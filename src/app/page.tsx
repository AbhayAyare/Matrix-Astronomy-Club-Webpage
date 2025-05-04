
import Link from 'next/link';
// Removed direct Image import, will use custom components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe, CalendarDays, ImageIcon as ImageIconIcon, UserPlus, Mail, Phone, MapPin, WifiOff, AlertCircle, ServerCrash, ArrowRight } from 'lucide-react'; // Renamed Image import, Added ArrowRight
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getSiteContent, SiteContent, defaultSiteContent } from '@/services/content'; // Use alias for default content
// Firestore imports for events and gallery metadata
import { collection, getDocs, query, orderBy, Timestamp, where, FirestoreError, limit } from 'firebase/firestore';
import { db } from '@/config/firebase'; // Only need db
import { JoinForm } from '@/components/home/join-form';
import { NewsletterForm } from '@/components/home/newsletter-form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import the new client components
import { EventImage } from '@/components/home/event-image';
import { GalleryImage } from '@/components/home/gallery-image';

// Interface for events fetched from Firestore
interface Event {
  id: string;
  name: string;
  date: Timestamp; // Use Firestore Timestamp
  description: string;
  imageURL?: string; // Optional field for image URL (could be external or placeholder)
}

// Interface for Gallery Image Metadata fetched from Firestore
interface GalleryImageMetadata { // Renamed for clarity
  id: string; // Firestore document ID
  url: string; // Image URL stored in Firestore
  name: string; // Name/description stored in Firestore
}

// Flag to indicate if data fetching resulted in errors
interface FetchResult<T> {
  data: T[];
  error: string | null; // Error message as a simple string or null
}

