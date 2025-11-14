'use client';

import React, { useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';
import { firebaseConfig } from './config';


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
