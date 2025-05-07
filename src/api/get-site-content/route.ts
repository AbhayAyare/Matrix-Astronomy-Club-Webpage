
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
        // return a non-200 status from the API route to signal an issue occurred.
        // Still return the JSON structure the client expects ({ content: ..., error: ... }).
        // Return 500 as the service layer encountered an error.
        const errorResponse: ErrorResponse = { content: null, error: result.error };
        console.log("[API /api/get-site-content] Sending 500 response due to service error:", JSON.stringify(errorResponse));
        return NextResponse.json(errorResponse, { status: 500 });
    } else {
         console.log(`[API /api/get-site-content] getSiteContent service returned successfully after ${Date.now() - startTime}ms.`);
         // Successful fetch, return 200 OK with the content
         return NextResponse.json(result, { status: 200 });
    }

  } catch (error: any) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    // This block is a safety net for errors not caught by getSiteContent() or other issues in this route handler.
    const endTime = Date.now();
    const duration = endTime - startTime;
    const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred in the site content API.';
    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in GET handler after ${duration}ms:`, error);
    // Log the stack trace if available
    if (error instanceof Error) {
        console.error("[API /api/get-site-content] Stack Trace:", error.stack);
    } else {
         console.error("[API /api/get-site-content] Raw Error Object:", error);
    }

    // Construct the JSON response *before* logging it
    const criticalErrorResponse: ErrorResponse = {
        content: null, // Explicitly null content on critical server error
        error: `API Route Server Error: ${errorMessage}. Check server logs for full details.` // Indicate error happened at API level
    };

    console.log("[API /api/get-site-content] Sending 500 response due to critical handler error:", JSON.stringify(criticalErrorResponse));

    // Return a standardized JSON error response with a 500 status
    return NextResponse.json(criticalErrorResponse, { status: 500 });
  }
}
