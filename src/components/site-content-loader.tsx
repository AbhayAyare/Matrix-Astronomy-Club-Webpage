
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, AlertCircle } from "lucide-react"; // Added AlertCircle
import { useState, useEffect } from "react";
import type { SiteContent } from '@/services/content'; // Import the type
import { defaultSiteContent } from "@/services/content"; // Import the default data
import { isOfflineError } from '@/lib/utils'; // Use helper from utils

interface SiteContentLoaderProps {
  children: (props: { content: SiteContent; error: Error | null; loading: boolean; isOffline: boolean }) => React.ReactNode;
}

export function SiteContentLoader({ children }: SiteContentLoaderProps) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const fetchSiteContent = async () => {
      setLoading(true);
      setError(null);
      setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);

      let response: Response | null = null;
      let responseBodyText: string | null = null; // Store raw response text for debugging

      try {
        console.log("[SiteContentLoader] Fetching /api/get-site-content...");
        response = await fetch("/api/get-site-content", {
          cache: 'no-store', // Ensure fresh data is fetched
        });
        const responseStatus = response.status;
        const responseContentType = response.headers.get("content-type");
        console.log(`[SiteContentLoader] API response status: ${responseStatus}, Content-Type: ${responseContentType}`);

        try {
          // Read the body as text first to handle potential non-JSON responses
          responseBodyText = await response.text();
          // console.log(`[SiteContentLoader] Raw response body text received (length: ${responseBodyText?.length ?? 0}).`);
        } catch (bodyReadError) {
          console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
          responseBodyText = null; // Ensure it's null if reading fails
          if (response && response.ok) {
            throw new Error("API returned OK status but response body could not be read.");
          }
          // If !response.ok, the error will be handled below based on status
        }

        // --- Handle Non-OK HTTP Responses (e.g., 4xx, 5xx) ---
        if (!response.ok) {
          let errorText = `Server error (${responseStatus}): Could not load site content.`;
          const isHtmlResponse = responseContentType?.includes("text/html") && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html');

          if (isHtmlResponse) {
             console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${responseStatus}). This likely indicates a server crash or unhandled route error.`);
             errorText = `Server error (${responseStatus}): Could not load site content. The API route may have crashed or returned HTML.`;
          } else if (responseContentType?.includes("application/json") && responseBodyText) {
             // Try to parse JSON error message
             try {
               const errorData = JSON.parse(responseBodyText);
               if (errorData?.error && typeof errorData.error === 'string') {
                 errorText = `API Error (${responseStatus}): ${errorData.error}`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with JSON error: ${errorData.error}`);
               } else {
                 errorText = `Server error (${responseStatus}): Unexpected JSON error format received.`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with unexpected JSON structure.`);
               }
             } catch (jsonParseError) {
                // Failed to parse JSON, use the raw text
                errorText = `Server error (${responseStatus}): Failed to parse non-OK JSON response. Body: ${responseBodyText?.substring(0, 100)}...`;
                console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} but failed to parse JSON body. Raw text: ${responseBodyText?.substring(0, 100)}...`);
             }
           } else if (responseBodyText) {
             // Fallback for other non-OK responses with text bodies
             errorText = `Server error (${responseStatus}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with content type '${responseContentType}'. Body snippet: ${errorText}`);
           } else {
               // No body or unreadable body
               errorText = `Server error (${responseStatus}): ${response.statusText || 'Failed request with empty or unreadable response body.'}`;
               console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with empty or unreadable body.`);
           }

           throw new Error(errorText); // Throw error to be caught by the outer catch block
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        if (!responseBodyText) {
            console.warn("[SiteContentLoader] API returned OK status but response body was unexpectedly empty. Using defaults.");
            setError(new Error("API returned OK status but response body was empty."));
            setContent(defaultSiteContent);
            setLoading(false);
            return; // Exit early
        }

        console.log("[SiteContentLoader] API response OK. Attempting to parse JSON...");
        let data;
        try {
            data = JSON.parse(responseBodyText);
        } catch (jsonParseError: any) {
            console.error("[SiteContentLoader] Failed to parse JSON from OK response:", jsonParseError);
            console.error("[SiteContentLoader] Raw response body that failed parsing:", responseBodyText);
            setError(new Error(`Failed to parse successful API response as JSON: ${jsonParseError.message}. Check server logs and API route response.`));
            setContent(defaultSiteContent); // Use defaults if parsing fails
            setLoading(false);
            return; // Exit early
        }

        // Check for service-level errors within the successful JSON response
        if (data?.error && typeof data.error === 'string') {
          console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
          const serviceError = new Error(data.error); // Create error from message
          setError(serviceError);
          setOffline(isOfflineError(serviceError));
          // Use the content potentially provided alongside the error (might be default from service)
          setContent(data.content ? { ...defaultSiteContent, ...data.content } : defaultSiteContent);
        } else if (data?.content) {
          // Successful fetch and parse with valid content
          setContent({ ...defaultSiteContent, ...data.content });
          setError(null);
          setOffline(false);
          console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
        } else {
          // Unexpected JSON structure in success response
          console.warn("[SiteContentLoader] Unexpected success response structure from API (missing 'content' key?), using defaults.", data);
          setError(new Error("Unexpected response structure from content API."));
          setContent(defaultSiteContent);
        }

      } catch (err: unknown) { // Catch fetch errors, parsing errors, or thrown errors from non-OK responses
        console.error("[SiteContentLoader] Fetch or processing error in fetchSiteContent:", err);
        let finalError: Error;
        let isLikelyOffline = false;

        if (err instanceof TypeError && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
             const offlineMsg = "Network Error: Could not connect to the API endpoint. Please check your network connection.";
             finalError = new Error(offlineMsg);
             isLikelyOffline = true;
             console.warn(`[SiteContentLoader] Network error detected: ${err.message}`);
        } else if (isOfflineError(err)) {
            const offlineMsg = `Network Error: Browser or utility indicated offline status. ${err instanceof Error ? err.message : ''}`.trim();
            finalError = new Error(offlineMsg);
            isLikelyOffline = true;
            console.warn(`[SiteContentLoader] Offline status detected by utility or browser.`);
        } else if (err instanceof Error) {
            finalError = err; // Use the error already thrown (e.g., from non-OK response handling)
            isLikelyOffline = isOfflineError(finalError);
            if (isLikelyOffline) {
                console.warn(`[SiteContentLoader] Thrown error message suggests offline status: ${finalError.message}`);
            }
        } else {
            finalError = new Error(`An unknown error occurred: ${String(err)}`);
            console.error(`[SiteContentLoader] Unknown error type encountered.`);
        }

        // Log the raw response text if available and an error occurred
        if (responseBodyText && !response?.ok) {
            console.error(`[SiteContentLoader] Raw response body on error: ${responseBodyText.substring(0, 500)}${responseBodyText.length > 500 ? '...' : ''}`);
        }

        setError(finalError);
        setOffline(isLikelyOffline);
        setContent(defaultSiteContent); // Fallback to default content on any error
      } finally {
        setLoading(false);
        console.log("[SiteContentLoader] Fetch process finished.");
      }
    };

    fetchSiteContent();

    // Event listeners for online/offline status changes
    const handleOnline = () => {
        console.log("[SiteContentLoader] Browser reported online.");
        setOffline(false);
        if (error && isOfflineError(error)) {
            console.log("[SiteContentLoader] Refetching content after coming back online.");
            fetchSiteContent();
        }
    };
    const handleOffline = () => {
        console.log("[SiteContentLoader] Browser reported offline.");
        setOffline(true);
        if (!error || !isOfflineError(error)) {
             const offlineErr = new Error("Network Error: Connection lost. Displaying potentially outdated content.");
             setError(offlineErr);
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  return <>{children({ content, error, loading, isOffline: offline })}</>;
}
