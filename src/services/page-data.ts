
'use server'; // Keep 'use server' if these functions might still be used by other server components/actions
                // Or remove if they are exclusively for page.tsx (build) and home-page-client.tsx (client)
                // For this hybrid approach, they will be called from both contexts.
                // However, direct Firestore client SDK usage is fine in both.
                // For clarity and since they use client SDK, let's assume they can be called from client directly.

import { collection, getDocs, query, orderBy, Timestamp, where, FirestoreError, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase'; // Ensure db is correctly initialized for client/server
import type { SiteContent } from './content'; // Assuming SiteContent is in content.ts
import { defaultSiteContent } from './content';

// Define collection names (consistency with page.tsx)
const CONTENT_COLLECTION = 'config';
const CONTENT_DOC_ID = 'siteContent';
const EVENTS_COLLECTION = 'events';
const GALLERY_COLLECTION = 'gallery';

export interface Event {
  id: string;
  name: string;
  date: number; // Milliseconds timestamp
  description: string;
  imageURL?: string;
  createdAt?: number; // Milliseconds timestamp or undefined
}

export interface GalleryImageMetadata {
  id: string;
  url: string;
  name: string;
  createdAt?: number; // Milliseconds timestamp or undefined
}

function isOfflineError(error: any): boolean {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  const code = error.code; // For FirestoreError

  if (error instanceof FirestoreError) {
    const offlineCodes: string[] = ['unavailable', 'cancelled', 'unknown', 'deadline-exceeded'];
    if (offlineCodes.includes(code)) return true;
    if (code === 'permission-denied') return false; // Explicitly not offline
  }
  const offlineKeywords: string[] = [
    'offline', 'network error', 'connection failed', 'could not reach',
    'failed to fetch', 'client is offline', 'internet connection', 'network request failed', 'connection lost',
  ];
  return offlineKeywords.some(keyword => message.includes(keyword));
}

function formatErrorReason(reason: any): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  try {
    const str = JSON.stringify(reason);
    return str.length > 200 ? str.substring(0, 197) + "..." : str;
  } catch { return 'Unknown error structure'; }
}


export async function fetchSiteContentData(): Promise<{ content: SiteContent; error: string | null }> {
  const contentDocPath = `${CONTENT_COLLECTION}/${CONTENT_DOC_ID}`;
  console.log(`[fetchSiteContentData] Attempting to fetch content from Firestore path: ${contentDocPath}`);
  const operationStartTime = Date.now();

  if (!db) {
    const errorMessage = "Initialization Error: Firestore database instance (db) is not initialized.";
    console.error(`[fetchSiteContentData] ${errorMessage}`);
    return { content: defaultSiteContent, error: errorMessage };
  }

  try {
    const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
    const docSnap = await getDoc(contentDocRef);
    const fetchDuration = Date.now() - operationStartTime;
    console.log(`[fetchSiteContentData] getDoc completed in ${fetchDuration}ms.`);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
      const mergedContent = { ...defaultSiteContent, ...data };
      return { content: mergedContent, error: null };
    } else {
      const errorMessage = `Configuration document '/${contentDocPath}' not found. Using default content.`;
      console.warn(`[fetchSiteContentData] INFO: ${errorMessage}`);
      return { content: defaultSiteContent, error: null };
    }
  } catch (error) {
    const duration = Date.now() - operationStartTime;
    let errorMessage: string;
     if (isOfflineError(error)) {
       errorMessage = `Network/Offline Error fetching site content (${(error as FirestoreError)?.code || 'Network Issue'}). Check connection/Firestore status.`;
     } else if (error instanceof FirestoreError && error.code === 'permission-denied') {
       errorMessage = `Permission Denied reading '/${contentDocPath}'. Check Firestore rules.`;
     } else {
       errorMessage = `Unexpected Error fetching site content: ${error instanceof Error ? error.message : String(error)}`;
     }
    console.error(`[fetchSiteContentData] Fetch Error (Duration: ${duration}ms): ${errorMessage}`, error);
    return { content: defaultSiteContent, error: `Website Content: ${errorMessage}` };
  }
}

