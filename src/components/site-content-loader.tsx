
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { SiteContent } from '@/services/content'; // Import the type
import { defaultSiteContent } from "@/services/content"; // Import the default data
import { isOfflineError } from "@/lib/utils"; // Use helper from utils

interface SiteContentLoaderProps {
  children: (props: { content: SiteContent; error: any | null; loading: boolean; isOffline: boolean }) => React.ReactNode;
}

export function SiteContentLoader({ children }: SiteContentLoaderProps) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const fetchSiteContent = async () => {
      setLoading(true);
      setError(null);
      setOffline(false); // Reset offline state at the beginning of fetch
      let response: Response | null = null;
      let responseBodyText: string | null = null; // Store response text

      try {
        console.log("[SiteContentLoader] Fetching /api/get-site-content...");
        response = await fetch("/api/get-site-content");
        console.log(`[SiteContentLoader] API response status: ${response.status}`);

        // Try reading the body text ONCE. Avoids "body stream already read" error.
        try {
            responseBodyText = await response.text();
            console.log(`[SiteContentLoader] Raw response body text received (length: ${responseBodyText?.length ?? 0}).`);
            // console.log(`[SiteContentLoader] Body snippet: ${responseBodyText?.substring(0, 100)}...`); // Use only for debugging
        } catch (bodyReadError) {
            console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
            responseBodyText = null; // Ensure it's null if read failed
        }

        // --- Handle Non-OK HTTP Responses (e.g., 500, 404) ---
        if (!response.ok) {
          let errorText = `Server error (${response.status}): Could not load site content. ${response.statusText || ''}`; // Default error text
          const contentType = response.headers.get("content-type");

          // Check if the response body looks like HTML (indicating a server crash page)
          if (contentType && contentType.includes("text/html") && responseBodyText && responseBodyText.trim().toLowerCase().startsWith('<!doctype html')) {
            console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${response.status}). This often indicates a server-side crash in the API route.`);
            errorText = `Server error (${response.status}): Could not load site content. The API route may have crashed or returned HTML.`;
          } else if (responseBodyText) {
            // Try parsing as JSON to get a structured error message
            if (contentType && contentType.includes("application/json")) {
              try {
                const errorData = JSON.parse(responseBodyText);
                if (errorData && errorData.error) {
                  errorText = `API Error (${response.status}): ${errorData.error}`; // Use the specific error from API
                  console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with JSON error: ${errorData.error}`);
                } else {
                  errorText = `Server error (${response.status}): Unexpected JSON response format.`;
                  console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected JSON structure.`);
                }
              } catch (jsonParseError) {
                 errorText = `Server error (${response.status}): Failed to parse non-OK response as JSON. Body starts with: ${responseBodyText.substring(0, 100)}...`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with non-JSON body.`);
              }
            } else {
               errorText = `Server error (${response.status}): Received unexpected content type '${contentType}'. Body starts with: ${responseBodyText.substring(0, 100)}...`;
               console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected content type.`);
             }
          } else {
               errorText = `Server error (${response.status}): ${response.statusText || 'Failed request with empty or unreadable response body.'}`;
               console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with empty or unreadable body.`);
          }

           throw new Error(errorText); // Throw error to be caught by the outer catch block
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
         if (!responseBodyText) {
            // This shouldn't happen if response.ok is true and body read succeeded
            throw new Error("API returned OK status but response body could not be read.");
         }

        console.log("[SiteContentLoader] API response OK. Attempting to parse JSON...");
        let data;
        try {
            data = JSON.parse(responseBodyText);
        } catch (jsonParseError) {
            console.error("[SiteContentLoader] Failed to parse JSON from OK response:", jsonParseError);
            console.error("[SiteContentLoader] Raw response body that failed parsing:", responseBodyText); // Log the problematic text
            throw new Error(`Failed to parse successful API response as JSON. Body starts with: ${responseBodyText.substring(0, 100)}...`);
        }

        // Check if the successful response *still* contains an error field (from the getSiteContent service)
        if (data && data.error) {
          console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
          const serviceError = new Error(data.error);
          setError(serviceError); // Set error state based on the message from the service
          if (isOfflineError(serviceError)) { // Check if service error indicates offline
              setOffline(true);
          }
          // Use default content if service reports an error, even if API status was OK
          setContent(defaultSiteContent);
        } else if (data && data.content) {
          // Successfully fetched content
          setContent({ ...defaultSiteContent, ...data.content }); // Merge with defaults
          setError(null); // Clear any previous errors
          setOffline(false); // Ensure offline is false on success
          console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
        } else {
          // Successful response but unexpected structure
          console.warn("[SiteContentLoader] Unexpected success response structure from /api/get-site-content, using defaults.", data);
          setError(new Error("Unexpected response structure from content API."));
          setContent(defaultSiteContent); // Fallback to default
        }

      } catch (err) {
        // --- Handle Fetch Errors (Network, CORS, etc.) OR Errors Thrown Above ---
        console.error("[SiteContentLoader] Fetch or processing error in fetchSiteContent:", err);
        let finalError = err;

        if (isOfflineError(err)) { // Check if it's likely an offline/network error
            finalError = new Error("Network Error: Could not connect to fetch site content. Please check your connection.");
            setOffline(true); // Set offline state
        } else if (!(err instanceof Error)) {
            // Ensure we always have an Error object
            finalError = new Error(`An unknown error occurred: ${String(err)}`);
        }

        setError(finalError);
        setContent(defaultSiteContent); // Fallback to default on any error
      } finally {
        setLoading(false);
        console.log("[SiteContentLoader] Fetch process finished.");
      }
    };

    // Check initial online status
    if (typeof navigator !== 'undefined') {
      setOffline(!navigator.onLine);
    }

    fetchSiteContent();

    // Add online/offline event listeners
    const handleOnline = () => {
        console.log("[SiteContentLoader] Browser reported online.");
        setOffline(false);
        // Optionally refetch content when coming back online if there was a previous error
        if (error) {
            console.log("[SiteContentLoader] Refetching content after coming back online.");
            fetchSiteContent();
        }
    };
    const handleOffline = () => {
        console.log("[SiteContentLoader] Browser reported offline.");
        setOffline(true);
        // Set a generic offline error if not already errored or if the current error isn't offline-related
        if (!error || !isOfflineError(error)) {
             setError(new Error("Network Error: Connection lost. Displaying default or cached content."));
        }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount

  // Call the children function with the fetched content, error, and loading state
  return <>{children({ content, error, loading, isOffline: offline })}</>;
}
