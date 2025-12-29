import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '@/types';

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  try {
    const credential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Create user profile in Firestore
    const userRef = doc(db, 'users', credential.user.uid);
    await setDoc(userRef, {
      uid: credential.user.uid,
      email: email,
      displayName: displayName || null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      preferences: {
        theme: 'dark',
        language: 'en'
      },
      role: 'user'
    });

    return credential.user;
  } catch (error: any) {
    throw new Error(handleAuthError(error));
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login time
    const userRef = doc(db, 'users', credential.user.uid);
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });

    return credential.user;
  } catch (error: any) {
    throw new Error(handleAuthError(error));
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error('Failed to sign out');
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Handle Firebase Auth errors with user-friendly messages
 */
function handleAuthError(error: any): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return error.message || 'An error occurred during authentication.';
  }
}
