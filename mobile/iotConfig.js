import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// ── Development Mock IoT Telemetry ──────────────────────────────────────────
// Set EXPO_PUBLIC_USE_MOCK_IOT=true in .env to simulate ESP32 smart bin telemetry
// when physical hardware is offline.
// __DEV__ guard: a production build can never show simulated data, even if the variable is set.
export const USE_MOCK_IOT = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_IOT === 'true';

export const MOCK_BIN_DATA_NORMAL = {
  plastic: {
    level: 45,
    weight: 2.4,
    status: 'LOW',
    overweight: false,
    timestamp: '2026-09-30 04:30:00',
  },
  food: {
    level: 68,
    weight: 3.1,
    moisture: 54,
    status: 'HALF',
    overweight: false,
    timestamp: '2026-09-30 04:30:00',
  },
  metal: {
    level: 82,
    weight: 5.2,
    status: '75%',
    overweight: false,
    timestamp: '2026-09-30 04:30:00',
  },
};

export const MOCK_BIN_DATA_ALERT = {
  plastic: {
    level: 100,
    weight: 8.5,
    status: 'FULL',
    overweight: true,
    timestamp: '2026-09-30 04:30:00',
  },
  food: {
    level: 76,
    weight: 4.2,
    moisture: 78,
    status: '75%',
    overweight: false,
    timestamp: '2026-09-30 04:30:00',
  },
  metal: {
    level: 91,
    weight: 6.3,
    status: 'FULL',
    overweight: false,
    timestamp: '2026-09-30 04:30:00',
  },
};

// ── Real IoT Firebase Realtime Database Connection ──────────────────────────
// The ESP32 smart bin firmware writes live sensor readings to its own
// Firebase project (Realtime Database), separate from this app's main
// Firestore project in firebaseConfig.js.
const iotFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_IOT_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_IOT_FIREBASE_PROJECT_ID,
  databaseURL: process.env.EXPO_PUBLIC_IOT_FIREBASE_DATABASE_URL,
};

const iotApp = getApps().find(app => app.name === 'iot')
  ?? initializeApp(iotFirebaseConfig, 'iot');

export const iotDb = getDatabase(iotApp);

if (!USE_MOCK_IOT) {
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
}

// Prototype bin in RTDB. Realtime Database keys are case-sensitive: the firmware
// writes to bins/bin001/compartments/{plastic,food,metal}/{level,weight} and
// bins/bin001/lastUpdated (see utils/binTelemetry.ts for how it is parsed).
export const BIN_ID = 'bin001';
