// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration - Get this from Firebase Console > Project Settings > Web App
const firebaseConfig = {
  apiKey: "AIzaSyAqO5aT-PMapefOhx1xoohJWXltjzaV4IM",
  authDomain: "insurance-fraud-detectio-a6526.firebaseapp.com",
  projectId: "insurance-fraud-detectio-a6526",
  storageBucket: "insurance-fraud-detectio-a6526.firebasestorage.app",
  messagingSenderId: "117593581001",
  appId: "1:117593581001:web:3052a62f77e1190f5bf418",
  measurementId: "G-BXEH09G6X8"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore (for storing user data)
export const db = getFirestore(app);

export default app;