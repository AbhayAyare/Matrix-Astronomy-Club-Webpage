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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Re-throw error to be caught in the component
    } finally {
      // Setting loading to false here might be too early if redirect happens before state update
      // Let onAuthStateChanged handle setting loading to false
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      // Auth state change will be handled by onAuthStateChanged
    } catch (error) {
      console.error("Logout error:", error);
      // Handle logout error if needed
    } finally {
      // Let onAuthStateChanged handle setting loading to false
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
