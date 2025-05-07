
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
           // Treat body read error as a generic server error
           throw new Error(`Failed to read response body (Status: ${responseStatus})`);
        }

        // --- Handle Non-OK HTTP Responses (e.g., 4xx, 5xx) ---
        if (!response.ok) {
          let errorText = `Server error (${responseStatus}): Could not load site content.`;
          const isHtmlResponse = responseContentType?.includes("text/html"); // Simpler check for HTML

          if (isHtmlResponse && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html')) {
             console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${responseStatus}).`);
             errorText = `Server error (${responseStatus}): Could not load site content. The API route may have crashed or returned HTML.`;
          } else if (responseContentType?.includes("application/json") && responseBodyText) {
             try {
               const errorData = JSON.parse(responseBodyText);
               if (errorData?.error && typeof errorData.error === 'string') {
                 // Use the specific error message from the API's JSON response
                 errorText = `API Error (${responseStatus}): ${errorData.error}`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with JSON error: ${errorData.error}`);
               } else {
                 // Fallback if JSON doesn't have the expected 'error' field
                 errorText = `Server error (${responseStatus}): Unexpected JSON error format received.`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with unexpected JSON: ${responseBodyText.substring(0, 100)}...`);
               }
             } catch (jsonParseError) {
                errorText = `Server error (${responseStatus}): Failed to parse non-OK JSON response.`;
                console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} but failed to parse JSON body.`);
             }
           } else if (responseBodyText) {
             // Non-JSON, non-HTML error response body
             errorText = `Server error (${responseStatus}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with content type '${responseContentType}'. Body: ${errorText}`);
           } else {
               // Empty or unreadable body on non-OK response
               errorText = `Server error (${responseStatus}): ${response.statusText || 'Empty or unreadable response body.'}`;
               console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with empty or unreadable body.`);
           }

           // IMPORTANT: Set the error state here instead of throwing,
           // allowing the component to render with default content and the error message.
           setError(new Error(errorText));
           setContent(defaultSiteContent); // Ensure defaults are set
           setOffline(isOfflineError(new Error(errorText))); // Check if the error implies offline
           setLoading(false); // Ensure loading stops
           return; // Exit the try block early after handling the error
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
                    // API returned 200 OK, but indicates a service-level error (e.g., Firestore issue handled by API)
                    console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
                    const serviceError = new Error(data.error);
                    setError(serviceError); // Set the specific error from the API response
                    setOffline(isOfflineError(serviceError));
                    // Use content from the response if available (might be default content returned by API), otherwise use component defaults
                    setContent(data.content ? { ...defaultSiteContent, ...data.content } : defaultSiteContent);
                } else if (data?.content) {
                    // Successful fetch and parse
                    setContent({ ...defaultSiteContent, ...data.content });
                    setError(null); // Clear any previous error
                    setOffline(false); // Ensure offline is false on success
                    console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
                } else {
                    // Unexpected success response structure
                    console.warn("[SiteContentLoader] Unexpected success response structure from API (missing 'content' key?), using defaults.", data);
                    setError(new Error("Unexpected response structure from content API."));
                    setContent(defaultSiteContent);
                }
            } catch (jsonParseError: any) {
                // Failed to parse even a successful (2xx) response
                console.error("[SiteContentLoader] Failed to parse JSON from OK response:", jsonParseError);
                console.error("[SiteContentLoader] Raw response body that failed parsing:", responseBodyText);
                setError(new Error(`Failed to parse successful API response as JSON: ${jsonParseError.message}.`));
                setContent(defaultSiteContent);
            }
        }

      } catch (err: unknown) { // Catch network fetch errors or body reading errors
        console.error("[SiteContentLoader] CATCH BLOCK ERROR in fetchSiteContent:", err);
        const finalError = err instanceof Error ? err : new Error(`An unknown error occurred: ${String(err)}`);
        const isLikelyOffline = isOfflineError(finalError); // Use the utility function

        console.error(`[SiteContentLoader] Final error state - Message: "${finalError.message}", Is Offline: ${isLikelyOffline}`);

        // Log raw response text if available and relevant (e.g., on parse errors)
        if (responseBodyText && finalError.message.toLowerCase().includes('parse')) {
            console.error(`[SiteContentLoader] Raw response body on parse error: ${responseBodyText.substring(0, 500)}${responseBodyText.length > 500 ? '...' : ''}`);
        }

        setError(finalError);
        setOffline(isLikelyOffline);
        setContent(defaultSiteContent); // Always fallback to default content on error
      } finally {
        // Ensure loading is always set to false eventually
        if (loading) {
             setLoading(false);
        }
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
             setError(new Error("Network Error: Connection lost. Please check your internet connection.")); // Set a more specific offline error
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
  }, []); // Empty dependency array ensures fetch runs once on mount

  return <>{children({ content, error, loading, isOffline: offline })}</>;
}
