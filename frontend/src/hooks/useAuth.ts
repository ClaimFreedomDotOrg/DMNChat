import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getUserProfile } from '@/services/authService';
import { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          try {
            const profile = await getUserProfile(user.uid);
            setState({
              user,
              profile,
              loading: false,
              error: null
            });
          } catch (error) {
            setState({
              user,
              profile: null,
              loading: false,
              error: error as Error
            });
          }
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      },
      (error) => {
        setState({
          user: null,
          profile: null,
          loading: false,
          error: error as Error
        });
      }
    );

    return () => unsubscribe();
  }, []);

  return state;
};
