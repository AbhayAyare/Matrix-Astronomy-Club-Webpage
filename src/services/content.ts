
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


/**
 * Fetches the site content from Firestore.
 * Returns default content if the document doesn't exist or on error.
 * @returns Promise<SiteContent>
 */
export async function getSiteContent(): Promise<SiteContent> {
  const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
  try {
    const docSnap = await getDoc(contentDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
       // Merge fetched data with defaults to ensure all fields exist and provide fallbacks
       return { ...defaultContent, ...data };
    } else {
      console.log("Site content document not found, returning default content.");
      // Optionally, you could create the default document here if it's guaranteed to not exist yet
      // await setDoc(contentDocRef, defaultContent);
      return defaultContent;
    }
  } catch (error) {
    console.error("Error fetching site content:", error);
    // Provide a specific message for offline errors if possible
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
        console.warn("Cannot fetch site content: Client is offline. Returning default content.");
    } else {
        console.error("An unexpected error occurred fetching site content.");
    }
    // Return default content as a fallback on any error
    return defaultContent;
  }
}
