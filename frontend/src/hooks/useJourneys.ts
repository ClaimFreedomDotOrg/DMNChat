/**
 * useJourneys Hook
 *
 * Provides access to Journey data and operations
 */

import { useState, useEffect } from 'react';
import { Journey } from '@/types';
import { subscribeToActiveJourneys, subscribeToAllJourneys } from '@/services/journeyService';

/**
 * Hook to access active journeys
 */
export function useJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToActiveJourneys((updatedJourneys) => {
        setJourneys(updatedJourneys);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { journeys, loading, error };
}

/**
 * Hook to access all journeys (admin only)
 */
export function useAllJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToAllJourneys((updatedJourneys) => {
        setJourneys(updatedJourneys);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, []);

  return { journeys, loading, error };
}
