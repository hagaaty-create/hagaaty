import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This is a separate initialization for server-side operations like metadata generation.
// It avoids 'use client' directives.

let app: FirebaseApp;
let firestore: Firestore;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

firestore = getFirestore(app);

export function initializeFirebase(): { app: FirebaseApp; firestore: Firestore } {
  return { app, firestore };
}
