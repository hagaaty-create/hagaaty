'use client';

import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  Timestamp
} from 'firebase/firestore';

interface UseDoc<T> {
  data: T | null;
  loading: boolean;
  error: FirestoreError | null;
}

export const useDoc = <T extends DocumentData>(
  ref: DocumentReference<DocumentData> | null
): UseDoc<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
           const docData = snapshot.data();
            // Convert Timestamp to ISO string to avoid serialization issues
            if (docData.date && docData.date instanceof Timestamp) {
                docData.date = docData.date.toDate().toISOString();
            }
             if (docData.createdAt && docData.createdAt instanceof Timestamp) {
                docData.createdAt = docData.createdAt.toDate().toISOString();
            }
          setData({ id: snapshot.id, ...docData } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error("Error fetching document:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
};
