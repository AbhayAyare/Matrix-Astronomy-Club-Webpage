'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useFirebase } from './firebase-provider';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // console.log("AuthProvider: Auth state changed, user:", currentUser?.email, "loading:", false);
    }, (error) => {
       // Added error handling for the listener itself
       console.error("AuthProvider: Error in onAuthStateChanged listener:", error);
       setUser(null); // Ensure user is null on listener error
       setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    if (!auth) {
      setLoading(false);
      throw new Error("Firebase Auth is not initialized.");
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will be handled by onAuthStateChanged.
    } catch (error: any) {
      setLoading(false);
      console.error("AuthProvider: Login failed.", "Email:", email, "Error Code:", error.code, "Message:", error.message);
      // Log more details for debugging specific auth errors
      if (error.code === 'auth/operation-not-allowed') {
         console.error("AuthProvider Detail: Email/Password sign-in might not be enabled in the Firebase project settings.");
      } else if (error.code === 'auth/invalid-credential') {
           console.error("AuthProvider Detail: Invalid email or password provided.");
      } else if (error.code === 'auth/user-not-found') {
            console.error("AuthProvider Detail: No user found with this email.");
      } else if (error.code === 'auth/wrong-password') {
             console.error("AuthProvider Detail: Incorrect password.");
      }
      throw error; // Re-throw the error to be caught by the calling component
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    if (!auth) {
      setLoading(false);
      throw new Error("Firebase Auth is not initialized.");
    }
    try {
      await signOut(auth);
      // Auth state change will set user to null via listener.
    } catch (error) {
      setLoading(false);
      console.error("AuthProvider: Logout failed", error);
      throw error;
    }
  };

  const value: AuthContextProps = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
