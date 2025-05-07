
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

// Updated return type to include specific error message
interface GetContentResult {
    content: SiteContent;
    error: string | null; // Error message as a simple string or null
}

// Helper function to check for offline errors (more robust check)
function isFirestoreOfflineError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  if (error instanceof FirestoreError) {
    return error.code === 'unavailable' ||
           message.includes('offline') || // Check message content
           message.includes('failed to get document because the client is offline') ||
           message.includes('could not reach cloud firestore backend');
  }
  // Also check for generic network errors if possible, though FirestoreError is primary
  return error instanceof Error && (
      message.includes('network error') ||
      message.includes('client is offline') ||
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
      const errorMsg = "[getSiteContent] Firestore database instance (db) is not initialized.";
      console.error(errorMsg);
      return { content: defaultSiteContent, error: `Website Content: ${errorMsg}` };
  }
  console.log("[getSiteContent] Firestore db instance appears valid.");


  let errorMessage: string | null = null;

  try {
    // Move doc() call inside the try block to catch potential errors here too
    const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
    console.log(`[getSiteContent] Executing getDoc for ${contentDocPath}...`);
    const docSnap = await getDoc(contentDocRef);
    console.log(`[getSiteContent] getDoc completed for ${contentDocPath}. Document exists: ${docSnap.exists()}`);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
       // Merge fetched data with defaults to ensure all fields exist and provide fallbacks
       const mergedContent = { ...defaultSiteContent, ...data };
       console.log("[getSiteContent] Fetched and merged content successfully.");
       return { content: mergedContent, error: null }; // No error
    } else {
      console.warn(`[getSiteContent] Site content document not found at ${contentDocPath}, returning default content.`);
      // Document doesn't exist, not strictly an error, but could be logged
      errorMessage = `Configuration document not found at '${contentDocPath}'. Using default content.`;
      return { content: defaultSiteContent, error: `Website Content: ${errorMessage}` }; // Return string error
    }
  } catch (error) {
    // Log the raw error first for detailed diagnosis
    console.error(`[getSiteContent] Error during Firestore operation for ${contentDocPath}:`, error);

    // Determine the error message string
    if (isFirestoreOfflineError(error)) {
       // More specific log for "offline" on server
       errorMessage = `Offline/Unavailable: The server could not connect to Firestore to fetch site content from '${contentDocPath}' (${(error as FirestoreError)?.code}).`;
       console.warn(`[getSiteContent] ${errorMessage}`);
    } else if (error instanceof FirestoreError) {
        if (error.code === 'permission-denied') {
            errorMessage = `Permission Denied: Could not read document '${contentDocPath}'. Check Firestore rules. Ensure API is enabled and rules allow public read access.`;
            console.error(`[getSiteContent] ${errorMessage}`);
        } else {
            errorMessage = `Firestore Error (${error.code}) on path '${contentDocPath}': Could not fetch content. Details: ${error.message}`;
            console.error(`[getSiteContent] Full Firestore error: ${error.message}`);
        }
    } else if (error instanceof Error) {
         // Check again for offline messages within the generic Error type
         if (isFirestoreOfflineError(error)) {
             errorMessage = `Offline/Unavailable: The client is offline or cannot reach Firestore to fetch content from '${contentDocPath}'. ${error.message}`;
             console.warn(`[getSiteContent] Offline detected via generic error: ${errorMessage}`);
         } else {
             errorMessage = `Unexpected Error: An unexpected error occurred fetching site content: ${error.message}`;
             console.error(`[getSiteContent] ${errorMessage}`);
         }
    } else {
        errorMessage = `Unknown Error: An unknown error occurred fetching site content from '${contentDocPath}'.`;
        console.error(`[getSiteContent] ${errorMessage}`);
    }
    // Return default content as a fallback on any error, including the specific string error message
    return { content: defaultSiteContent, error: `Website Content: ${errorMessage}` };
  }
}

