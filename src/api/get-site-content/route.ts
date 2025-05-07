
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
    // Call the service function which handles its own errors and returns a consistent structure
    const result: GetContentResult = await getSiteContent();
    const duration = Date.now() - startTime;

    if (result.error) {
        // Log the error reported by the service layer
        console.error(`[API /api/get-site-content] Service Error after ${duration}ms: ${result.error}`);

        // Return a 500 status, but still provide the structure the client expects ({ content: ..., error: ... }).
        // The service layer already provided default content in 'result.content'.
        return NextResponse.json(
          { content: result.content, error: result.error }, // Use content and error from service result
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
    } else {
         // Service returned content successfully without errors
         console.log(`[API /api/get-site-content] Service returned successfully after ${duration}ms.`);
         return NextResponse.json(result, { status: 200 });
    }

  } catch (error: unknown) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    // This is a fallback for errors *outside* the getSiteContent service call or errors thrown by it unexpectedly
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in API route handler after ${duration}ms:`, error);

    // Determine a safe error message string
    let errorMessage = 'An unknown critical error occurred in the site content API route.';
    let errorStack = 'N/A';
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || 'N/A';
      console.error(`[API /api/get-site-content] Stack Trace: ${errorStack}`);
    } else {
      try {
        // Attempt to stringify non-Error objects, but be cautious
        errorMessage = `Non-Error object caught: ${JSON.stringify(error)}`;
      } catch (stringifyError) {
         console.error("[API /api/get-site-content] Error trying to stringify the unknown error:", stringifyError);
         // Fallback to a very generic message if stringification fails
         errorMessage = "An unknown, non-serializable critical error occurred.";
      }
    }

    // Construct the standardized JSON error response
    // Use a safe, guaranteed-to-serialize message in the response
    const criticalErrorResponse: ErrorResponse = {
      content: null, // No content available due to critical API error
      error: `API Route Critical Error: Could not process request due to an internal server issue. Check server logs for ID [${startTime}] for details.` // More generic user-facing message
    };

    console.log("[API /api/get-site-content] Sending 500 response due to critical handler error:", JSON.stringify(criticalErrorResponse));

    // Use NextResponse.json for consistency and ensure correct headers
    // Set status to 500 for internal server error
    return NextResponse.json(criticalErrorResponse, {
        status: 500,
        headers: { 'Content-Type': 'application/json' }, // Explicitly set content type
    });
  }
}
