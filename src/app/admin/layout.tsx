import { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { AuthProvider, useAuth } from '@/context/auth-provider'; // Assuming auth context setup
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Settings, CalendarClock, Users, Newspaper, Image as ImageIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/admin/user-nav'; // Placeholder for user dropdown


// Component to protect routes
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>; // Or a spinner
  }

  if (!user) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}


export default function AdminLayout({ children }: { children: ReactNode }) {
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
               {/* Add UserNav/Logout here if needed, or keep it simple */}
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
