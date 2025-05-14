
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useFirebase } from './firebase-provider';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: ((email: string, password: string) => Promise<void>) | null;
  logout: (() => Promise<void>) | null;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth: firebaseAuthService } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] Initializing. Firebase Auth Service from useFirebase():", firebaseAuthService ? 'Available' : 'NOT AVAILABLE');
    if (!firebaseAuthService) {
      console.warn("[AuthProvider] Firebase Auth service is not available on init. Auth features will be disabled. Setting loading to false.");
      setLoading(false);
      setUser(null);
      return;
    }

    console.log("[AuthProvider] Subscribing to onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(firebaseAuthService, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      console.log("[AuthProvider] Auth state changed. User:", currentUser?.email || 'No user', "Loading:", false);
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
    console.log("[AuthProvider] login function called for email:", email);
    setLoading(true);
    if (!firebaseAuthService) {
      setLoading(false);
      console.error("[AuthProvider] Login function called, but Firebase Auth service is not initialized. This is unexpected if AuthProvider initialized correctly.");
      throw new Error("Firebase Auth is not initialized. Cannot login.");
    }
    try {
      console.log("[AuthProvider] Attempting signInWithEmailAndPassword for:", email);
      await signInWithEmailAndPassword(firebaseAuthService, email, password);
      console.log("[AuthProvider] signInWithEmailAndPassword successful (onAuthStateChanged will update user and loading state).");
    } catch (error: any) {
      setLoading(false);
      console.error("[AuthProvider] Login failed.", "Email:", email, "Error Code:", error.code, "Message:", error.message, error);
      throw error; // Re-throw to be caught by the calling component (LoginPage)
    }
  };

  const logout = async (): Promise<void> => {
    console.log("[AuthProvider] logout function called.");
    setLoading(true);
    if (!firebaseAuthService) {
      setLoading(false);
      console.error("[AuthProvider] Logout function called, but Firebase Auth service is not initialized.");
      throw new Error("Firebase Auth is not initialized. Cannot logout.");
    }
    try {
      console.log("[AuthProvider] Attempting signOut.");
      await signOut(firebaseAuthService);
      console.log("[AuthProvider] signOut successful (onAuthStateChanged will update user and loading state).");
    } catch (error) {
      setLoading(false);
      console.error("[AuthProvider] Logout failed", error);
      throw error;
    }
  };

  const value: AuthContextProps = {
    user,
    loading,
    login: firebaseAuthService ? login : null,
    logout: firebaseAuthService ? logout : null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error("[useAuth] Critical: useAuth must be used within an AuthProvider. This component is likely not wrapped correctly.");
    throw new Error('useAuth must be used within an AuthProvider. This usually means a component calling useAuth() is not wrapped in <AuthProvider>.');
  }
  return context;
};
