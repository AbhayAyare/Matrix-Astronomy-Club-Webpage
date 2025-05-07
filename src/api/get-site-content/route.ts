
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

  } catch (error: unknown) { // Catch unknown type for broader compatibility
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in GET handler after ${duration}ms:`, error);

    // Determine the error message
    let errorMessage = 'An unknown critical error occurred in the site content API.';
    if (error instanceof Error) {
        errorMessage = error.message;
        // Log stack trace for server-side debugging
        console.error("[API /api/get-site-content] Stack Trace:", error.stack);
    } else {
        // Try to stringify non-Error objects, but handle potential failures
        try {
            errorMessage = String(error);
        } catch (stringifyError) {
            console.error("[API /api/get-site-content] Error trying to stringify the unknown error:", stringifyError);
            // Keep the default message if stringification fails
        }
    }

    // Construct the JSON response
    const criticalErrorResponse: ErrorResponse = {
        content: null, // Explicitly set content to null on critical errors
        error: `API Route Server Error: ${errorMessage}. Check server logs.` // Indicate error happened at API level
    };

    console.log("[API /api/get-site-content] Sending 500 response due to critical handler error:", JSON.stringify(criticalErrorResponse));

    // Ensure this ALWAYS returns JSON, preventing HTML error pages
    // Use the Response constructor directly for maximum safety in critical error paths
    return new Response(JSON.stringify(criticalErrorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}
