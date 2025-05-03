
// Import the core Firebase app functions
import { initializeApp, getApps, getApp } from "firebase/app";

// Import the Firebase services you want to use
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Hardcoded Firebase project configuration based on user input
const firebaseConfig = {
  apiKey: "AIzaSyA4hCoqr1HGpa2Ink0rU-ASU0oTfafchvg",
  authDomain: "matrix-astronomy-hub.firebaseapp.com",
  projectId: "matrix-astronomy-hub",
  storageBucket: "matrix-astronomy-hub.firebasestorage.app", // Note: Typically ends with .appspot.com, but using user-provided value. Double-check this in your Firebase console.
  messagingSenderId: "1010550441917",
  appId: "1:1010550441917:web:7e5037ac27e995599c74d4",
  // measurementId is optional but recommended for Analytics
  // measurementId: "G-XXXXXXXXXX" // Add your measurement ID if you have one
};

// Initialize Firebase app. Use getApps check for robustness.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app); // Assuming Firestore is needed based on previous files
const storage = getStorage(app);

// Initialize Analytics only if supported (runs only on client-side)
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        // Add check for measurementId if you include it in the config
        // if (supported && firebaseConfig.measurementId) {
        if (supported) { // Initialize if supported, even without measurementId for now
            analytics = getAnalytics(app);
            // console.log("Firebase Analytics initialized.");
        } else {
             // console.log("Firebase Analytics not supported or measurementId missing.");
        }
    }).catch(err => {
        console.error("Error checking Firebase Analytics support:", err);
    });
}

// Export the initialized app and services
export { app, auth, db, storage, analytics };
