import { getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Same IoT Firebase project the mobile app reads (see mobile/iotConfig.js) —
// the ESP32 firmware's live sensor readings, kept separate from the main
// Firestore project. Anonymous auth + that project's Realtime Database rules
// gate access; no admin secret is embedded here.
const iotFirebaseConfig = {
  apiKey: import.meta.env.VITE_IOT_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_IOT_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_IOT_FIREBASE_DATABASE_URL,
};

const iotApp =
  getApps().find((app) => app.name === "iot") ??
  initializeApp(iotFirebaseConfig, "iot");

export const iotDb = getDatabase(iotApp);

const iotAuth = getAuth(iotApp);
signInAnonymously(iotAuth).catch((error) => {
  console.warn("IoT project anonymous sign-in failed:", error);
});

// The firmware docs describe a single physical prototype bin at this path
// (bins/Bin001/{plastic,food,metal}) — not one bin per seller.
export const BIN_ID = "Bin001";
