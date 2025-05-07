
import { db } from '@/config/firebase'; // Adjust path as needed
import { doc, getDoc, DocumentData, FirestoreError } from 'firebase/firestore';
import { isOfflineError } from '@/lib/utils'; // Use helper from utils


const CONTENT_COLLECTION = 'config';
const CONTENT_DOC_ID = 'siteContent';

// Interface matching the structure in AdminContentPage
export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  joinTitle: string;
  joinDescription: string;
  newsletterTitle: string;
  newsletterDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

// Default content structure (matches AdminContentPage)
// Export this constant
export const defaultSiteContent: SiteContent = {
  heroTitle: 'Welcome to Matrix Astronomy Club',
  heroSubtitle: 'Your gateway to the cosmos. Explore, learn, and connect with fellow space enthusiasts.',
  about: 'Matrix is a passionate community dedicated to exploring the wonders of the universe. We organize stargazing sessions, workshops, and talks for enthusiasts of all levels.',
  joinTitle: 'Become a Member',
  joinDescription: 'Fill out the form below to start your cosmic journey with us.',
  newsletterTitle: 'Subscribe to Our Newsletter',
  newsletterDescription: 'Get the latest news, event announcements, and astronomical insights delivered to your inbox.',
  contactEmail: 'info@matrixastronomy.org',
  contactPhone: '7219690903',
  contactAddress: 'Kolhapur',
};

// Return type for the service function
export interface GetContentResult {
    content: SiteContent;
    error: string | null; // Error message as a simple string or null
}


/**
 * Fetches the site content from Firestore.
 * Returns default content if the document doesn't exist or on error.
 * Includes an error message string if a fetch error occurred.
 * @returns Promise<GetContentResult>
 */
export async function getSiteContent(): Promise<GetContentResult> {
  const contentDocPath = `${CONTENT_COLLECTION}/${CONTENT_DOC_ID}`;
  console.log(`[Service getSiteContent] Attempting to fetch content from Firestore path: ${contentDocPath}`);
  let errorMessage: string | null = null;

  // Wrap the entire operation in a try...catch
  try {
    // --- Initial DB Check ---
    if (!db) {
        console.error("[Service getSiteContent] Firestore database instance (db) is null or undefined. Cannot proceed with Firestore operation.");
        // Throw an error here so it's caught by the main catch block
        throw new Error("Firestore database instance (db) is not initialized.");
    }
    console.log("[Service getSiteContent] Firestore db instance appears valid.");

    // --- Firestore Operation ---
    let contentDocRef;
    try {
         contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
         console.log(`[Service getSiteContent] Created document reference for ${contentDocPath}.`);
    } catch (refError) {
        console.error(`[Service getSiteContent] Error creating document reference for ${contentDocPath}:`, refError);
        throw new Error(`Failed to create Firestore document reference: ${refError instanceof Error ? refError.message : String(refError)}`);
    }


    console.log(`[Service getSiteContent] Executing getDoc for ${contentDocPath}...`);
    const docSnap = await getDoc(contentDocRef);
    console.log(`[Service getSiteContent] getDoc completed for ${contentDocPath}. Document exists: ${docSnap.exists()}`);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
       // Merge fetched data with defaults to handle potentially missing fields
       const mergedContent = { ...defaultSiteContent, ...data };
       console.log("[Service getSiteContent] Fetched and merged content successfully.");
       return { content: mergedContent, error: null }; // Success
    } else {
      errorMessage = `Configuration document '/${contentDocPath}' not found in Firestore. Using default content.`;
      console.warn(`[Service getSiteContent] INFO: ${errorMessage}`);
      // Return default content, but signal that it wasn't found (not a critical fetch error)
      // Consider if this should be logged as an "error" in the result or just a notice.
      // For now, returning null error as it's not a fetch failure.
      return { content: defaultSiteContent, error: null };
    }

  } catch (error) {
    // --- Catch ANY error during DB check, ref creation, or Firestore operation ---
    const errorId = `service-error-${Date.now()}`;
    console.error(`[Service getSiteContent] CRITICAL ERROR during Firestore operation for ${contentDocPath} (ID: ${errorId}):`, error);

    // Log Firestore-specific details if available
    if (error instanceof FirestoreError) {
        console.error(`[Service getSiteContent] Firestore Error Details (ID: ${errorId}) - Code: ${error.code}, Message: ${error.message}`);
    }

    // Determine the specific error message
     if (error instanceof Error && error.message.includes("db) is not initialized")) {
       errorMessage = `Initialization Error: ${error.message}`;
     } else if (isOfflineError(error)) {
        // Client seems offline or cannot reach Firestore
        errorMessage = `Network/Offline Error: Could not connect to Firestore (${(error as FirestoreError)?.code || 'Network Issue'}). Check network connection and Firestore status.`;
       console.warn(`[Service getSiteContent] NETWORK/OFFLINE (ID: ${errorId}): ${errorMessage}`);
    } else if (error instanceof FirestoreError) {
        // Other Firestore specific errors
        if (error.code === 'permission-denied') {
            errorMessage = `Permission Denied: Could not read '/${contentDocPath}'. Check Firestore security rules.`;
            console.error(`[Service getSiteContent] CRITICAL PERMISSION ERROR (ID: ${errorId}): ${errorMessage}`);
        } else {
            errorMessage = `Firestore Error (${error.code}) fetching '/${contentDocPath}'. Details: ${error.message}`;
            console.error(`[Service getSiteContent] FIRESTORE ERROR (ID: ${errorId}): ${errorMessage}`);
        }
    } else if (error instanceof Error) {
         // Generic JS errors or errors thrown from ref creation
         errorMessage = `Unexpected Error fetching content: ${error.message}`;
         console.error(`[Service getSiteContent] GENERIC ERROR (ID: ${errorId}): ${errorMessage}`);
    } else {
        // Unknown error type
        errorMessage = `Unknown Error fetching content from '${contentDocPath}'.`;
        console.error(`[Service getSiteContent] UNKNOWN ERROR TYPE (ID: ${errorId}): ${errorMessage}`);
    }

    // Return default content as a fallback, including the specific error message
    return { content: defaultSiteContent, error: `Service Layer Error (ID: ${errorId}): ${errorMessage}` };
  }
}