// Helper function to check for offline errors (more robust check)
function isOfflineError(error: any): boolean {
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


// Fetch upcoming events from Firestore
async function getUpcomingEvents(): Promise<FetchResult<Event>> {
  const eventsCollectionName = 'events';
  console.log(`[getUpcomingEvents] Attempting to fetch upcoming events from Firestore collection: ${eventsCollectionName}...`);


   if (!db) {
      const errorMsg = "[getUpcomingEvents] Firestore database instance (db) is not initialized.";
      console.error(errorMsg);
      return { data: [], error: `Events: ${errorMsg}` };
  }
  console.log("[getUpcomingEvents] Firestore db instance appears valid.");

  // Get current date at the beginning of the day (for consistent comparison)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayTimestamp = Timestamp.fromDate(startOfToday);

  console.log(`[getUpcomingEvents] Querying for events on or after: ${startOfToday.toISOString()} (Timestamp: ${todayTimestamp.seconds})`);

  const eventsCollectionRef = collection(db, eventsCollectionName);
  let errorMessage: string | null = null;
  const fallbackEvents: Event[] = [
      { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), description: 'Join us for a night under the stars observing distant galaxies and nebulae.', imageURL: `https://picsum.photos/seed/event1/400/250` },
      { id: 'fallback2', name: 'Planetary Alignment Talk (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), description: 'Learn about the upcoming planetary alignment and how to view it.', imageURL: `https://picsum.photos/seed/event2/400/250` },
  ]; // Start with empty fallback unless error

  try {
    // Query for events where the date is >= start of today, ordered by date, limit to 6
    const q = query(eventsCollectionRef, where("date", ">=", todayTimestamp), orderBy("date", "asc"), limit(6));
    console.log(`[getUpcomingEvents] Executing getDocs query for '${eventsCollectionName}' where date >= ${todayTimestamp.toDate().toISOString()}, orderBy date asc, limit 6...`);

    const querySnapshot = await getDocs(q);
    console.log(`[getUpcomingEvents] getDocs completed. Found ${querySnapshot.size} documents.`);

    if (querySnapshot.empty) {
       console.log("[getUpcomingEvents] No upcoming events found matching criteria.");
       // Check Firestore rules and if documents actually exist with future dates
       return { data: [], error: null };
    }

    const events: Event[] = [];
    querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date instanceof Timestamp ? data.date : null;

        // Log raw data for debugging
        console.log(`[getUpcomingEvents] Processing doc ID: ${doc.id}, Raw Data:`, JSON.stringify(data));

        if (!eventDate) {
            console.warn(`[getUpcomingEvents] Skipping doc ID: ${doc.id} due to missing or invalid date field.`);
            return; // Skip this document if date is invalid
        }

         console.log(`  -> Name: ${data.name}, Date: ${eventDate.toDate().toISOString()}`);

         events.push({
           id: doc.id,
           name: data.name || 'Unnamed Event',
           description: data.description || 'No description provided.',
           date: eventDate, // Already verified as Timestamp
           imageURL: data.imageURL || `https://picsum.photos/seed/${doc.id}/400/250`,
         });
    });


    console.log(`[getUpcomingEvents] Successfully processed ${events.length} valid events.`);
    return { data: events, error: null };

  } catch (error) {
    console.error(`[getUpcomingEvents] Error during Firestore query:`, error); // Log the full error object

    if (isOfflineError(error)) {
        errorMessage = `Offline/Unavailable: Could not connect to Firestore to fetch events (${(error as FirestoreError)?.code}). Using fallback data.`;
        console.warn(`[getUpcomingEvents] ${errorMessage}`);
    } else if (error instanceof FirestoreError) {
         if (error.code === 'permission-denied') {
             // CRITICAL: Check Firestore Rules in Firebase Console for 'events' collection
             errorMessage = `Permission Denied: Could not read collection '${eventsCollectionName}'. Check Firestore rules allow public read. Ensure the Cloud Firestore API is enabled for your project: https://console.cloud.google.com/apis/api/firestore.googleapis.com/overview?project=${db.app.options.projectId || 'YOUR_PROJECT_ID'}. Using fallback data.`;
             console.error(`[getUpcomingEvents] CRITICAL: ${errorMessage}`);
         } else if (error.code === 'failed-precondition') {
             // COMMON: Index needed in Firebase Console
             errorMessage = `Index Required: Query for events needs an index (usually on 'date >=', 'date asc'). Create it in the Firebase console. Using fallback data.`;
             console.error(`[getUpcomingEvents] ACTION NEEDED: ${errorMessage}`);
         } else {
             errorMessage = `Firestore Error (${error.code}) on collection '${eventsCollectionName}': Could not fetch events. Details: ${error.message}. Using fallback data.`;
             console.error(`[getUpcomingEvents] Full Firestore error: ${error.message}`);
         }
    } else if (error instanceof Error) {
         if (isOfflineError(error)) {
             errorMessage = `Offline/Unavailable: The client is offline or cannot reach Firestore to fetch events. ${error.message}. Using fallback data.`;
             console.warn(`[getUpcomingEvents] Offline detected via generic error: ${errorMessage}`);
         } else {
              errorMessage = `Unexpected Error: ${error.message}. Using fallback data.`;
              console.error(`[getUpcomingEvents] ${errorMessage}`);
         }
    } else {
       errorMessage = `Unknown Error occurred fetching events. Using fallback data.`;
       console.error(`[getUpcomingEvents] ${errorMessage}`);
    }
    // Return fallback data on error, including context-prefixed string error message
    console.warn("[getUpcomingEvents] Returning fallback event data due to error.");
    return { data: fallbackEvents, error: `Events: ${errorMessage}` }; // Prefix error message
  }
}

