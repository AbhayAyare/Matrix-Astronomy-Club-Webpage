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
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error from /api/get-site-content" }));
          throw new Error(errorData.error || `Failed to fetch site content: ${response.statusText}`);
        }
        const data = await response.json();
        // Assuming the API returns { content: SiteContent } or similar structure from getSiteContent
        if (data && data.content) {
          setContent(data.content);
        } else {
           // If API response structure is not as expected (e.g. data directly is SiteContent)
           // This branch might need adjustment based on actual API response.
           // For now, assume data itself might be the content or it's nested under a `content` key.
           // If data.content is not found, but data itself looks like SiteContent:
           if (data && data.heroTitle) { // Check for a known key to guess structure
            setContent(data as SiteContent);
           } else {
            setContent(defaultSiteContentData); // Fallback to default if structure is not as expected
            setError(new Error("Unexpected response structure from /api/get-site-content"));
           }
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
