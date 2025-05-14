
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, UserPlus, Mail, Phone, MapPin, Newspaper, ServerCrash, WifiOff, AlertCircle, CalendarDays, Image as ImageIcon } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SiteContent, defaultSiteContent } from '@/services/content';
// Firestore imports for events and gallery metadata
import { collection, getDocs, query, orderBy, Timestamp, where, FirestoreError, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { JoinForm } from '@/components/home/join-form';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UpcomingEventsSection, Event } from '@/components/home/upcoming-events-section';
import { GallerySection, GalleryImageMetadata } from '@/components/home/gallery-section';
import { isOfflineError } from '@/lib/utils';


// Define collection names
const CONTENT_COLLECTION = 'config';
const CONTENT_DOC_ID = 'siteContent';
const EVENTS_COLLECTION = 'events';
const GALLERY_COLLECTION = 'gallery';

// Helper to format error reasons from Promise.allSettled
function formatErrorReason(reason: any): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  if (typeof reason === 'string') {
    return reason;
  }
  try {
    // Attempt to stringify, but handle complex objects that might cause issues
    const str = JSON.stringify(reason);
    return str.length > 200 ? str.substring(0, 197) + "..." : str; // Truncate long strings
  } catch {
    return 'Unknown error structure';
  }
}


// --- Helper Functions for Data Fetching ---

async function fetchSiteContentData(): Promise<{ content: SiteContent; error: string | null }> {
  const contentDocPath = `${CONTENT_COLLECTION}/${CONTENT_DOC_ID}`;
  console.log(`[fetchSiteContentData] Attempting to fetch content from Firestore path: ${contentDocPath}`);
  const operationStartTime = Date.now();

  if (!db) {
    const errorMessage = "Initialization Error: Firestore database instance (db) is not initialized.";
    console.error(`[fetchSiteContentData] ${errorMessage}`);
    return { content: defaultSiteContent, error: errorMessage };
  }
  console.log("[fetchSiteContentData] Firestore db instance appears valid.");

  try {
    console.log(`[fetchSiteContentData] Executing getDoc for ${contentDocPath}...`);
    const contentDocRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);
    const docSnap = await getDoc(contentDocRef);
    const fetchDuration = Date.now() - operationStartTime;
    console.log(`[fetchSiteContentData] getDoc completed in ${fetchDuration}ms.`);

    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<SiteContent>;
      const mergedContent = { ...defaultSiteContent, ...data };
      console.log(`[fetchSiteContentData] Fetched and merged content successfully.`);
      return { content: mergedContent, error: null };
    } else {
      const errorMessage = `Configuration document '/${contentDocPath}' not found. Using default content.`;
      console.warn(`[fetchSiteContentData] INFO: ${errorMessage}`);
      return { content: defaultSiteContent, error: null }; // Not a technical error
    }
  } catch (error) {
    const duration = Date.now() - operationStartTime;
    const errorId = `fetch-content-error-${operationStartTime}`;
    let errorMessage: string;
    console.error(`[fetchSiteContentData] CRITICAL ERROR (ID: ${errorId}, Duration: ${duration}ms):`, error);

     if (isOfflineError(error)) {
       errorMessage = `Network/Offline Error fetching site content (${(error as FirestoreError)?.code || 'Network Issue'}). Check connection/Firestore status.`;
     } else if (error instanceof FirestoreError && error.code === 'permission-denied') {
       errorMessage = `Permission Denied reading '/${contentDocPath}'. Check Firestore rules.`;
     } else {
       errorMessage = `Unexpected Error fetching site content: ${error instanceof Error ? error.message : String(error)}`;
     }
     console.error(`[fetchSiteContentData] ${errorMessage}`);
    return { content: defaultSiteContent, error: `Website Content: ${errorMessage}` };
  }
}

