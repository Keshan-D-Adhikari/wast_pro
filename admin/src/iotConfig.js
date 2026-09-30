import { getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database";

// ── Development Mock IoT Telemetry ──────────────────────────────────────────
// Set VITE_USE_MOCK_IOT=true in .env or localStorage to simulate ESP32 smart bin
// telemetry in the Admin dashboard when physical hardware is offline.
export const USE_MOCK_IOT =
  import.meta.env.VITE_USE_MOCK_IOT === "true" ||
  (typeof window !== "undefined" && window.localStorage?.getItem("use_mock_iot") === "true");

export const MOCK_BIN_DATA_NORMAL = {
  plastic: {
    level: 45,
    weight: 2.4,
    status: "LOW",
    overweight: false,
    timestamp: "2026-09-30 04:30:00",
  },
  food: {
    level: 68,
    weight: 3.1,
    moisture: 54,
    status: "HALF",
    overweight: false,
    timestamp: "2026-09-30 04:30:00",
  },
  metal: {
    level: 82,
    weight: 5.2,
    status: "75%",
    overweight: false,
    timestamp: "2026-09-30 04:30:00",
  },
};

export const MOCK_BIN_DATA_ALERT = {
  plastic: {
    level: 100,
    weight: 8.5,
    status: "FULL",
    overweight: true,
    timestamp: "2026-09-30 04:30:00",
  },
  food: {
    level: 76,
    weight: 4.2,
    moisture: 78,
    status: "75%",
    overweight: false,
    timestamp: "2026-09-30 04:30:00",
  },
  metal: {
    level: 91,
    weight: 6.3,
    status: "FULL",
    overweight: false,
    timestamp: "2026-09-30 04:30:00",
  },
};

// ── Real IoT Firebase Realtime Database Connection ──────────────────────────
// Same IoT Firebase project the mobile app reads (see mobile/iotConfig.js) —
// the ESP32 firmware's live sensor readings, kept separate from the main
// Firestore project.
const iotFirebaseConfig = {
  apiKey: import.meta.env.VITE_IOT_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_IOT_FIREBASE_PROJECT_ID,
  databaseURL: import.meta.env.VITE_IOT_FIREBASE_DATABASE_URL,
};

const iotApp =
  getApps().find((app) => app.name === "iot") ??
  initializeApp(iotFirebaseConfig, "iot");

export const iotDb = getDatabase(iotApp);

if (!USE_MOCK_IOT) {
  const iotAuth = getAuth(iotApp);
  signInAnonymously(iotAuth).catch((error) => {
    console.warn("IoT project anonymous sign-in failed:", error);
  });
}

// Prototype bin identifier in RTDB: bins/Bin001/{plastic,food,metal}
export const BIN_ID = "Bin001";
