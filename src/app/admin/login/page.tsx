
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Telescope } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    console.log("[LoginPage] handleLogin called for email:", email);

    if (!login) {
      const authUnavailableError = "Login function is not available. Authentication service might be down, not configured, or still initializing. Please try again in a moment. If the issue persists, contact support.";
      console.error("[LoginPage] HandleLogin: Login function from useAuth() is null. This indicates a problem with AuthProvider or Firebase Auth service initialization.");
      setError(authUnavailableError);
      setIsLoggingIn(false);
      toast({
        title: "Auth Service Error",
        description: authUnavailableError,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    try {
      await login(email, password);
      console.log("[LoginPage] Login successful, redirecting to /admin");
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      router.push('/admin');
    } catch (err: any) {
      console.error("[LoginPage] Login page error handler caught:", err);
      let errorMessage = "Login failed. Please try again.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
         errorMessage = "Invalid email format.";
      } else if (err.code === 'auth/operation-not-allowed') {
         errorMessage = "Login method not enabled. Please contact support.";
      } else if (err.code === 'auth/too-many-requests') {
         errorMessage = "Too many login attempts. Please try again later.";
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (err.message && err.message.includes("Firebase Auth is not initialized")) {
        errorMessage = "Authentication service is not initialized. Please contact support.";
      } else if (err.message) {
          if (!err.message.includes('Firebase: Error')) {
              errorMessage = err.message;
          }
      }

      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
      console.log("[LoginPage] handleLogin finished.");
    }
  };

  const isLoading = authLoading || isLoggingIn;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-sm shadow-2xl animate-fade-in border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <Telescope className="mx-auto mb-4 h-16 w-16 text-primary" />
          <CardTitle className="text-2xl font-bold text-primary">Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="text-primary-foreground placeholder:text-gray-300 transition-colors duration-200 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="text-primary-foreground placeholder:text-gray-300 transition-colors duration-200 focus:border-accent"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
            <Button type="submit" className="w-full transform hover:scale-[1.02] transition-transform duration-200 ease-in-out" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground">
           <p>Access restricted to authorized personnel.</p>
         </CardFooter>
      </Card>
    </div>
  );
}
