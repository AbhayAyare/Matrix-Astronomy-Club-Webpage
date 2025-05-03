'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Loader2, PlusCircle, Edit, Trash2, Wand2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import { suggestEventDetails, SuggestEventDetailsInput, SuggestEventDetailsOutput } from '@/ai/flows/suggest-event-details'; // Import AI flow
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const EVENTS_COLLECTION = 'events';

interface Event {
  id: string;
  name: string;
  date: Timestamp; // Use Firestore Timestamp
  description: string;
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


  const eventsCollectionRef = collection(db, EVENTS_COLLECTION);

  // Fetch events on load
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const q = query(eventsCollectionRef, orderBy("date", "asc")); // Order by event date
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure date and createdAt are Timestamps
          date: doc.data().date as Timestamp,
          createdAt: doc.data().createdAt as Timestamp,
        })) as Event[];
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast({
          title: "Error",
          description: "Failed to load events.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
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
    } else {
      setEditEventId(null);
      setCurrentEvent({ name: '', date: '', description: '' }); // Reset form for new event
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!currentEvent) return;
    const { name, value } = e.target;
    setCurrentEvent({ ...currentEvent, [name]: value });
  };

   const handleSuggestDetails = async () => {
       if (!aiKeywords || !currentEvent) return;
       setAiLoading(true);
       setAiError(null);
       try {
           const input: SuggestEventDetailsInput = { keywords: aiKeywords };
           const result: SuggestEventDetailsOutput = await suggestEventDetails(input);
           setCurrentEvent({
             ...currentEvent,
             name: result.title,
             description: result.description,
           });
           toast({ title: "AI Suggestion", description: "Title and description populated." });
       } catch (error) {
           console.error("AI suggestion error:", error);
           setAiError("Failed to get AI suggestions. Please try again.");
           toast({ title: "AI Error", description: "Could not generate suggestions.", variant: "destructive" });
       } finally {
           setAiLoading(false);
       }
   };


  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !currentEvent.name || !currentEvent.date || !currentEvent.description) {
       toast({ title: "Missing Fields", description: "Please fill in all event details.", variant: "destructive" });
       return;
    }
    setSaving(true);

    // Convert date string back to Firestore Timestamp
    let eventDateTimestamp: Timestamp;
    try {
        // Important: Ensure the date string is treated as local time, not UTC, if that's the intent.
        // Adding time part prevents potential timezone issues where just 'yyyy-MM-dd' might shift the day.
        const dateWithTime = `${currentEvent.date}T12:00:00`; // Assume midday local time
        eventDateTimestamp = Timestamp.fromDate(new Date(dateWithTime));
    } catch (dateError) {
        console.error("Invalid date format:", dateError);
        toast({ title: "Invalid Date", description: "Please enter a valid date (YYYY-MM-DD).", variant: "destructive" });
        setSaving(false);
        return;
    }


    const eventData = {
      name: currentEvent.name,
      date: eventDateTimestamp,
      description: currentEvent.description,
    };

    try {
      if (editEventId) {
        // Update existing event
        const eventDocRef = doc(db, EVENTS_COLLECTION, editEventId);
        await updateDoc(eventDocRef, eventData);
        setEvents(events.map(ev => ev.id === editEventId ? { ...ev, ...eventData, date: eventDateTimestamp } : ev));
        toast({ title: "Success", description: "Event updated successfully." });
      } else {
        // Add new event
        const docRef = await addDoc(eventsCollectionRef, { ...eventData, createdAt: serverTimestamp() });
         // Fetch the newly added doc to get server timestamp correctly if needed, or approximate locally
         const newEvent: Event = {
            id: docRef.id,
            ...eventData,
            date: eventDateTimestamp,
            createdAt: Timestamp.now() // Use local timestamp as approximation until refetch
         };
        setEvents([...events, newEvent].sort((a, b) => a.date.toMillis() - b.date.toMillis())); // Keep sorted
        toast({ title: "Success", description: "Event added successfully." });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: `Failed to ${editEventId ? 'update' : 'add'} event.`,
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
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Event Management</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
        </Button>
      </div>
      <p className="text-muted-foreground">Add, edit, or delete upcoming club events.</p>

      {loading ? (
         <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Events...</span></div>
      ) : events.length === 0 ? (
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
                         <CardDescription>{event.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                     </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleOpenModal(event)} disabled={deletingId === event.id}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteEvent(event.id)} disabled={deletingId === event.id}>
                          {deletingId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                           <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                 </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{event.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editEventId ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
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
                        disabled={aiLoading}
                    />
                    <Button type="button" onClick={handleSuggestDetails} disabled={!aiKeywords || aiLoading} size="sm">
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
              <Input id="name" name="name" value={currentEvent?.name || ''} onChange={handleInputChange} required disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={currentEvent?.date || ''} onChange={handleInputChange} required disabled={saving} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={currentEvent?.description || ''} onChange={handleInputChange} required rows={5} disabled={saving} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={handleCloseModal} disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
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
