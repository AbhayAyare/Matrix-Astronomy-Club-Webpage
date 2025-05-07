
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
      setOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false); // Check initial offline state
      let response: Response | null = null;
      let responseBodyText: string | null = null; // Store response text

      try {
        console.log("[SiteContentLoader] Fetching /api/get-site-content...");
        response = await fetch("/api/get-site-content");
        console.log(`[SiteContentLoader] API response status: ${response.status}`);

        try {
            responseBodyText = await response.text();
            // console.log(`[SiteContentLoader] Raw response body text received (length: ${responseBodyText?.length ?? 0}).`);
        } catch (bodyReadError) {
            console.error("[SiteContentLoader] Error reading response body:", bodyReadError);
            responseBodyText = null;
            if (response && response.ok) {
                 throw new Error("API returned OK status but response body could not be read.");
             }
        }

        if (!response.ok) {
          let errorText = `Server error (${response.status}): Could not load site content.`;
          const contentType = response.headers.get("content-type");

           // Prefer JSON error message if available
           if (responseBodyText && contentType?.includes("application/json")) {
               try {
                 const errorData = JSON.parse(responseBodyText);
                 if (errorData?.error && typeof errorData.error === 'string') {
                   errorText = `API Error (${response.status}): ${errorData.error}`;
                   console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with JSON error: ${errorData.error}`);
                 } else {
                   errorText = `Server error (${response.status}): Unexpected JSON error format.`;
                   console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected JSON structure.`);
                 }
               } catch (jsonParseError) {
                  errorText = `Server error (${response.status}): Failed to parse non-OK JSON response.`;
                  console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with non-JSON body. Starts with: ${responseBodyText?.substring(0, 100)}...`);
               }
           } else if (contentType?.includes("text/html") && responseBodyText?.trim().toLowerCase().startsWith('<!doctype html')) {
             console.warn(`[SiteContentLoader] API route /api/get-site-content returned an HTML error page (Status: ${response.status}). This likely indicates a server crash.`);
             errorText = `Server error (${response.status}): Could not load site content. The API route may have crashed or returned HTML.`;
           } else if (responseBodyText) {
             // Fallback to using plain text if not JSON or obvious HTML error page
             errorText = `Server error (${response.status}): ${responseBodyText.substring(0, 200)}${responseBodyText.length > 200 ? '...' : ''}`;
             console.warn(`[SiteContentLoader] API returned non-OK status ${response.status} with unexpected content type '${contentType}'. Body snippet: ${errorText}`);
           } else {
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
            throw new Error(`Failed to parse successful API response as JSON: ${jsonParseError.message}. Check server logs.`);
        }

        // Even with 200 OK, the service layer might report an error in the JSON body
        if (data?.error && typeof data.error === 'string') {
          console.warn("[SiteContentLoader] API returned 200 OK, but contained a service-level error message:", data.error);
          const serviceError = new Error(data.error); // Create error from message
          setError(serviceError);
          setOffline(isOfflineError(serviceError)); // Check if service error indicates offline
          // Use the content potentially provided alongside the error (might be default)
          setContent(data.content ? { ...defaultSiteContent, ...data.content } : defaultSiteContent);
        } else if (data?.content) {
          // Successful fetch and parse
          setContent({ ...defaultSiteContent, ...data.content });
          setError(null);
          setOffline(false);
          console.log("[SiteContentLoader] Successfully fetched and parsed site content.");
        } else {
          // Unexpected JSON structure in success response
          console.warn("[SiteContentLoader] Unexpected success response structure from API, using defaults.", data);
          setError(new Error("Unexpected response structure from content API."));
          setContent(defaultSiteContent);
        }

      } catch (err: unknown) { // Catch fetch errors, parsing errors, or thrown errors from non-OK responses
        console.error("[SiteContentLoader] Fetch or processing error in fetchSiteContent:", err);
        let finalError: Error;
        let isLikelyOffline = false;

        if (isOfflineError(err)) {
            const offlineMsg = "Network Error: Could not connect to fetch site content. Please check your connection.";
            finalError = new Error(offlineMsg);
            isLikelyOffline = true;
        } else if (err instanceof Error) {
            finalError = err; // Use the error thrown (e.g., from non-OK response handling)
        } else {
            finalError = new Error(`An unknown error occurred: ${String(err)}`);
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
             const offlineErr = new Error("Network Error: Connection lost. Displaying default or cached content.");
             setError(offlineErr);
             // Keep existing content if possible, otherwise it's already default
        }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []); // Runs once on mount

  return <>{children({ content, error, loading, isOffline: offline })}</>;
}
