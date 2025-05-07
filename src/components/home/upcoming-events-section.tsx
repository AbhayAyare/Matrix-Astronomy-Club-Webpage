'use client';

import { useState, useEffect } from 'react'; // Import useState and useEffect
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventImage } from './event-image';
import { CalendarDays, AlertCircle, WifiOff, ArrowRight, X, Clock } from 'lucide-react'; // Added Clock icon
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { isOfflineError } from '@/lib/utils';

// Event interface remains the same
export interface Event {
  id: string;
  name: string;
  date: number; // Milliseconds timestamp
  description: string;
  imageURL?: string;
  createdAt?: number; // Milliseconds timestamp or undefined
}

interface UpcomingEventsSectionProps {
  events: Event[];
  error: string | null;
}

// Fallback events remain the same
const fallbackEvents: Event[] = [
  { id: 'fallback1', name: 'Deep Sky Observation Night (Fallback)', date: Date.now() + 7 * 24 * 60 * 60 * 1000, description: 'Join us for a night under the stars observing distant galaxies and nebulae.', imageURL: 'https://picsum.photos/seed/event1/400/250'},
  { id: 'fallback2', name: 'Workshop: Introduction to Astrophotography (Fallback)', date: Date.now() + 14 * 24 * 60 * 60 * 1000, description: 'Learn the basics of capturing stunning images of the night sky.', imageURL: 'https://picsum.photos/seed/event2/400/250'},
];

// New client component to handle time formatting safely
function EventTime({ timestamp }: { timestamp: number }) {
  const [timeString, setTimeString] = useState<string | null>(null);

  useEffect(() => {
    // Format time only on the client after hydration
    const dateObj = new Date(timestamp);
    if (!isNaN(dateObj.getTime())) {
      setTimeString(dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    } else {
      setTimeString('Time unknown');
    }
  }, [timestamp]); // Re-run if the timestamp changes

  return timeString ? <span>{timeString}</span> : <span className="text-muted-foreground/50">...</span>; // Show placeholder while loading
}


export function UpcomingEventsSection({ events, error }: UpcomingEventsSectionProps) {
  const displayEvents = error && events.length === 0 ? fallbackEvents : events;
  const isDisplayingFallbacks = error && events.length === 0;
  const isCurrentlyOffline = error ? isOfflineError(new Error(error)) : false;

  const getModalTitleId = (eventId: string) => `event-modal-title-${eventId}`;
  const getModalDescriptionId = (eventId: string) => `event-modal-description-${eventId}`;


  return (
    <>
       {error && events.length === 0 && (
         <Alert variant={isCurrentlyOffline ? "default" : "destructive"} className={`mb-4 ${isCurrentlyOffline ? 'border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400' : ''}`}>
           {isCurrentlyOffline ? <WifiOff className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
           <AlertTitle>{isCurrentlyOffline ? "Network Issue" : "Events Unavailable"}</AlertTitle>
           <AlertDescription>
             Could not load latest events. {isDisplayingFallbacks ? "Showing fallback data." : ""} Error: {error}
           </AlertDescription>
         </Alert>
       )}

       {displayEvents.length === 0 && !error && (
        <Card>
          <CardContent className="p-6 text-center text-foreground">
             No upcoming events scheduled yet. Check back soon!
          </CardContent>
        </Card>
      )}

      {displayEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayEvents.map((event, index) => {
             const modalTitleId = getModalTitleId(event.id);
             const modalDescriptionId = getModalDescriptionId(event.id);
             const eventDateObj = new Date(event.date);
             // Format date consistently (less prone to hydration issues than time)
             const eventDateString = !isNaN(eventDateObj.getTime()) ? eventDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
             const eventLongDateString = !isNaN(eventDateObj.getTime()) ? eventDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date unknown';
             // Pass timestamp to EventTime component for client-side formatting

            return (
              <Dialog key={event.id}>
                <DialogTrigger asChild>
                    {/* Card remains mostly the same */}
                    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out animate-fade-in cursor-pointer group bg-card" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                      <div className="relative h-48 w-full overflow-hidden group">
                        <EventImage
                          src={event.imageURL}
                          alt={event.name}
                          eventId={event.id}
                          priority={index < 3}
                        />
                      </div>
                      <CardHeader>
                         <CardTitle className="text-xl text-card-foreground">{event.name}</CardTitle>
                         {/* Display date and use EventTime component for time */}
                         <CardDescription className="text-muted-foreground flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" /> {eventDateString}
                            <Clock className="h-4 w-4 ml-1" /> <EventTime timestamp={event.date} />
                         </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-foreground/80 line-clamp-3">{event.description}</p>
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
                       {/* Use EventTime also in the modal for consistency */}
                       <DialogDescription id={modalDescriptionId} className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                            <span><CalendarDays className="inline-block h-4 w-4 mr-1.5 align-text-bottom"/>{eventLongDateString}</span>
                            <span><Clock className="inline-block h-4 w-4 mr-1.5 align-text-bottom"/> <EventTime timestamp={event.date} /></span>
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