export async function fetchUpcomingEventsData(): Promise<{ data: Event[]; error: string | null }> {
  console.log(`[fetchUpcomingEvents] Attempting to fetch upcoming events from Firestore collection: ${EVENTS_COLLECTION}...`);
  const operationStartTime = Date.now();
  if (!db) {
    const errorMessage = "Initialization Error: Firestore database instance (db) is not initialized.";
    return { data: [], error: `Events: ${errorMessage}` };
  }

  try {
    const eventsCollectionRef = collection(db, EVENTS_COLLECTION);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(startOfToday);

    const q = query(
      eventsCollectionRef,
      where("date", ">=", todayTimestamp),
      orderBy("date", "asc"),
      limit(6)
    );
    const querySnapshot = await getDocs(q);
    const fetchDuration = Date.now() - operationStartTime;
    console.log(`[fetchUpcomingEvents] getDocs completed in ${fetchDuration}ms. Fetched ${querySnapshot.size} events.`);

    const events: Event[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'Unnamed Event',
            description: data.description || 'No description available.',
            date: (data.date as Timestamp).toMillis(),
            imageURL: data.imageURL,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : undefined,
        };
    });
    return { data: events, error: null };
  } catch (error) {
    const duration = Date.now() - operationStartTime;
    let errorMessage: string;
     if (isOfflineError(error)) {
       errorMessage = `Network/Offline Error fetching events (${(error as FirestoreError)?.code || 'Network Issue'}).`;
     } else if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorMessage = `Permission Denied reading '${EVENTS_COLLECTION}'. Check Firestore rules.`;
     } else if (error instanceof FirestoreError && error.code === 'failed-precondition') {
        errorMessage = `Index Required for events query (date >=, date asc). Create it in Firebase.`;
     } else {
       errorMessage = `Unexpected Error: ${error instanceof Error ? error.message : String(error)}`;
     }
    console.error(`[fetchUpcomingEvents] Fetch Error (Duration: ${duration}ms): ${errorMessage}`, error);
    return { data: [], error: `Events: ${errorMessage}` };
  }
}

export async function fetchGalleryImagesData(): Promise<{ data: GalleryImageMetadata[]; error: string | null }> {
  console.log(`[getGalleryImages] Attempting to fetch gallery images from Firestore collection: ${GALLERY_COLLECTION}...`);
  const operationStartTime = Date.now();
  if (!db) {
     const errorMessage = "Initialization Error: Firestore database instance (db) is not initialized.";
    return { data: [], error: `Gallery: ${errorMessage}` };
  }

  try {
    const galleryCollectionRef = collection(db, GALLERY_COLLECTION);
    const q = query(galleryCollectionRef, orderBy("createdAt", "desc"), limit(12));
    const querySnapshot = await getDocs(q);
    const fetchDuration = Date.now() - operationStartTime;
    console.log(`[getGalleryImages] getDocs completed in ${fetchDuration}ms. Fetched ${querySnapshot.size} gallery images.`);

    const images = querySnapshot.docs.map(docInstance => {
        const data = docInstance.data();
        return {
            id: docInstance.id,
            url: data.url as string,
            name: data.name as string,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : undefined,
        };
    }) as GalleryImageMetadata[];
    return { data: images, error: null };
  } catch (error) {
    const duration = Date.now() - operationStartTime;
    let errorMessage: string;
     if (isOfflineError(error)) {
       errorMessage = `Network/Offline Error fetching gallery (${(error as FirestoreError)?.code || 'Network Issue'}).`;
     } else if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorMessage = `Permission Denied reading '${GALLERY_COLLECTION}'. Check Firestore rules.`;
     } else if (error instanceof FirestoreError && error.code === 'failed-precondition') {
        errorMessage = `Index Required for gallery query (createdAt desc). Create it in Firebase.`;
     } else {
        errorMessage = `Unexpected Error: ${error instanceof Error ? error.message : String(error)}`;
     }
    console.error(`[getGalleryImages] Fetch Error (Duration: ${duration}ms): ${errorMessage}`, error);
    return { data: [], error: `Gallery: ${errorMessage}` };
  }
}
