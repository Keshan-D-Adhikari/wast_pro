// IOT (SMART BIN) CONNECTION
// The physical smart bin has an ESP32 chip with sensors. It uploads its readings
// (fill level, weight, moisture) to a Firebase Realtime Database. That database
// belongs to a SEPARATE Firebase project from the main app (see firebaseConfig.js).
// This file:
//   - decides whether to use fake (mock) data while developing,
//   - provides the mock data,
//   - connects to the IoT database and signs in anonymously,
//   - exports the default bin id.
// Screens read the live data through iotDb. See utils/binTelemetry.ts for parsing.
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getDatabase } from 'firebase/database';

// ── Development Mock IoT Telemetry ──────────────────────────────────────────
// Set EXPO_PUBLIC_USE_MOCK_IOT=true in .env to simulate ESP32 smart bin telemetry
// when physical hardware is offline.
// __DEV__ guard: a production build can never show simulated data, even if the variable is set.
// __DEV__ is a global that is true only when the app runs in development mode.
export const USE_MOCK_IOT = __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_IOT === 'true';

// Fake readings for a bin that is mostly fine. There is one entry per compartment:
//   level     = how full the compartment is (percent)
//   weight    = weight of the waste (kg)
//   moisture  = wetness (only the food compartment has this sensor)
//   status    = label worked out by the firmware (LOW, HALF, 75%, FULL...)
//   overweight= true when the weight is over the safe limit
//   timestamp = when the reading was taken
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

// Fake readings for a bin that needs attention (full and overweight). Useful for
// testing alerts and warning colours without waiting for the real bin to fill up.
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
// Keys come from the .env file (EXPO_PUBLIC_ variables are readable in app code).
const iotFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_IOT_FIREBASE_API_KEY,
  projectId: process.env.EXPO_PUBLIC_IOT_FIREBASE_PROJECT_ID,
  databaseURL: process.env.EXPO_PUBLIC_IOT_FIREBASE_DATABASE_URL,
};

// This is a SECOND Firebase app, named 'iot', so it can live next to the main one.
// If it already exists (for example after a hot reload while developing), reuse it.
// "??" means "use the right side only if the left side is empty".
const iotApp = getApps().find(app => app.name === 'iot')
  ?? initializeApp(iotFirebaseConfig, 'iot');

// Realtime Database handle. Screens subscribe to it to get live bin data.
export const iotDb = getDatabase(iotApp);

// Real data needs a signed-in user on the IoT project, so sign in anonymously.
// With mock data there is no network call, so we skip it.
if (!USE_MOCK_IOT) {
  // On native, give this second app's Auth the same AsyncStorage persistence as the main app
  // (plain getAuth() falls back to memory persistence and logs a warning). initializeAuth
  // throws if it already ran for this app (e.g. on a hot reload), so fall back to getAuth.
  let iotAuth;
  try {
    iotAuth = Platform.OS === 'web'
      ? getAuth(iotApp)
      : initializeAuth(iotApp, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    iotAuth = getAuth(iotApp);
  }
  // Anonymous sign-in: a login without email or password. It only lets the app
  // read the sensor data. The catch only prints a warning, so a failure does not crash the app.
  signInAnonymously(iotAuth).catch(error => {
    if (error.code === 'auth/configuration-not-found') {
      // This code usually means Anonymous sign-in is not turned on in the Firebase console.
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
// Used when a seller has no binId in their profile.
export const DEFAULT_BIN_ID = 'bin001';
