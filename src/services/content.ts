
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
const defaultContent: SiteContent = {
  heroTitle: 'Welcome to Matrix Astronomy Club',
  heroSubtitle: 'Your gateway to the cosmos. Explore, learn, and connect with fellow space enthusiasts.',
  about: 'Matrix is a passionate community dedicated to exploring the wonders of the universe. We organize stargazing sessions, workshops, and talks for enthusiasts of all levels.',
  joinTitle: 'Become a Member',
  joinDescription: 'Fill out the form below to start your cosmic journey with us.',
  newsletterTitle: 'Subscribe to Our Newsletter',
  newsletterDescription: 'Get the latest news, event announcements, and astronomical insights delivered to your inbox.',
  contactEmail: 'info@matrixastronomy.org',
  contactPhone: '7219690903', // Updated phone
  contactAddress: 'Kolhapur', // Updated address
};

// Updated return type to include specific error message
interface GetContentResult {
    content: SiteContent;
    error: string | null; // Changed from offlineError to a string or null
}


/**
 * Fetches the site content from Firestore.
 * Returns default content if the document doesn't exist or on error.
 * Includes an error message if a fetch error occurred.
 * @returns Promise<GetContentResult>
 */
export async function getSiteContent(): Promise<GetContentResult> {
  const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  let errorMessage: string | null = null;
  try {
    const docSnap = await getDoc(contentDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
       // Merge fetched data with defaults to ensure all fields exist and provide fallbacks
       return { content: { ...defaultContent, ...data }, error: null }; // No error
    } else {
      console.log("Site content document not found, returning default content.");
      // Optionally, you could create the default document here if it's guaranteed to not exist yet
      // await setDoc(contentDocRef, defaultContent);
      return { content: defaultContent, error: null }; // No error, just using defaults
    }
  } catch (error) {
    console.error("Error fetching site content:", error);
    // Provide a specific message based on the error type
    if (error instanceof FirestoreError) {
        if (error.code === 'unavailable' || error.message.includes('offline')) {
           errorMessage = "Offline: Cannot fetch site content.";
           console.warn(errorMessage);
        } else {
            errorMessage = `Firestore Error (${error.code}): Could not fetch content.`;
            console.error(errorMessage);
        }
    } else {
         errorMessage = "An unexpected error occurred fetching site content.";
         console.error(errorMessage, error);
    }
    // Return default content as a fallback on any error, including the error message
    return { content: defaultContent, error: errorMessage };
  }
}
