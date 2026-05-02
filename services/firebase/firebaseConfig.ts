import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
// import { getStorage } from 'firebase/storage'; // Skipping Storage for now

// @ts-ignore — React Native persistence adapter
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase project configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA-c4yed06mVTwDkLelt8jM37SXjCtuS9o",
  authDomain: "smd-project-app.firebaseapp.com",
  databaseURL: "https://smd-project-app-default-rtdb.firebaseio.com", // Added default RTDB URL
  projectId: "smd-project-app",
  storageBucket: "smd-project-app.firebasestorage.app",
  messagingSenderId: "176410159575",
  appId: "1:176410159575:web:d9b8b9a9f1b460a0ccc392",
};

// Initialize Firebase (prevent re-initialization in dev hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Auth already initialized (hot reload)
  auth = getAuth(app);
}

// Initialize Realtime Database
const database = getDatabase(app);

// Initialize Storage
// const storage = getStorage(app); // Skipping Storage

export { app, auth, database /*, storage */ };
