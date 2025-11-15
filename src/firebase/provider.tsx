'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; 
}

// Create the context with a default undefined value
const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);


/**
 * FirebaseProvider manages and provides Firebase services.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
    };
  }, [firebaseApp, firestore, auth]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


/**
 * Hook to access the core Firebase service instances.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useFirebaseServices = (): Omit<FirebaseContextState, 'areServicesAvailable'> => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  
  if (!context.firebaseApp || !context.firestore || !context.auth) {
      throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
  };
};


/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebaseServices();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseServices();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseServices();
  return firebaseApp;
};

// A helper type that "tags" a memoized value.
type Memoized<T> = T & { __memo: true };

/**
 * A custom hook that works like React.useMemo but also "tags" the returned
 * value with a hidden property. This allows other hooks like useCollection
 * and useDoc to verify that they are receiving a memoized value, preventing
 * accidental infinite loops.
 *
 * @param factory The function that creates the value to be memoized.
 * @param deps The dependency array for useMemo.
 * @returns The memoized value, tagged for verification.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
    const memoized = useMemo(factory, deps);

    // Tag the object if it's a non-null object. Primitives can't be tagged.
    if (memoized && typeof memoized === 'object') {
        Object.defineProperty(memoized, '__memo', {
            value: true,
            writable: false,
            configurable: true,
            enumerable: false
        });
    }
    
    return memoized as T;
}


// Duplicating useUser hook here to resolve circular dependency
// This hook now stands alone and can be used by any component.
interface UseUser {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export const useUser = (): UseUser => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(auth?.currentUser || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, isLoading, error };
};

// This hook is now a combination of services and the user state
export const useFirebase = () => {
    const services = useFirebaseServices();
    const userState = useUser();
    return { ...services, ...userState };
}
