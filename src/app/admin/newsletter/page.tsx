
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, getDocs, doc, deleteDoc, query, orderBy, Timestamp, FirestoreError } from 'firebase/firestore';
import { Loader2, Trash2, Mail, WifiOff } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false); // Track offline state

  // Return early if db is null or undefined
  if (!db) {
    return <div>Error: Firestore not initialized.</div>;
  }

  // Fetch subscribers on load
  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      setFetchError(null); // Reset error on fetch
      setIsOffline(false); // Reset offline state

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
         let errorMessage = "Failed to load newsletter subscribers.";
         if (error instanceof FirestoreError) {
             if (error.code === 'failed-precondition') {
                 errorMessage = "A Firestore index on 'newsletterSubscribers' by 'subscribedAt' descending is needed. Please create it in Firebase.";
                 setFetchError(errorMessage); // Set specific error for UI if needed
                 toast({
                     title: "Firestore Index Required",
                     description: errorMessage,
                     variant: "destructive",
                     duration: 10000,
                 });
             } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                 errorMessage = "Cannot load subscribers. You appear to be offline. Please check your internet connection.";
                 setFetchError(errorMessage);
                 setIsOffline(true); // Set offline state
                 toast({
                     title: "Network Error",
                     description: errorMessage,
                     variant: "destructive",
                 });
             } else {
                 setFetchError(errorMessage); // Set generic error message
                 toast({
                     title: "Error",
                     description: errorMessage,
                     variant: "destructive",
                 });
             }
         } else {
              setFetchError(errorMessage); // Set generic error message
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
    fetchSubscribers();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Rerun if db instance changes

  const handleDeleteSubscriber = async (id: string) => {
    setDeletingId(id);
    try {
      // Check if db is available
      if (!db) {
        throw new Error("Firestore not initialized.");
      }
      const subscriberDocRef = doc(db, NEWSLETTER_COLLECTION, id);
      await deleteDoc(subscriberDocRef);
      setSubscribers(subscribers.filter(sub => sub.id !== id));
      toast({ title: "Success", description: "Subscriber removed successfully." });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
       let errorMessage = "Failed to remove subscriber.";
       if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes('offline'))) {
          errorMessage = "Cannot remove subscriber. You appear to be offline.";
          setIsOffline(true); // Indicate offline during delete
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

   // Function to generate unique IDs for Alert Dialog Title and Description
   const getDialogTitleId = (subscriberId: string) => `remove-subscriber-dialog-title-${subscriberId}`;
   const getDialogDescriptionId = (subscriberId: string) => `remove-subscriber-dialog-description-${subscriberId}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
      <p className="text-muted-foreground">View and manage the list of newsletter subscribers.</p>

       {/* Offline Warning */}
       {isOffline && (
          <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
              <WifiOff className="h-4 w-4"/>
              <AlertTitle>Offline Mode</AlertTitle>
              <AlertDescription>You are currently offline. Subscriber list may be outdated, and removal is disabled.</AlertDescription>
          </Alert>
        )}

      <Card>
        <CardHeader>
          <CardTitle>Subscriber List</CardTitle>
          <CardDescription>Total Subscribers: {loading || (fetchError && !isOffline) ? '...' : subscribers.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Subscribers...</span></div>
          ) : fetchError && !isOffline ? ( // Show destructive alert only for non-offline fetch errors
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{fetchError}</AlertDescription>
             </Alert>
            ): fetchError && isOffline ? ( // Show warning for offline fetch error
              <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Network Error</AlertTitle>
                <AlertDescription>{fetchError}</AlertDescription>
              </Alert>
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
                {subscribers.length === 0 && !loading ? ( // Show 'No subscribers' only if not loading and no error
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No subscribers found yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  subscribers.map((subscriber) => {
                    const titleId = getDialogTitleId(subscriber.id);
                    const descriptionId = getDialogDescriptionId(subscriber.id);
                    return (
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
                              <Button variant="destructive" size="sm" disabled={deletingId === subscriber.id || isOffline}>
                                {deletingId === subscriber.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1 h-4 w-4" />}
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              aria-labelledby={titleId} // Use dynamic ID
                              aria-describedby={descriptionId} // Use dynamic ID
                            >
                              {/* Added AlertDialogHeader */}
                              <AlertDialogHeader>
                                <AlertDialogTitle id={titleId}>Are you sure?</AlertDialogTitle> {/* Add ID */}
                                <AlertDialogDescription id={descriptionId}> {/* Add ID */}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
