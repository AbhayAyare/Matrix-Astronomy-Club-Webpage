
import { getSiteContent, defaultSiteContent, GetContentResult } from '@/services/content';
import { NextResponse } from 'next/server';

// Define a consistent error response structure
interface ErrorResponse {
    content: null; // Ensure content is null on error
    error: string;
}

// Ensure this route is treated as dynamic, not static,
// especially if environment variables or external services are involved.
export const dynamic = 'force-dynamic';

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
        // Let's send back the default content along with the error message.
        return NextResponse.json(
          { content: result.content, error: result.error }, // Use content and error from service result
          {
            status: 500, // Indicate a server-side issue occurred during data fetching
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0', // Prevent caching of error responses
            },
          }
        );
    } else {
         // Service returned content successfully without errors
         console.log(`[API /api/get-site-content] Service returned successfully after ${duration}ms.`);
         return NextResponse.json(result, {
            status: 200,
             headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Allow caching for successful responses
            },
         });
    }

  } catch (error: unknown) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    // This is a fallback for errors *outside* the getSiteContent service call or errors thrown by it unexpectedly
    const endTime = Date.now();
    const duration = endTime - startTime;
    const errorId = `api-critical-${startTime}`; // Unique ID for this error instance

    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in API route handler after ${duration}ms (ID: ${errorId}):`, error);

    // Determine a safe error message string
    let errorMessage = 'An unknown critical error occurred in the site content API route.';
    let errorStack = 'N/A';
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack || 'N/A';
      console.error(`[API /api/get-site-content] Stack Trace (ID: ${errorId}): ${errorStack}`);
    } else {
      try {
        // Attempt to stringify non-Error objects, but be cautious
        const stringifiedError = JSON.stringify(error);
        errorMessage = `Non-Error object caught: ${stringifiedError}`;
        console.error(`[API /api/get-site-content] Raw Error Object (ID: ${errorId}):`, stringifiedError);
      } catch (stringifyError) {
         console.error(`[API /api/get-site-content] Error trying to stringify the unknown error (ID: ${errorId}):`, stringifyError);
         // Fallback to a very generic message if stringification fails
         errorMessage = "An unknown, non-serializable critical error occurred.";
      }
    }

    // Construct the standardized JSON error response
    // Use a safe, guaranteed-to-serialize message in the response
    const criticalErrorResponse: ErrorResponse = {
      content: null, // No content available due to critical API error
      error: `API Route Critical Error (ID: ${errorId}): Could not process request due to an internal server issue. Check server logs for details.` // More generic user-facing message
    };

    console.log(`[API /api/get-site-content] Sending 500 response due to critical handler error (ID: ${errorId}):`, JSON.stringify(criticalErrorResponse));

    // Use NextResponse.json for consistency and ensure correct headers
    // Set status to 500 for internal server error
    return NextResponse.json(criticalErrorResponse, {
        status: 500,
        headers: {
            'Content-Type': 'application/json', // Explicitly set content type
            'Cache-Control': 'no-store, max-age=0', // Prevent caching of error responses
        },
    });
  }
}
