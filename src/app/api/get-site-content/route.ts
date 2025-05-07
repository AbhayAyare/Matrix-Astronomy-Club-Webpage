
import { getSiteContent, defaultSiteContent, GetContentResult } from '@/services/content';
import { NextResponse } from 'next/server';

// Define a consistent error response structure
interface ErrorResponse {
    content: null; // Ensure content is null on error
    error: string;
}

export async function GET(): Promise<NextResponse<GetContentResult | ErrorResponse>> {
  console.log("[API /api/get-site-content] GET request received.");
  try {
    const result = await getSiteContent(); // This function should already return { content: ..., error: ... }

    // Log the result from the service function before returning
    if (result.error) {
        console.warn("[API /api/get-site-content] getSiteContent service returned an error:", result.error);
    } else {
         console.log("[API /api/get-site-content] getSiteContent service returned successfully.");
    }

    // Return the result directly (including potential error message from the service)
    // The service function handles Firestore errors and returns default content + error message.
    // The HTTP status should generally be 200 OK here, as the API route itself processed the request.
    // The client (SiteContentLoader) will check the 'error' field in the JSON response.
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    // --- Catch UNEXPECTED errors within the API route itself ---
    // This block is a safety net for errors not caught by getSiteContent() or other issues in this route handler.
    const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred in the site content API.';
    console.error("[API /api/get-site-content] CRITICAL UNHANDLED ERROR in GET handler:", error);
    console.error("[API /api/get-site-content] Error Details:", error); // Log the full error object

    // Return a standardized JSON error response with a 500 status
    // Make the error message more specific that it happened at the API level
    return NextResponse.json(
      {
        content: null, // Explicitly null content on server error
        error: `API Route Server Error: ${errorMessage}. Check server logs for full details.` // Modified error message
      },
      { status: 500 } // Indicate internal server error
    );
  }
}

