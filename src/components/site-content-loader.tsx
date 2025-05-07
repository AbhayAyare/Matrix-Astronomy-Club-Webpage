
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, Loader2, AlertCircle } from "lucide-react"; // Added AlertCircle
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
      let responseBodyText: string | null = null;
      let isHtmlResponse = false;

      try {
        console.log("[SiteContentLoader] Fetching /api/get-site-content...");
        response = await fetch("/api/get-site-content", {
          cache: 'no-store', // Ensure fresh data is fetched
          headers: { // Explicitly ask for JSON
            'Accept': 'application/json',
          },
        });
        const responseStatus = response.status;
        const responseContentType = response.headers.get("content-type");
        console.log(`[SiteContentLoader] API response status: ${responseStatus}, Content-Type: ${responseContentType}`);

        // Check if the response looks like HTML early on
        isHtmlResponse = !!responseContentType?.includes("text/html");

        // --- Handle Non-OK HTTP Responses (e.g., 4xx, 5xx) ---
        if (!response.ok) {
          let errorText = `Server error (${responseStatus}): ${response.statusText || 'Unknown server error.'}`;

          // Attempt to read the body text regardless of content type for better error info
          try {
             responseBodyText = await response.text();
             console.log(`[SiteContentLoader] Read response body for non-OK status ${responseStatus}. Length: ${responseBodyText?.length ?? 0}`);
          } catch (bodyReadError) {
              console.warn("[SiteContentLoader] Could not read response body for non-OK status:", bodyReadError);
              // Keep the initial errorText based on status
          }

          // Refine error message based on content type and body
          if (isHtmlResponse && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html')) {
              errorText = `Server error (${responseStatus}): Could not load site content. The API route may have crashed or returned HTML.`;
              console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${responseStatus}).`);
          } else if (responseContentType?.includes("application/json") && responseBodyText) {
              // Try parsing as JSON error structure { error: "message" }
              try {
                  const errorJson = JSON.parse(responseBodyText);
                  if (errorJson?.error && typeof errorJson.error === 'string') {
                      errorText = `API Error (${responseStatus}): ${errorJson.error}`;
                      console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with JSON error: ${errorJson.error}`);
                  } else {
                     // Valid JSON but not the expected error format
                     errorText = `Server error (${responseStatus}): Unexpected JSON response structure. Body: ${responseBodyText.substring(0, 100)}...`;
                     console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with unexpected JSON body:`, responseBodyText);
                  }
              } catch (parseError) {
                  // JSON specified, but failed to parse
                  errorText = `Server error (${responseStatus}): Failed to parse JSON error response. Body: ${responseBodyText.substring(0, 100)}...`;
                  console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus}. Failed to parse body as JSON.`);
              }
          } else if (responseBodyText) {
               // Not HTML, not JSON, but has text content
               errorText = `Server error (${responseStatus}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
          }
          // else: Keep the initial status-based error message if body is empty or unreadable

          const errorToSet = new Error(errorText);
          setError(errorToSet);
          setContent(defaultSiteContent); // Use defaults on error
          setOffline(isOfflineError(errorToSet));
          setLoading(false);
          console.error(`[SiteContentLoader] Setting error state due to non-OK response: ${errorText}`);
          return; // Exit fetch function
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        // Read body text first
        try {
           responseBodyText = await response.text();
           console.log(`[SiteContentLoader] Read response body for OK status ${responseStatus}. Length: ${responseBodyText?.length ?? 0}`);
        } catch (bodyReadError) {
           console.error("[SiteContentLoader] CRITICAL: Failed to read response body even for OK status:", bodyReadError);
           setError(new Error("Failed to read successful API response body."));
           setContent(defaultSiteContent);
           setLoading(false);
           return;
        }

        // Now parse the text body
        let data;
        try {
          if (!responseBodyText) {
              throw new Error("API returned OK status but response body was empty.");
          }
          data = JSON.parse(responseBodyText);
        } catch (e) {
          const parseError = e instanceof Error ? e : new Error(String(e));
          console.error("[SiteContentLoader] API returned OK status but failed to parse JSON body:", parseError);
          console.error(`[SiteContentLoader] Raw response body that failed parsing (first 500 chars): ${responseBodyText?.substring(0, 500)}`);
          setError(new Error(`Failed to parse successful API response as JSON: ${parseError.message}. Check server logs for API route issues.`));
          setContent(defaultSiteContent); // Use defaults
          setLoading(false);
          return;
        }

        // Process the parsed data
        if (data?.error && typeof data.error === 'string') {
           // Handle cases where the API returns 200 OK but includes an error message in the JSON payload
           // This might happen if the service layer (getSiteContent) caught an error but returned default content + error message.
           console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
           const serviceError = new Error(data.error); // Create error object from message
           setError(serviceError);
           setOffline(isOfflineError(serviceError));
           // Use the content provided by the API (likely defaults)
           setContent(data.content ? { ...defaultSiteContent, ...data.content } : defaultSiteContent);
        } else if (data?.content) {
           // Successful fetch and parse
           setContent({ ...defaultSiteContent, ...data.content });
           setError(null); // Clear any previous errors
           setOffline(false);
           console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
        } else {
           // OK status, valid JSON, but unexpected structure (missing 'content' key?)
           console.warn("[SiteContentLoader] Unexpected success response structure from API (missing 'content' key?), using defaults.", data);
           setError(new Error("Unexpected response structure from content API."));
           setContent(defaultSiteContent); // Use defaults
        }

      } catch (err: unknown) {
        // --- Catch Network Errors or Errors Thrown Explicitly Above ---
        const finalError = err instanceof Error ? err : new Error(String(err));
        const isLikelyOffline = isOfflineError(finalError);

        console.error(`[SiteContentLoader] CATCH BLOCK ERROR: ${finalError.message} (Is Offline: ${isLikelyOffline})`);

        // Log raw response body if available and relevant (especially for non-OK responses)
        if (responseBodyText && response && !response.ok) {
            console.error(`[SiteContentLoader] Raw response body on catch block error (Status: ${response.status}): ${responseBodyText.substring(0, 500)}${responseBodyText.length > 500 ? '...' : ''}`);
        }

        setError(finalError);
        setOffline(isLikelyOffline);
        setContent(defaultSiteContent); // Use defaults
      } finally {
        setLoading(false);
        console.log("[SiteContentLoader] Fetch process finished.");
      }
    };

    fetchSiteContent();

    // Network status listeners
    const handleOnline = () => {
        console.log("[SiteContentLoader] Browser reported online.");
        setOffline(false);
        if (error && isOfflineError(error)) {
            console.log("[SiteContentLoader] Refetching content after coming back online.");
            fetchSiteContent(); // Retry fetch if the error was due to being offline
        }
    };
    const handleOffline = () => {
        console.log("[SiteContentLoader] Browser reported offline.");
        setOffline(true);
        // Set a generic offline error if not already set or if the current error isn't offline-related
        if (!error || !isOfflineError(error)) {
             setError(new Error("Network Error: Connection lost. Please check your internet connection."));
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

   // --- Render Logic ---

   // Loading State
   if (loading) {
     return (
       <div className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <span className="ml-4 text-xl text-foreground">Loading Site Content...</span>
       </div>
     );
   }

   // Error State Alert (Displayed once at the top)
   const globalErrorAlert = error ? (
     <div className="container mx-auto px-4 pt-4">
       <Alert
         variant={offline ? "default" : "destructive"}
         className={`${offline ? "border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400" : "" } animate-fade-in`}
       >
         {offline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
         <AlertTitle>
           {offline ? "Network Connectivity Issue" : "Site Content Error"}
         </AlertTitle>
         <AlertDescription>
           {offline
             ? "Could not connect to fetch site content. Please check your internet connection. Displaying default text."
             : `Could not load essential site text (e.g., titles, descriptions). Displaying default text.`}
           <p className="mt-2 text-xs font-mono bg-muted/50 p-1 rounded max-h-20 overflow-y-auto">Details: {String(error?.message || error)}</p>
           {!offline && "Events and Gallery sections may attempt to load separately. Refreshing the page might help."}
         </AlertDescription>
       </Alert>
     </div>
   ) : null;

   // Render children with fetched (or default) content and state
   return (
     <>
       {globalErrorAlert}
       {children({ content, error, loading: false, isOffline: offline })}
     </>
   );
}