// Fetch gallery image metadata from Cloud Firestore
async function getGalleryImages(): Promise<FetchResult<GalleryImageMetadata>> {
  const galleryCollectionName = 'gallery';
  console.log(`[getGalleryImages] Attempting to fetch gallery images from Firestore collection: ${galleryCollectionName}...`);

   if (!db) {
      const errorMsg = "[getGalleryImages] Firestore database instance (db) is not initialized.";
      console.error(errorMsg);
      return { data: [], error: `Gallery: ${errorMsg}` };
  }
  console.log("[getGalleryImages] Firestore db instance appears valid.");

  const galleryCollectionRef = collection(db, galleryCollectionName);
  const fallbackImages: GalleryImageMetadata[] = [
      { id: 'g1', url: 'https://picsum.photos/seed/gallery1/300/200', name: 'Nebula (Fallback)'},
      { id: 'g2', url: 'https://picsum.photos/seed/gallery2/300/200', name: 'Galaxy (Fallback)'},
      { id: 'g3', url: 'https://picsum.photos/seed/gallery3/300/200', name: 'Moon surface (Fallback)'},
      { id: 'g4', url: 'https://picsum.photos/seed/gallery4/300/200', name: 'Star cluster (Fallback)'},
      { id: 'g5', url: 'https://picsum.photos/seed/gallery5/300/200', name: 'Planet Jupiter (Fallback)'},
      { id: 'g6', url: 'https://picsum.photos/seed/gallery6/300/200', name: 'Observatory telescope (Fallback)'},
    ];
    let errorMessage: string | null = null;

  try {
    // Make sure Firestore rules allow public read on 'gallery' collection
    const q = query(galleryCollectionRef, orderBy("createdAt", "desc"), limit(12));
    console.log(`[getGalleryImages] Executing getDocs query for '${galleryCollectionName}' ordered by createdAt desc, limit 12...`);
    const querySnapshot = await getDocs(q);
    console.log(`[getGalleryImages] getDocs completed. Fetched ${querySnapshot.size} gallery images.`);

    if (querySnapshot.empty) {
      console.log("[getGalleryImages] No gallery images found in Firestore.");
      return { data: [], error: null }; // Return empty array if no images, but not an error
    }

    const images = querySnapshot.docs.map(doc => ({
      id: doc.id,
      url: doc.data().url as string, // Ensure 'url' field exists and is a string
      name: doc.data().name as string, // Ensure 'name' field exists and is a string
    })) as GalleryImageMetadata[];

    return { data: images, error: null };
  } catch (error) {
      console.error(`[getGalleryImages] Error during Firestore query:`, error); // Log full error object

       if (isOfflineError(error)) {
         errorMessage = `Offline/Unavailable: Could not connect to Firestore to fetch gallery images (${(error as FirestoreError)?.code}). Using fallback data.`;
         console.warn(`[getGalleryImages] ${errorMessage}`);
      } else if (error instanceof FirestoreError) {
           if (error.code === 'permission-denied') {
                // THIS IS A CRITICAL ERROR - Check Firestore Rules in Firebase Console
                errorMessage = `Permission Denied: Could not read collection '${galleryCollectionName}'. Check Firestore rules allow public read. Ensure the Cloud Firestore API is enabled for your project: https://console.cloud.google.com/apis/library/firestore.googleapis.com`;
                 console.error(`[getGalleryImages] CRITICAL: ${errorMessage}`);
           } else if (error.code === 'failed-precondition') {
                // THIS IS A COMMON ERROR - Requires creating an index in Firebase Console
                errorMessage = `Index Required: Firestore query for gallery needs an index on 'createdAt' descending. Please create it in the Firebase console. Using fallback data.`;
                 console.error(`[getGalleryImages] ACTION NEEDED: ${errorMessage}`);
           } else {
               errorMessage = `Firestore Error (${error.code}): Could not fetch gallery images. Details: ${error.message}. Using fallback data.`;
               console.error(`[getGalleryImages] Full Firestore error: ${error.message}`);
           }
      } else if (error instanceof Error) {
         if (isOfflineError(error)) {
             errorMessage = `Offline/Unavailable: The client is offline or cannot reach Firestore to fetch gallery. ${error.message}. Using fallback data.`;
             console.warn(`[getGalleryImages] Offline detected via generic error: ${errorMessage}`);
         } else {
              errorMessage = `Unexpected Error: ${error.message}. Using fallback data.`;
              console.error(`[getGalleryImages] ${errorMessage}`);
         }
      } else {
           errorMessage = `Unknown Error occurred fetching gallery images. Using fallback data.`;
           console.error(`[getGalleryImages] ${errorMessage}`);
      }
    // Return fallback data on error, including context-prefixed string error message
    console.warn("[getGalleryImages] Returning fallback image data due to error.");
    return { data: fallbackImages, error: `Gallery: ${errorMessage}` }; // Prefix error message
  }
}


