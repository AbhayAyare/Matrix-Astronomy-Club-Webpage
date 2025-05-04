'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/auth-provider'; // Import AuthProvider
import ProtectedRoute from '@/components/layout/protected-route'; // Import ProtectedRoute
import { LayoutDashboard, Settings, CalendarClock, Image as ImageIcon, Users, Newspaper, HelpCircle, Home } from 'lucide-react'; // Added Home icon
import { UserNav } from '@/components/admin/user-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

// Internal layout component that assumes authentication has been handled
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

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
        <SidebarProvider defaultOpen> {/* Ensures sidebar is open by default on desktop */}
             <Sidebar side="left" variant="inset" collapsible="icon" className="border-sidebar-border"> {/* Use inset variant and allow icon collapse */}
                 <SidebarHeader className="items-center justify-between p-2">
                    {/* Title appears when expanded */}
                    <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                        Admin Panel
                    </h2>
                    {/* Sidebar Trigger is automatically handled by SidebarProvider/SidebarRail */}
                 </SidebarHeader>
                 <SidebarContent className="p-2 flex flex-col justify-between"> {/* Add padding and flex for structure */}
                     {/* Main navigation */}
                     <SidebarMenu>
                         {navItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.href)} // Highlight active link
                                    tooltip={{ children: item.label }} // Show tooltip when collapsed
                                >
                                    <Link href={item.href}>
                                        <item.icon /> {/* Icon always visible */}
                                        <span>{item.label}</span> {/* Label hides when collapsed */}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                         ))}
                     </SidebarMenu>
                     {/* Bottom navigation group */}
                     <SidebarMenu className="mt-auto"> {/* Pushes this menu to the bottom */}
                          <SidebarMenuItem>
                             <SidebarMenuButton asChild tooltip={{ children: 'Go to Homepage' }}>
                                <Link href="/"> {/* Link to homepage */}
                                     <Home /> {/* Home icon */}
                                     <span>Homepage</span>
                                </Link>
                             </SidebarMenuButton>
                         </SidebarMenuItem>
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
                 <SidebarSeparator /> {/* Separator before the footer */}
                 <SidebarFooter className="p-2">
                    <UserNav /> {/* UserNav already adapted for collapsible */}
                 </SidebarFooter>
                 <SidebarRail /> {/* Add the rail for resizing/toggling */}
            </Sidebar>

            {/* Main content area adjusts based on sidebar state */}
            <SidebarInset className="p-4 md:p-6 lg:p-8 overflow-auto">
                 {children}
            </SidebarInset>
        </SidebarProvider>
  );
}


// Main export: Wraps the layout content with Auth and Protection
export default function AdminLayout({ children }: { children: React.ReactNode }) {
   return (
     <AuthProvider>
        <ProtectedRoute>
           <AdminLayoutContent>{children}</AdminLayoutContent>
        </ProtectedRoute>
     </AuthProvider>
   );
}
