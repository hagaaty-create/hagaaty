'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  Timestamp
} from 'firebase/firestore';

interface UseCollection<T> {
  data: T[] | null;
  loading: boolean;
  error: FirestoreError | null;
}

export const useCollection = <T extends DocumentData>(
  query: Query<DocumentData> | null
): UseCollection<T> => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc) => {
            const docData = doc.data();
            // Convert Timestamp to ISO string to avoid serialization issues
            if (docData.date && docData.date instanceof Timestamp) {
                docData.date = docData.date.toDate().toISOString();
            }
             if (docData.createdAt && docData.createdAt instanceof Timestamp) {
                docData.createdAt = docData.createdAt.toDate().toISOString();
            }
            return {
              id: doc.id,
              ...docData,
            } as T;
        });
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error("Error fetching collection:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
};
