
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Auth, User } from 'firebase/auth';
// Removed unused Firebase auth imports: onAuthStateChanged, signInWithEmailAndPassword, signOut
import { useFirebase } from './firebase-provider';

interface AuthContextProps {
  user: User | null; // Keeping user structure in case it's needed later, but will always be null or placeholder
  loading: boolean; // Keeping loading structure, but will resolve quickly
  // Removed login/logout types
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // const { auth } = useFirebase(); // Auth instance no longer needed here
  // Simulate admin state without actual Firebase auth
  const [user, setUser] = useState<User | null>(null); // Start as null initially
  const [loading, setLoading] = useState(false); // Set loading to false as no auth check is performed

  // Simulate an admin user being logged in without Firebase check
  // In a real scenario without auth, you might pass admin status differently
  // For now, let's assume admin access is granted by reaching the layout
  // We can remove the concept of a logged-in 'user' entirely if preferred

  useEffect(() => {
     // No auth state listener needed
     // If we wanted to simulate a logged-in admin for components relying on `user` object:
     // setUser({ uid: 'admin-placeholder', email: 'admin@example.com' } as User);
     // setLoading(false); // Ensure loading is false
     // Or keep user null if components don't rely on it
     setLoading(false);
  }, []);


  // Login function removed
  // const login = async (email: string, password: string): Promise<void> => { ... }

  // Logout function removed
  // const logout = async (): Promise<void> => { ... }

  const value: AuthContextProps = {
    user: null, // Explicitly set user to null as auth is disabled
    loading, // Loading is now always false after initial render
    // login and logout removed from context value
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // User will always be null, loading will be false
  return context;
};

