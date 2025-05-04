'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventImage } from './event-image'; // Ensure this component exists and is client-compatible
import { CalendarDays, AlertCircle, Loader2, WifiOff, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy, Timestamp, where, limit, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/context/firebase-provider';
import Image from 'next/image'; // For modal image

interface Event {
  id: string;
  name: string;
  date: Timestamp;
  description: string;
  imageURL?: string; // Optional: Assuming image URL might be stored
  createdAt?: Timestamp; // Optional, but good for ordering
}

// Helper function to check for offline errors
function isOfflineError(error: any): boolean {
  const message = String(error?.message ?? '').toLowerCase();
  if (error instanceof FirestoreError) {
    return error.code === 'unavailable' ||
           message.includes('offline') ||
           message.includes('failed to get document because the client is offline') ||
           message.includes('could not reach cloud firestore backend');
  }
  return error instanceof Error && (
      message.includes('network error') ||
      message.includes('client is offline') ||
      message.includes('could not reach cloud firestore backend')
  );
}

export function UpcomingEventsSection() {
  const { db } = useFirebase();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const eventsCollectionName = 'events';
  // Define fallbackEvents as an empty array if you don't want fallbacks on error
  const fallbackEvents: Event[] = [];
  // Example with fallback data:
  // const fallbackEvents: Event[] = [
  //     { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), description: 'Join us for a night under the stars observing distant galaxies and nebulae. Details will be available soon.', imageURL: `https://picsum.photos/seed/event1/400/250` },
  //     { id: 'fallback2', name: 'Planetary Alignment Talk (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), description: 'Learn about the upcoming planetary alignment and how to view it. More information coming soon.', imageURL: `https://picsum.photos/seed/event2/400/250` },
  // ];


  useEffect(() => {
    const fetchEvents = async () => {
      console.log("[UpcomingEvents] Fetch effect started.");
      setLoading(true);
      setFetchError(null);
      setIsOffline(false); // Assume online initially
      setUpcomingEvents([]); // Reset events state on fetch start

      if (!db) {
        console.error("[UpcomingEvents] Database instance is not available.");
        setFetchError("Database not initialized.");
        setLoading(false);
        setUpcomingEvents(fallbackEvents); // Use fallback if DB missing
        return;
      }
      console.log("[UpcomingEvents] Database instance found.");

      const eventsCollectionRef = collection(db, eventsCollectionName);
      let errorMessage: string | null = null;

      try {
        const now = new Date();
        // Start of today, considering local timezone for comparison if dates are entered locally
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayTimestamp = Timestamp.fromDate(startOfToday);
        console.log(`[UpcomingEvents] Fetching events from collection '${eventsCollectionName}' on or after: ${startOfToday.toISOString()} (Timestamp: ${todayTimestamp.toMillis()})`);

        // The query definition
        const q = query(
          eventsCollectionRef,
          where("date", ">=", todayTimestamp), // Query for dates >= start of today
          orderBy("date", "asc"),             // Order by event date
          limit(6)                            // Limit results
        );
        console.log(`[UpcomingEvents] Firestore Query: collection='${eventsCollectionName}', where date >= ${todayTimestamp.toMillis()}, orderBy date asc, limit 6`);

        console.log(`[UpcomingEvents] Executing getDocs query for '${eventsCollectionName}'...`);
        const querySnapshot = await getDocs(q);
        console.log(`[UpcomingEvents] Query completed. Fetched ${querySnapshot.size} documents.`);

        if (querySnapshot.empty) {
          console.log("[UpcomingEvents] No upcoming events found matching the query.");
          setUpcomingEvents([]); // Ensure state is empty if no events found
        } else {
          const events: Event[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Basic validation for required fields
            const eventDate = data.date instanceof Timestamp ? data.date : Timestamp.now(); // Fallback date if missing/invalid
            const eventName = data.name || 'Unnamed Event';
            const eventDesc = data.description || 'No description available.';
            // Use fallback URL if imageURL is missing or empty
            const eventImage = data.imageURL || `https://picsum.photos/seed/${doc.id}/400/250`;

            // Log raw data for each document fetched
             console.log(`[UpcomingEvents] Raw doc data for ${doc.id}:`, {
                 name: data.name,
                 date: data.date?.toDate ? data.date.toDate().toISOString() : data.date, // Log date as ISO string if possible
                 description: data.description,
                 imageURL: data.imageURL,
                 createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
             });

            return {
              id: doc.id,
              name: eventName,
              description: eventDesc,
              date: eventDate,
              imageURL: eventImage,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
            };
          });
          console.log("[UpcomingEvents] Successfully mapped documents to events array:", events);
          setUpcomingEvents(events);
        }
      } catch (error) {
         console.error(`[UpcomingEvents] Error fetching events:`, error); // Log the raw error
         const isOfflineErr = isOfflineError(error);
         setIsOffline(isOfflineErr); // Set offline state based on helper

         if (isOfflineErr) {
              errorMessage = `Network Issue: Could not connect to fetch events (${(error as FirestoreError)?.code}).`;
              console.warn(`[UpcomingEvents] ${errorMessage}`);
          } else if (error instanceof FirestoreError) {
             if (error.code === 'permission-denied') {
                 errorMessage = `Permission Denied: Could not read collection '${eventsCollectionName}'. Check Firestore rules.`;
                 console.error(`[UpcomingEvents] CRITICAL: ${errorMessage}`);
             } else if (error.code === 'failed-precondition') {
                  // This error usually means an index is missing
                  errorMessage = `Index Required: Firestore query needs a composite index on 'date >=, date asc'. Create it in the Firebase console. Link in console error details.`;
                 console.error(`[UpcomingEvents] ACTION NEEDED: ${errorMessage}`);
             } else {
                 // Catch other specific Firestore errors
                 errorMessage = `Firestore Error (${error.code}): ${error.message}.`;
                 console.error(`[UpcomingEvents] ${errorMessage}`);
             }
          } else {
             // Catch generic errors
             errorMessage = `Unexpected Error: ${error instanceof Error ? error.message : String(error)}.`;
             console.error(`[UpcomingEvents] ${errorMessage}`);
          }
        setFetchError(errorMessage);
        // Only set fallback if fallbackEvents has items
        if (fallbackEvents.length > 0) {
            console.warn("[UpcomingEvents] Setting fallback event data due to error.");
            setUpcomingEvents(fallbackEvents);
        } else {
             console.warn("[UpcomingEvents] Error occurred, but no fallback data defined. Events list will be empty.");
             setUpcomingEvents([]); // Explicitly set to empty on error if no fallback
        }
      } finally {
        console.log("[UpcomingEvents] Fetch process finished. Setting loading to false.");
        setLoading(false);
      }
    };

    fetchEvents();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Rerun only if db instance changes

   // Generate unique IDs for DialogTitle and DialogDescription
  const getModalTitleId = (eventId: string) => `event-modal-title-${eventId}`;
  const getModalDescriptionId = (eventId: string) => `event-modal-description-${eventId}`;


  return (
    <section id="events" className="scroll-mt-20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-primary flex items-center justify-center gap-2">
        <CalendarDays className="w-8 h-8 text-accent"/>Upcoming Events
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Events...</span></div>
      )}

       {/* Error State */}
      {!loading && fetchError && (
          <Alert variant={isOffline ? "default" : "destructive"} className={`mb-4 ${isOffline ? 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400' : ''}`}>
               {isOffline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
               <AlertTitle>{isOffline ? "Network Issue" : "Events Unavailable"}</AlertTitle>
               <AlertDescription>
                  {fetchError} {fallbackEvents.length > 0 && upcomingEvents === fallbackEvents && " Showing fallback events."}
                  {isOffline && fallbackEvents.length > 0 && upcomingEvents === fallbackEvents && " Showing fallback events."}
                  {/* Message if offline and no fallback or if other error and no fallback */}
                  {((isOffline && fallbackEvents.length === 0) || (!isOffline && !fetchError?.includes("fallback") && fallbackEvents.length === 0)) && " Cannot load events."}
             </AlertDescription>
          </Alert>
      )}


       {/* Empty State - Show ONLY if not loading, events array has length 0 AND there was no error that prevented fetching */}
       {!loading && !fetchError && upcomingEvents.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
             No upcoming events scheduled yet. Check back soon!
          </CardContent>
        </Card>
      )}
        {/* Empty State - Show ONLY if not loading, events array is empty AND there WAS an error BUT no fallback was used */}
       {!loading && fetchError && upcomingEvents.length === 0 && fallbackEvents.length === 0 && (
         <Card>
           <CardContent className="p-6 text-center text-muted-foreground">
              Could not load events due to an error. Check back soon!
           </CardContent>
         </Card>
       )}


      {/* Events Grid (Show if not loading AND there are events - either fetched or fallback) */}
      {!loading && upcomingEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {upcomingEvents.map((event, index) => {
            const modalTitleId = getModalTitleId(event.id); // Generate ID for title
            const modalDescriptionId = getModalDescriptionId(event.id); // Generate ID for description
            const eventDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
            const eventLongDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
            return (
              <Dialog key={event.id}>
                <DialogTrigger asChild>
                    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out animate-fade-in cursor-pointer" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
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
                          {eventDateString}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-foreground/80 line-clamp-3">{event.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center mt-auto pt-4 border-t">
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">Upcoming</Badge>
                         {/* This span now acts like a button for the trigger */}
                         <span role="button" className="inline-flex items-center justify-center text-sm font-medium text-primary/80 hover:text-primary cursor-pointer">
                             Learn More <ArrowRight className="ml-1 h-4 w-4"/>
                         </span>
                      </CardFooter>
                    </Card>
                </DialogTrigger>
                 <DialogContent
                    className="sm:max-w-[600px] p-0"
                    aria-labelledby={modalTitleId}
                    aria-describedby={modalDescriptionId}
                  >
                    {/* Ensure DialogHeader with Title and Description is present */}
                    <DialogHeader className="p-4 sm:p-6 border-b">
                      <DialogTitle id={modalTitleId}>{event.name}</DialogTitle>
                      <DialogDescription id={modalDescriptionId}>
                        Event details for {event.name} scheduled on {eventLongDateString}.
                      </DialogDescription>
                    </DialogHeader>
                    {/* Main content */}
                    <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                      {event.imageURL && (
                        <div className="relative aspect-video mb-4 rounded-md overflow-hidden">
                          <Image
                            src={event.imageURL}
                            alt={`Image for ${event.name}`}
                            fill
                            sizes="(max-width: 640px) 90vw, 600px"
                            className="object-cover"
                            onError={(e) => {
                              console.warn(`Modal Event Image Load Error: ${event.imageURL}`);
                              const fallbackSrc = `https://picsum.photos/seed/${event.id}/600/338`; // Fallback URL
                              if (e.currentTarget && typeof e.currentTarget.src === 'string') {
                                e.currentTarget.src = fallbackSrc;
                              }
                              e.currentTarget.alt = `${event.name} (Fallback Image)`;
                              e.currentTarget.onerror = null;
                            }}
                            unoptimized={!event.imageURL?.startsWith('/')}
                          />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">{eventLongDateString}</p>
                      <p className="text-foreground/90 whitespace-pre-wrap">{event.description}</p>
                    </div>
                    <DialogClose className="absolute top-3 right-3 p-1 rounded-full bg-secondary/80 text-muted-foreground hover:bg-secondary transition-colors z-10">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </DialogClose>
                  </DialogContent>
              </Dialog>
            );
          })}
        </div>
      )}
    </section>
  );
}