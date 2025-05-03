'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image'; // Import Image component

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth(); // Destructure login and loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Local loading state for the button
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error on new login attempt
    setIsLoggingIn(true); // Set local loading state

    if (!login) {
      setError("Login function is not available.");
      setIsLoggingIn(false);
      return;
    }

    try {
      await login(email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      router.push('/admin'); // Redirect to admin dashboard on successful login
      // No need to setIsLoggingIn(false) here as the page will redirect
    } catch (err: any) {
      console.error("Login error:", err);
      // Handle specific Firebase auth errors or show a generic message
      let errorMessage = "Login failed. Please check your credentials.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
         errorMessage = "Invalid email format.";
      }
      // Add more specific error codes as needed

      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoggingIn(false); // Reset local loading state on error
    }
  };

  // Combine auth loading state and local logging in state for the button
  const isLoading = authLoading || isLoggingIn;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-sm shadow-2xl animate-fade-in border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <Image
              src="/placeholder.svg" // Replace with your actual logo path if available
              alt="Matrix Astronomy Club Logo"
              width={60}
              height={60}
              className="mx-auto mb-4 rounded-full"
              data-ai-hint="logo icon astronomy"
            />
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
                className="transition-colors duration-200 focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                 className="transition-colors duration-200 focus:border-accent"
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
