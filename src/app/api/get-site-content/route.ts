
import { NextResponse } from 'next/server';
import { db } from '@/config/firebase'; // Firebase instance
import { doc, getDoc, FirestoreError } from 'firebase/firestore';
import type { SiteContent } from '@/services/content'; // SiteContent type
import { defaultSiteContent } from '@/services/content'; // Default content

// This tells Next.js to treat this API route as a dynamic serverless function,
// even when the rest of the site is statically exported.
export const dynamic = 'force-dynamic';

const CONTENT_COLLECTION = 'config';
const CONTENT_DOC_ID = 'siteContent';

interface GetContentApiResponse {
    content: SiteContent;
    error: string | null;
}

export async function GET(): Promise<NextResponse<GetContentApiResponse>> {
  console.log("[API /api/get-site-content] GET request received.");

  if (!db) {
    const errorMessage = "Firestore database instance (db) is not initialized.";
    console.error(`[API /api/get-site-content] CRITICAL: ${errorMessage}`);
    // Return default content and a 500 error status if db is not available
    return NextResponse.json({ content: defaultSiteContent, error: errorMessage }, { status: 500 });
  }

  try {
    const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
    const docSnap = await getDoc(contentDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
      // Merge fetched data with defaults to ensure all fields are present,
      // giving precedence to fetched data.
      const mergedContent = { ...defaultSiteContent, ...data };
      console.log("[API /api/get-site-content] Fetched and merged content successfully.");
      return NextResponse.json({ content: mergedContent, error: null }, { status: 200 });
    } else {
      // Document doesn't exist, use default content.
      // This is not necessarily a server error, but expected behavior if content isn't set in Firestore.
      const message = `Configuration document '/${CONTENT_COLLECTION}/${CONTENT_DOC_ID}' not found. Serving default content.`;
      console.warn(`[API /api/get-site-content] INFO: ${message}`);
      return NextResponse.json({ content: defaultSiteContent, error: null /* Or pass 'message' if client needs to know */ }, { status: 200 });
    }
  } catch (error) {
    let errorMessage: string;
    let statusCode = 500; // Default to Internal Server Error

    if (error instanceof FirestoreError) {
      console.error(`[API /api/get-site-content] Firestore Error (Code: ${error.code}):`, error.message, error.stack);
      if (error.code === 'permission-denied') {
        errorMessage = `Permission Denied: Cannot read Firestore document '/${CONTENT_COLLECTION}/${CONTENT_DOC_ID}'. Please check Firestore security rules.`;
        statusCode = 403; // Forbidden
      } else if (error.code === 'unavailable') {
        errorMessage = `Firestore Service Unavailable: Could not fetch site content. This might be a temporary network issue or Firestore service disruption. (Code: ${error.code})`;
        statusCode = 503; // Service Unavailable
      } else {
        errorMessage = `A Firestore error occurred while fetching site content (Code: ${error.code}): ${error.message}`;
      }
    } else if (error instanceof Error) {
      console.error("[API /api/get-site-content] Generic Error:", error.message, error.stack);
      errorMessage = `An unexpected server error occurred while fetching site content: ${error.message}`;
    } else {
      // Handle cases where the error is not an instance of Error
      console.error("[API /api/get-site-content] Unknown Error Object:", error);
      errorMessage = "An unknown server error occurred while fetching site content.";
    }
    
    // In case of any error, return default content along with the error message and appropriate status code
    return NextResponse.json({ content: defaultSiteContent, error: errorMessage }, { status: statusCode });
  }
}
