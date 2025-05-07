
import { getSiteContent } from '@/services/content';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await getSiteContent();
    // The result object from getSiteContent should include an 'error' property if Firestore access failed.
    // We return this result directly; the client (SiteContentLoader) will handle displaying the error.
    // A 200 OK response is appropriate here as the API route itself functioned,
    // even if getSiteContent reported a data access issue.
    return NextResponse.json(result);
  } catch (error: any) {
    // This catch block is for unexpected errors within the API route itself,
    // or if getSiteContent() itself throws an unhandled exception.
    console.error("FATAL ERROR in /api/get-site-content route:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown critical error occurred in the site content API.';
    
    // This will be the JSON payload if this catch block is hit.
    return NextResponse.json(
      { 
        // Mimic the GetContentResult structure somewhat for consistency on the client if possible,
        // but indicate it's a severe server-side API failure.
        content: null, // No content could be determined due to the fatal error
        error: `API Server Error: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}