async function fetchUpcomingEventsData(): Promise<{ data: Event[]; error: string | null }> {
  console.log(`[fetchUpcomingEvents] Attempting to fetch upcoming events from Firestore collection: ${EVENTS_COLLECTION}...`);
  const operationStartTime = Date.now();

  if (!db) {
    const errorMessage = "Initialization Error: Firestore database instance (db) is not initialized.";
    console.error(`[fetchUpcomingEvents] ${errorMessage}`);
    return { data: [], error: `Events: ${errorMessage}` };
  }
  console.log("[fetchUpcomingEvents] Firestore db instance appears valid.");


  try {
    const eventsCollectionRef = collection(db, EVENTS_COLLECTION);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(startOfToday);

    console.log("[fetchUpcomingEvents] Executing getDocs query...");
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
        const eventName = data.name || 'Unnamed Event';
        const eventDesc = data.description || 'No description available.';
        const eventImage = data.imageURL;
        const eventDateMillis = data.date instanceof Timestamp ? data.date.toMillis() : (data.date ? new Date(data.date).getTime() : Date.now());
        const createdAtMillis = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt ? new Date(data.createdAt).getTime() : undefined);


        return {
            id: doc.id,
            name: eventName,
            description: eventDesc,
            date: eventDateMillis,
            imageURL: eventImage,
            createdAt: createdAtMillis,
        };
    });

     if (events.length === 0) {
        console.log("[fetchUpcomingEvents] No upcoming events found in Firestore.");
     } else {
        console.log("[fetchUpcomingEvents] Successfully fetched and processed events.");
     }
    return { data: events, error: null };

  } catch (error) {
    const duration = Date.now() - operationStartTime;
    const errorId = `fetch-events-error-${operationStartTime}`;
    let errorMessage: string;
    console.error(`[fetchUpcomingEvents] CRITICAL ERROR during Firestore query (ID: ${errorId}, Duration: ${duration}ms):`, error);

     if (isOfflineError(error)) {
       errorMessage = `Network/Offline Error fetching events (${(error as FirestoreError)?.code || 'Network Issue'}). Check connection/Firestore status.`;
     } else if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorMessage = `Permission Denied reading '${EVENTS_COLLECTION}'. Check Firestore rules.`;
     } else if (error instanceof FirestoreError && error.code === 'failed-precondition') {
        errorMessage = `Index Required for events query (date >=, date asc). Create it in Firebase.`;
     } else if (error instanceof Error) {
       errorMessage = `Unexpected Error: ${error.message}`;
     } else {
       errorMessage = "Unknown Error occurred fetching events.";
     }
     console.error(`[fetchUpcomingEvents] ${errorMessage}`);
     console.log("[fetchUpcomingEvents] Returning empty event data due to error.");
     return { data: [], error: `Events: ${errorMessage}` };
  }
}

async function fetchGalleryImagesData(): Promise<{ data: GalleryImageMetadata[]; error: string | null }> {
  console.log(`[getGalleryImages] Attempting to fetch gallery images from Firestore collection: ${GALLERY_COLLECTION}...`);
  const operationStartTime = Date.now();

  if (!db) {
     const errorMessage = "Initialization Error: Firestore database instance (db) is not initialized.";
     console.error(`[getGalleryImages] ${errorMessage}`);
    return { data: [], error: `Gallery: ${errorMessage}` };
  }
   console.log("[getGalleryImages] Firestore db instance appears valid.");

  try {
    const galleryCollectionRef = collection(db, GALLERY_COLLECTION);
    console.log("[getGalleryImages] Executing getDocs query...");
    const q = query(galleryCollectionRef, orderBy("createdAt", "desc"), limit(12));
    const querySnapshot = await getDocs(q);
    const fetchDuration = Date.now() - operationStartTime;
    console.log(`[getGalleryImages] getDocs completed in ${fetchDuration}ms. Fetched ${querySnapshot.size} gallery images.`);

    const images = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtMillis = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt ? new Date(data.createdAt).getTime(): undefined);
        return {
            id: doc.id,
            url: data.url as string,
            name: data.name as string,
            createdAt: createdAtMillis,
        };
    }) as GalleryImageMetadata[];

     if (images.length === 0) {
        console.log("[getGalleryImages] No gallery images found in Firestore.");
     } else {
        console.log("[getGalleryImages] Successfully fetched and processed gallery images.");
     }

    return { data: images, error: null };
  } catch (error) {
    const duration = Date.now() - operationStartTime;
    const errorId = `fetch-gallery-error-${operationStartTime}`;
    let errorMessage: string;
    console.error(`[getGalleryImages] CRITICAL ERROR during Firestore query (ID: ${errorId}, Duration: ${duration}ms):`, error);

     if (isOfflineError(error)) {
       errorMessage = `Network/Offline Error fetching gallery (${(error as FirestoreError)?.code || 'Network Issue'}). Check connection/Firestore status.`;
     } else if (error instanceof FirestoreError && error.code === 'permission-denied') {
        errorMessage = `Permission Denied reading '${GALLERY_COLLECTION}'. Check Firestore rules.`;
     } else if (error instanceof FirestoreError && error.code === 'failed-precondition') {
        errorMessage = `Index Required for gallery query (createdAt desc). Create it in Firebase.`;
     } else if (error instanceof Error) {
       errorMessage = `Unexpected Error: ${error.message}`;
     } else {
        errorMessage = "Unknown Error occurred fetching gallery images.";
     }
     console.error(`[getGalleryImages] ${errorMessage}`);
      console.log("[getGalleryImages] Returning empty gallery data due to error.");
    return { data: [], error: `Gallery: ${errorMessage}` };
  }
}


