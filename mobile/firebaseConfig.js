import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC1xBVoXPMD-KlXhx5cwAUyjQ-oWsm8eqE",
  authDomain: "wast-pro.firebaseapp.com",
  projectId: "wast-pro",
  storageBucket: "wast-pro.firebasestorage.app",
  messagingSenderId: "1095195004878",
  appId: "1:1095195004878:web:771ce2725643c58420e59f",
  measurementId: "G-8QDZE4ESFL"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;