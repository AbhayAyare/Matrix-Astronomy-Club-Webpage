
'use client';

import React, { useState, useEffect } from 'react'; // Ensured React is imported
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
import { Loader2, PlusCircle, Edit, Trash2, Wand2, WifiOff } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
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
  date: Timestamp; // Use Firestore Timestamp
  description: string;
  imageURL?: string; // Add optional imageURL field
  createdAt: Timestamp;
}

type EventFormData = Omit<Event, 'id' | 'createdAt' | 'date'> & { date: string }; // Use string for form input date

export default function AdminEventsPage() {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<EventFormData | null>(null); // For form data
  const [editEventId, setEditEventId] = useState<string | null>(null); // ID of event being edited
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false); // Track offline state

  // Generate stable IDs using React.useId
  const baseId = React.useId();
  const dialogTitleId = `${baseId}-event-dialog-title`;
  const dialogDescriptionId = `${baseId}-event-dialog-description`;


  // Add a check if db is null before creating eventsCollectionRef
 if (!db) {
    console.error("[AdminEvents] Firestore DB is not initialized.");
 return (
 <div className="flex items-center justify-center h-screen text-red-500">Firestore DB not available.</div>
 );
  }
 const eventsCollectionRef = collection(db, EVENTS_COLLECTION);

  // Fetch events on load
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError(null); // Reset error on fetch
      setIsOffline(false); // Reset offline state
      console.log("[AdminEvents] Fetching events...");
      try {
        const q = query(eventsCollectionRef, orderBy("date", "asc")); // Order by event date
        const querySnapshot = await getDocs(q);
        console.log(`[AdminEvents] Fetched ${querySnapshot.size} events.`);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure date and createdAt are Timestamps
          date: doc.data().date as Timestamp,
          createdAt: doc.data().createdAt as Timestamp,
        })) as Event[];
        setEvents(fetchedEvents);
         console.log("[AdminEvents] Events state updated:", fetchedEvents);
      } catch (error) {
        console.error("[AdminEvents] Error fetching events:", error);
        let errorMessage = "Failed to load events.";
         if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
            errorMessage = "Cannot load events. You appear to be offline. Please check your internet connection.";
            setFetchError(errorMessage); // Set specific error message for UI
            setIsOffline(true); // Set offline state
         } else if (error instanceof FirestoreError && error.code === 'failed-precondition') {
             errorMessage = "A Firestore index on 'events' collection by 'date' ascending is needed. Please create it in the Firebase console.";
             setFetchError(errorMessage);
             toast({
                 title: "Firestore Index Required",
                 description: errorMessage,
                 variant: "destructive",
                 duration: 10000, // Show longer
             });
         } else {
            setFetchError(errorMessage); // Set generic error for other cases
            toast({
              title: "Error",
              description: errorMessage,
              variant: "destructive",
            });
         }

      } finally {
        setLoading(false);
        console.log("[AdminEvents] Fetching complete.");
      }
    };
    fetchEvents();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);


  const handleOpenModal = (eventToEdit: Event | null = null) => {
    setAiError(null); // Reset AI error on modal open
    setAiKeywords(''); // Reset keywords
    if (eventToEdit) {
      setEditEventId(eventToEdit.id);
       // Convert Timestamp to 'yyyy-MM-dd' string for input
       const dateString = eventToEdit.date.toDate().toISOString().split('T')[0];
      setCurrentEvent({ ...eventToEdit, date: dateString });
       console.log("[AdminEvents] Opening modal to edit event:", eventToEdit);
    } else {
      setEditEventId(null);
      setCurrentEvent({ name: '', date: '', description: '', imageURL: '' }); // Reset form for new event, include imageURL
       console.log("[AdminEvents] Opening modal to add new event.");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEvent(null);
    setEditEventId(null);
    setAiKeywords('');
    setAiLoading(false);
    setAiError(null);
    console.log("[AdminEvents] Modal closed.");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentEvent) return;
    const { name, value } = e.target;
    setCurrentEvent({ ...currentEvent, [name]: value });
     console.log(`[AdminEvents] Input change - ${name}: ${value}`);
  };

   const handleSuggestDetails = async () => {
       if (!aiKeywords || !currentEvent) return;
       setAiLoading(true);
       setAiError(null);
       console.log("[AdminEvents] Requesting AI suggestions for keywords:", aiKeywords);
       try {
           const input: SuggestEventDetailsInput = { keywords: aiKeywords };
           const result: SuggestEventDetailsOutput = await suggestEventDetails(input);
           setCurrentEvent({
             ...currentEvent,
             name: result.title,
             description: result.description,
           });
           toast({ title: "AI Suggestion", description: "Title and description populated." });
           console.log("[AdminEvents] AI suggestions applied:", result);
       } catch (error) {
           console.error("[AdminEvents] AI suggestion error:", error);
           setAiError("Failed to get AI suggestions. Please try again.");
           toast({ title: "AI Error", description: "Could not generate suggestions.", variant: "destructive" });
       } finally {
           setAiLoading(false);
       }
   };


  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AdminEvents] Attempting to save event...");
    if (!currentEvent || !currentEvent.name || !currentEvent.date || !currentEvent.description) {
       toast({ title: "Missing Fields", description: "Please fill in all required event details (Name, Date, Description).", variant: "destructive" });
       console.warn("[AdminEvents] Save cancelled: Missing required fields.");
       return;
    }
    setSaving(true);

    // Convert date string back to Firestore Timestamp
    let eventDateTimestamp: Timestamp;
    try {
        // Important: Ensure the date string is treated as local time, not UTC.
        // Construct date with a fixed time (e.g., midday) to avoid timezone shifts.
        const dateInput = currentEvent.date; // e.g., "2024-05-15"
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            throw new Error("Invalid date format. Use YYYY-MM-DD.");
        }
        // Use Date constructor carefully. Parsing 'YYYY-MM-DD' directly might interpret it as UTC midnight.
        // Create date parts and construct locally.
        const [year, month, day] = dateInput.split('-').map(Number);
        // Month is 0-indexed in Date constructor (0 = January)
        const localDate = new Date(year, month - 1, day, 12, 0, 0); // Use midday local time

        if (isNaN(localDate.getTime())) {
            throw new Error("Invalid date created.");
        }

        eventDateTimestamp = Timestamp.fromDate(localDate);
         console.log(`[AdminEvents] Date string "${currentEvent.date}" converted to Timestamp:`, eventDateTimestamp.toDate().toISOString());
    } catch (dateError: any) {
        console.error("[AdminEvents] Invalid date format:", dateError);
        toast({ title: "Invalid Date", description: `Please enter a valid date (YYYY-MM-DD). Error: ${dateError.message}`, variant: "destructive" });
        setSaving(false);
        return;
    }


    const eventData = {
      name: currentEvent.name,
      date: eventDateTimestamp,
      description: currentEvent.description,
      imageURL: currentEvent.imageURL || '', // Add imageURL, default to empty string if not provided
    };

    console.log("[AdminEvents] Saving event data:", eventData);

    try {
      if (editEventId) {
        // Update existing event
        console.log(`[AdminEvents] Updating event with ID: ${editEventId}`);
        const eventDocRef = doc(db!, EVENTS_COLLECTION, editEventId); // Use non-null assertion as db is checked above
        await updateDoc(eventDocRef, eventData);
        // Update local state correctly, ensuring date is the new timestamp
        setEvents(prevEvents =>
            prevEvents.map(ev =>
              ev.id === editEventId ? { ...ev, ...eventData, date: eventDateTimestamp } : ev
            ).sort((a, b) => a.date.toMillis() - b.date.toMillis()) // Keep sorted
         );
        toast({ title: "Success", description: "Event updated successfully." });
         console.log("[AdminEvents] Event updated successfully.");
      } else {
        // Add new event
        console.log("[AdminEvents] Adding new event.");
        const docRef = await addDoc(eventsCollectionRef, { ...eventData, createdAt: serverTimestamp() });
         // Optimistically add to local state or refetch for accuracy
         const newEvent: Event = {
            id: docRef.id,
            ...eventData,
            date: eventDateTimestamp, // Use the correct timestamp
            createdAt: Timestamp.now() // Use local timestamp as approximation until refetch
         };
         setEvents(prevEvents =>
            [...prevEvents, newEvent].sort((a, b) => a.date.toMillis() - b.date.toMillis()) // Add and keep sorted
          );
        toast({ title: "Success", description: "Event added successfully." });
        console.log("[AdminEvents] New event added with ID:", docRef.id);
      }
      handleCloseModal();
    } catch (error) {
       console.error("[AdminEvents] Error saving event:", error);
       let errorMessage = `Failed to ${editEventId ? 'update' : 'add'} event.`;
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
          errorMessage = "Cannot save. You appear to be offline.";
          setIsOffline(true); // Indicate offline during save
        }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
       console.log("[AdminEvents] Save operation finished.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setDeletingId(id);
    console.log(`[AdminEvents] Attempting to delete event with ID: ${id}`);
    try {
      const eventDocRef = doc(db!, EVENTS_COLLECTION, id); // Use non-null assertion
      await deleteDoc(eventDocRef);
      setEvents(events.filter(ev => ev.id !== id));
      toast({ title: "Success", description: "Event deleted successfully." });
      console.log(`[AdminEvents] Event deleted successfully: ${id}`);
    } catch (error) {
      console.error("[AdminEvents] Error deleting event:", error);
       let errorMessage = "Failed to delete event.";
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
          errorMessage = "Cannot delete. You appear to be offline.";
           setIsOffline(true); // Indicate offline during delete
        }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
       console.log("[AdminEvents] Delete operation finished.");
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button onClick={() => handleOpenModal()} disabled={isOffline}>
          <PlusCircle className="mr-2 h-4 w-4" /> {isOffline ? "Offline" : "Add New Event"}
        </Button>
      </div>
      <p className="text-muted-foreground">Add, edit, or delete upcoming club events.</p>

      {/* Offline Warning */}
      {isOffline && (
         <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
             <WifiOff className="h-4 w-4"/>
             <AlertTitle>Offline Mode</AlertTitle>
             <AlertDescription>You are currently offline. Functionality may be limited (e.g., adding, saving, deleting).</AlertDescription>
         </Alert>
       )}

      {loading ? (
         <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Events...</span></div>
      ) : fetchError && !isOffline ? ( // Display destructive alert only for non-offline errors
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{fetchError}</AlertDescription>
         </Alert>
      ): fetchError && isOffline ? ( // Display warning for offline fetch error
           <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Network Error</AlertTitle>
             <AlertDescription>{fetchError}</AlertDescription>
           </Alert>
      ) : events.length === 0 && !loading ? ( // Show 'No events' only if not loading and no error
        <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
                No events found. Click Add New Event to create one.
            </CardContent>
        </Card>
      ) :(
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                 <div className="flex justify-between items-start">
                     <div>
                         <CardTitle>{event.name}</CardTitle>
                         {/* Format Timestamp to readable date string */}
                         <CardDescription>{event.date?.toDate ? event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date Missing'}</CardDescription>
                     </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenModal(event)} disabled={deletingId === event.id || isOffline}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                         {/* Delete Confirmation Dialog */}
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="icon" disabled={deletingId === event.id || isOffline}>
                                {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Delete</span>
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                               <AlertDialogDescription>
                                 This action cannot be undone. This will permanently delete the event "{event.name}".
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancel</AlertDialogCancel>
                               <AlertDialogAction onClick={() => handleDeleteEvent(event.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                 Yes, delete it
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
                      </div>
                 </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{event.description}</p>
                 {/* Display Image URL if available */}
                 {event.imageURL && (
                   <p className="text-xs text-muted-foreground mt-2 truncate">
                     Image: <a href={event.imageURL} target="_blank" rel="noopener noreferrer" className="hover:underline">{event.imageURL}</a>
                   </p>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
           className="sm:max-w-[525px]"
           aria-labelledby={dialogTitleId}
           aria-describedby={dialogDescriptionId}
        >
          {/* Added DialogHeader, DialogTitle, and DialogDescription */}
          <DialogHeader>
            <DialogTitle id={dialogTitleId}>{editEventId ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription id={dialogDescriptionId}>
              {editEventId ? 'Update the details for this event.' : 'Fill in the details for the new event.'} Use the AI tool for suggestions.
            </DialogDescription>
          </DialogHeader>
           {/* AI Suggestion Section */}
            <div className="space-y-2 p-4 border rounded-md bg-secondary/30">
               <Label htmlFor="ai-keywords" className="font-semibold flex items-center gap-1"><Wand2 className="w-4 h-4 text-accent" /> AI Suggestion Tool</Label>
                <div className="flex gap-2 items-center">
                    <Input
                        id="ai-keywords"
                        placeholder="Enter keywords (e.g., 'meteor shower viewing dark site')"
                        value={aiKeywords}
                        onChange={(e) => setAiKeywords(e.target.value)}
                        disabled={aiLoading || isOffline}
                    />
                    <Button type="button" onClick={handleSuggestDetails} disabled={!aiKeywords || aiLoading || isOffline} size="sm">
                        {aiLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
                         Suggest
                    </Button>
               </div>
                {aiError && (
                    <Alert variant="destructive" className="mt-2">
                         <AlertCircle className="h-4 w-4" />
                         <AlertTitle>AI Error</AlertTitle>
                         <AlertDescription>{aiError}</AlertDescription>
                    </Alert>
                )}
           </div>

          <form onSubmit={handleSaveEvent} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input id="name" name="name" value={currentEvent?.name || ''} onChange={handleInputChange} required disabled={saving || isOffline} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={currentEvent?.date || ''} onChange={handleInputChange} required disabled={saving || isOffline} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={currentEvent?.description || ''} onChange={handleInputChange} required rows={5} disabled={saving || isOffline} />
            </div>
             {/* Image URL Input */}
            <div className="space-y-2">
                <Label htmlFor="imageURL">Image URL (Optional)</Label>
                <Input
                    id="imageURL"
                    name="imageURL"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={currentEvent?.imageURL || ''}
                    onChange={handleInputChange}
                    disabled={saving || isOffline}
                />
                <p className="text-xs text-muted-foreground">Enter a direct link to an image for the event.</p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={handleCloseModal} disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving || isOffline}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : (editEventId ? 'Update Event' : 'Add Event')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
