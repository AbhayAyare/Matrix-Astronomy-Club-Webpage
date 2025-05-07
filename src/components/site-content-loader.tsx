"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

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

// Local function to check for client-side network errors during fetch
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
      let response: Response | null = null; // Define response variable outside try block

      try {
        response = await fetch("/api/get-site-content"); // API route to fetch content

        // --- Handle Non-OK HTTP Responses ---
        if (!response.ok) {
          let errorText = `API Error: ${response.status} ${response.statusText}`;
          let responseBodyText = '';

          try {
            // Try reading the response body ONCE to check its content
            responseBodyText = await response.text();

            if (responseBodyText && responseBodyText.trim().toLowerCase().startsWith('<!doctype html')) {
               console.warn("[SiteContentLoader] API route returned an HTML error page, status:", response.status);
               // Use a generic error message based on status for HTML errors
               errorText = `Server error (${response.status}): Could not load site content. The API route returned an HTML page instead of JSON.`;
            } else if (responseBodyText) {
               // Attempt to parse as JSON only if it's not HTML
               try {
                  const errorData = JSON.parse(responseBodyText);
                  if (errorData && errorData.error) {
                    // Use structured error from JSON if available
                    errorText = `API Error (${response.status}): ${errorData.error}`;
                  } else {
                    // Valid JSON but no specific error field, use truncated text as fallback
                    errorText = `API Error (${response.status}): Unexpected response format. Body: ${responseBodyText.substring(0, 200)}`;
                  }
               } catch (jsonParseError) {
                  // Not JSON, use truncated raw text
                  console.warn("[SiteContentLoader] API response was not JSON:", jsonParseError);
                  errorText = `API Error (${response.status}): ${responseBodyText.substring(0, 500)}`;
               }
            }
             // If responseBodyText was empty, errorText remains the initial statusText message
          } catch (bodyReadError) {
            // Error reading the body itself (e.g., network interruption during read)
            console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
            // Keep the original status-based error message
          }
           throw new Error(errorText); // Throw error to be caught by the outer catch block
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        const data = await response.json();

        // Check if the successful response *still* contains an error field (from getSiteContent service)
        if (data && data.error) {
            console.warn("[SiteContentLoader] API returned 200 OK, but contained an error message:", data.error);
            setError(new Error(data.error)); // Set error state based on the message from the service
            setContent(defaultSiteContentData); // Use default content when there's a service-level error
        } else if (data && data.content) {
            // Successfully fetched content
            setContent({ ...defaultSiteContentData, ...data.content }); // Merge with defaults
            setError(null); // Clear any previous errors
        } else {
            // Successful response but unexpected structure
            console.warn("[SiteContentLoader] Unexpected success response structure from /api/get-site-content, using defaults.", data);
            setError(new Error("Unexpected response structure from content API."));
            setContent(defaultSiteContentData); // Fallback to default
        }

      } catch (err) {
        // --- Handle Fetch Errors (Network, CORS, etc.) OR Thrown Errors ---
        console.error("[SiteContentLoader] Fetch or processing error:", err);

        if (isNetworkError(err)) {
           // Specific network error
           setError(new Error("Network Error: Could not connect to fetch site content. Please check your connection."));
        } else if (err instanceof Error) {
            // Use the error message thrown from the !response.ok block or other errors
           setError(err);
        } else {
            // Fallback for non-Error objects thrown
            setError(new Error("An unknown error occurred while fetching site content."));
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