export default async function Home() {
  // Fetch dynamic data in the Server Component
  console.log("[Home Page] Starting data fetch...");
  // Use Promise.allSettled to fetch everything concurrently and handle individual errors
  const results = await Promise.allSettled([
     getSiteContent(),
     getUpcomingEvents(),
     getGalleryImages()
  ]);
  console.log("[Home Page] Data fetch completed. Results:", results); // Log full results for inspection

  // Process results, providing defaults and capturing errors
  const siteContentResult = results[0].status === 'fulfilled'
    ? results[0].value
    : { content: defaultSiteContent, error: `Website Content: Failed - ${String((results[0] as PromiseRejectedResult).reason)}` };

  const eventsResult = results[1].status === 'fulfilled'
    ? results[1].value
    : { data: [], error: `Events: Failed - ${String((results[1] as PromiseRejectedResult).reason)}` };

  const galleryResult = results[2].status === 'fulfilled'
    ? results[2].value
    : { data: [], error: `Gallery: Failed - ${String((results[2] as PromiseRejectedResult).reason)}` };


   // Extract data and errors
   const siteContent = siteContentResult.content;
   const upcomingEvents = eventsResult.data;
   const galleryImages = galleryResult.data;

   // Combine all non-null error strings for a general error state check
   const fetchErrors = [siteContentResult.error, eventsResult.error, galleryResult.error].filter((e): e is string => e !== null);
   console.log("[Home Page] Combined Fetch Errors:", fetchErrors);

   // Determine if *any* fetch resulted in an offline-like error by checking error messages
   const isOffline = fetchErrors.some(e => e?.toLowerCase().includes('offline') || e?.toLowerCase().includes('unavailable') || e?.toLowerCase().includes('network error') || e?.toLowerCase().includes('client is offline'));
   // Check if there are errors other than offline errors (like permissions, index needed etc.)
   const hasOtherErrors = fetchErrors.some(e => !(e?.toLowerCase().includes('offline') || e?.toLowerCase().includes('unavailable') || e?.toLowerCase().includes('network error') || e?.toLowerCase().includes('client is offline')));
   console.log(`[Home Page] Offline state: ${isOffline}, Other errors present: ${hasOtherErrors}`);
   // Removed potentially problematic console.log

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

       {/* Global Error/Offline Alert */}
       {fetchErrors.length > 0 && (
         <div className="container mx-auto px-4 pt-4">
           <Alert
             variant={isOffline && !hasOtherErrors ? "default" : "destructive"} // Yellow-ish border for pure offline, red otherwise
             className={`${isOffline && !hasOtherErrors ? "border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400" : "" } animate-fade-in`}
           >
             {isOffline ? <WifiOff className="h-4 w-4"/> : <ServerCrash className="h-4 w-4"/>}
             <AlertTitle>
                {isOffline && !hasOtherErrors ? "Network Connectivity Issue" :
                 isOffline && hasOtherErrors ? "Network & Data Loading Issues" :
                 "Data Loading Issue"}
             </AlertTitle>
             <AlertDescription>
               {isOffline && !hasOtherErrors
                 ? "Could not connect to the database due to network issues. Some content might be outdated or showing defaults/fallbacks."
                 : hasOtherErrors && isOffline
                 ? "Could not load all site data due to server-side errors (e.g., permissions, missing indexes) and network issues. Some sections might be showing default content or fallbacks."
                 : hasOtherErrors
                 ? "Could not load all site data due to server-side errors (e.g., permissions, missing indexes). Some sections might be showing default content or fallbacks."
                 : "Could not load all site data due to server-side errors or network issues. Some sections might be showing default content." // Fallback case for non-offline errors
               }
               {/* List specific errors concisely */}
               <ul className="list-disc list-inside mt-2 text-xs max-h-32 overflow-y-auto">
                 {fetchErrors.map((error, index) => (
                   <li key={index}>{error}</li> // Display prefixed string errors
                 ))}
               </ul>
               Please try refreshing the page. If the problem persists, contact support or check Firebase console for required indexes/permissions.
             </AlertDescription>
           </Alert>
         </div>
       )}

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 space-y-16 md:space-y-24 overflow-x-hidden">
        {/* Hero Section */}
        <section id="hero" className="text-center py-16 md:py-24 bg-gradient-to-b from-primary/10 to-transparent rounded-lg shadow-inner animate-fade-in">
           <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary animate-fade-in" style={{ animationDelay: '0.1s' }}>{siteContent.heroTitle}</h1>
           <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>{siteContent.heroSubtitle}</p>
           <Button size="lg" asChild className="transform hover:scale-105 transition-transform duration-300 ease-in-out animate-fade-in" style={{ animationDelay: '0.3s' }}>
             <Link href="#join">Join the Club</Link>
           </Button>
        </section>

        {/* About Matrix Section */}
        <section id="about" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-primary flex items-center justify-center gap-2"><Globe className="w-8 h-8 text-accent"/>About Matrix</h2>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6 md:p-8">
              {/* Display content error specifically if it occurred and is NOT the global offline one */}
              {siteContentResult.error && !(isOffline && !hasOtherErrors) && ( // Show if error exists and it's NOT purely an offline error
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4"/>
                  <AlertTitle>Content Error</AlertTitle>
                  {/* Use the string error directly */}
                  <AlertDescription>Could not load the 'About' content. Displaying default text. Error: {siteContentResult.error}</AlertDescription>
                </Alert>
              )}
              {/* Always display the 'about' content (either fetched or default) */}
              <p className="text-lg leading-relaxed text-foreground/90">{siteContent.about}</p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Upcoming Events Section */}
        <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events</h2>

           {/* Display specific warning if events failed and it's NOT a global offline error */}
           {eventsResult.error && !(isOffline && !hasOtherErrors) && (
               <Alert variant="destructive" className="mb-4">
                   <AlertCircle className="h-4 w-4"/>
                   <AlertTitle>Events Unavailable</AlertTitle>
                   <AlertDescription>Could not load latest events. Showing fallback data. Error: {eventsResult.error}</AlertDescription>
               </Alert>
           )}

            {/* Debug: Log the final upcomingEvents array just before rendering - REMOVED as it might cause issues */}

           {/* Improved Logic for displaying events or messages */}
           {upcomingEvents.length === 0 ? (
               // Case 1: No upcoming events found OR an error occurred (which might have resulted in empty or fallback data)
               <Card>
                   <CardContent className="p-6 text-center text-muted-foreground">
                       {eventsResult.error
                           ? (isOffline // If it's an offline error (even with others)
                               ? "Events couldn't be loaded due to network issues. Displaying fallback/defaults if available."
                               // If it's NOT offline but has other errors
                               : `Could not load events due to an error: ${eventsResult.error}. Displaying fallback/defaults if available. Please check Firestore rules and ensure the 'events' collection exists with the correct fields and indexes.`)
                           // If no error but length is 0
                           : "No upcoming events scheduled yet. Check back soon!"
                       }
                   </CardContent>
               </Card>
           ) : (
               // Case 2: Successfully fetched events OR fallback events are available (render the grid)
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                   {upcomingEvents.map((event, index) => (
                       <Card key={event.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out animate-fade-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                           <div className="relative h-48 w-full overflow-hidden group">
                               <EventImage
                                   src={event.imageURL}
                                   alt={event.name}
                                   eventId={event.id}
                                   priority={index < 3}
                               />
                           </div>
                           <CardHeader>
                               <CardTitle className="text-xl">{event.name}</CardTitle>
                               <CardDescription>
                                   {event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not available'}
                               </CardDescription>
                           </CardHeader>
                           <CardContent className="flex-grow">
                               <p className="text-foreground/80 line-clamp-3">{event.description}</p>
                           </CardContent>
                           <CardFooter className="flex justify-between items-center mt-auto pt-4 border-t">
                               <Badge variant="secondary" className="bg-accent text-accent-foreground">Upcoming</Badge>
                               <Button variant="link" size="sm" className="text-primary/80 hover:text-primary">
                                   Learn More <ArrowRight className="ml-1 h-4 w-4"/>
                               </Button>
                           </CardFooter>
                       </Card>
                   ))}
               </div>
           )}
       </section>


        <Separator />

        {/* Event Gallery Section - Uses Firestore metadata */}
        <section id="gallery" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.9s' }}>
           <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><ImageIconIcon className="w-8 h-8 text-accent"/>Event Gallery</h2>
            {/* Display specific warning if gallery failed, separate from global warning */}
            {galleryResult.error && !(isOffline && !hasOtherErrors) && ( // Show only if error exists and it's NOT purely an offline error
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4"/>
                <AlertTitle>Gallery Unavailable</AlertTitle>
                <AlertDescription>Could not load gallery images. Showing fallback data. Error: {galleryResult.error}</AlertDescription>
              </Alert>
            )}
            {galleryImages.length === 0 && !galleryResult.error ? ( // Show "empty" only if no error occurred
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        {isOffline ? "Gallery couldn't be loaded due to network issues. Please check back later." : "The gallery is currently empty. Check back soon!"}
                    </CardContent>
                </Card>
             ) : galleryImages.length > 0 ? ( // Render only if images exist (fetched or fallback)
                <div className="grid grid-cols-gallery gap-4">
                 {galleryImages.map((image, index) => {
                     return (
                        <div key={image.id} className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 group animate-fade-in relative aspect-[3/2]" style={{ animationDelay: `${1 + index * 0.05}s` }}>
                          {/* Use the GalleryImage client component */}
                          <GalleryImage
                            src={image.url}
                            alt={image.name || `Gallery image ${image.id}`}
                            imageId={image.id}
                            loading={index < 6 ? "eager" : "lazy"}
                          />
                           {/* Optional: Display name overlay */}
                           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs truncate pointer-events-none">
                             {image.name}
                           </div>
                        </div>
                      );
                  })}
                </div>
             ) : (
                 // Fallback if length is somehow 0 despite error logic (e.g., error occurred but fallback is also empty)
                  <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                          {galleryResult.error
                              ? `Could not load gallery images due to an error: ${galleryResult.error}. Fallback data may be shown.`
                              : "Loading gallery or an unexpected issue occurred."
                          }
                           {/* Optional: Display fallback images if error and fallback exists */}
                           {galleryResult.error && galleryImages.length > 0 && galleryImages[0]?.id?.startsWith('g') && ( // Check if it's likely fallback data
                               <div className="mt-4 border-t pt-4 grid grid-cols-gallery gap-4">
                                   <h4 className="col-span-full font-semibold text-foreground">Placeholder Gallery Images:</h4>
                                   {galleryImages.map((img, idx) => (
                                       <div key={idx} className="relative aspect-[3/2]">
                                            <GalleryImage src={img.url} alt={img.name} imageId={img.id} loading="lazy"/>
                                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 text-white text-xs truncate pointer-events-none">
                                                 {img.name} (Placeholder)
                                             </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                      </CardContent>
                  </Card>
             )}
        </section>

        <Separator />

        {/* Join Matrix Section */}
        <section id="join" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><UserPlus className="w-8 h-8 text-accent"/>{siteContent.joinTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle>{siteContent.joinTitle}</CardTitle>
              <CardDescription>{siteContent.joinDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinForm /> {/* Client Component for form handling */}
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Newsletter Subscription Section */}
        <section id="newsletter" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.3s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Mail className="w-8 h-8 text-accent"/>{siteContent.newsletterTitle}</h2>
          <Card className="max-w-2xl mx-auto shadow-lg bg-secondary/50 hover:shadow-xl transition-shadow duration-300">
             <CardHeader>
               <CardTitle>{siteContent.newsletterTitle}</CardTitle>
               <CardDescription>{siteContent.newsletterDescription}</CardDescription>
             </CardHeader>
             <CardContent>
              <NewsletterForm /> {/* Client Component for form handling */}
             </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Contact Us Section */}
        <section id="contact" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '1.4s' }}>
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2"><Phone className="w-8 h-8 text-accent"/>Contact Us</h2>
           <Card className="max-w-2xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
             <CardContent className="p-6 md:p-8 space-y-4">
               {/* Display content error specifically if it occurred and is NOT offline */}
              {siteContentResult.error && !(isOffline && !hasOtherErrors) && ( // Show if error exists and it's NOT purely an offline error
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4"/>
                  <AlertTitle>Contact Details Error</AlertTitle>
                  {/* Use the string error directly */}
                  <AlertDescription>Could not load contact details. Displaying defaults. Error: {siteContentResult.error}</AlertDescription>
                </Alert>
              )}
               <div className="flex items-center gap-3 group">
                 <Mail className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                 <a href={`mailto:${siteContent.contactEmail}`} className="text-foreground/90 hover:text-accent transition-colors duration-200 break-all">{siteContent.contactEmail || 'N/A'}</a>
               </div>
               <div className="flex items-center gap-3 group">
                 <Phone className="w-5 h-5 text-accent group-hover:animate-pulse"/>
                 <a href={`tel:${siteContent.contactPhone}`} className="text-foreground/90 hover:text-accent transition-colors duration-200">{siteContent.contactPhone || 'N/A'}</a>
               </div>
               <div className="flex items-start gap-3 group">
                 <MapPin className="w-5 h-5 text-accent mt-1 group-hover:animate-pulse"/>
                 <span className="text-foreground/90 whitespace-pre-wrap">{siteContent.contactAddress || 'Location not specified'}</span>
               </div>
             </CardContent>
           </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
