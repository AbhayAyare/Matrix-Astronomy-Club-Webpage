
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
    console.log(`[ProtectedRoute] Effect triggered. Path: ${pathname}, Loading: ${loading}, User: ${user?.email || 'null'}`);
    // Skip check if already on the login page
    if (pathname === '/admin/login') {
      console.log("[ProtectedRoute] Already on login page. Skipping checks.");
      return;
    }

    if (loading) {
      console.log("[ProtectedRoute] Auth state is loading. Waiting...");
      return;
    }

    // If not loading and no user is logged in, redirect to login
    if (!user) {
        console.log(`[ProtectedRoute] No user found and not loading. Redirecting from "${pathname}" to /admin/login.`);
      router.push('/admin/login');
    } else {
      console.log(`[ProtectedRoute] User "${user.email}" found. Allowing access to "${pathname}".`);
    }
  }, [user, loading, router, pathname]);

  // If we are on the login page, render children (which is the LoginPage itself)
  // This prevents a flash of the loading spinner if already on login.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show loading indicator while checking auth state, but only if not on login page already.
  if (loading) {
    console.log("[ProtectedRoute] Rendering loading spinner.");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <span className="ml-4 text-lg text-muted-foreground">Loading Authentication...</span>
      </div>
    );
  }

  // If user exists, render the children (the protected admin page)
  if (user) {
    console.log("[ProtectedRoute] User exists. Rendering children for path:", pathname);
    return <>{children}</>;
  }

  // If no user and not loading (and not already on login page),
  // this return might show briefly before redirect effect runs, or if redirect fails.
  // Returning a loading spinner here too can make for a smoother experience during the redirect.
  console.log("[ProtectedRoute] No user, not loading. Showing loading spinner while redirect takes effect for path:", pathname);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="ml-4 text-lg text-muted-foreground">Redirecting...</span>
    </div>
  );
};

export default ProtectedRoute;
