'use client';

import React, { useMemo } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { FirebaseProvider } from './provider';
import { firebaseConfig } from './config';


export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebase = useMemo(() => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { app, auth, firestore };
  }, []);

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
