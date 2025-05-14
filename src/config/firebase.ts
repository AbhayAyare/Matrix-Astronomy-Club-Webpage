
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4hCoqr1HGpa2Ink0rU-ASU0oTfafchvg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "matrix-astronomy-hub.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "matrix-astronomy-hub",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "matrix-astronomy-hub.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1010550441917",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1010550441917:web:7e5037ac27e995599c74d4",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SEPQZFGK23"
};

// Log the config being used (mask API key if needed for public logs)
console.log("[Firebase Config] Using config:", {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' : undefined // Mask API key in logs
});


// Initialize Firebase app instance
let app: FirebaseApp | null = null;
if (getApps().length < 1) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase Init] New Firebase app initialized successfully.", app ? app.name : 'App name unavailable');
  } catch (error) {
      console.error("[Firebase Init] Error initializing Firebase app:", error);
  }
} else {
  app = getApp();
  console.log("[Firebase Init] Existing Firebase app instance retrieved.", app ? app.name : 'App name unavailable');
}

// Initialize Firebase services, checking if 'app' was successfully initialized
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let db: Firestore | null = null;
let analytics: Analytics | undefined = undefined;

if (app) {
    console.log("[Firebase Init] App instance is valid. Initializing services...");
    try {
        auth = getAuth(app);
        console.log("[Firebase Init] Authentication service initialized.", auth ? 'Success' : 'Failed/Null');
    } catch (error) {
        console.error("[Firebase Init] Error initializing Authentication:", error);
    }

    try {
        storage = getStorage(app);
        console.log("[Firebase Init] Storage service initialized.", storage ? 'Success' : 'Failed/Null');
    } catch (error) {
        console.error("[Firebase Init] Error initializing Storage:", error);
    }

    try {
        db = initializeFirestore(app, {
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
          ignoreUndefinedProperties: true,
        });
        console.log("[Firebase Init] Firestore service initialized (In-Memory Cache).", db ? 'Success' : 'Failed/Null');
    } catch (error) {
        console.error("[Firebase Init] Error initializing Firestore:", error);
    }


    if (typeof window !== 'undefined') {
        console.log("[Firebase Init] Browser environment detected for Analytics check.");
        if (firebaseConfig.measurementId) {
            isSupported().then((supported) => {
              if (supported) {
                 try {
                     analytics = getAnalytics(app);
                     console.log("[Firebase Init] Analytics service initialized.", analytics ? 'Success' : 'Failed/Undefined');
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

export {
  app,
  auth,
  db,
  storage,
  analytics,
};
