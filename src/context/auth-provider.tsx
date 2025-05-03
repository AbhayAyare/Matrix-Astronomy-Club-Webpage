'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Auth, User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Restore imports
import { useFirebase } from './firebase-provider';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; // Restore login type
  logout: () => Promise<void>; // Restore logout type
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useFirebase(); // Use the auth instance
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true

  useEffect(() => {
    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      // console.log("AuthProvider: Auth state changed, user:", currentUser?.email, "loading:", false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  // Login function implementation
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true); // Set loading to true when login starts
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will be handled by onAuthStateChanged, which sets loading to false.
      // console.log("AuthProvider: signInWithEmailAndPassword successful.");
    } catch (error) {
      setLoading(false); // Set loading to false on login error
      // console.error("AuthProvider: Login failed", error);
      throw error; // Re-throw the error to be caught by the calling component
    }
  };

  // Logout function implementation
  const logout = async (): Promise<void> => {
    setLoading(true); // Optionally set loading during logout
    try {
      await signOut(auth);
       // console.log("AuthProvider: signOut successful.");
       // Auth state change will set user to null and loading to false via listener
    } catch (error) {
      setLoading(false); // Set loading to false on logout error
      // console.error("AuthProvider: Logout failed", error);
      throw error; // Re-throw error if needed
    }
  };

  const value: AuthContextProps = {
    user,
    loading,
    login, // Add login back
    logout, // Add logout back
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
