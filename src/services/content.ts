
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
export const defaultContent: SiteContent = {
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

// Updated return type to include specific error message
interface GetContentResult {
    content: SiteContent;
    error: string | null; // Error message as a simple string or null
}

// Helper function to check for offline errors (more robust check)
function isFirestoreOfflineError(error: any): boolean {
  if (error instanceof FirestoreError) {
    return error.code === 'unavailable' ||
           error.message?.toLowerCase().includes('offline') || // Check message content
           error.message?.toLowerCase().includes('failed to get document because the client is offline');
  }
  // Also check for generic network errors if possible, though FirestoreError is primary
  return error instanceof Error && error.message?.toLowerCase().includes('network error');
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
      const errorMsg = "[getSiteContent] Firestore database instance (db) is not initialized.";
      console.error(errorMsg);
      return { content: defaultContent, error: `Website Content: ${errorMsg}` };
  }
  console.log("[getSiteContent] Firestore db instance appears valid.");


  const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  let errorMessage: string | null = null;

  try {
    console.log(`[getSiteContent] Executing getDoc for ${contentDocPath}...`);
    const docSnap = await getDoc(contentDocRef);
    console.log(`[getSiteContent] getDoc completed for ${contentDocPath}. Document exists: ${docSnap.exists()}`);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
       // Merge fetched data with defaults to ensure all fields exist and provide fallbacks
       const mergedContent = { ...defaultContent, ...data };
       console.log("[getSiteContent] Fetched and merged content successfully.");
       return { content: mergedContent, error: null }; // No error
    } else {
      console.warn("[getSiteContent] Site content document not found, returning default content.");
      // Document doesn't exist, not strictly an error, but could be logged
      errorMessage = "Configuration document not found. Using default content.";
      return { content: defaultContent, error: `Website Content: ${errorMessage}` }; // Return string error
    }
  } catch (error) {
    // Log the raw error first for detailed diagnosis
    console.error(`[getSiteContent] Error during getDoc for ${contentDocPath}:`, error);

    // Determine the error message string
    if (isFirestoreOfflineError(error)) {
       // More specific log for "offline" on server
       errorMessage = `Offline/Unavailable: The server could not connect to Firestore to fetch site content (${(error as FirestoreError)?.code}).`;
       console.warn(`[getSiteContent] ${errorMessage}`);
    } else if (error instanceof FirestoreError) {
        if (error.code === 'permission-denied') {
            errorMessage = `Permission Denied: Check Firestore rules for reading '${contentDocPath}'. Ensure API is enabled and propagated.`;
            console.error(`[getSiteContent] ${errorMessage}`);
        } else {
            errorMessage = `Firestore Error (${error.code}): Could not fetch content. Details: ${error.message}`;
            console.error(`[getSiteContent] Full Firestore error: ${error.message}`);
        }
    } else if (error instanceof Error) {
         errorMessage = `Unexpected Error: An unexpected error occurred fetching site content: ${error.message}`;
         console.error(`[getSiteContent] ${errorMessage}`);
    } else {
        errorMessage = "Unknown Error: An unknown error occurred fetching site content.";
        console.error(`[getSiteContent] ${errorMessage}`);
    }
    // Return default content as a fallback on any error, including the specific string error message
    return { content: defaultContent, error: `Website Content: ${errorMessage}` };
  }
}
