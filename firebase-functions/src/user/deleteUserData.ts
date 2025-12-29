/**
 * Delete User Data Cloud Function
 *
 * Deletes all user data for GDPR compliance
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const deleteUserData = onCall(
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const userId = request.auth.uid;
    const db = admin.firestore();
    const batch = db.batch();

    try {
      // Delete user profile
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);

      // Delete user chats and messages
      const chatsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('chats')
        .get();

      for (const chatDoc of chatsSnapshot.docs) {
        // Delete messages subcollection
        const messagesSnapshot = await chatDoc.ref
          .collection('messages')
          .get();

        messagesSnapshot.docs.forEach(msgDoc => {
          batch.delete(msgDoc.ref);
        });

        batch.delete(chatDoc.ref);
      }

      await batch.commit();

      // Delete Firebase Auth account
      await admin.auth().deleteUser(userId);

      return {
        success: true,
        message: 'User data deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new HttpsError('internal', 'Failed to delete user data');
    }
  }
);
