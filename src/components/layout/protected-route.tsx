'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check if loading or on the login page itself
    if (loading || pathname === '/admin/login') {
      return;
    }

    // If not loading and no user is logged in, redirect to login
    if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to login from", pathname);
      router.push('/admin/login');
    }
     // else {
     // console.log("ProtectedRoute: User found", user.email, "staying on", pathname);
     // }
  }, [user, loading, router, pathname]);

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <span className="ml-4 text-lg text-muted-foreground">Loading Authentication...</span>
      </div>
    );
  }

  // If user exists OR we are on the login page, render the children
  if (user || pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If no user and not loading (and not already on login page),
  // this return might show briefly before redirect effect runs.
  // Or return null if redirect is fast enough.
  return null; // Or a minimal loading state if preferred
};

export default ProtectedRoute;
