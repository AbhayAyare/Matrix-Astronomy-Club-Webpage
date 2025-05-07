
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
  const requestId = `api-req-${startTime}`; // Unique ID for this request
  console.log(`[API /api/get-site-content] ${requestId} - GET request received.`);

  // --- Early Check for DB Initialization ---
  if (!db) {
      const duration = Date.now() - startTime;
      const errorId = `api-db-init-fail-${requestId}`;
      console.error(`[API /api/get-site-content] ${errorId} - CRITICAL ERROR: Firestore db instance is not initialized. Request failed after ${duration}ms.`);
      const criticalErrorResponse: ErrorResponse = {
        content: null,
        error: `API Route Critical Error (ID: ${errorId}): Database service is not available. Please check server logs.`
      };
      // Attempt to return JSON error
      return NextResponse.json(criticalErrorResponse, {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0',
          },
      });
  }
  console.log(`[API /api/get-site-content] ${requestId} - Firestore db instance check passed.`);

  try {
    // Re-verify db instance immediately before the call, just in case.
    if (!db) {
       throw new Error("Firestore db instance became unavailable immediately before service call.");
    }

    console.log(`[API /api/get-site-content] ${requestId} - Calling getSiteContent service...`);
    const result: GetContentResult = await getSiteContent(); // Service function handles its own errors and returns { content, error }
    const duration = Date.now() - startTime;
    console.log(`[API /api/get-site-content] ${requestId} - getSiteContent service returned after ${duration}ms. Error present in result: ${!!result.error}`);

    if (result.error) {
        // Log the error received from the service layer
        console.error(`[API /api/get-site-content] ${requestId} - Service Error reported: ${result.error}`);
        // The service returned an error, but likely provided default content.
        // We still return a 500 status from the API to indicate a problem occurred upstream.
        const errorResponse: GetContentResult = { content: result.content, error: result.error };
        console.log(`[API /api/get-site-content] ${requestId} - Preparing 500 JSON response for service error...`);
        return NextResponse.json(errorResponse, {
            status: 500, // Use 500 because the service layer encountered an issue
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0', // Prevent caching of error states
            },
          }
        );
    } else {
         // Success case from the service layer
         console.log(`[API /api/get-site-content] ${requestId} - Service returned successfully after ${duration}ms.`);
         const successResponse: GetContentResult = { content: result.content, error: null }; // Ensure error is null on success
         console.log(`[API /api/get-site-content] ${requestId} - Preparing 200 JSON response for success...`);
         return NextResponse.json(successResponse, {
            status: 200,
             headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', // Cache successful responses
            },
         });
    }

  } catch (error: unknown) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    // This catches errors outside the getSiteContent call or if the call itself throws unexpectedly.
    const duration = Date.now() - startTime;
    const errorId = `api-handler-critical-${requestId}`; // Unique ID for this handler error
    const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred in the API route handler.';

    // DETAILED LOGGING IN CATCH BLOCK
    console.error(`[API /api/get-site-content] ${errorId} - CRITICAL UNHANDLED ERROR in API route handler after ${duration}ms:`, error);
     if (error instanceof Error && error.stack) {
        console.error(`[API /api/get-site-content] Stack Trace (${errorId}):\n${error.stack}`);
     } else {
        console.error(`[API /api/get-site-content] Raw Error Object (${errorId}):`, error);
     }

    // Prepare a standardized JSON error response
    const criticalErrorResponse: ErrorResponse = {
      content: null, // Explicitly null content on critical server error
      error: `API Route Critical Error (ID: ${errorId}): An internal server error occurred. Check server logs.`
    };

    // Attempt to return the JSON error response
    try {
      console.log(`[API /api/get-site-content] ${errorId} - Attempting to send 500 JSON response due to critical handler error...`);
      return NextResponse.json(criticalErrorResponse, {
          status: 500,
          headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, max-age=0',
          },
      });
    } catch (responseError) {
        // Fallback if NextResponse.json itself fails
        console.error(`[API /api/get-site-content] ${errorId} - CRITICAL FAILURE: Could not even send JSON error response:`, responseError);
        // Return a plain text response as a last resort
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
