'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from "@/context/auth-provider";
import { Loader2, LogOut, LayoutDashboard, Settings, CalendarClock, Image as ImageIcon, Users, Newspaper, HelpCircle, PanelLeft } from 'lucide-react';
import { UserNav } from '@/components/admin/user-nav';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'; // Import Sidebar components

// Higher-Order Component for route protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

   useEffect(() => {
     // console.log("ProtectedRoute Effect: loading =", loading, "user =", !!user);
     if (!loading && !user && pathname !== '/admin/login') {
        // console.log("ProtectedRoute: Not loading, no user, not on login page. Redirecting to /admin/login");
       router.replace('/admin/login'); // Use replace to avoid adding current page to history
     }
   }, [user, loading, router, pathname]); // Add pathname to dependencies

   // If loading, show a loading indicator
   if (loading) {
    // console.log("ProtectedRoute: Auth loading, showing loading indicator.");
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
             <div className="flex items-center space-x-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-lg text-muted-foreground">Verifying access...</span>
            </div>
        </div>
    );
   }

   // If not loading and no user, and already on login page, render null or children (login page content)
   if (!user && pathname === '/admin/login') {
      // console.log("ProtectedRoute: No user, on login page. Rendering children (Login page).");
     return <>{children}</>; // Render the login page content
   }

   // If not loading and user exists, render the protected content
   if (!loading && user) {
      // console.log("ProtectedRoute: User authenticated. Rendering protected children.");
     return <>{children}</>;
   }

   // Fallback (should ideally not be reached due to redirects)
   // console.log("ProtectedRoute: Fallback - Returning null.");
   return null;
};


// Admin Layout Component (now assumes authentication is handled by ProtectedRoute)
function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

     // Don't render sidebar/header on the login page itself
     if (pathname === '/admin/login') {
         return <>{children}</>;
     }

     const navItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/content', label: 'Website Content', icon: Settings },
        { href: '/admin/events', label: 'Events', icon: CalendarClock },
        { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
        { href: '/admin/members', label: 'Members', icon: Users },
        { href: '/admin/newsletter', label: 'Newsletter', icon: Newspaper },
     ];

     // Determine active link
    const isActive = (href: string) => {
        // Exact match for dashboard, startsWith for others
        return href === '/admin' ? pathname === href : pathname.startsWith(href);
    };

  return (
     <ProtectedRoute>
        <SidebarProvider defaultOpen>
             <Sidebar side="left" variant="inset" collapsible="icon" className="border-sidebar-border">
                 <SidebarHeader className="items-center justify-between p-2">
                    <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                        Admin Panel
                    </h2>
                    {/* Sidebar Trigger remains, handled by SidebarProvider */}
                 </SidebarHeader>
                 <SidebarContent className="p-2 flex flex-col justify-between">
                     <SidebarMenu>
                         {navItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.href)}
                                    tooltip={{ children: item.label }}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         ))}
                     </SidebarMenu>
                     {/* Help Link (Optional) */}
                     <SidebarMenu className="mt-auto">
                         <SidebarMenuItem>
                             <SidebarMenuButton asChild tooltip={{ children: 'Help / Support' }}>
                                <Link href="/admin/support"> {/* Example link */}
                                     <HelpCircle />
                                     <span>Help</span>
                                </Link>
                             </SidebarMenuButton>
                         </SidebarMenuItem>
                     </SidebarMenu>
                 </SidebarContent>
                 <SidebarSeparator />
                 <SidebarFooter className="p-2">
                    <UserNav /> {/* UserNav already adapted for collapsible */}
                 </SidebarFooter>
                 <SidebarRail /> {/* Add the rail for resizing/toggling */}
            </Sidebar>

            <SidebarInset className="p-4 md:p-6 lg:p-8 overflow-auto">
                 {/* Main content area */}
                 {children}
            </SidebarInset>
        </SidebarProvider>
     </ProtectedRoute>
  );
}


// Default export remains the layout component
export default AdminLayout;
