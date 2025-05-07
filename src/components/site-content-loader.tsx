
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
           throw new Error(`Failed to read response body (Status: ${responseStatus})`);
        }

        // Attempt to parse as JSON first
        let data;
        let parseError: Error | null = null;
        try {
          data = JSON.parse(responseBodyText);
        } catch (e) {
          parseError = e instanceof Error ? e : new Error(String(e));
          console.warn("[SiteContentLoader] Failed to parse response as JSON:", parseError.message);
        }

        // --- Handle Non-OK HTTP Responses (e.g., 4xx, 5xx) ---
        if (!response.ok) {
          let errorText = `Server error (${responseStatus}): Could not load site content.`;
          const isHtmlResponse = responseContentType?.includes("text/html") && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html');

          if (isHtmlResponse) {
            errorText = `Server error (${responseStatus}): Could not load site content. The API route may have crashed or returned HTML.`;
            console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${responseStatus}).`);
          } else if (data?.error && typeof data.error === 'string') {
            // Use the specific error message from the API's JSON response (even if status wasn't 200)
            errorText = `API Error (${responseStatus}): ${data.error}`;
            console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with JSON error: ${data.error}`);
          } else if (responseBodyText) {
             // Include a snippet of the non-JSON, non-HTML response if available
             errorText = `Server error (${responseStatus}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with content type '${responseContentType}'. Body snippet: ${errorText}`);
          } else {
             errorText = `Server error (${responseStatus}): ${response.statusText || 'Empty or unreadable response body.'}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with empty or unreadable body.`);
          }

          const errorToSet = new Error(errorText);
          setError(errorToSet);
          setContent(defaultSiteContent); // Ensure defaults are set
          setOffline(isOfflineError(errorToSet)); // Check if the error implies offline
          setLoading(false); // Ensure loading stops
          console.error(`[SiteContentLoader] Setting error state due to non-OK response: ${errorText}`);
          return; // Exit fetch function
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        if (parseError) {
           // OK status, but failed to parse JSON -> Treat as unexpected structure
           console.error("[SiteContentLoader] API returned OK status but failed to parse JSON body:", parseError);
           console.error(`[SiteContentLoader] Raw response body that failed parsing (first 500 chars): ${responseBodyText.substring(0, 500)}`);
           setError(new Error(`Failed to parse successful API response as JSON: ${parseError.message}.`));
           setContent(defaultSiteContent);
        } else if (data?.error && typeof data.error === 'string') {
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
           // Unexpected success response structure (missing 'content' key)
           console.warn("[SiteContentLoader] Unexpected success response structure from API (missing 'content' key?), using defaults.", data);
           setError(new Error("Unexpected response structure from content API."));
           setContent(defaultSiteContent);
        }

      } catch (err: unknown) { // Catch network fetch errors or body reading errors
        const finalError = err instanceof Error ? err : new Error(String(err));
        const isLikelyOffline = isOfflineError(finalError);

        console.error(`[SiteContentLoader] CATCH BLOCK ERROR: ${finalError.message} (Is Offline: ${isLikelyOffline})`);

        // Log the raw response body text if it exists and the error seems related to parsing or reading it
        if (responseBodyText && (finalError.message.toLowerCase().includes('parse') || finalError.message.includes('Failed to read response body'))) {
            console.error(`[SiteContentLoader] Raw response body on error (Status: ${response?.status}): ${responseBodyText.substring(0, 500)}${responseBodyText.length > 500 ? '...' : ''}`);
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
