
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { SiteContent } from '@/services/content'; // Import the type
import { defaultSiteContent } from "@/services/content"; // Import the default data
import { isOfflineError } from "@/lib/utils"; // Use helper from utils

interface SiteContentLoaderProps {
  children: (props: { content: SiteContent; error: Error | null; loading: boolean; isOffline: boolean }) => React.ReactNode;
}

export function SiteContentLoader({ children }: SiteContentLoaderProps) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [error, setError] = useState<Error | null>(null); // Store errors as Error objects
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
        } catch (bodyReadError) {
            console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
            responseBodyText = null; // Ensure it's null if read failed
            if (response && response.ok) {
                 throw new Error("API returned OK status but response body could not be read.");
             }
        }

        // --- Handle Non-OK HTTP Responses (e.g., 500, 404) ---
        if (!response.ok) {
          let errorText = `Server error (${response.status}): Could not load site content. ${response.statusText || ''}`; // Default error text
          const contentType = response.headers.get("content-type");

          // Check if the response body looks like HTML
          if (contentType?.includes("text/html") && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html')) {
            console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${response.status}).`);
            errorText = `Server error (${response.status}): Could not load site content. The API route may have crashed or returned HTML.`;
          } else if (responseBodyText && contentType?.includes("application/json")) {
              // Try parsing as JSON to get a structured error message
              try {
                const errorData = JSON.parse(responseBodyText);
                if (errorData?.error) {
                  errorText = `API Error (${response.status}): ${errorData.error}`;
                  console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with JSON error: ${errorData.error}`);
                } else {
                  errorText = `Server error (${response.status}): Unexpected JSON response format.`;
                  console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected JSON.`);
                }
              } catch (jsonParseError) {
                 errorText = `Server error (${response.status}): Failed to parse non-OK response as JSON.`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with non-JSON body. Starts with: ${responseBodyText?.substring(0, 100)}...`);
                 // Log the problematic text for debugging
                 console.error("[SiteContentLoader] Non-JSON response body:", responseBodyText);
              }
          } else if (responseBodyText) {
              // If it's not HTML or JSON, use the body text as the error message if available
              errorText = `Server error (${response.status}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`; // Include snippet of the response
              console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected content type '${contentType}'.`);
          } else {
             // Keep the default error if body is empty or unreadable
             errorText = `Server error (${response.status}): ${response.statusText || 'Failed request with empty or unreadable response body.'}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with empty or unreadable body.`);
           }

           throw new Error(errorText); // Throw error to be caught by the outer catch block
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
         if (!responseBodyText) {
            throw new Error("API returned OK status but response body was unexpectedly empty.");
         }

        console.log("[SiteContentLoader] API response OK. Attempting to parse JSON...");
        let data;
        try {
            data = JSON.parse(responseBodyText);
        } catch (jsonParseError: any) {
            console.error("[SiteContentLoader] Failed to parse JSON from OK response:", jsonParseError);
            console.error("[SiteContentLoader] Raw response body that failed parsing:", responseBodyText);
            throw new Error(`Failed to parse successful API response as JSON: ${jsonParseError.message}. Check server logs for API route structure.`);
        }

        if (data?.error) {
          console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
          const serviceError = new Error(data.error);
          setError(serviceError);
          if (isOfflineError(serviceError)) {
              setOffline(true);
          }
          setContent(defaultSiteContent);
        } else if (data?.content) {
          setContent({ ...defaultSiteContent, ...data.content });
          setError(null);
          setOffline(false);
          console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
        } else {
          console.warn("[SiteContentLoader] Unexpected success response structure from /api/get-site-content, using defaults.", data);
          setError(new Error("Unexpected response structure from content API."));
          setContent(defaultSiteContent);
        }

      } catch (err: unknown) { // Catch unknown
        console.error("[SiteContentLoader] Fetch or processing error in fetchSiteContent:", err);
        let finalError: Error;
        let isLikelyOffline = false;

        if (isOfflineError(err)) {
            const offlineMsg = "Network Error: Could not connect to fetch site content. Please check your connection.";
            finalError = new Error(offlineMsg);
            isLikelyOffline = true;
        } else if (err instanceof Error) {
            finalError = err; // Keep the original error object
        } else {
            finalError = new Error(`An unknown error occurred: ${String(err)}`);
        }

        setError(finalError);
        setOffline(isLikelyOffline); // Set offline based on check
        setContent(defaultSiteContent);
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

    const handleOnline = () => {
        console.log("[SiteContentLoader] Browser reported online.");
        setOffline(false);
        if (error && isOfflineError(error)) { // Refetch only if the previous error was offline-related
            console.log("[SiteContentLoader] Refetching content after coming back online.");
            fetchSiteContent();
        }
    };
    const handleOffline = () => {
        console.log("[SiteContentLoader] Browser reported offline.");
        setOffline(true);
        if (!error || !isOfflineError(error)) { // Set generic offline error only if not already offline
             const offlineErr = new Error("Network Error: Connection lost. Displaying default or cached content.");
             setError(offlineErr);
        }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  return <>{children({ content, error, loading, isOffline: offline })}</>;
}
