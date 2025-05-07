
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { SiteContent } from '@/services/content'; // Import the type
import { defaultSiteContent } from "@/services/content"; // Import the default data
import { isOfflineError } from '@/lib/utils'; // Import the updated utility function

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

        // Attempt to read the body regardless of status, handling potential errors
        try {
          responseBodyText = await response.text();
        } catch (bodyReadError) {
          console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
          // If reading the body fails, create an error to be handled below
          throw new Error(`Failed to read response body (Status: ${responseStatus})`);
        }

        // --- Handle Non-OK HTTP Responses (e.g., 4xx, 5xx) ---
        if (!response.ok) {
          let errorText = `Server error (${responseStatus}): Could not load site content.`;
          const isHtmlResponse = responseContentType?.includes("text/html") && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html');

          if (isHtmlResponse) {
             console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${responseStatus}).`);
             errorText = `Server error (${responseStatus}): Could not load site content. The API route may have crashed or returned HTML.`;
          } else if (responseContentType?.includes("application/json") && responseBodyText) {
             try {
               const errorData = JSON.parse(responseBodyText);
               if (errorData?.error && typeof errorData.error === 'string') {
                 errorText = `API Error (${responseStatus}): ${errorData.error}`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with JSON error: ${errorData.error}`);
               } else {
                 errorText = `Server error (${responseStatus}): Unexpected JSON error format.`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with unexpected JSON.`);
               }
             } catch (jsonParseError) {
                errorText = `Server error (${responseStatus}): Failed to parse non-OK JSON response.`;
                console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} but failed to parse JSON body.`);
             }
           } else if (responseBodyText) {
             errorText = `Server error (${responseStatus}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with content type '${responseContentType}'.`);
           } else {
               errorText = `Server error (${responseStatus}): ${response.statusText || 'Empty or unreadable response body.'}`;
               console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with empty or unreadable body.`);
           }

           throw new Error(errorText); // Throw error to be caught by the outer catch block
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        if (!responseBodyText) {
            console.warn("[SiteContentLoader] API returned OK status but response body was unexpectedly empty. Using defaults.");
            setError(new Error("API returned OK status but response body was empty."));
            setContent(defaultSiteContent);
        } else {
            try {
                const data = JSON.parse(responseBodyText);

                if (data?.error && typeof data.error === 'string') {
                    console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
                    const serviceError = new Error(data.error);
                    setError(serviceError);
                    setOffline(isOfflineError(serviceError));
                    setContent(data.content ? { ...defaultSiteContent, ...data.content } : defaultSiteContent);
                } else if (data?.content) {
                    setContent({ ...defaultSiteContent, ...data.content });
                    setError(null); // Clear any previous error
                    setOffline(false); // Ensure offline is false on success
                    console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
                } else {
                    console.warn("[SiteContentLoader] Unexpected success response structure from API (missing 'content' key?), using defaults.", data);
                    setError(new Error("Unexpected response structure from content API."));
                    setContent(defaultSiteContent);
                }
            } catch (jsonParseError: any) {
                console.error("[SiteContentLoader] Failed to parse JSON from OK response:", jsonParseError);
                console.error("[SiteContentLoader] Raw response body that failed parsing:", responseBodyText);
                setError(new Error(`Failed to parse successful API response as JSON: ${jsonParseError.message}.`));
                setContent(defaultSiteContent);
            }
        }

      } catch (err: unknown) { // Catch fetch errors, body reading errors, parsing errors, or thrown errors from non-OK responses
        console.error("[SiteContentLoader] Catch block error in fetchSiteContent:", err);
        const finalError = err instanceof Error ? err : new Error(`An unknown error occurred: ${String(err)}`);
        const isLikelyOffline = isOfflineError(finalError); // Use the utility function

        console.error(`[SiteContentLoader] Final error state - Message: "${finalError.message}", Is Offline: ${isLikelyOffline}`);

        // Log raw response text if available *and* it's likely relevant (e.g., on non-OK or parse errors)
        if (responseBodyText && ( (response && !response.ok) || finalError.message.toLowerCase().includes('parse')) ) {
            console.error(`[SiteContentLoader] Raw response body on error (Status: ${response?.status ?? 'unknown'}): ${responseBodyText.substring(0, 500)}${responseBodyText.length > 500 ? '...' : ''}`);
        }

        setError(finalError);
        setOffline(isLikelyOffline);
        setContent(defaultSiteContent); // Always fallback to default content on error
      } finally {
        setLoading(false);
        console.log("[SiteContentLoader] Fetch process finished.");
      }
    };

    fetchSiteContent();

    // Online/Offline listeners
    const handleOnline = () => {
        console.log("[SiteContentLoader] Browser reported online.");
        setOffline(false);
        if (error && isOfflineError(error)) {
            console.log("[SiteContentLoader] Refetching content after coming back online.");
            fetchSiteContent(); // Refetch if the previous error was offline-related
        }
    };
    const handleOffline = () => {
        console.log("[SiteContentLoader] Browser reported offline.");
        setOffline(true);
        if (!error || !isOfflineError(error)) {
             setError(new Error("Network Error: Connection lost.")); // Set a generic offline error if not already set
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
  }, []); // Empty dependency array

  return <>{children({ content, error, loading, isOffline: offline })}</>;
}
