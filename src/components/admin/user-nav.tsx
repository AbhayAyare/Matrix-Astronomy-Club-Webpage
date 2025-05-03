'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, // Removed unused imports: DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { useAuth } from "@/context/auth-provider"; // No longer needed
// import { LogOut, User } from "lucide-react"; // Removed LogOut, User
import { User } from "lucide-react"; // Keep User icon for placeholder if needed
// import { useRouter } from 'next/navigation'; // No longer needed

export function UserNav() {
  // const { user, logout, loading } = useAuth(); // Removed auth state
  // const router = useRouter(); // Removed router

  // const handleLogout = async () => { // Removed logout handler
  //   try {
  //     await logout();
  //     router.push('/admin/login'); // Redirect after logout
  //   } catch (error) {
  //     console.error("Logout failed:", error);
  //     // Optionally show a toast notification for logout failure
  //   }
  // };

   // if (loading) { // Removed loading state check
   //  return <Button variant="ghost" size="icon" disabled><User className="h-5 w-5" /></Button>;
   // }

   // if (!user) { // No user check needed
   //   return null; // Or a login button if needed in this specific context
   // }


  const getInitials = () => {
    // Generic admin initials since there's no logged-in user
    return 'AD';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Display generic Admin info */}
        <Button variant="ghost" className="relative h-8 w-full justify-start px-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0">
           <Avatar className="h-6 w-6 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
            {/* Placeholder for user avatar image if available */}
            {/* <AvatarImage src="/avatars/001.png" alt={'Admin'} /> */}
            <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
          </Avatar>
          <span className="ml-2 text-sm font-medium truncate group-data-[collapsible=icon]:hidden">Admin</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Admin</p>
             {/* Removed dynamic email */}
            <p className="text-xs leading-none text-muted-foreground">
               Administrator Access
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          Add other items like Settings if needed
        </DropdownMenuGroup>
        <DropdownMenuSeparator /> */}
        {/* Removed Logout option */}
        {/* <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem> */}
         <DropdownMenuItem disabled>
            {/* Placeholder or remove if no actions needed */}
             Logged in as Admin
         </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
