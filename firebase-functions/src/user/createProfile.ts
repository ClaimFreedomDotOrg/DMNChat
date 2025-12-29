/**
 * Create User Profile Cloud Function
 *
 * Creates a user profile document when a new user signs up
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

interface CreateProfileData {
  displayName?: string;
}

export const createUserProfile = onCall<CreateProfileData>(
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const { displayName } = request.data;

    const db = getFirestore();
    const userRef = db.collection("users").doc(userId);

    // Check if profile already exists
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      throw new HttpsError("already-exists", "User profile already exists");
    }

    // Create user profile
    await userRef.set({
      uid: userId,
      email: request.auth.token.email || null,
      displayName: displayName || null,
      createdAt: FieldValue.serverTimestamp(),
      lastLoginAt: FieldValue.serverTimestamp(),
      preferences: {
        theme: "dark",
        language: "en",
        notifications: true
      },
      role: "user"
    });

    return {
      success: true,
      userId
    };
  }
);
