'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-provider";
import { LogOut, User } from "lucide-react";
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login'); // Redirect after logout
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show a toast notification for logout failure
    }
  };

   if (loading) {
    return <Button variant="ghost" size="icon" disabled><User className="h-5 w-5" /></Button>;
   }

   if (!user) {
     return null; // Or a login button if needed in this specific context
   }


  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'AD'; // Default Admin initials
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-full justify-start px-2 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0">
           <Avatar className="h-6 w-6 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6">
            {/* Placeholder for user avatar image if available */}
            {/* <AvatarImage src="/avatars/001.png" alt={user.email || 'Admin'} /> */}
            <AvatarFallback className="text-xs">{getInitials(user.email)}</AvatarFallback>
          </Avatar>
          <span className="ml-2 text-sm font-medium truncate group-data-[collapsible=icon]:hidden">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Admin</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
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
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
