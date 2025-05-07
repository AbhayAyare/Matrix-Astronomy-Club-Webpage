
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { SiteContent } from "@/services/content"; // Import the type
import { defaultSiteContent as defaultSiteContentData } from "@/services/content"; // Import the default data

interface SiteContentLoaderProps {
  children: (props: { content: SiteContent; error: any | null; loading: boolean; }) => React.ReactNode;
}

// Local function to check for client-side network errors during fetch
function isNetworkError(error: any): boolean {
  return error instanceof TypeError && (
    error.message.toLowerCase().includes('failed to fetch') || // Common browser network error
    error.message.toLowerCase().includes('network request failed') // React Native/other environments
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
      let response: Response | null = null;
      let responseBodyText: string | null = null; // Store response text if needed

      try {
        response = await fetch("/api/get-site-content");

        // --- Handle Non-OK HTTP Responses (e.g., 500, 404) ---
        if (!response.ok) {
          let errorText = `API Error (${response.status}): ${response.statusText}`; // Default error text

          try {
            // Try reading the body ONCE to get more context
            responseBodyText = await response.text();

            // Check if the response body looks like HTML (indicating a server crash page)
            if (responseBodyText && responseBodyText.trim().toLowerCase().startsWith('<!doctype html')) {
              console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${response.status}).`);
              // Provide a more user-friendly message for HTML responses
              errorText = `Server error (${response.status}): Could not load site content. The API route may have crashed.`;

            } else if (responseBodyText) {
              // Try parsing as JSON to get a structured error message from the API route's catch block
              try {
                const errorData = JSON.parse(responseBodyText);
                if (errorData && errorData.error) {
                  // Use the structured error message from the API's JSON response
                  errorText = `API Error (${response.status}): ${errorData.error}`;
                   console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with JSON error: ${errorData.error}`);
                } else {
                  // Valid JSON but no 'error' field, use truncated text as fallback
                  errorText = `API Error (${response.status}): Unexpected response format. Body: ${responseBodyText.substring(0, 200)}...`;
                   console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected JSON structure.`);
                }
              } catch (jsonParseError) {
                // Response body wasn't JSON, use truncated raw text
                errorText = `API Error (${response.status}): Non-JSON response received. Body: ${responseBodyText.substring(0, 500)}...`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with non-JSON body.`);
              }
            }
            // If responseBodyText was empty, errorText remains the initial statusText message
          } catch (bodyReadError) {
            // Error reading the response body itself (e.g., network interruption during read)
            console.error("[SiteContentLoader] Error reading non-OK response body:", bodyReadError);
            // Keep the original status-based error message
          }
           throw new Error(errorText); // Throw the determined error message
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        // If response.ok, parse the successful JSON response
        const data = await response.json();

        // Check if the successful response *still* contains an error field (from the getSiteContent service)
        if (data && data.error) {
          console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
          setError(new Error(data.error)); // Set error state based on the message from the service
          setContent(defaultSiteContentData); // Use default content when there's a service-level error
        } else if (data && data.content) {
          // Successfully fetched content
          setContent({ ...defaultSiteContentData, ...data.content }); // Merge with defaults
          setError(null); // Clear any previous errors
           console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
        } else {
          // Successful response but unexpected structure
          console.warn("[SiteContentLoader] Unexpected success response structure from /api/get-site-content, using defaults.", data);
          setError(new Error("Unexpected response structure from content API."));
          setContent(defaultSiteContentData); // Fallback to default
        }

      } catch (err) {
        // --- Handle Fetch Errors (Network, CORS, etc.) OR Errors Thrown Above ---
        console.error("[SiteContentLoader] Fetch or processing error in fetchSiteContent:", err);

        if (isNetworkError(err)) {
           // Specific network error detected client-side
           setError(new Error("Network Error: Could not connect to fetch site content. Please check your connection."));
        } else if (err instanceof Error) {
            // Use the error message thrown from the !response.ok block or other JS errors
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
