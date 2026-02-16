/**
 * Journey Service
 *
 * Handles CRUD operations for Journeys
 */

import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Journey } from '@/types';

/**
 * Get all active journeys
 */
export async function getActiveJourneys(): Promise<Journey[]> {
  const journeysRef = collection(db, 'journeys');
  const q = query(journeysRef, where('isActive', '==', true), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Journey[];
}

/**
 * Get all journeys (admin only)
 */
export async function getAllJourneys(): Promise<Journey[]> {
  const journeysRef = collection(db, 'journeys');
  const q = query(journeysRef, orderBy('order', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Journey[];
}

/**
 * Get a single journey by ID
 */
export async function getJourneyById(journeyId: string): Promise<Journey | null> {
  const journeyRef = doc(db, 'journeys', journeyId);
  const snapshot = await getDoc(journeyRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Journey;
}

/**
 * Subscribe to active journeys (real-time updates)
 */
export function subscribeToActiveJourneys(
  callback: (journeys: Journey[]) => void
): () => void {
  const journeysRef = collection(db, 'journeys');
  const q = query(journeysRef, where('isActive', '==', true), orderBy('order', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const journeys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Journey[];
      callback(journeys);
    },
    (error) => {
      console.error('Error subscribing to active journeys:', error);
      // Return empty array on error to prevent component crashes
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to all journeys (admin only, real-time updates)
 */
export function subscribeToAllJourneys(
  callback: (journeys: Journey[]) => void
): () => void {
  const journeysRef = collection(db, 'journeys');
  const q = query(journeysRef, orderBy('order', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const journeys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Journey[];
      callback(journeys);
    },
    (error) => {
      console.error('Error subscribing to all journeys:', error);
      // Return empty array on error to prevent component crashes
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * Create a new journey (admin only)
 */
export async function createJourney(
  journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const journeysRef = collection(db, 'journeys');

  const now = Date.now();
  const docRef = await addDoc(journeysRef, {
    ...journey,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

/**
 * Update an existing journey (admin only)
 */
export async function updateJourney(
  journeyId: string,
  updates: Partial<Omit<Journey, 'id' | 'createdAt'>>
): Promise<void> {
  const journeyRef = doc(db, 'journeys', journeyId);

  await updateDoc(journeyRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a journey (admin only)
 */
export async function deleteJourney(journeyId: string): Promise<void> {
  const journeyRef = doc(db, 'journeys', journeyId);
  await deleteDoc(journeyRef);
}
