'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

// Helper type to check for our memoization tag
type MemoizedRef = DocumentReference<DocumentData> & { __memo?: boolean };


/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * CRITICAL: The `docRef` passed to this hook MUST be memoized, ideally using
 * the `useMemoFirebase` hook. This prevents re-creating the reference on every
 * render, which would cause an infinite loop of subscriptions.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference, created with `useMemoFirebase`.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  docRef: MemoizedRef | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // Check for memoization tag if the reference is not null.
    if (docRef && !docRef.__memo) {
      console.error(
        'useDoc Error: The DocumentReference passed to useDoc was not memoized with useMemoFirebase. This can lead to severe performance issues and infinite loops. Path:',
        docRef.path
      );
      // Throw an error in development to halt execution and force a fix.
      if (process.env.NODE_ENV === 'development') {
          throw new Error(`useDoc Error: DocumentReference for path "${docRef.path}" is not memoized. Use useMemoFirebase.`);
      }
    }

    if (!docRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist
          setData(null);
        }
        setError(null); // Clear any previous error on successful snapshot (even if doc doesn't exist)
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: docRef.path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [docRef]); // Re-run if the memoized docRef changes.

  return { data, isLoading, error };
}
