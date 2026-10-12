// Connects the admin site to the main Firebase project (Authentication + Firestore).
// The other Firebase project, for the smart bin sensors, is in iotConfig.js.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The settings come from environment variables in the .env file. Vite only exposes
// variables that start with VITE_ and puts their values in at build time.
// These keys identify the project. They are not secrets. Access is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// initializeApp starts the Firebase connection. We then create the two services we use.
const app = initializeApp(firebaseConfig);

// auth is used to sign in and out. db is the Firestore database used by all pages.
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
