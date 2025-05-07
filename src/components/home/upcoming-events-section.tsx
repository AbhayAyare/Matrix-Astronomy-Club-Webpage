
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventImage } from './event-image';
import { CalendarDays, AlertCircle, Loader2, WifiOff, ArrowRight, X } from 'lucide-react'; // Keep icons used for rendering
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Timestamp } from 'firebase/firestore'; // Keep Timestamp for type definition
import Image from 'next/image';
import { Button } from "@/components/ui/button"; // Import Button
import { isOfflineError } from '@/lib/utils'; // Keep for checking error type

// Event interface remains the same
export interface Event {
  id: string;
  name: string;
  date: Timestamp;
  description: string;
  imageURL?: string;
  createdAt?: Timestamp;
}

interface UpcomingEventsSectionProps {
  events: Event[];
  error: string | null;
}

// Fallback events for display when there's an error and no events are passed
const fallbackEvents: Event[] = [
     { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), description: 'Join us for a night under the stars observing distant galaxies and nebulae.', imageURL: 'https://picsum.photos/seed/event1/400/250'},
     { id: 'fallback2', name: 'Workshop: Introduction to Astrophotography (Fallback)', date: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), description: 'Learn the basics of capturing stunning images of the night sky.', imageURL: 'https://picsum.photos/seed/event2/400/250'},
  ];


export function UpcomingEventsSection({ events, error }: UpcomingEventsSectionProps) {
  // No useEffect or useState for fetching needed here

  const displayEvents = error && events.length === 0 ? fallbackEvents : events;
  const isDisplayingFallbacks = error && events.length === 0;
  const isCurrentlyOffline = error ? isOfflineError(new Error(error)) : false; // Check if the passed error indicates offline

   // Helper function to generate unique IDs for Dialog Title and Description
  const getModalTitleId = (eventId: string) => `event-modal-title-${eventId}`;
  const getModalDescriptionId = (eventId: string) => `event-modal-description-${eventId}`;


  return (
    <>
       {/* Error Alert (Only shown if there's an error and no events were fetched, handled globally now) */}
       {/* The global error alert in page.tsx handles the main error reporting. */}
       {/* We might add a smaller note here if needed, but often the global one is sufficient. */}
       {/* Example:
       {error && events.length === 0 && (
         <Alert variant={isCurrentlyOffline ? "default" : "destructive"} className={`mb-4 ${isCurrentlyOffline ? 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400' : ''}`}>
           {isCurrentlyOffline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
           <AlertTitle>{isCurrentlyOffline ? "Network Issue" : "Events Unavailable"}</AlertTitle>
           <AlertDescription>
             {error} {isDisplayingFallbacks && " Showing fallback events."}
           </AlertDescription>
         </Alert>
       )}
       */}


       {displayEvents.length === 0 && !error && (
        <Card>
          <CardContent className="p-6 text-center text-card-foreground">
             No upcoming events scheduled yet. Check back soon!
          </CardContent>
        </Card>
      )}


      {displayEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayEvents.map((event, index) => {
             const modalTitleId = getModalTitleId(event.id);
             const modalDescriptionId = getModalDescriptionId(event.id);
            const eventDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
            const eventLongDateString = event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { weekday: 'numeric', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
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
                        <p className="text-black line-clamp-3">{event.description}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center mt-auto pt-4 border-t">
                        <Badge variant="secondary" className="bg-accent text-accent-foreground">Upcoming</Badge>
                         {/* Use span for non-interactive trigger text */}
                          <span role="button" className="inline-flex items-center justify-center text-sm font-medium text-primary/80 hover:text-primary cursor-pointer group-hover:text-primary group-focus-within:text-primary">
                              Learn More <ArrowRight className="ml-1 h-4 w-4"/>
                          </span>
                      </CardFooter>
                    </Card>
                </DialogTrigger>
                 <DialogContent
                    className="sm:max-w-[600px] p-0"
                    aria-labelledby={modalTitleId} // Ensure this is set
                    aria-describedby={modalDescriptionId} // Ensure this is set if description exists
                  >
                    <DialogHeader className="p-4 sm:p-6 border-b">
                      {/* Ensure DialogTitle and optional DialogDescription are present */}
                      <DialogTitle id={modalTitleId}>{event.name}</DialogTitle>
                      <DialogDescription id={modalDescriptionId} className="sr-only">
                        Event details for {event.name} scheduled on {eventLongDateString}.
                      </DialogDescription>
                      {/* Or provide a visible description */}
                      {/* <DialogDescription id={modalDescriptionId} className="text-sm text-muted-foreground">
                        Scheduled on {eventLongDateString}.
                      </DialogDescription> */}
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
    </>
  );
}
