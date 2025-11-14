'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

// This is the correct place to build the config object on the client
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebase = useMemo(() => initializeFirebase(firebaseConfig), []);

  return (
    <FirebaseProvider
      value={{
        app: firebase.app,
        auth: firebase.auth,
        firestore: firebase.firestore,
      }}
    >
      {children}
    </FirebaseProvider>
  );
}
