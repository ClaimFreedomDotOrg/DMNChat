import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

/**
 * Update a user's role (admin only)
 * Only existing admins can grant/revoke admin status
 */
export const updateUserRole = onCall(async (request) => {
  const db = getFirestore();

  // Check if caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify caller is admin
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can update user roles');
  }

  // Get target user and new role from request
  const { userId, role } = request.data;

  if (!userId || !role) {
    throw new HttpsError('invalid-argument', 'userId and role are required');
  }

  if (role !== 'user' && role !== 'admin') {
    throw new HttpsError('invalid-argument', 'role must be either "user" or "admin"');
  }

  try {
    // Update user role in Firestore
    await db.collection('users').doc(userId).set({
      role: role
    }, { merge: true });

    logger.info(`User ${userId} role updated to ${role} by ${request.auth.uid}`);

    return {
      success: true,
      message: `User role updated to ${role}`,
      userId: userId
    };
  } catch (error: any) {
    logger.error('Error updating user role:', error);
    throw new HttpsError('internal', error.message || 'Failed to update user role');
  }
});