// --- Home Page Component ---
export default async function Home() {
  console.log("[Home Page] Starting server-side rendering and data fetch...");

  const [
    contentResult,
    eventsResult,
    galleryResult,
  ] = await Promise.allSettled([
    fetchSiteContentData(),
    fetchUpcomingEventsData(),
    fetchGalleryImagesData(),
  ]);

  // Process results safely after Promise.allSettled
  const { content: siteContent, error: siteContentError } = contentResult.status === 'fulfilled'
    ? contentResult.value
    : { content: defaultSiteContent, error: `Website Content: Fetch failed: ${formatErrorReason(contentResult.reason)}` };

  const { data: upcomingEvents, error: eventsError } = eventsResult.status === 'fulfilled'
    ? eventsResult.value
    : { data: [], error: `Events: Fetch failed: ${formatErrorReason(eventsResult.reason)}` };

  const { data: galleryImages, error: galleryError } = galleryResult.status === 'fulfilled'
    ? galleryResult.value
    : { data: [], error: `Gallery: Fetch failed: ${formatErrorReason(galleryResult.reason)}` };


  const allErrors = [siteContentError, eventsError, galleryError].filter(Boolean) as string[];
  const isAnyOffline = allErrors.some(err => err.toLowerCase().includes('offline') || err.toLowerCase().includes('network'));

  console.log(`[Home Page] Data fetch completed.`);
  if (allErrors.length > 0) {
    console.warn(`[Home Page] Combined Fetch Errors:`, allErrors);
    console.warn(`[Home Page] Offline state: ${isAnyOffline}`);
  }


  return (
    <div className="flex flex-col min-h-screen">
      <Header />

       {/* Global Error/Offline Alert */}
       {allErrors.length > 0 && (
         <div className="container mx-auto px-4 pt-4">
            <Alert
             variant={isAnyOffline ? "default" : "destructive"}
             className={`${isAnyOffline ? "border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400" : ""} animate-fade-in`}
           >
             {isAnyOffline ? <WifiOff className="h-4 w-4"/> : <ServerCrash className="h-4 w-4"/>}
             <AlertTitle>
               {isAnyOffline ? "Network Connectivity Issue" : "Data Loading Issue"}
             </AlertTitle>
             <AlertDescription>
               {isAnyOffline
                 ? "Could not connect to fetch all site data. Displaying available or default content."
                 : `Could not load all site data due to server-side errors or network issues. Some sections might be showing default content.`}
               <ul className="list-disc list-inside mt-2 text-xs max-h-32 overflow-y-auto">
                 {allErrors.map((err, index) => (
                   <li key={index}>{err}</li>
                 ))}
               </ul>
               {!isAnyOffline && "Please try refreshing the page. If the problem persists, contact support."}
             </AlertDescription>
           </Alert>
          </div>
       )}


      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
          <section
           id="hero"
           className="text-center py-16 md:py-24 bg-primary/80 rounded-2xl shadow-xl animate-fade-in p-8 relative overflow-hidden backdrop-blur-sm border-transparent"
           style={{ animationDelay: '0s' }}
         >
            <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none"></div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>{siteContent.heroSubtitle}</p>
            <Button
              size="lg"
              asChild
              variant="secondary"
              className="transform hover:scale-105 transition-all duration-300 ease-in-out animate-fade-in border-2 border-transparent hover:border-accent shadow-lg hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              style={{ animationDelay: '0.3s' }}
            >
              <Link href="#join">Join the Club</Link>
            </Button>
        </section>


        <section id="about" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
            {siteContentError && !isAnyOffline && siteContent.about === defaultSiteContent.about && ( // Show error only if default content is used for 'about'
                 <Alert variant="destructive" className="mb-4">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>About Content Error</AlertTitle>
                   <AlertDescription>
                     Could not load the 'About' section content. Displaying default text. Error: {siteContentError}
                   </AlertDescription>
                 </Alert>
             )}
           <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
               <p className="text-lg leading-relaxed text-black">{siteContent.about}</p>
             </CardContent>
           </Card>
        </section>

        <Separator />

         <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
             <CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events
            </h2>
            <UpcomingEventsSection events={upcomingEvents} error={eventsError} />
         </section>

        <Separator />

         <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
             <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2">
               <ImageIcon className="w-8 h-8 text-accent"/>Event Gallery
            </h2>
            <GallerySection galleryImages={galleryImages} error={galleryError} />
         </section>


        <Separator />

        <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
            {siteContentError && !isAnyOffline && (siteContent.joinTitle === defaultSiteContent.joinTitle || siteContent.joinDescription === defaultSiteContent.joinDescription) && (
                 <Alert variant="destructive" className="mb-4 max-w-2xl mx-auto">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Join Section Content Error</AlertTitle>
                   <AlertDescription>
                     Could not load join section text. Using defaults. Error: {siteContentError}
                   </AlertDescription>
                 </Alert>
             )}
           <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>{siteContent.joinTitle}</CardTitle>
              <CardDescription>{siteContent.joinDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinForm />
            </CardContent>
          </Card>
        </section>

        <Separator />

         <section id="newsletter" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.3s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Newspaper className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
             {siteContentError && !isAnyOffline && (siteContent.newsletterTitle === defaultSiteContent.newsletterTitle || siteContent.newsletterDescription === defaultSiteContent.newsletterDescription) && (
                 <Alert variant="destructive" className="mb-4 max-w-2xl mx-auto">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Newsletter Section Content Error</AlertTitle>
                   <AlertDescription>
                     Could not load newsletter section text. Using defaults. Error: {siteContentError}
                   </AlertDescription>
                 </Alert>
             )}
           <Card className="max-w-2xl mx-auto shadow-lg bg-card hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{siteContent.newsletterTitle}</CardTitle>
                <CardDescription className="text-sm text-black">{siteContent.newsletterDescription}</CardDescription>
              </CardHeader>
              <CardContent>
               <NewsletterForm />
              </CardContent>
           </Card>
         </section>

        <Separator />

        <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-white flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
             {siteContentError && !isAnyOffline && (siteContent.contactEmail === defaultSiteContent.contactEmail || siteContent.contactPhone === defaultSiteContent.contactPhone || siteContent.contactAddress === defaultSiteContent.contactAddress) && (
                 <Alert variant="destructive" className="mb-4 max-w-2xl mx-auto">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Contact Details Error</AlertTitle>
                   <AlertDescription>
                     Could not load contact details. Displaying defaults. Error: {siteContentError}
                   </AlertDescription>
                 </Alert>
             )}
            <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3 group">
                  <Mail className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                  <a href={`mailto:${siteContent.contactEmail}`} className="text-black hover:text-accent transition-colors duration-200 break-all">{siteContent.contactEmail || 'N/A'}</a>
                </div>
                <div className="flex items-center gap-3 group">
                  <Phone className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                  <a href={`tel:${siteContent.contactPhone}`} className="text-black hover:text-accent transition-colors duration-200">{siteContent.contactPhone || 'N/A'}</a>
                </div>
                <div className="flex items-start gap-3 group">
                  <MapPin className="w-5 h-5 text-accent mt-1 group-hover:animate-pulse"/>
                  <span className="text-black whitespace-pre-wrap">{siteContent.contactAddress || 'Location not specified'}, India</span>
                </div>
              </CardContent>
            </Card>
         </section>
      </main>
      <Footer />
    </div>
  );
}
