
// Import the core Firebase app functions
import { initializeApp, getApps, getApp } from "firebase/app";

// Import the Firebase services you want to use for your Matrixclub project
import { getAuth } from "firebase/auth"; // Needed for Authentication
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore"; // Use initializeFirestore for config
import { getStorage } from "firebase/storage"; // Needed for Storage
import { getAnalytics, isSupported } from "firebase/analytics"; // Needed for Analytics


// Your Firebase project configuration object using environment variables
const firebaseConfig = {
  // Use environment variables first, then fall back to the hardcoded values from user input
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4hCoqr1HGpa2Ink0rU-ASU0oTfafchvg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "matrixclub-bb0db.firebaseapp.com", // Fallback to user's previous value
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "matrixclub-bb0db", // User's Project ID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "matrixclub-bb0db.firebasestorage.app", // User's storage bucket format
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "801204253639", // User's Sender ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:801204253639:web:422e423828577fe2cb1fe2", // User's App ID
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SEPQZFGK23" // User's Measurement ID
};

// Initialize Firebase app. Use getApps check for robustness.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// console.log("Firebase app initialized or retrieved for Matrixclub.");


// Initialize Firebase services using the 'app' instance.
const auth = getAuth(app); // Initialize Firebase Authentication
// console.log("Firebase Authentication service initialized.");

const storage = getStorage(app); // Initialize Cloud Storage for Firebase
// console.log("Firebase Storage service initialized.");

// Initialize Firestore WITHOUT persistence
// Use initializeFirestore instead of getFirestore to pass settings
const db = initializeFirestore(app, {
  // persistence: undefined, // Explicitly disable persistence (or use memoryPersistence() if needed temporarily) - Updated: persistence is deprecated, use cacheSizeBytes
  // experimentalForceLongPolling: true, // Sometimes helps in certain environments, uncomment to test if needed
  // ignoreUndefinedProperties: true, // Recommended practice
  cacheSizeBytes: CACHE_SIZE_UNLIMITED, // Use unlimited memory cache or a specific size if preferred, effectively disabling disk persistence for server
});
console.log("Cloud Firestore service initialized (Persistence Disabled).");


// Initialize Analytics ONLY if supported (runs only on client-side).
let analytics: Analytics | undefined = undefined;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
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


// Export the initialized app and services
export {
  app,
  auth,
  db, // Export db
  storage,
  analytics,
};
