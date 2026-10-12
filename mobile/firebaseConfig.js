// FIREBASE SETUP FOR THE PHONE APP (Android / iOS)
// This file connects the app to our Firebase project and exports ready-to-use
// tools. Other files import them, for example: import { auth, db } from '../firebaseConfig'.
// There is a separate file, firebaseConfig.web.js, which Expo uses for the web build.
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Project keys. They are read from the .env file. Expo only exposes variables
// that start with EXPO_PUBLIC_ to the app code. These keys only identify our
// project. Real security comes from the Firestore and Storage rules.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 1. Start the Firebase app. Every other Firebase service is attached to it.
const app = initializeApp(firebaseConfig);

// 2. Authentication (sign up, log in, log out).
// AsyncStorage is the phone's small key-value storage. Using it as "persistence"
// means the user stays logged in after closing and reopening the app.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 3. Firestore: the main database (users, listings, orders, offers, notifications).
export const db = getFirestore(app);
// 4. Storage: file storage, for example profile pictures.
export const storage = getStorage(app);
// 5. Cloud Functions client: lets the app call server code (see functions/index.js,
// used for Stripe payments).
export const functions = getFunctions(app);

// The app itself is also exported in case another file needs it.
export default app;
