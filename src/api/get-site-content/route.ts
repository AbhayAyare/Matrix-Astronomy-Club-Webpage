
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

        // Return a 500 status, providing the structure the client expects ({ content: ..., error: ... }).
        // Use the content (likely default) and error message from the service result.
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
    const duration = Date.now() - startTime;
    const errorId = `api-critical-${startTime}`; // Unique ID for this error instance

    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in API route handler after ${duration}ms (ID: ${errorId}):`, error);

    // **Simplified Error Response:** Return a very basic JSON error immediately.
    // This reduces the chance of an error happening *while* formatting the error response.
    const criticalErrorResponse: ErrorResponse = {
      content: null,
      error: `API Route Critical Error (ID: ${errorId}): An internal server error occurred. Please check server logs.`
    };

    console.log(`[API /api/get-site-content] Sending simplified 500 response due to critical handler error (ID: ${errorId})`);

    // Always return a JSON response, even if error details are hard to get.
    try {
      return NextResponse.json(criticalErrorResponse, {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0',
          },
      });
    } catch (responseError) {
        // Fallback if even NextResponse.json fails (very unlikely)
        console.error(`[API /api/get-site-content] CRITICAL FAILURE: Could not even send JSON error response (ID: ${errorId}):`, responseError);
        // Return a plain text response as a last resort
        return new Response('Internal Server Error', { status: 500 });
    }
  }
}
