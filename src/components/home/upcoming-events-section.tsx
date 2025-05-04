
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
  imageURL?: string;
  createdAt?: Timestamp; // Optional, but good for ordering
}

interface FetchResult<T> {
  data: T[];
  error: string | null;
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
  const fallbackEvents: Event[] = [
      { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), description: 'Join us for a night under the stars observing distant galaxies and nebulae. Details will be available soon.', imageURL: `https://picsum.photos/seed/event1/400/250` },
      { id: 'fallback2', name: 'Planetary Alignment Talk (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), description: 'Learn about the upcoming planetary alignment and how to view it. More information coming soon.', imageURL: `https://picsum.photos/seed/event2/400/250` },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError(null);
      setIsOffline(false); // Assume online initially

      if (!db) {
        setFetchError("Database not initialized.");
        setLoading(false);
        return;
      }

      const eventsCollectionRef = collection(db, eventsCollectionName);
      let errorMessage: string | null = null;

      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayTimestamp = Timestamp.fromDate(startOfToday);

        const q = query(eventsCollectionRef, where("date", ">=", todayTimestamp), orderBy("date", "asc"), limit(6));
        console.log(`[UpcomingEvents] Executing getDocs query for '${eventsCollectionName}'...`);
        const querySnapshot = await getDocs(q);
        console.log(`[UpcomingEvents] Fetched ${querySnapshot.size} events.`);

        if (querySnapshot.empty) {
          console.log("[UpcomingEvents] No upcoming events found.");
          setUpcomingEvents([]); // Ensure state is empty
        } else {
          const events: Event[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unnamed Event',
              description: data.description || 'No description provided.',
              date: data.date as Timestamp, // Assume date exists and is correct type
              imageURL: data.imageURL || `https://picsum.photos/seed/${doc.id}/400/250`,
              createdAt: data.createdAt as Timestamp, // Keep timestamp if available
            };
          });
          setUpcomingEvents(events);
        }
      } catch (error) {
         console.error(`[UpcomingEvents] Error fetching events:`, error);
          if (isOfflineError(error)) {
             errorMessage = `Offline/Unavailable: Could not connect to Firestore to fetch events (${(error as FirestoreError)?.code}). Using fallback data.`;
             console.warn(`[UpcomingEvents] ${errorMessage}`);
             setIsOffline(true); // Set offline state
          } else if (error instanceof FirestoreError) {
             if (error.code === 'permission-denied') {
                 errorMessage = `Permission Denied: Could not read collection '${eventsCollectionName}'. Check Firestore rules.`;
                 console.error(`[UpcomingEvents] CRITICAL: ${errorMessage}`);
             } else if (error.code === 'failed-precondition') {
                  errorMessage = `Index Required: Firestore query needs an index (date >=, date asc). Create it in Firebase. Using fallback data.`;
                 console.error(`[UpcomingEvents] ACTION NEEDED: ${errorMessage}`);
             } else {
                 errorMessage = `Firestore Error (${error.code}): ${error.message}. Using fallback data.`;
             }
          } else {
             errorMessage = `Unexpected Error: ${error instanceof Error ? error.message : String(error)}. Using fallback data.`;
          }
        setFetchError(errorMessage);
        setUpcomingEvents(fallbackEvents); // Use fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

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
                  {fetchError} {!isOffline && "Showing fallback events."}
                  {isOffline && "Showing fallback events. Functionality may be limited."}
             </AlertDescription>
          </Alert>
      )}


       {/* Empty State (Only show if not loading and no error resulted in fallback) */}
       {!loading && upcomingEvents.length === 0 && !(fetchError && fallbackEvents.length > 0) && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No upcoming events scheduled yet. Check back soon!
          </CardContent>
        </Card>
      )}

      {/* Events Grid */}
      {!loading && upcomingEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {upcomingEvents.map((event, index) => {
            const modalTitleId = getModalTitleId(event.id);
            const modalDescriptionId = getModalDescriptionId(event.id);
            const eventDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not available';
            const eventLongDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date not available';
            return (
              <Dialog key={event.id}>
                <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out animate-fade-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
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
                    <DialogTrigger asChild>
                      <Button variant="link" size="sm" className="text-primary/80 hover:text-primary">
                        Learn More <ArrowRight className="ml-1 h-4 w-4"/>
                      </Button>
                    </DialogTrigger>
                  </CardFooter>
                </Card>
                 <DialogContent
                      className="sm:max-w-[600px] p-0"
                      aria-labelledby={modalTitleId}
                      aria-describedby={modalDescriptionId} // Add aria-describedby
                 >
                     {/* Removed sr-only from header, added to title/desc individually */}
                     <DialogHeader className="p-4 sm:p-6 border-b">
                       <DialogTitle id={modalTitleId} className="text-2xl font-semibold">{event.name}</DialogTitle>
                       <DialogDescription id={modalDescriptionId} className="text-muted-foreground mt-1">
                          {eventLongDateString}
                       </DialogDescription>
                     </DialogHeader>
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
                                      e.currentTarget.src = `https://picsum.photos/seed/${event.id}/600/338`; // Fallback
                                      e.currentTarget.alt = `${event.name} (Fallback Image)`;
                                       e.currentTarget.onerror = null;
                                    }}
                                    unoptimized={!event.imageURL?.startsWith('/')}
                                />
                            </div>
                         )}
                         {/* Use event.description as the primary description */}
                         <p className="text-foreground/90 whitespace-pre-wrap">{event.description}</p>
                     </div>
                      <DialogClose className="absolute top-3 right-3 p-1 rounded-full bg-secondary/80 text-muted-foreground hover:bg-secondary transition-colors">
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
