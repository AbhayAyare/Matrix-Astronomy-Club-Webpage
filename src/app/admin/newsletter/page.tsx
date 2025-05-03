'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, getDocs, doc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, Trash2, Mail } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const NEWSLETTER_COLLECTION = 'newsletterSubscribers';

interface Subscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp; // Assume a timestamp field exists
}

export default function AdminNewsletterPage() {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const subscribersCollectionRef = collection(db, NEWSLETTER_COLLECTION);

  // Fetch subscribers on load
  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      try {
        // Assuming subscribers have a 'subscribedAt' field for ordering
        const q = query(subscribersCollectionRef, orderBy("subscribedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedSubscribers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
           subscribedAt: doc.data().subscribedAt as Timestamp, // Ensure correct type
        })) as Subscriber[];
        setSubscribers(fetchedSubscribers);
      } catch (error) {
         console.error("Error fetching subscribers:", error);
           // Check if the error is due to missing index
           if ((error as any).code === 'failed-precondition') {
               toast({
                   title: "Firestore Index Required",
                   description: "A Firestore index on 'newsletterSubscribers' by 'subscribedAt' descending is needed. Please create it in Firebase.",
                   variant: "destructive",
                   duration: 10000,
               });
           } else {
              toast({
                title: "Error",
                description: "Failed to load newsletter subscribers.",
                variant: "destructive",
              });
           }
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Add subscribersCollectionRef if needed, but it's stable

  const handleDeleteSubscriber = async (id: string) => {
    setDeletingId(id);
    try {
      const subscriberDocRef = doc(db, NEWSLETTER_COLLECTION, id);
      await deleteDoc(subscriberDocRef);
      setSubscribers(subscribers.filter(sub => sub.id !== id));
      toast({ title: "Success", description: "Subscriber removed successfully." });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      toast({
        title: "Error",
        description: "Failed to remove subscriber.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

   // Unique IDs for Alert Dialog Title and Description
   const alertDialogTitleId = "remove-subscriber-dialog-title";
   const alertDialogDescriptionId = "remove-subscriber-dialog-description";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
      <p className="text-muted-foreground">View and manage the list of newsletter subscribers.</p>

      <Card>
        <CardHeader>
          <CardTitle>Subscriber List</CardTitle>
          <CardDescription>Total Subscribers: {subscribers.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Subscribers...</span></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Subscription Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No subscribers found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  subscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground"/>
                        {subscriber.email}
                        </TableCell>
                      <TableCell>
                         {subscriber.subscribedAt ? subscriber.subscribedAt.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="destructive" size="sm" disabled={deletingId === subscriber.id}>
                              {deletingId === subscriber.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                               Remove
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent
                             aria-labelledby={alertDialogTitleId}
                             aria-describedby={alertDialogDescriptionId}
                          >
                            <AlertDialogHeader>
                              <AlertDialogTitle id={alertDialogTitleId}>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription id={alertDialogDescriptionId}>
                                This action will permanently remove the subscriber
                                <span className="font-medium"> {subscriber.email} </span>
                                from the newsletter list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSubscriber(subscriber.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Yes, remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
