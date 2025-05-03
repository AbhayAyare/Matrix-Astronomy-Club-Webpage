'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup, // Restore group import
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-provider"; // Restore auth hook
import { LogOut, User, Settings } from "lucide-react"; // Restore icons
import { useRouter } from 'next/navigation'; // Restore router

export function UserNav() {
  const { user, logout, loading } = useAuth(); // Use auth state again
  const router = useRouter();

  const handleLogout = async () => { // Restore logout handler
    try {
      await logout();
      router.push('/admin/login'); // Redirect after logout
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show a toast notification for logout failure
    }
  };

   if (loading) { // Restore loading state check
    return <Button variant="ghost" size="icon" disabled><User className="h-5 w-5 animate-pulse" /></Button>; // Add pulse animation
   }

   if (!user) { // Restore user check
     // This ideally shouldn't be reached if ProtectedRoute works correctly,
     // but it's good practice to handle it.
     // Maybe redirect or show nothing.
     return null;
   }


  const getInitials = (email?: string | null) => {
     if (!email) return 'AD';
     const nameParts = email.split('@')[0];
     // Simple initials from email prefix, enhance if name is available
     return nameParts.substring(0, 2).toUpperCase();
   };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Display user info */}
        <Button variant="ghost" className="relative h-8 w-full justify-start px-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0">
           <Avatar className="h-6 w-6 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
            {/* Placeholder for user avatar image if available */}
            {/* <AvatarImage src={user.photoURL || undefined} alt={user.email || 'User'} /> */}
            <AvatarFallback className="text-xs">{getInitials(user.email)}</AvatarFallback>
          </Avatar>
          <span className="ml-2 text-sm font-medium truncate group-data-[collapsible=icon]:hidden">{user.email || 'Admin'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || user.email || 'Admin'}</p>
             {/* Show dynamic email */}
            <p className="text-xs leading-none text-muted-foreground">
               {user.email || 'Administrator Access'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
          <DropdownMenuItem disabled> {/* Keep profile disabled for now */}
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
           <DropdownMenuItem disabled> {/* Keep settings disabled */}
             <Settings className="mr-2 h-4 w-4" />
             <span>Settings</span>
           </DropdownMenuItem>
         </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Restore Logout option */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
