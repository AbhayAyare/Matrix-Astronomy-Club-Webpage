'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const { user, login, loading: authLoading } = useAuth(); // Use loading state and user from AuthProvider
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Local loading state for login action

  // Redirect if user is already logged in and auth is not loading
   useEffect(() => {
     if (!authLoading && user) {
       // console.log("Login Page: User already logged in, redirecting to /admin");
       router.replace('/admin'); // Use replace to avoid adding login page to history
     }
   }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true); // Start local loading
    // console.log("Login Page: Attempting login...");
    try {
      await login(email, password);
      // Login successful, onAuthStateChanged in AuthProvider will handle user state update
      // and the useEffect above will trigger redirection.
      // console.log("Login Page: Login call succeeded, awaiting redirect...");
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
       // No need to redirect here, useEffect handles it based on user state change
    } catch (error: any) {
       console.error("Login Page: Login failed:", error);
       let description = "An unexpected error occurred during login.";
       // Handle specific Firebase Auth errors
       if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           description = "Invalid email or password. Please try again.";
       } else if (error.code === 'auth/too-many-requests') {
           description = "Too many login attempts. Please try again later.";
       } else if (error.code === 'auth/network-request-failed') {
           description = "Network error. Please check your connection.";
       }
       toast({
           title: "Login Failed",
           description: description,
           variant: "destructive",
       });
      setIsLoggingIn(false); // Stop local loading on error
    }
     // Don't set isLoggingIn to false on success, let the redirect happen
  };


  // Show loading indicator while checking auth state or if already logged in and waiting for redirect
  if (authLoading || (user && !authLoading)) {
     // console.log("Login Page: Showing loading indicator (authLoading:", authLoading, "user:", !!user, ")");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading authentication...</span>
        </div>
      </div>
    );
  }

   // If not loading and no user, show the login form
  // console.log("Login Page: Rendering login form (authLoading:", authLoading, "user:", !!user, ")");
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoggingIn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoggingIn}
              />
            </div>
             <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging In...
                  </>
                ) : (
                   <>
                    <LogIn className="mr-2 h-4 w-4" /> Login
                   </>
                )}
              </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground">
           <p>Only authorized administrators can log in.</p>
         </CardFooter>
      </Card>
    </div>
  );
}
