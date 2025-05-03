
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Users, CalendarCheck, BarChart, Settings, CalendarClock, Image as ImageIconProp, Newspaper, ArrowRight, WifiOff } from "lucide-react"; // Renamed Image to avoid conflict
import { useFirebase } from '@/context/firebase-provider';
import { collection, getDocs, doc, getDoc, FirestoreError } from 'firebase/firestore'; // Added FirestoreError
import { ref, listAll, StorageError } from 'firebase/storage'; // Added ref, StorageError
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components
import { AlertCircle } from 'lucide-react'; // Added AlertCircle icon

// Collections and Storage Folders
const MEMBERS_COLLECTION = 'members';
const EVENTS_COLLECTION = 'events';
const NEWSLETTER_COLLECTION = 'newsletterSubscribers';
const GALLERY_FOLDER = 'gallery';
const CONTENT_COLLECTION = 'config';
const CONTENT_DOC_ID = 'siteContent';

export default function AdminDashboardPage() {
   const { db, storage } = useFirebase();
   const [stats, setStats] = useState({
     memberCount: 0,
     eventCount: 0,
     galleryImageCount: 0,
     subscriberCount: 0,
   });
   const [loadingStats, setLoadingStats] = useState(true);
   const [statsError, setStatsError] = useState<string | null>(null); // State for error message


   useEffect(() => {
     const fetchStats = async () => {
       setLoadingStats(true);
       setStatsError(null); // Reset error on fetch
       try {
         const membersCollectionRef = collection(db, MEMBERS_COLLECTION);
         const eventsCollectionRef = collection(db, EVENTS_COLLECTION);
         const newsletterCollectionRef = collection(db, NEWSLETTER_COLLECTION);

         // Use Promise.allSettled to fetch all stats even if some fail
         const results = await Promise.allSettled([
             getDocs(membersCollectionRef),
             getDocs(eventsCollectionRef),
             getDocs(newsletterCollectionRef),
             listAll(ref(storage, GALLERY_FOLDER))
         ]);

         let memberCount = 0;
         let eventCount = 0;
         let subscriberCount = 0;
         let galleryImageCount = 0;
         let encounteredError = false;

         if (results[0].status === 'fulfilled') memberCount = results[0].value.size; else encounteredError = true;
         if (results[1].status === 'fulfilled') eventCount = results[1].value.size; else encounteredError = true;
         if (results[2].status === 'fulfilled') subscriberCount = results[2].value.size; else encounteredError = true;
         if (results[3].status === 'fulfilled') galleryImageCount = results[3].value.items.length; else encounteredError = true;


         setStats({ memberCount, eventCount, galleryImageCount, subscriberCount });

         // Check for specific offline errors if any promise was rejected
         if (encounteredError) {
             const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason);
             const offlineError = errors.some(err =>
                 (err instanceof FirestoreError && (err.code === 'unavailable' || err.message.includes('offline'))) ||
                 (err instanceof StorageError && (err.code === 'storage/retry-limit-exceeded' || err.code.includes('offline')))
             );
             if (offlineError) {
                  setStatsError("Cannot load all stats. You appear to be offline. Some data may be outdated.");
             } else {
                  console.error("Error fetching dashboard stats:", errors); // Log other errors
                  setStatsError("Failed to load some site statistics."); // Generic error for other issues
             }
         }

       } catch (error) {
         // Catch any unexpected top-level error during setup
         console.error("Unexpected error fetching dashboard stats:", error);
         setStatsError("An unexpected error occurred while loading statistics.");
       } finally {
         setLoadingStats(false);
       }
     };

     fetchStats();
   }, [db, storage]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {/* Updated welcome message */}
        <p className="text-muted-foreground">Welcome, Admin! Overview of your site.</p>
      </div>


      {/* Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><BarChart className="w-6 h-6 text-accent"/> Site Statistics</h2>
        {statsError && ( // Display error message if present
             <Alert variant="destructive" className="mb-4">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Data Loading Issue</AlertTitle>
               <AlertDescription>{statsError}</AlertDescription>
             </Alert>
          )}
        {loadingStats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {[...Array(4)].map((_, i) => (
               <Card key={i}>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 </CardContent>
               </Card>
             ))}
           </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.memberCount}</div>
                <p className="text-xs text-muted-foreground">Registered members</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.eventCount}</div>
                <p className="text-xs text-muted-foreground">Scheduled events</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gallery Images</CardTitle>
                <ImageIconProp className="h-4 w-4 text-muted-foreground" /> {/* Use renamed import */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.galleryImageCount}</div>
                <p className="text-xs text-muted-foreground">Images in gallery</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Newsletter Subs</CardTitle>
                 <Newspaper className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.subscriberCount}</div>
                <p className="text-xs text-muted-foreground">Active subscribers</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Quick Actions / Management Links Section */}
      <section>
         <h2 className="text-2xl font-semibold mb-4">Manage Site</h2>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Settings className="w-5 h-5 text-primary"/> Website Content</CardTitle>
                    <CardDescription>Edit About Us and Contact Info.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" size="sm">
                       <Link href="/admin/content">Edit Content <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="w-5 h-5 text-primary"/> Events</CardTitle>
                    <CardDescription>Add, edit, or delete club events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" size="sm">
                       <Link href="/admin/events">Manage Events <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ImageIconProp className="w-5 h-5 text-primary"/> Gallery</CardTitle> {/* Use renamed import */}
                    <CardDescription>Upload or remove gallery images.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" size="sm">
                       <Link href="/admin/gallery">Manage Gallery <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Users className="w-5 h-5 text-primary"/> Members</CardTitle>
                    <CardDescription>View registered club members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" size="sm">
                       <Link href="/admin/members">View Members <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Newspaper className="w-5 h-5 text-primary"/> Newsletter</CardTitle>
                    <CardDescription>Manage newsletter subscribers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" size="sm">
                       <Link href="/admin/newsletter">Manage Subscribers <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             {/* Placeholder for future sections */}
             <Card className="bg-secondary/30 border-dashed flex flex-col justify-center items-center">
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">More management sections coming soon...</p>
                </CardContent>
            </Card>
         </div>
       </section>
    </div>
  );
}

    