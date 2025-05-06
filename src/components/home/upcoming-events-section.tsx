
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventImage } from './event-image';
import { CalendarDays, AlertCircle, Loader2, WifiOff, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { collection, getDocs, query, orderBy, Timestamp, where, limit, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/context/firebase-provider';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  name: string;
  date: Timestamp;
  description: string;
  imageURL?: string;
  createdAt?: Timestamp;
}

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
       { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), description: 'Join us for a night under the stars observing distant galaxies and nebulae.', imageURL: 'https://picsum.photos/seed/event1/400/250'},
       { id: 'fallback2', name: 'Workshop: Introduction to Astrophotography (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), description: 'Learn the basics of capturing stunning images of the night sky.', imageURL: 'https://picsum.photos/seed/event2/400/250'},
    ];


  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError(null);
      setIsOffline(false);
      setUpcomingEvents([]);

      if (!db) {
        setFetchError("Database not initialized.");
        setLoading(false);
        setUpcomingEvents(fallbackEvents);
        return;
      }

      const eventsCollectionRef = collection(db, eventsCollectionName);
      let errorMessage: string | null = null;

      try {
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

        if (querySnapshot.empty) {
          setUpcomingEvents([]);
        } else {
          const events: Event[] = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const eventDate = data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(0));
            const eventName = data.name || 'Unnamed Event';
            const eventDesc = data.description || 'No description available.';
            const eventImage = data.imageURL;

            return {
              id: doc.id,
              name: eventName,
              description: eventDesc,
              date: eventDate,
              imageURL: eventImage,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
            };
          });
          setUpcomingEvents(events);
        }
      } catch (error) {
         const isOfflineErr = isOfflineError(error);
         setIsOffline(isOfflineErr);

         if (isOfflineErr) {
              errorMessage = `Network Issue: Could not connect to fetch events (${(error as FirestoreError)?.code}). Please check your connection.`;
          } else if (error instanceof FirestoreError) {
             if (error.code === 'permission-denied') {
                 errorMessage = `Permission Denied: Could not read collection '${eventsCollectionName}'. Check Firestore rules.`;
             } else if (error.code === 'failed-precondition') {
                  errorMessage = `Index Required: Firestore query needs a composite index on 'date >=, date asc'. Please create it in the Firebase console.`;
             } else {
                 errorMessage = `Firestore Error (${error.code}): ${error.message}.`;
             }
          } else {
             errorMessage = `Unexpected Error: ${error instanceof Error ? error.message : String(error)}.`;
          }
        setFetchError(errorMessage);
        if (fallbackEvents.length > 0) {
            setUpcomingEvents(fallbackEvents);
        } else {
             setUpcomingEvents([]);
        }
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
      

      {loading && (
        <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-muted-foreground">Loading Events...</span></div>
      )}

      {!loading && fetchError && (
          <Alert variant={isOffline ? "default" : "destructive"} className={`mb-4 ${isOffline ? 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400' : ''}`}>
               {isOffline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
               <AlertTitle>{isOffline ? "Network Issue" : "Events Unavailable"}</AlertTitle>
               <AlertDescription>
                  {fetchError} {fallbackEvents.length > 0 && upcomingEvents === fallbackEvents && " Showing fallback events."}
                  {isOffline && fallbackEvents.length > 0 && upcomingEvents === fallbackEvents && " Showing fallback events."}
                  {((isOffline && fallbackEvents.length === 0) || (!isOffline && !fetchError?.includes("fallback") && fallbackEvents.length === 0)) && " Cannot display events at this time."}
             </AlertDescription>
          </Alert>
      )}


       {!loading && upcomingEvents.length === 0 && !fetchError && (
        <Card>
          <CardContent className="p-6 text-center text-card-foreground">
             No upcoming events scheduled yet. Check back soon!
          </CardContent>
        </Card>
      )}


      {!loading && upcomingEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {upcomingEvents.map((event, index) => {
            const modalTitleId = getModalTitleId(event.id);
            const modalDescriptionId = getModalDescriptionId(event.id);
            const eventDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
            const eventLongDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
            return (
              <Dialog key={event.id}>
                <DialogTrigger asChild>
                    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out animate-fade-in cursor-pointer group bg-card" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                      <div className="relative h-48 w-full overflow-hidden">
                        <EventImage
                          src={event.imageURL}
                          alt={event.name}
                          eventId={event.id}
                          priority={index < 3}
                        />
                      </div>
                      <CardHeader>
                         <CardTitle className="text-xl text-card-foreground">{event.name}</CardTitle>
                         <CardDescription className="text-muted-foreground">
                          {eventDateString}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-card-foreground line-clamp-3">{event.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center mt-auto pt-4 border-t">
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">Upcoming</Badge>
                         <span role="button" className="inline-flex items-center justify-center text-sm font-medium text-primary/80 hover:text-primary cursor-pointer group-hover:text-primary group-focus-within:text-primary">
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
                    <DialogHeader className="p-4 sm:p-6 border-b">
                      <DialogTitle id={modalTitleId}>{event.name}</DialogTitle>
                      <DialogDescription id={modalDescriptionId} className="sr-only">
                        Event details for {event.name} scheduled on {eventLongDateString}.
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
                              const fallbackSrc = `https://picsum.photos/seed/${event.id}/600/338`;
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
                    <DialogClose asChild>
                         <Button variant="ghost" size="icon" className="absolute top-3 right-3 p-1 rounded-full bg-secondary/80 text-muted-foreground hover:bg-secondary transition-colors z-10">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </Button>
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
