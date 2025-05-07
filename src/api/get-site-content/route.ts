
import { getSiteContent, defaultSiteContent, GetContentResult } from '@/services/content';
import { NextResponse } from 'next/server';
import { FirestoreError } from 'firebase/firestore'; // Ensure FirestoreError is imported if needed for specific checks

// Define a consistent error response structure
interface ErrorResponse {
    content: null; // Explicitly null content on error
    error: string;
}

export async function GET(): Promise<NextResponse<GetContentResult | ErrorResponse>> {
  const startTime = Date.now();
  console.log("[API /api/get-site-content] GET request received.");

  try {
    // Call the service function which handles its own errors and returns default content on failure
    const result: GetContentResult = await getSiteContent();

    // Check if the service function itself reported an error (even if it returned default content)
    if (result.error) {
      console.warn(`[API /api/get-site-content] Service reported an issue after ${Date.now() - startTime}ms: ${result.error}`);
      // Return a 500 status, but still provide the structure the client expects (content + error)
      // Use the default content provided by the service in case of error.
      return NextResponse.json(
         { content: result.content, error: result.error }, // Use content from service (which is default on error)
         { status: 500 }
      );
    } else {
      // Service returned content successfully without errors
      console.log(`[API /api/get-site-content] Service returned successfully after ${Date.now() - startTime}ms.`);
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
    if (error instanceof Error) {
      errorMessage = error.message;
      // Log stack trace if available for better debugging
      console.error("[API /api/get-site-content] Stack Trace:", error.stack);
    } else {
      try {
        errorMessage = String(error); // Attempt to stringify unknown errors
      } catch (stringifyError) {
         // If stringifying fails, use the absolute fallback
         console.error("[API /api/get-site-content] Error trying to stringify the unknown error:", stringifyError);
      }
    }

    // Construct the standardized JSON error response
    const criticalErrorResponse: ErrorResponse = {
      content: null, // No content available due to critical API error
      error: `API Route Server Error: ${errorMessage}. Check server logs.`
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
