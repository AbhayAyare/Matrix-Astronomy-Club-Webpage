'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Auth, User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useFirebase } from './firebase-provider';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useFirebase(); // Get auth instance from FirebaseProvider
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading as true

  useEffect(() => {
    // console.log("AuthProvider: Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // console.log("AuthProvider: onAuthStateChanged fired. User:", currentUser ? currentUser.email : null);
      setUser(currentUser);
      // console.log("AuthProvider: Setting loading to false.");
      setLoading(false);
    }, (error) => {
       // Handle potential errors during listener setup or execution
       console.error("AuthProvider: Error in onAuthStateChanged listener:", error);
       setUser(null); // Assume no user on error
       setLoading(false); // Ensure loading state is updated even on error
    });

    // Cleanup subscription on unmount
    return () => {
       // console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    }
  }, [auth]);

  const login = async (email: string, password: string): Promise<void> => {
    // console.log("AuthProvider: login called for", email);
    setLoading(true); // Set loading to true when login starts
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will be handled by onAuthStateChanged, which sets loading to false.
      // console.log("AuthProvider: signInWithEmailAndPassword successful.");
    } catch (error) {
      console.error("AuthProvider: Login error:", error);
      setLoading(false); // Set loading to false if login fails
      throw error; // Re-throw error to be caught in the component
    }
    // No finally block needed here, loading is handled by listener or catch block
  };

  const logout = async (): Promise<void> => {
    // console.log("AuthProvider: logout called.");
    setLoading(true); // Set loading to true when logout starts
    try {
      await signOut(auth);
      // Auth state change (user becomes null) will be handled by onAuthStateChanged, which sets loading to false.
      // console.log("AuthProvider: signOut successful.");
    } catch (error) {
      console.error("AuthProvider: Logout error:", error);
      setLoading(false); // Set loading to false if logout fails
      // Handle logout error if needed
    }
     // No finally block needed here, loading is handled by listener or catch block
  };

  const value: AuthContextProps = {
    user,
    loading,
    login,
    logout,
  };

  // console.log("AuthProvider: Rendering provider with loading:", loading, "user:", user ? user.email : null);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // console.log("useAuth hook called, returning context with loading:", context.loading, "user:", context.user ? context.user.email : null);
  return context;
};
