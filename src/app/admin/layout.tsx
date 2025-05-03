'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useAuth } from "@/context/auth-provider"; // No longer needed for protection
import { LayoutDashboard, Settings, CalendarClock, Image as ImageIcon, Users, Newspaper, HelpCircle } from 'lucide-react';
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
} from '@/components/ui/sidebar'; // Import Sidebar components


// Admin Layout Component - No longer protected
function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

     // No need for login page check, as it's removed/bypassed
     // if (pathname === '/admin/login') {
     //     return <>{children}</>;
     // }

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
     // Removed ProtectedRoute wrapper
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
     // Removed ProtectedRoute wrapper
  );
}


// Default export remains the layout component
export default AdminLayout;
