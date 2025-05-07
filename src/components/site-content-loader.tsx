"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
// Removed isOfflineError import as it's now defined locally
// import { isOfflineError } from "@/lib/utils"; // Removed

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

// Local isOfflineError function specifically for fetch errors
function isNetworkError(error: any): boolean {
  return error instanceof TypeError && (
    error.message.includes('Failed to fetch') || // Common browser network error
    error.message.includes('Network request failed') // React Native/other environments
  );
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
          let responseBodyText = '';

          try {
            // Try reading the body *once*
            responseBodyText = await response.text();

            // Check if the response body looks like HTML
            if (responseBodyText && responseBodyText.trim().toLowerCase().startsWith('<!doctype html')) {
               console.warn("API route returned HTML error page, status:", response.status);
               // Use a generic error message based on status
               errorText = `Server error (${response.status}): Could not load site content.`;
            } else if (responseBodyText) {
               // Attempt to parse as JSON only if it doesn't look like HTML
               try {
                  const errorData = JSON.parse(responseBodyText);
                  if (errorData && errorData.error) {
                    errorText = errorData.error; // Use structured error if available
                  } else {
                    // Valid JSON but no specific error field, use truncated text
                    errorText = responseBodyText.substring(0, 500);
                  }
               } catch (jsonParseError) {
                  // Not JSON, use truncated raw text
                  errorText = responseBodyText.substring(0, 500);
               }
            }
            // If responseBodyText was empty, errorText remains the statusText initially set
          } catch (bodyReadError) {
            // Error reading the body itself (e.g., network interruption during read)
            console.error("Error reading response body:", bodyReadError);
            // Keep the original status-based error message
          }
          throw new Error(errorText);
        }

        // If response.ok, parse the successful JSON response
        const data = await response.json();

        // Handle different possible successful response structures
        if (data && data.content) {
            // Structure: { content: { ... } }
            setContent({ ...defaultSiteContentData, ...data.content }); // Merge with defaults
        } else if (data && data.heroTitle) {
             // Structure: { heroTitle: '...', about: '...', ... }
             setContent({ ...defaultSiteContentData, ...data }); // Merge with defaults
        } else {
            console.warn("Unexpected response structure from /api/get-site-content, using defaults.");
            setContent(defaultSiteContentData); // Fallback to default
        }

      } catch (err) {
        console.error("SiteContentLoader fetch error:", err);
        // Check for network-specific errors here
        if (isNetworkError(err)) {
           setError(new Error("Network Error: Could not connect to fetch site content. Please check your connection."));
        } else {
           setError(err); // Use the error thrown from the !response.ok block or other fetch errors
        }
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
