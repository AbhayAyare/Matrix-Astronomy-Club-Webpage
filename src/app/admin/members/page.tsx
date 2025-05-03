'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from '@/context/firebase-provider';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Loader2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  const membersCollectionRef = collection(db, MEMBERS_COLLECTION);

  // Fetch members on load
  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
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
          // Check if the error is due to missing 'joinedAt' index
          if ((error as any).code === 'failed-precondition') {
              toast({
                  title: "Firestore Index Required",
                  description: "A Firestore index on 'members' collection by 'joinedAt' descending is needed. Please create it in the Firebase console.",
                  variant: "destructive",
                  duration: 10000, // Show longer
              });
           } else {
                toast({
                  title: "Error",
                  description: "Failed to load registered members.",
                  variant: "destructive",
                });
           }
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]); // Add membersCollectionRef if needed, but it's stable

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Member Management</h1>
      <p className="text-muted-foreground">View the list of registered club members (read-only).</p>

      <Card>
        <CardHeader>
          <CardTitle>Registered Members</CardTitle>
           <CardDescription>Total Members: {members.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading Members...</span></div>
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
                {members.length === 0 ? (
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
