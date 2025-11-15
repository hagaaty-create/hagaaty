import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This is a separate initialization for server-side operations like metadata generation.
// It avoids 'use client' directives.

let app: FirebaseApp;
let firestore: Firestore;

/**
 * Initializes and returns the server-side Firebase app and Firestore instances.
 * It ensures that initialization happens only once.
 * This function is designed to be called at the beginning of any server-side
 * function that needs to interact with Firebase.
 */
export const initializeFirebase = (): { app: FirebaseApp; firestore: Firestore } => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  firestore = getFirestore(app);
  return { app, firestore };
}
