'use client';

import { ReactNode, useEffect } from 'react'; // Import useEffect
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { AuthProvider, useAuth } from '@/context/auth-provider';
import { useRouter } from 'next/navigation'; // Import useRouter
import Link from 'next/link';
import { LayoutDashboard, Settings, CalendarClock, Users, Newspaper, Image as ImageIcon } from 'lucide-react';
import { UserNav } from '@/components/admin/user-nav';
import { Loader2 } from 'lucide-react';


// Component to protect routes
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter(); // Get router instance

  useEffect(() => {
    // Redirect logic inside useEffect, runs only on the client after hydration
    // and when dependencies change.
    // If loading is finished and there's no user, redirect to login.
    if (!loading && !user) {
      // console.log("ProtectedRoute: Not loading, no user. Redirecting to /admin/login");
      router.push('/admin/login');
    }
    // No need for an else block here, rendering is handled below
  }, [user, loading, router]); // Dependencies for the effect


  if (loading) {
    // While checking auth state, show a loading indicator
    // console.log("ProtectedRoute: Rendering loading state");
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  // If loading is finished:
  if (!user) {
    // If there's no user, the useEffect above should be triggering a redirect.
    // Show a message indicating redirection is happening.
    // console.log("ProtectedRoute: Loading false, user null. Showing redirect message...");
     return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <span className="ml-2">Redirecting to login...</span>
        </div>
     ); // Or return null, but a message is slightly better UX
  }

  // If loading is finished and user exists, render the protected content
  // console.log("ProtectedRoute: Rendering children for user:", user.email);
  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  // AuthProvider needs to be inside a client component context.
  // By adding 'use client' at the top, this entire layout becomes a client component.
  return (
    <AuthProvider>
      <ProtectedRoute>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader className="items-center justify-between p-4">
              <Link href="/" className="font-semibold text-lg text-sidebar-foreground">Matrix Admin</Link>
              {/* Removed the default trigger from header */}
            </SidebarHeader>
            <SidebarContent className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <Link href="/admin"><LayoutDashboard /><span>Dashboard</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Content Settings">
                    <Link href="/admin/content"><Settings /><span>Content</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Events">
                    <Link href="/admin/events"><CalendarClock /><span>Events</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Gallery">
                    <Link href="/admin/gallery"><ImageIcon /><span>Gallery</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Members">
                    <Link href="/admin/members"><Users /><span>Members</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Newsletter">
                    <Link href="/admin/newsletter"><Newspaper /><span>Newsletter</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
             <SidebarFooter className="p-2 mt-auto">
               <UserNav />
             </SidebarFooter>
          </Sidebar>
          <SidebarInset>
              <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <SidebarTrigger className="sm:hidden" /> {/* Trigger only visible on mobile */}
                <div className="ml-auto">
                   {/* Placeholder for potential header elements like search or notifications */}
                </div>
              </header>
            <main className="p-4 md:p-6 flex-1">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
