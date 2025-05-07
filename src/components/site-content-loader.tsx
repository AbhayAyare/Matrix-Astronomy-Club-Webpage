
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { SiteContent } from "@/services/content"; // Import the type
import { defaultSiteContent as defaultSiteContentData } from "@/services/content"; // Import the default data
import { isOfflineError } from "@/lib/utils"; // Use helper from utils

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
      let response: Response | null = null;
      let responseBodyText: string | null = null; // Store response text if needed

      try {
        console.log("[SiteContentLoader] Fetching /api/get-site-content...");
        response = await fetch("/api/get-site-content");
        console.log(`[SiteContentLoader] API response status: ${response.status}`);

        // --- Handle Non-OK HTTP Responses (e.g., 500, 404) ---
        if (!response.ok) {
          let errorText = `API Request Failed (${response.status}): ${response.statusText || 'Unknown Error'}`; // Default error text
          const contentType = response.headers.get("content-type");

          try {
            // Try reading the body ONCE to get more context
            responseBodyText = await response.text();

            // Check if the response body looks like HTML (indicating a server crash page)
            if (contentType && contentType.includes("text/html") && responseBodyText && responseBodyText.trim().toLowerCase().startsWith('<!doctype html')) {
              console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${response.status}). This often indicates a server-side crash.`);
              errorText = `Server error (${response.status}): Could not load site content. The API route may have crashed or returned HTML.`;

            } else if (responseBodyText && contentType && contentType.includes("application/json")) {
              // Try parsing as JSON to get a structured error message from the API route's catch block
              try {
                const errorData = JSON.parse(responseBodyText);
                if (errorData && errorData.error) {
                  // Use the structured error message from the API's JSON response
                  errorText = `API Error (${response.status}): ${errorData.error}`;
                   console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with JSON error: ${errorData.error}`);
                } else {
                  // Valid JSON but no 'error' field, use truncated text as fallback
                  errorText = `API Error (${response.status}): Unexpected JSON response format. Body: ${responseBodyText.substring(0, 200)}...`;
                   console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected JSON structure.`);
                }
              } catch (jsonParseError) {
                // Response body wasn't JSON, use truncated raw text
                errorText = `API Error (${response.status}): Non-JSON response received. Body: ${responseBodyText.substring(0, 500)}...`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with non-JSON body: ${responseBodyText.substring(0, 100)}...`);
              }
            } else if (responseBodyText) {
                // Not HTML, not JSON, but has text content
                 errorText = `API Error (${response.status}): Received unexpected content type '${contentType}'. Body: ${responseBodyText.substring(0, 500)}...`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected content type and body: ${responseBodyText.substring(0, 100)}...`);
            } else {
                 console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with empty body.`);
            }
          } catch (bodyReadError) {
            // Error reading the response body itself (e.g., network interruption during read)
            console.error("[SiteContentLoader] Error reading non-OK response body:", bodyReadError);
            // Keep the original status-based error message
          }
           throw new Error(errorText); // Throw the determined error message
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        console.log("[SiteContentLoader] API response OK. Attempting to parse JSON...");
        const data = await response.json();

        // Check if the successful response *still* contains an error field (from the getSiteContent service)
        if (data && data.error) {
          console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
          setError(new Error(data.error)); // Set error state based on the message from the service
          setContent(data.content || defaultSiteContentData); // Use default content if service provides none, else the content from service
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

        if (isOfflineError(err)) { // Check if it's likely an offline/network error
           setError(new Error("Network Error: Could not connect to fetch site content. Please check your connection."));
        } else if (err instanceof Error) {
            // Use the error message thrown from the !response.ok block or other JS errors
           setError(err); // err already contains a descriptive message from the block above
        } else {
            // Fallback for non-Error objects thrown
            setError(new Error("An unknown error occurred while fetching site content."));
        }
        setContent(defaultSiteContentData); // Fallback to default on any error
      } finally {
        setLoading(false);
        console.log("[SiteContentLoader] Fetch process finished.");
      }
    };

    fetchSiteContent();
  }, []);

  // Call the children function with the fetched content, error, and loading state
  return <>{children({ content, error, loading })}</>;
}
