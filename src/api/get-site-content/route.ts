
import { getSiteContent, defaultSiteContent, GetContentResult } from '@/services/content';
import { NextResponse } from 'next/server';

// Define a consistent error response structure
interface ErrorResponse {
    content: null; // Ensure content is null on error
    error: string;
}

export async function GET(): Promise<NextResponse<GetContentResult | ErrorResponse>> {
  const startTime = Date.now();
  console.log("[API /api/get-site-content] GET request received.");

  try {
    const result = await getSiteContent(); // This function should already return { content: ..., error: ... }

    if (result.error) {
        console.error(`[API /api/get-site-content] Error returned from getSiteContent service after ${Date.now() - startTime}ms:`, result.error);
        // Even though the service handled it by returning default content,
        // return a 500 status from the API route to signal an issue occurred.
        // Return null content to clearly indicate failure at the API level,
        // along with the error message from the service.
        const errorResponse: ErrorResponse = {
            content: null, // Explicitly null content on service error
            error: `Service Error: ${result.error}` // Prefix the error message
        };
        console.log("[API /api/get-site-content] Sending 500 response due to service error:", JSON.stringify(errorResponse));
        // Ensure JSON is returned even for service errors
        return NextResponse.json(errorResponse, { status: 500 });
    } else {
         console.log(`[API /api/get-site-content] getSiteContent service returned successfully after ${Date.now() - startTime}ms.`);
         // Successful fetch, return 200 OK with the content
         return NextResponse.json(result, { status: 200 });
    }

  } catch (error: any) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in GET handler after ${duration}ms:`, error);

    // Default error message
    let errorMessage = 'An unknown critical error occurred in the site content API.';
    try {
      // Try to get a more specific message, but don't let this fail the response
      errorMessage = error instanceof Error ? error.message : String(error);
      if (error instanceof Error && error.stack) {
        console.error("[API /api/get-site-content] Stack Trace:", error.stack);
      }
    } catch (e) {
      console.error("[API /api/get-site-content] Error while trying to stringify the original error:", e);
    }

    // Construct the JSON response *before* logging it
    const criticalErrorResponse: ErrorResponse = {
        content: null, // Explicitly set content to null on critical errors
        error: `API Route Server Error: ${errorMessage}. Check server logs.` // Indicate error happened at API level
    };

    console.log("[API /api/get-site-content] Sending 500 response due to critical handler error:", JSON.stringify(criticalErrorResponse));

    // Ensure this ALWAYS returns JSON, preventing HTML error pages
    try {
        return NextResponse.json(criticalErrorResponse, { status: 500 });
    } catch (responseError) {
        // Fallback if NextResponse.json fails (highly unlikely)
        console.error("[API /api/get-site-content] FAILED TO SEND JSON RESPONSE:", responseError);
        // Return a plain text response as a last resort, still trying to make it JSON-like
        return new Response(JSON.stringify({ error: 'Failed to generate JSON error response.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
  }
}

