'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal representation of a Query object used to extract the path. */
interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString: () => string;
    }
  }
}

// Helper type to check for our memoization tag
type MemoizedRefOrQuery = (CollectionReference<DocumentData> | Query<DocumentData>) & { __memo?: boolean };


/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 * CRITICAL: The `targetRefOrQuery` passed to this hook MUST be memoized, ideally using
 * the `useMemoFirebase` hook. This prevents re-creating the query on every
 * render, which would cause an infinite loop of subscriptions.
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query, created with `useMemoFirebase`.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    targetRefOrQuery: MemoizedRefOrQuery | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  const getPath = (refOrQuery: MemoizedRefOrQuery): string => {
      return refOrQuery.type === 'collection'
          ? (refOrQuery as CollectionReference).path
          : (refOrQuery as unknown as InternalQuery)._query.path.canonicalString();
  }

  useEffect(() => {
    // Check for memoization tag if the reference is not null.
    if (targetRefOrQuery && !targetRefOrQuery.__memo) {
        const path = getPath(targetRefOrQuery);
        console.error(
            'useCollection Error: The query or reference passed to useCollection was not memoized with useMemoFirebase. This can lead to severe performance issues and infinite loops. Path:',
            path
        );
        // Throw an error in development to halt execution and force a fix.
        if (process.env.NODE_ENV === 'development') {
            throw new Error(`useCollection Error: Query/Reference for path "${path}" is not memoized. Use useMemoFirebase.`);
        }
    }


    if (!targetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const path = getPath(targetRefOrQuery);
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [targetRefOrQuery]); // Re-run if the target query/reference changes.

  return { data, isLoading, error };
}
