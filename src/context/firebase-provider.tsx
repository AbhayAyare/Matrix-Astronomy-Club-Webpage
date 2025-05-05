'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Analytics } from 'firebase/analytics';
import { app, auth, db, storage, analytics } from '@/config/firebase'; // Assuming analytics might be undefined initially

interface FirebaseContextProps {
  app?: FirebaseApp | null;
  auth?: Auth | null;
  db?: Firestore | null;
  storage?: FirebaseStorage | null;
  analytics?: Analytics; // Optional analytics
}

const FirebaseContext = createContext<FirebaseContextProps | null>(null);

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  // Ensure analytics is potentially available if initialized
  const value = { app, auth, db, storage, analytics };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextProps => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
