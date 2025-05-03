'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Users, CalendarCheck, BarChart, Settings, CalendarClock, Image as ImageIcon, Newspaper, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-provider";
import { useFirebase } from '@/context/firebase-provider';
import { collection, getDocs } from 'firebase/firestore';
import { listAll } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Collections and Storage Folders
const MEMBERS_COLLECTION = 'members';
const EVENTS_COLLECTION = 'events';
const NEWSLETTER_COLLECTION = 'newsletterSubscribers';
const GALLERY_FOLDER = 'gallery';
const CONTENT_COLLECTION = 'config';
const CONTENT_DOC_ID = 'siteContent';

export default function AdminDashboardPage() {
   const { user } = useAuth();
   const { db, storage } = useFirebase();
   const [stats, setStats] = useState({
     memberCount: 0,
     eventCount: 0,
     galleryImageCount: 0,
     subscriberCount: 0,
   });
   const [loadingStats, setLoadingStats] = useState(true);

   useEffect(() => {
     const fetchStats = async () => {
       setLoadingStats(true);
       try {
         const memberSnap = await getDocs(collection(db, MEMBERS_COLLECTION));
         const eventSnap = await getDocs(collection(db, EVENTS_COLLECTION));
         const subscriberSnap = await getDocs(collection(db, NEWSLETTER_COLLECTION));
         const galleryListRef = ref(storage, GALLERY_FOLDER);
         const galleryRes = await listAll(galleryListRef);

         setStats({
           memberCount: memberSnap.size,
           eventCount: eventSnap.size,
           galleryImageCount: galleryRes.items.length,
           subscriberCount: subscriberSnap.size,
         });
       } catch (error) {
         console.error("Error fetching dashboard stats:", error);
         // Handle error display if needed
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
        <p className="text-muted-foreground">Welcome back, {user?.email || 'Admin'}! Overview of your site.</p>
      </div>


      {/* Analytics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><BarChart className="w-6 h-6 text-accent"/> Site Statistics</h2>
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
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
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
            <Card className="hover:shadow-md transition-shadow">
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
             <Card className="hover:shadow-md transition-shadow">
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
             <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ImageIcon className="w-5 h-5 text-primary"/> Gallery</CardTitle>
                    <CardDescription>Upload or remove gallery images.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild variant="outline" size="sm">
                       <Link href="/admin/gallery">Manage Gallery <ArrowRight className="ml-2 h-4 w-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-md transition-shadow">
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
             <Card className="hover:shadow-md transition-shadow">
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