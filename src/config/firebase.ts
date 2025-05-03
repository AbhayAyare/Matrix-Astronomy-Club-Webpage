
// Import the core Firebase app functions
import { initializeApp, getApps, getApp } from "firebase/app";

// Import the Firebase services you want to use for your Matrixclub project
import { getAuth } from "firebase/auth"; // Needed for Authentication
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Needed for Storage
import { getAnalytics, isSupported } from "firebase/analytics"; // Needed for Analytics


// Your Firebase project configuration object using environment variables
const firebaseConfig = {
  // Using environment variables with fallbacks to default project config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4hCoqr1HGpa2Ink0rU-ASU0oTfafchvg", // Using fallback from user input
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "matrix-astronomy-hub.firebaseapp.com", // Using fallback from user input
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "matrix-astronomy-hub", // Using fallback from user input
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "matrix-astronomy-hub.firebasestorage.app", // Using fallback from user input
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1010550441917", // Using fallback from user input
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1010550441917:web:7e5037ac27e995599c74d4", // Using fallback from user input
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional, only use if defined in env
};

// Initialize Firebase app. Use getApps check for robustness, especially in Next.js environments.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// console.log("Firebase app initialized or retrieved for Matrixclub.");


// Initialize Firebase services using the 'app' instance.
const auth = getAuth(app); // Initialize Firebase Authentication
// console.log("Firebase Authentication service initialized.");

const storage = getStorage(app); // Initialize Cloud Storage for Firebase
// console.log("Firebase Storage service initialized.");

// Initialize Firestore
const db = getFirestore(app);
// console.log("Cloud Firestore service initialized.");


// Initialize Analytics ONLY if supported (runs only on client-side).
// This prevents errors during server-side rendering (SSR) environments
// where the 'window' object might not be available.
let analytics: Analytics | undefined = undefined; // Initialize analytics to undefined by default
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      // Initialize analytics only if supported AND measurementId is provided
      if (supported && firebaseConfig.measurementId) {
         analytics = getAnalytics(app);
         // console.log("Firebase Analytics service initialized for Matrixclub.");
      } else {
         // console.log("Firebase Analytics not supported or measurementId missing. Skipping Analytics initialization.");
      }
    }).catch(err => {
       console.error("Error checking Firebase Analytics support:", err);
    });
}


// Export the initialized app and services so they can be used elsewhere in your app.
export {
  app,
  auth,
  db, // Export db
  storage,
  analytics,
};

