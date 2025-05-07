
import { getSiteContent, defaultSiteContent, GetContentResult } from '@/services/content';
import { NextResponse } from 'next/server';
import { db } from '@/config/firebase'; // Import db to check initialization

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

  // --- Early Check for DB Initialization ---
  if (!db) {
      const duration = Date.now() - startTime;
      const errorId = `api-db-init-fail-${startTime}`;
      console.error(`[API /api/get-site-content] CRITICAL ERROR: Firestore db instance is not initialized (ID: ${errorId}). Request failed after ${duration}ms.`);
      const criticalErrorResponse: ErrorResponse = {
        content: null,
        error: `API Route Critical Error (ID: ${errorId}): Database service is not available. Please check server logs.`
      };
      return NextResponse.json(criticalErrorResponse, {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0',
          },
      });
  }
  console.log("[API /api/get-site-content] Firestore db instance check passed.");

  try {
    console.log("[API /api/get-site-content] Calling getSiteContent service...");
    const result: GetContentResult = await getSiteContent();
    const duration = Date.now() - startTime;
    console.log(`[API /api/get-site-content] getSiteContent service returned after ${duration}ms. Error present: ${!!result.error}`);

    if (result.error) {
        console.error(`[API /api/get-site-content] Service Error after ${duration}ms: ${result.error}`);
        // Use the content (likely default) and error message from the service result.
        const errorResponse: GetContentResult = { content: result.content, error: result.error }; // Ensure GetContentResult structure
        console.log(`[API /api/get-site-content] Preparing 500 JSON response for service error...`);
        return NextResponse.json(errorResponse, {
            status: 500, // Indicate a server-side issue occurred during data fetching
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0', // Prevent caching of error responses
            },
          }
        );
    } else {
         console.log(`[API /api/get-site-content] Service returned successfully after ${duration}ms.`);
         const successResponse: GetContentResult = { content: result.content, error: null }; // Explicitly set error to null
         console.log(`[API /api/get-site-content] Preparing 200 JSON response for success...`);
         return NextResponse.json(successResponse, {
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
    const errorId = `api-handler-critical-${startTime}`; // Unique ID for this error instance
    const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred in the API route handler.';

    // DETAILED LOGGING IN CATCH BLOCK
    console.error(`[API /api/get-site-content] CRITICAL UNHANDLED ERROR in API route handler after ${duration}ms (ID: ${errorId}):`, error);
     if (error instanceof Error && error.stack) {
        console.error(`[API /api/get-site-content] Stack Trace (ID: ${errorId}):\n${error.stack}`);
     } else {
        console.error(`[API /api/get-site-content] Raw Error Object (ID: ${errorId}):`, error);
     }

    // Prepare the critical error response structure
    const criticalErrorResponse: ErrorResponse = {
      content: null, // Explicitly null content on critical server error
      error: `API Route Critical Error (ID: ${errorId}): An internal server error occurred (${errorMessage}). Check server logs.`
    };

    // Attempt to return the JSON error response
    try {
      console.log(`[API /api/get-site-content] Attempting to send 500 JSON response due to critical handler error (ID: ${errorId})`);
      return NextResponse.json(criticalErrorResponse, {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0',
          },
      });
    } catch (responseError) {
        // Fallback if NextResponse.json itself fails (extremely unlikely)
        console.error(`[API /api/get-site-content] CRITICAL FAILURE: Could not even send JSON error response (ID: ${errorId}):`, responseError);
        // Return a plain text response as a last resort, ensuring a response is sent
        return new Response('Internal Server Error - Response Generation Failed', {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    }
  }
}

