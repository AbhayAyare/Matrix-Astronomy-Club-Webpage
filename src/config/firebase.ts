
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app"; // Keep getApp/getApps for potential safety, though often simplified now.
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Keep Firestore initialization
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCWqQMAguYi6-JkOM3AlTy-3Omh18kWoCA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "matrixclub-bb0db.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "matrixclub-bb0db",
  // Ensure storage bucket uses the .appspot.com domain consistent with others
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "matrixclub-bb0db.appspot.com", // Reverted to .appspot.com as per original file structure unless specifically told otherwise. Check Firebase Console for correct value.
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "801204253639",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:801204253639:web:422e423828577fe2cb1fe2",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SEPQZFGK23" // Optional
};

// Initialize Firebase - Use getApps check for robustness against HMR or multiple initializations
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app);

// Initialize Analytics only if supported (runs only on client-side)
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported && firebaseConfig.measurementId) { // Also check if measurementId exists
            analytics = getAnalytics(app);
            // console.log("Firebase Analytics initialized."); // Keep console logs minimal
        } else {
             if(!supported) console.log("Firebase Analytics is not supported in this environment.");
             if(!firebaseConfig.measurementId) console.log("Firebase measurementId is missing, skipping Analytics initialization.");
        }
    }).catch(err => {
        console.error("Error checking Firebase Analytics support:", err); // Add error handling
    });
}


export { app, auth, db, storage, analytics };
