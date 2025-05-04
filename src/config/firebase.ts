
// Import the core Firebase app functions
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

// Import the Firebase services you want to use for your Matrixclub project
import { getAuth, Auth } from "firebase/auth"; // Needed for Authentication
import { initializeFirestore, CACHE_SIZE_UNLIMITED, Firestore } from "firebase/firestore"; // Use initializeFirestore for config
import { getStorage, FirebaseStorage } from "firebase/storage"; // Needed for Storage
import { getAnalytics, isSupported, Analytics } from "firebase/analytics"; // Needed for Analytics


// Your Firebase project configuration object using environment variables
const firebaseConfig = {
  // Using environment variables with fallbacks to default project config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4hCoqr1HGpa2Ink0rU-ASU0oTfafchvg", // Fallback to your specific key
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "matrix-astronomy-hub.firebaseapp.com", // Your auth domain
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "matrix-astronomy-hub", // Your Project ID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "matrix-astronomy-hub.firebasestorage.app", // Your storage bucket
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1010550441917", // Your Sender ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1010550441917:web:7e5037ac27e995599c74d4", // Your App ID
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Measurement ID is optional, can be undefined
};

// Log the config being used (mask API key if needed for public logs)
console.log("[Firebase Config] Using config:", {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' : undefined // Mask API key in logs
});


// Initialize Firebase app instance
let app: FirebaseApp;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase Init] New Firebase app initialized successfully.");
  } catch (error) {
      console.error("[Firebase Init] Error initializing Firebase app:", error);
      // Depending on the error, you might want to throw it or handle it differently
      // For now, we'll let it potentially fail downstream service initializations
      // which will then log their own errors.
      // Re-throwing might be better in production to halt if config is critically wrong.
      // throw error;
  }
} else {
  app = getApp();
  console.log("[Firebase Init] Existing Firebase app instance retrieved.");
}

// Initialize Firebase services, checking if 'app' was successfully initialized
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let db: Firestore | null = null;
let analytics: Analytics | undefined = undefined; // Optional

if (app) {
    try {
        auth = getAuth(app);
        console.log("[Firebase Init] Authentication service initialized.");
    } catch (error) {
        console.error("[Firebase Init] Error initializing Authentication:", error);
    }

    try {
        storage = getStorage(app);
        console.log("[Firebase Init] Storage service initialized.");
    } catch (error) {
        console.error("[Firebase Init] Error initializing Storage:", error);
    }

    try {
        // Initialize Firestore WITHOUT persistence for server-side environments
        // In Next.js (App Router), this file runs on both server and client.
        // This config aims for server-side compatibility. Client-side might need different config
        // if persistence is desired there (usually handled in a client-only context).
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED, // In-memory cache for server
          ignoreUndefinedProperties: true, // Recommended practice
        });
        console.log("[Firebase Init] Firestore service initialized (In-Memory Cache).");
    } catch (error) {
        console.error("[Firebase Init] Error initializing Firestore:", error);
    }


    // Initialize Analytics ONLY if in a browser environment AND supported AND measurementId is present
    if (typeof window !== 'undefined') {
        console.log("[Firebase Init] Browser environment detected for Analytics check.");
        if (firebaseConfig.measurementId) {
            isSupported().then((supported) => {
              if (supported) {
                 try {
                     analytics = getAnalytics(app);
                     console.log("[Firebase Init] Analytics service initialized.");
                 } catch (error) {
                     console.error("[Firebase Init] Error initializing Analytics:", error);
                 }
              } else {
                 console.log("[Firebase Init] Analytics is not supported in this browser environment.");
              }
            }).catch(err => {
               console.error("[Firebase Init] Error checking Analytics support:", err);
            });
        } else {
            console.log("[Firebase Init] No measurementId provided. Skipping Analytics initialization.");
        }
    } else {
         console.log("[Firebase Init] Non-browser environment. Skipping Analytics initialization.");
    }

} else {
    console.error("[Firebase Init] Firebase app initialization failed. Services (Auth, Firestore, Storage, Analytics) will not be available.");
}


// Export the potentially initialized app and services
// Downstream code should ideally check if these are null before using
export {
  app,
  auth, // Can be null
  db, // Can be null
  storage, // Can be null
  analytics, // Can be undefined
};
