import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// The ESP32 smart bin firmware writes live sensor readings to its own
// Firebase project (Realtime Database), separate from this app's main
// Firestore project in firebaseConfig.js. Deliberately does NOT use a
// Realtime Database legacy secret — those grant full admin access and
// should never be embedded in a client app. Access here relies on
// anonymous auth + that project's Realtime Database Security Rules.
const iotFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_IOT_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_IOT_FIREBASE_PROJECT_ID,
  databaseURL: process.env.EXPO_PUBLIC_IOT_FIREBASE_DATABASE_URL,
};

const iotApp = getApps().find(app => app.name === 'iot')
  ?? initializeApp(iotFirebaseConfig, 'iot');

export const iotDb = getDatabase(iotApp);

const iotAuth = getAuth(iotApp);
signInAnonymously(iotAuth).catch(error => {
  console.warn('IoT project anonymous sign-in failed:', error);
});

// The firmware docs describe a single physical prototype bin at this path
// (bins/Bin001/{plastic,food,metal}) — not one bin per seller.
export const BIN_ID = 'Bin001';
