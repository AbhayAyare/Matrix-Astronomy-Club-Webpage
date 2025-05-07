
import { db } from '@/config/firebase'; // Adjust path as needed
import { doc, getDoc, DocumentData, FirestoreError } from 'firebase/firestore';

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

// Helper function to check for offline errors (more robust check)
// Duplicated from utils.ts for standalone use if needed, but ideally imported
function isFirestoreOfflineError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  if (error instanceof FirestoreError) {
    // Specific Firestore codes indicating offline or network issues
    return error.code === 'unavailable' || error.code === 'cancelled' || // Cancelled can sometimes indicate network issues
           message.includes('offline') ||
           message.includes('failed to get document because the client is offline') ||
           message.includes('could not reach cloud firestore backend') ||
           message.includes('network'); // Broader check for network-related messages
  }
  // Check generic Error messages as well
  return error instanceof Error && (
      message.includes('network error') ||
      message.includes('client is offline') ||
      message.includes('failed to fetch') || // Browser fetch error
      message.includes('could not reach cloud firestore backend')
  );
}


/**
 * Fetches the site content from Firestore.
 * Returns default content if the document doesn't exist or on error.
 * Includes an error message string if a fetch error occurred.
 * @returns Promise<GetContentResult>
 */
export async function getSiteContent(): Promise<GetContentResult> {
  const contentDocPath = `${CONTENT_COLLECTION}/${CONTENT_DOC_ID}`;
  console.log(`[getSiteContent] Attempting to fetch content from Firestore path: ${contentDocPath}`);

  if (!db) {
      const errorMsg = "Firestore database instance (db) is not initialized.";
      console.error(`[getSiteContent] CRITICAL: ${errorMsg}`);
      // Prefix error message for clarity on the client
      return { content: defaultSiteContent, error: `Initialization Error: ${errorMsg}` };
  }
  console.log("[getSiteContent] Firestore db instance appears valid.");


  let errorMessage: string | null = null;

  try {
    const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
    console.log(`[getSiteContent] Executing getDoc for ${contentDocPath}...`);
    const docSnap = await getDoc(contentDocRef);
    console.log(`[getSiteContent] getDoc completed for ${contentDocPath}. Document exists: ${docSnap.exists()}`);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
       const mergedContent = { ...defaultSiteContent, ...data };
       console.log("[getSiteContent] Fetched and merged content successfully.");
       return { content: mergedContent, error: null }; // Success, no error
    } else {
      // Document doesn't exist - this is not necessarily a fatal error, but useful info.
      errorMessage = `Configuration document '/${contentDocPath}' not found in Firestore. Using default website content.`;
      console.warn(`[getSiteContent] INFO: ${errorMessage}`);
      // Return default content but include the informational error message
      return { content: defaultSiteContent, error: `Content Notice: ${errorMessage}` };
    }
  } catch (error) {
    // Log the raw error first for detailed diagnosis
    console.error(`[getSiteContent] Error during Firestore operation for ${contentDocPath}:`, error);
    // More detailed log if it's a FirestoreError
    if (error instanceof FirestoreError) {
        console.error(`[getSiteContent] Firestore Error Details - Code: ${error.code}, Message: ${error.message}`);
    }

    // Determine the error message string
    if (isFirestoreOfflineError(error)) {
        // Client seems offline or cannot reach Firestore
        errorMessage = `Network/Offline Error: Could not connect to Firestore to fetch site content (${(error as FirestoreError)?.code || 'Network Issue'}). Please check the network connection. Displaying default content.`;
       console.warn(`[getSiteContent] NETWORK/OFFLINE: ${errorMessage}`);
    } else if (error instanceof FirestoreError) {
        // Other Firestore specific errors
        if (error.code === 'permission-denied') {
            errorMessage = `Permission Denied: Could not read site content document ('/${contentDocPath}'). Check Firestore security rules. Ensure the '${contentDocPath}' path allows public read access.`;
            console.error(`[getSiteContent] CRITICAL PERMISSION ERROR: ${errorMessage}`);
        } else if (error.code === 'unimplemented') {
            errorMessage = `Firestore Error (Unimplemented): This operation is not supported. Path: '${contentDocPath}'.`;
            console.error(`[getSiteContent] FIRESTORE ERROR: ${errorMessage}`);
        } else {
            // Other Firestore errors
            errorMessage = `Firestore Error (${error.code}) fetching site content from '${contentDocPath}'. Details: ${error.message}`;
            console.error(`[getSiteContent] FIRESTORE ERROR: Full details - ${errorMessage}`);
        }
    } else if (error instanceof Error) {
         // Generic JS errors
         errorMessage = `Unexpected Error fetching site content: ${error.message}`;
         console.error(`[getSiteContent] GENERIC ERROR: ${errorMessage}`);
    } else {
        // Unknown error type
        errorMessage = `Unknown Error fetching site content from '${contentDocPath}'.`;
        console.error(`[getSiteContent] UNKNOWN ERROR TYPE: ${errorMessage}`);
    }

    // Return default content as a fallback on any error, including the specific string error message
    // Prefix the error message source for better debugging on the client
    return { content: defaultSiteContent, error: `Content Fetch Error: ${errorMessage}` };
  }
}
