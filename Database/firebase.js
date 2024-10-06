import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_APP_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
    db, auth
}
