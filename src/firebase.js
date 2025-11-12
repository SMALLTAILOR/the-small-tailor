// Firebase initialization (modular v9+)
// Reads configuration from environment variables so keys are not hard-coded.
// Usage: import { db } from './firebase';

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "<REPLACE>",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "<REPLACE>",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "<REPLACE>",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "<REPLACE>",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "<REPLACE>",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "<REPLACE>"
};

// Initialize Firebase app and services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
