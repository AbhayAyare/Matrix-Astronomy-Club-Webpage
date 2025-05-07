"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { isOfflineError } from "@/lib/utils";

// Define SiteContent interface (should match services/content.ts)
interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  joinTitle: string;
  joinDescription: string;
  newsletterTitle: string;
  newsletterDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

// Default content (ensure this matches services/content.ts and is exported there ideally)
const defaultSiteContentData: SiteContent = {
  heroTitle: 'Welcome to Matrix Astronomy Club',
  heroSubtitle: 'Your gateway to the cosmos. Explore, learn, and connect with fellow space enthusiasts.',
  about: 'Matrix is a passionate community dedicated to exploring the wonders of the universe. We organize stargazing sessions, workshops, and talks for enthusiasts of all levels.',
  joinTitle: 'Become a Member',
  joinDescription: 'Fill out the form below to start your cosmic journey with us.',
  newsletterTitle: 'Subscribe to Our Newsletter',
  newsletterDescription: 'Get the latest news, event announcements, and astronomical insights delivered to your inbox.',
  contactEmail: 'info@matrixastronomy.org',
  contactPhone: '7219690903',
  contactAddress: 'Kolhapur',
};

interface SiteContentLoaderProps {
  children: (props: { content: SiteContent; error: any | null; loading: boolean; }) => React.ReactNode;
}

export function SiteContentLoader({ children }: SiteContentLoaderProps) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContentData);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiteContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/get-site-content"); // API route to fetch content

        if (!response.ok) {
          let errorText = `Failed to fetch site content: ${response.status} ${response.statusText}`;
          // Try to get the body as text first. This is generally safer.
          const responseBodyText = await response.text();

          if (responseBodyText) {
            try {
              // Attempt to parse the text as JSON
              const errorData = JSON.parse(responseBodyText);
              if (errorData && errorData.error) {
                errorText = errorData.error; // Use structured error if available
              } else {
                // If JSON parsing was successful but no .error field, or if it's not JSON, use the text
                errorText = responseBodyText.substring(0, 500); // Truncate long non-JSON errors
              }
            } catch (jsonParseError) {
              // If JSON parsing failed, the body was likely not JSON. Use the raw text.
              errorText = responseBodyText.substring(0, 500); // Truncate long non-JSON errors
            }
          }
          // If responseBodyText was empty, errorText remains the statusText
          throw new Error(errorText);
        }

        // If response.ok, parse the successful JSON response
        const data = await response.json();
        
        if (data && data.content) {
          setContent(data.content);
        } else if (data && data.heroTitle) { 
          setContent(data as SiteContent);
        } else {
          setContent(defaultSiteContentData);
          setError(new Error("Unexpected response structure from /api/get-site-content"));
        }
      } catch (err) {
        console.error("SiteContentLoader fetch error:", err);
        setError(err);
        setContent(defaultSiteContentData); // Fallback to default on any error
      } finally {
        setLoading(false);
      }
    };

    fetchSiteContent();
  }, []);

  // Call the children function with the fetched content, error, and loading state
  return <>{children({ content, error, loading })}</>;
}
