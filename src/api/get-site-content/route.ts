
import { getSiteContent, defaultSiteContent, GetContentResult } from '@/services/content';
import { NextResponse } from 'next/server';

// Define a consistent error response structure
interface ErrorResponse {
    content: null | SiteContent; // Allow default content even on error
    error: string;
}

export async function GET(): Promise<NextResponse<GetContentResult | ErrorResponse>> {
  const startTime = Date.now();
  console.log("[API /api/get-site-content] GET request received.");

  try {
    // Call the service function which now handles its own errors more robustly
    const result = await getSiteContent();

    // The service function now ALWAYS returns a result object { content: ..., error: ... }
    // Check if the service reported an error (even if it returned default content)
    if (result.error) {
      console.warn(`[API /api/get-site-content] Service reported an issue after ${Date.now() - startTime}ms: ${result.error}`);
      // Return a 500 status to indicate a server-side problem occurred,
      // but still send the result object (which includes the default content and the error message)
      return NextResponse.json(result, { status: 500 });
    } else {
      // Service returned content successfully without errors
      console.log(`[API /api/get-site-content] Service returned successfully after ${Date.now() - startTime}ms.`);
      return NextResponse.json(result, { status: 200 });
    }

  } catch (error: unknown) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    // This is a fallback for errors *outside* the getSiteContent service call
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in API route handler after ${duration}ms:`, error);

    // Determine the error message
    let errorMessage = 'An unknown critical error occurred in the site content API route.';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("[API /api/get-site-content] Stack Trace:", error.stack);
    } else {
      try {
        errorMessage = String(error);
      } catch (stringifyError) {
        console.error("[API /api/get-site-content] Error trying to stringify the unknown error:", stringifyError);
      }
    }

    // Construct the JSON response for critical errors
    const criticalErrorResponse: ErrorResponse = {
      content: defaultSiteContent, // Provide default content even on critical API errors
      error: `API Route Server Error: ${errorMessage}. Check server logs.`
    };

    console.log("[API /api/get-site-content] Sending 500 response due to critical handler error:", JSON.stringify(criticalErrorResponse));

    // Use NextResponse.json for consistency
    return NextResponse.json(criticalErrorResponse, {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}
