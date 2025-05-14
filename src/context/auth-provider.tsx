
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useFirebase } from './firebase-provider';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: ((email: string, password: string) => Promise<void>) | null; // Allow login to be null if auth not ready
  logout: (() => Promise<void>) | null; // Allow logout to be null
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth: firebaseAuthService } = useFirebase(); // Renamed to avoid confusion with local 'auth'
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] Initializing. Firebase Auth Service from useFirebase():", firebaseAuthService);
    if (!firebaseAuthService) {
      console.warn("[AuthProvider] Firebase Auth service is not available on init from useFirebase(). Auth features may not work.");
      setLoading(false);
      setUser(null);
      return;
    }
    console.log("[AuthProvider] Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(firebaseAuthService, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      console.log("[AuthProvider] Auth state changed. User:", currentUser?.email, "Loading:", false);
    }, (error) => {
       console.error("[AuthProvider] Error in onAuthStateChanged listener:", error);
       setUser(null);
       setLoading(false);
    });

    return () => {
      console.log("[AuthProvider] Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [firebaseAuthService]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    if (!firebaseAuthService) {
      setLoading(false);
      console.error("[AuthProvider] Login function called, but Firebase Auth service is not initialized.");
      throw new Error("Firebase Auth is not initialized. Cannot login.");
    }
    try {
      console.log("[AuthProvider] Attempting signInWithEmailAndPassword for:", email);
      await signInWithEmailAndPassword(firebaseAuthService, email, password);
      // Auth state change will be handled by onAuthStateChanged.
      console.log("[AuthProvider] signInWithEmailAndPassword successful (pending onAuthStateChanged).");
    } catch (error: any) {
      setLoading(false);
      console.error("[AuthProvider] Login failed.", "Email:", email, "Error Code:", error.code, "Message:", error.message);
      if (error.code === 'auth/operation-not-allowed') {
         console.error("[AuthProvider Detail] Email/Password sign-in might not be enabled in the Firebase project settings.");
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
           console.error("[AuthProvider Detail] Invalid email or password provided.");
      } else if (error.code === 'auth/invalid-email') {
         console.error("[AuthProvider Detail] Invalid email format.");
      } else if (error.code === 'auth/too-many-requests') {
         console.error("[AuthProvider Detail] Too many login attempts. Please try again later.");
      } else if (error.code === 'auth/network-request-failed') {
        console.error("[AuthProvider Detail] Network error during login. Check internet connection.");
      } else if (error.message && error.message.includes("Firebase Auth is not initialized")) {
        console.error("[AuthProvider Detail] Caught error: Firebase Auth is not initialized during login attempt.");
      }
      throw error;
    }
    // setLoading will be set to false by onAuthStateChanged
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    if (!firebaseAuthService) {
      setLoading(false);
      console.error("[AuthProvider] Logout function called, but Firebase Auth service is not initialized.");
      throw new Error("Firebase Auth is not initialized. Cannot logout.");
    }
    try {
      console.log("[AuthProvider] Attempting signOut.");
      await signOut(firebaseAuthService);
      // Auth state change will set user to null via listener.
      console.log("[AuthProvider] signOut successful (pending onAuthStateChanged).");
    } catch (error) {
      setLoading(false);
      console.error("[AuthProvider] Logout failed", error);
      throw error;
    }
     // setLoading will be set to false by onAuthStateChanged
  };

  const value: AuthContextProps = {
    user,
    loading,
    login: firebaseAuthService ? login : null, // Only provide login/logout if auth service is available
    logout: firebaseAuthService ? logout : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. This usually means a component calling useAuth() is not wrapped in <AuthProvider>.');
  }
  return context;
};
