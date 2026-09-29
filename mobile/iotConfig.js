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

// Attempt anonymous sign-in so the IoT RTDB rules can use request.auth.
// This is OPTIONAL — if the IoT project has Anonymous Auth disabled or has
// open read rules (".read": true for the bins path), sensor data will still
// load correctly without it.
//
// If you see auth/configuration-not-found:
//   Firebase Console → [IoT project] → Authentication → Sign-in method
//   → Anonymous → Enable
//
// If you prefer not to enable Anonymous Auth, open your IoT RTDB rules and
// allow unauthenticated reads for the bins path:
//   { "rules": { "bins": { ".read": true, ".write": false } } }
const iotAuth = getAuth(iotApp);
signInAnonymously(iotAuth).catch(error => {
  if (error.code === 'auth/configuration-not-found') {
    console.warn(
      '[IoT] Anonymous Auth is disabled in the IoT Firebase project. ' +
      'Enable it at: Firebase Console → IoT project → Authentication → Sign-in method → Anonymous. ' +
      'Sensor data will still load if RTDB rules allow unauthenticated reads.'
    );
  } else {
    console.warn('[IoT] Anonymous sign-in failed:', error.code, error.message);
  }
});

// The firmware docs describe a single physical prototype bin at this path
// (bins/Bin001/{plastic,food,metal}) — not one bin per seller.
export const BIN_ID = 'Bin001';
