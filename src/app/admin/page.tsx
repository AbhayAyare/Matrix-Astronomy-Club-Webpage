'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarCheck, BarChart } from "lucide-react";
import { useAuth } from "@/context/auth-provider"; // Assuming auth context setup

// Placeholder data - replace with Firebase fetching
const memberCount = 150; // Example: Fetch from Firestore
const eventRegistrations = 45; // Example: Fetch from Firestore aggregate or count

export default function AdminDashboardPage() {
   const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
       <p className="text-muted-foreground">Welcome back, {user?.email || 'Admin'}!</p>

      {/* Analytics Section - Placeholder */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><BarChart className="w-6 h-6 text-accent"/> Analytics Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memberCount}</div>
              <p className="text-xs text-muted-foreground">Current registered members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Event Registrations (Total)</CardTitle>
               <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventRegistrations}</div>
              <p className="text-xs text-muted-foreground">Across all upcoming events</p>
            </CardContent>
          </Card>
           {/* Add more analytics cards as needed */}
           <Card className="bg-secondary/30 border-dashed">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">More Analytics</CardTitle>
               {/* Optional Icon */}
             </CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground">Future analytics display area (e.g., website visits).</p>
             </CardContent>
           </Card>
        </div>
      </section>

      {/* Quick Actions or Overview Section - Placeholder */}
      <section>
         <h2 className="text-2xl font-semibold mb-4">Quick Links</h2>
         <Card>
           <CardContent className="p-6">
             <p className="text-muted-foreground">Use the sidebar navigation to manage content, events, members, and more.</p>
             {/* Potentially add quick action buttons here */}
           </CardContent>
         </Card>
       </section>

    </div>
  );
}
