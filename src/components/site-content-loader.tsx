
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, WifiOff, Loader2 } from "lucide-react";
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

      try {
        console.log("[SiteContentLoader] Fetching /api/get-site-content...");
        response = await fetch("/api/get-site-content", {
          cache: 'no-store',
        });
        const responseStatus = response.status;
        const responseContentType = response.headers.get("content-type");
        console.log(`[SiteContentLoader] API response status: ${responseStatus}, Content-Type: ${responseContentType}`);

        try {
          responseBodyText = await response.text();
        } catch (bodyReadError) {
          console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
          throw new Error(`Failed to read response body (Status: ${responseStatus})`);
        }

        if (!response.ok) {
          let errorText = `Server error (${responseStatus}): Could not load site content.`;
          const isHtmlResponse = responseContentType?.includes("text/html") && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html');

          if (isHtmlResponse) {
            errorText = `Server error (${responseStatus}): Could not load site content. The API route may have crashed or returned HTML.`;
            console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${responseStatus}).`);
          } else {
            try {
              const errorJson = JSON.parse(responseBodyText);
              if (errorJson?.error && typeof errorJson.error === 'string') {
                errorText = `API Error (${responseStatus}): ${errorJson.error}`;
                console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with JSON error: ${errorJson.error}`);
              } else {
                 errorText = `Server error (${responseStatus}): ${response.statusText || 'Unknown server error.'}`;
                 console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus} with non-JSON or unexpected JSON body.`);
              }
            } catch (parseError) {
              // If parsing as JSON fails, use the text body if available and not HTML
              if (responseBodyText && !isHtmlResponse) {
                errorText = `Server error (${responseStatus}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
              } else {
                errorText = `Server error (${responseStatus}): ${response.statusText || 'Unknown server error.'}`;
              }
              console.warn(`[SiteContentLoader] API returned non-OK status ${responseStatus}. Failed to parse body as JSON. Using: ${errorText}`);
            }
          }

          const errorToSet = new Error(errorText);
          setError(errorToSet);
          setContent(defaultSiteContent);
          setOffline(isOfflineError(errorToSet));
          setLoading(false);
          console.error(`[SiteContentLoader] Setting error state due to non-OK response: ${errorText}`);
          return; // Exit fetch function
        }

        // --- Handle OK HTTP Responses (Status 200-299) ---
        let data;
        let parseError: Error | null = null;
        try {
          data = JSON.parse(responseBodyText);
        } catch (e) {
          parseError = e instanceof Error ? e : new Error(String(e));
          console.error("[SiteContentLoader] API returned OK status but failed to parse JSON body:", parseError);
          console.error(`[SiteContentLoader] Raw response body that failed parsing (first 500 chars): ${responseBodyText.substring(0, 500)}`);
          setError(new Error(`Failed to parse successful API response as JSON: ${parseError.message}.`));
          setContent(defaultSiteContent);
        }

        if (!parseError) {
            if (data?.error && typeof data.error === 'string') {
               console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
               const serviceError = new Error(data.error);
               setError(serviceError);
               setOffline(isOfflineError(serviceError));
               setContent(data.content ? { ...defaultSiteContent, ...data.content } : defaultSiteContent);
            } else if (data?.content) {
               setContent({ ...defaultSiteContent, ...data.content });
               setError(null);
               setOffline(false);
               console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
            } else {
               console.warn("[SiteContentLoader] Unexpected success response structure from API (missing 'content' key?), using defaults.", data);
               setError(new Error("Unexpected response structure from content API."));
               setContent(defaultSiteContent);
            }
        }

      } catch (err: unknown) {
        const finalError = err instanceof Error ? err : new Error(String(err));
        const isLikelyOffline = isOfflineError(finalError);

        console.error(`[SiteContentLoader] CATCH BLOCK ERROR: ${finalError.message} (Is Offline: ${isLikelyOffline})`);

        // Log raw response body if available and relevant
        if (responseBodyText && response && !response.ok) {
            console.error(`[SiteContentLoader] Raw response body on catch block error (Status: ${response.status}): ${responseBodyText.substring(0, 500)}${responseBodyText.length > 500 ? '...' : ''}`);
        }

        setError(finalError);
        setOffline(isLikelyOffline);
        setContent(defaultSiteContent);
      } finally {
        setLoading(false);
        console.log("[SiteContentLoader] Fetch process finished.");
      }
    };

    fetchSiteContent();

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
         <span className="ml-4 text-xl text-foreground">Loading Content...</span>
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
         {offline ? <WifiOff className="h-4 w-4"/> : <ServerCrash className="h-4 w-4"/>}
         <AlertTitle>
           {offline ? "Network Connectivity Issue" : "Site Content Error"}
         </AlertTitle>
         <AlertDescription>
            {/* Updated Error Message */}
            Could not load essential site text (e.g., titles, descriptions) due to server-side errors. Displaying default text.
            <p className="mt-2 text-xs font-mono bg-muted/50 p-1 rounded max-h-20 overflow-y-auto">Error: {String(error?.message || error)}</p>
            Events and Gallery sections will attempt to load separately. Refreshing the page might help.
         </AlertDescription>
       </Alert>
     </div>
   ) : null;

   return (
     <>
       {globalErrorAlert}
       {children({ content, error, loading: false, isOffline: offline })}
     </>
   );
}
