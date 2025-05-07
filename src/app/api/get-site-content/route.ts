
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

    if (result.error) {
        console.warn("[API /api/get-site-content] getSiteContent service returned an error:", result.error);
        // Even though the service handled it by returning default content,
        // return a non-200 status from the API route to signal an issue occurred.
        // Still return the JSON structure the client expects ({ content: ..., error: ... }).
        return NextResponse.json(result, { status: 500 }); // Return 500 if service indicates an error
    } else {
         console.log("[API /api/get-site-content] getSiteContent service returned successfully.");
         // Successful fetch, return 200 OK with the content
         return NextResponse.json(result, { status: 200 });
    }

  } catch (error: any) {
    // --- Catch UNEXPECTED errors within the API route handler itself ---
    // This block is a safety net for errors not caught by getSiteContent() or other issues in this route handler.
    const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred in the site content API.';
    console.error("[API /api/get-site-content] CRITICAL UNHANDLED ERROR in GET handler:", error);
    console.error("[API /api/get-site-content] Error Details:", error); // Log the full error object

    // Return a standardized JSON error response with a 500 status
    return NextResponse.json(
      {
        content: null, // Explicitly null content on server error
        error: `API Route Server Error: ${errorMessage}. Check server logs for full details.` // Indicate error happened at API level
      },
      { status: 500 } // Indicate internal server error
    );
  }
}
