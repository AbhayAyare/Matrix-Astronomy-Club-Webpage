// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "matrixclub-bb0db.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "801204253639",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:801204253639:web:422e423828577fe2cb1fe2",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SEPQZFGK23" // Optional
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only if supported (runs only on client-side)
let analytics;
if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics initialized.");
        } else {
            console.log("Firebase Analytics is not supported in this environment.");
        }
    });
}


export { app, auth, db, storage, analytics };
