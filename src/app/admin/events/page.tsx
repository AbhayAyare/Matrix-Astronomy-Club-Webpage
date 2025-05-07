
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardFooter, // Added CardFooter
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, Timestamp, serverTimestamp, FirestoreError } from 'firebase/firestore';
import { Loader2, PlusCircle, Edit3, Trash2, Calendar, Clock, Image as ImageIcon, Wand2, WifiOff, Save } from 'lucide-react'; // Added Wand2 for AI, Save
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter, // Added DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { suggestEventDetails, SuggestEventDetailsInput, SuggestEventDetailsOutput } from '@/ai/flows/suggest-event-details'; // Import AI flow
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';


const EVENTS_COLLECTION = 'events';

interface Event {
  id: string;
  name: string;
  date: Timestamp;
  description: string;
  imageURL?: string; // Optional image URL
  createdAt?: Timestamp; // Optional, for sorting by creation if needed
}

export default function AdminEventsPage() {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // For add/edit operations
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEventId, setEditEventId] = useState<string | null>(null); // To track if editing
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(''); // Store as string, convert to Timestamp on save
  const [eventTime, setEventTime] = useState(''); // Store as string
  const [eventDescription, setEventDescription] = useState('');
  const [eventImageURL, setEventImageURL] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false); // Track offline state


  // Generate stable IDs using React.useId
  const baseId = React.useId();
  const dialogTitleId = `${baseId}-event-dialog-title`;
  const dialogDescriptionId = `${baseId}-event-dialog-description`;


  // Check for db
  if (!db) {
     return (
       <div className="flex items-center justify-center h-screen">
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Database Error</AlertTitle>
           <AlertDescription>
             Firebase Firestore is not initialized. Please check your Firebase configuration.
             Admin features related to database operations will not be available.
           </AlertDescription>
         </Alert>
       </div>
     );
   }

  const eventsCollectionRef = collection(db, EVENTS_COLLECTION);

  // Fetch events on load
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError(null); // Reset error on fetch
      setIsOffline(false); // Reset offline state
      try {
        const q = query(eventsCollectionRef, orderBy("date", "desc")); // Order by event date
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
           date: doc.data().date as Timestamp, // Ensure correct type
        })) as Event[];
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        let errorMessage = "Failed to load events.";
        if (error instanceof FirestoreError) {
            if (error.code === 'failed-precondition') {
                 errorMessage = "A Firestore index is required for 'events' by 'date' descending. Please create it in the Firebase console.";
                 toast({ title: "Index Required", description: errorMessage, variant: "destructive", duration: 10000 });
            } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                errorMessage = "Cannot load events. You appear to be offline. Please check your internet connection.";
                setIsOffline(true); // Set offline state
            }
        }
        setFetchError(errorMessage); // Set error message
        if (!(error instanceof FirestoreError && error.code === 'failed-precondition')) {
           toast({
             title: "Error",
             description: errorMessage,
             variant: "destructive",
           });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const resetForm = () => {
    setEventName('');
    setEventDate('');
    setEventTime('');
    setEventDescription('');
    setEventImageURL('');
    setEditEventId(null);
    setAiKeywords('');
  };

  const handleOpenModal = (event?: Event) => {
    if (event) {
      setEditEventId(event.id);
      setEventName(event.name);
      // Convert Timestamp to yyyy-mm-dd string for date input
      const dateObj = event.date.toDate();
      setEventDate(dateObj.toISOString().split('T')[0]);
      // Convert Timestamp to hh:mm string for time input
      setEventTime(dateObj.toTimeString().split(' ')[0].substring(0, 5));
      setEventDescription(event.description);
      setEventImageURL(event.imageURL || '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  // Combine date and time strings into a Firestore Timestamp
  const combineDateTimeToTimestamp = (dateStr: string, timeStr: string): Timestamp | null => {
    if (!dateStr || !timeStr) return null;
    try {
      // Handles potential timezone issues by parsing as local time then converting
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      // Note: JavaScript month is 0-indexed (0 for January, 11 for December)
      const combinedDate = new Date(year, month - 1, day, hours, minutes);
      if (isNaN(combinedDate.getTime())) {
          throw new Error("Invalid date or time resulting in NaN timestamp");
      }
      return Timestamp.fromDate(combinedDate);
    } catch (error) {
        console.error("Error combining date and time:", error);
        toast({
            title: "Invalid Date/Time",
            description: "Please ensure date and time are correctly formatted.",
            variant: "destructive",
        });
        return null;
    }
};


  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const combinedTimestamp = combineDateTimeToTimestamp(eventDate, eventTime);
    if (!combinedTimestamp) {
        setSaving(false);
        // Toast for invalid date/time should have been shown by combineDateTimeToTimestamp
        return;
    }

    const eventData = {
      name: eventName,
      date: combinedTimestamp,
      description: eventDescription,
      imageURL: eventImageURL,
       // Add createdAt for new events, maintain for existing ones
       ...(editEventId ? {} : { createdAt: serverTimestamp() }),
    };

    try {
      if (editEventId) {
        const eventDocRef = doc(db, EVENTS_COLLECTION, editEventId);
        await updateDoc(eventDocRef, eventData);
        setEvents(events.map(ev => ev.id === editEventId ? { ...ev, ...eventData, date: combinedTimestamp } : ev));
        toast({ title: "Success", description: "Event updated successfully." });
      } else {
        const docRef = await addDoc(eventsCollectionRef, eventData);
        // Optimistically add to local state with the server-generated ID and timestamp
        const newEvent: Event = { id: docRef.id, ...eventData, date: combinedTimestamp, createdAt: Timestamp.now() };
        setEvents(prevEvents => [newEvent, ...prevEvents].sort((a, b) => b.date.toMillis() - a.date.toMillis()));
        toast({ title: "Success", description: "Event added successfully." });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving event:", error);
      let errorMessage = "Failed to save event.";
      if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
          errorMessage = "Cannot save event. You appear to be offline.";
          setIsOffline(true);
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setDeletingId(id);
    try {
      const eventDocRef = doc(db, EVENTS_COLLECTION, id);
      await deleteDoc(eventDocRef);
      setEvents(events.filter(ev => ev.id !== id));
      toast({ title: "Success", description: "Event deleted successfully." });
    } catch (error) {
      console.error("Error deleting event:", error);
      let errorMessage = "Failed to delete event.";
      if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
          errorMessage = "Cannot delete event. You appear to be offline.";
          setIsOffline(true);
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAISuggest = async () => {
    if (!aiKeywords.trim()) {
      toast({ title: "Input Required", description: "Please enter some keywords for AI suggestion.", variant: "default" });
      return;
    }
    setIsSuggesting(true);
    try {
      const input: SuggestEventDetailsInput = { keywords: aiKeywords };
      const result = await suggestEventDetails(input);
      setEventName(result.title);
      setEventDescription(result.description);
      toast({ title: "AI Suggestion Applied", description: "Title and description updated." });
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({ title: "AI Suggestion Failed", description: `Could not generate suggestions. ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  const getDeleteDialogTitleId = (eventId: string) => `delete-event-dialog-title-${eventId}`;
  const getDeleteDialogDescriptionId = (eventId: string) => `delete-event-dialog-description-${eventId}`;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Add, edit, or delete club events.</p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={isOffline}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Event
        </Button>
      </div>

       {/* Offline Warning */}
       {isOffline && (
         <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
             <WifiOff className="h-4 w-4"/>
             <AlertTitle>Offline Mode</AlertTitle>
             <AlertDescription>You are currently offline. Event management is limited.</AlertDescription>
         </Alert>
       )}

      {/* Event Creation/Editing Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
           className="sm:max-w-[525px]"
           aria-labelledby={dialogTitleId} // Use generated ID
           aria-describedby={dialogDescriptionId} // Use generated ID
        >
          <DialogHeader>
            <DialogTitle id={dialogTitleId}> {/* Use generated ID */}
              {editEventId ? 'Edit Event' : 'Add New Event'}
            </DialogTitle>
            <DialogDescription id={dialogDescriptionId}> {/* Use generated ID */}
              {editEventId ? 'Update the details for this event.' : 'Fill in the details for the new event.'} Use the AI tool for suggestions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="aiKeywords">AI Suggestion Keywords</Label>
              <div className="flex gap-2">
                <Input
                  id="aiKeywords"
                  placeholder="e.g., meteor shower, telescope viewing"
                  value={aiKeywords}
                  onChange={(e) => setAiKeywords(e.target.value)}
                  disabled={isSuggesting || saving || isOffline}
                  className="transition-colors duration-200 focus:border-accent"
                />
                <Button type="button" onClick={handleAISuggest} disabled={isSuggesting || saving || isOffline || !aiKeywords.trim()}>
                  {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  <span className="sr-only">Get AI Suggestions</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
                disabled={saving || isOffline}
                className="text-primary-foreground placeholder:text-gray-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="eventDate">Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                  disabled={saving || isOffline}
                  className="text-primary-foreground placeholder:text-gray-300"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="eventTime">Time</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  required
                  disabled={saving || isOffline}
                  className="text-primary-foreground placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="eventDescription">Description</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                rows={4}
                required
                disabled={saving || isOffline}
                className="text-primary-foreground placeholder:text-gray-300"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eventImageURL">Image URL (Optional)</Label>
              <Input
                id="eventImageURL"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={eventImageURL}
                onChange={(e) => setEventImageURL(e.target.value)}
                disabled={saving || isOffline}
                className="text-primary-foreground placeholder:text-gray-300"
              />
            </div>
             <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving || isOffline}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4"/>
                {saving ? 'Saving...' : (editEventId ? 'Update Event' : 'Add Event')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Events</CardTitle>
          <CardDescription>View and manage your scheduled events.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Events...</span></div>
          ) : fetchError && !isOffline ? (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{fetchError}</AlertDescription>
             </Alert>
          ) : fetchError && isOffline ? (
             <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Network Error</AlertTitle>
               <AlertDescription>{fetchError}</AlertDescription>
             </Alert>
          ) : events.length === 0 && !loading ? (
             <p className="text-center text-muted-foreground p-6">No events scheduled yet. Add one!</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const deleteDialogTitleId = getDeleteDialogTitleId(event.id);
                const deleteDialogDescriptionId = getDeleteDialogDescriptionId(event.id);
                return(
                <Card key={event.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold text-primary-foreground">{event.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {event.date.toDate().toLocaleDateString()}
                      <Clock className="h-4 w-4 ml-2" /> {event.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {event.imageURL && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                        <ImageIcon className="h-3 w-3" />
                        <a href={event.imageURL} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">
                          {event.imageURL}
                        </a>
                      </div>
                    )}
                     <p className="text-sm text-primary-foreground pt-1 line-clamp-3">{event.description}</p>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(event)} disabled={deletingId === event.id || isOffline}>
                      <Edit3 className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deletingId === event.id || isOffline}>
                           {deletingId === event.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                           Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                         aria-labelledby={deleteDialogTitleId}
                         aria-describedby={deleteDialogDescriptionId}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle id={deleteDialogTitleId}>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription id={deleteDialogDescriptionId}>
                            This will permanently delete the event: <span className="font-medium">{event.name}</span>. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
