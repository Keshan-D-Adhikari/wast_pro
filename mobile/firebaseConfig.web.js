// FIREBASE SETUP FOR THE WEB BUILD
// Expo picks this file instead of firebaseConfig.js when the app runs in a
// browser (the ".web.js" ending is the signal). Imports of '../firebaseConfig'
// therefore work on every platform without changing any screen code.
// Differences from the phone version:
//   - getAuth() is used, because browsers already save the login in their own
//     storage (no AsyncStorage needed).
//   - the Cloud Functions client is not exported here.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Same project keys as the phone version, read from the .env file.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Start the Firebase app.
const app = initializeApp(firebaseConfig);

// Authentication for the browser.
export const auth = getAuth(app);

// Firestore database and file storage.
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
