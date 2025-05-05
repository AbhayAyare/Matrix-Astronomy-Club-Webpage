'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, getDocs, query, orderBy, Timestamp, FirestoreError } from 'firebase/firestore';
import { Loader2, User, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

const MEMBERS_COLLECTION = 'members'; // Firestore collection for members

interface Member {
  id: string;
  name: string;
  email: string;
  interest?: string; // Optional field from the form
  joinedAt: Timestamp; // Assume a timestamp field exists
}

export default function AdminMembersPage() {
  const { db } = useFirebase();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false); // Track offline state

  // Add a check for db being null before creating the collection reference
  let membersCollectionRef;
  if (db) {
    membersCollectionRef = collection(db, MEMBERS_COLLECTION);
  } else {
    // Handle the case where db is null (e.g., Firebase not initialized)
    console.error("Firestore database not available.");
  }

  // Fetch members on load
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setFetchError(null); // Reset error on fetch
      setIsOffline(false); // Reset offline state
      try {
        // Assuming members have a 'joinedAt' field for ordering
        const q = query(membersCollectionRef, orderBy("joinedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedMembers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
           joinedAt: doc.data().joinedAt as Timestamp, // Ensure correct type
        })) as Member[];
        setMembers(fetchedMembers);
      } catch (error) {
         console.error("Error fetching members:", error);
         let errorMessage = "Failed to load registered members.";
          // Check if the error is due to missing 'joinedAt' index
          if (error instanceof FirestoreError) {
             if (error.code === 'failed-precondition') {
                 errorMessage = "A Firestore index on 'members' collection by 'joinedAt' descending is needed. Please create it in the Firebase console.";
                 setFetchError(errorMessage); // Set specific error for UI if needed
                 toast({
                     title: "Firestore Index Required",
                     description: errorMessage,
                     variant: "destructive",
                     duration: 10000, // Show longer
                 });
             } else if (error.code === 'unavailable' || error.message.includes('offline')) {
                 errorMessage = "Cannot load members. You appear to be offline. Please check your internet connection.";
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
    fetchMembers();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Rerun if db instance changes

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Member Management</h1>
      <p className="text-muted-foreground">View the list of registered club members (read-only).</p>

      {/* Offline Warning */}
       {isOffline && (
          <Alert variant="default" className="border-yellow-500 text-yellow-700 dark:border-yellow-600 dark:text-yellow-300 [&>svg]:text-yellow-500 dark:[&>svg]:text-yellow-400">
              <WifiOff className="h-4 w-4"/>
              <AlertTitle>Offline Mode</AlertTitle>
              <AlertDescription>You are currently offline. Member list may be outdated.</AlertDescription>
          </Alert>
        )}

      <Card>
        <CardHeader>
          <CardTitle>Registered Members</CardTitle>
           <CardDescription>Total Members: {loading || (fetchError && !isOffline) ? '...' : members.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Members...</span></div>
           ) : fetchError && !isOffline ? ( // Show destructive alert only for non-offline errors
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Interest / Notes</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 && !loading ? ( // Show 'No members' only if not loading and no error
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{member.interest || 'N/A'}</TableCell>
                      <TableCell>
                        {member.joinedAt ? member.joinedAt.toDate().toLocaleDateString() : 'N/A'}
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
