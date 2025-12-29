import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Set a user's role to admin
 * This function should only be called by existing admins or during initial setup
 */
export const setAdminRole = onCall(async (request) => {
  const db = getFirestore();
  const auth = getAuth();

  // Check if caller is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  // For initial setup: allow any authenticated user to become first admin if no admins exist
  const usersSnapshot = await db.collection('users')
    .where('role', '==', 'admin')
    .limit(1)
    .get();

  const hasExistingAdmin = !usersSnapshot.empty;

  // If admins exist, verify caller is admin
  if (hasExistingAdmin) {
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();
    const callerData = callerDoc.data();

    if (!callerData || callerData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admins can set admin role');
    }
  }

  // Get target user email from request
  const { email } = request.data;
  if (!email) {
    throw new HttpsError('invalid-argument', 'Email is required');
  }

  try {
    // Find user by email
    const userRecord = await auth.getUserByEmail(email);

    // Update user role in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      role: 'admin'
    }, { merge: true });

    return {
      success: true,
      message: `User ${email} is now an admin`,
      uid: userRecord.uid
    };
  } catch (error: any) {
    console.error('Error setting admin role:', error);
    throw new HttpsError('internal', error.message || 'Failed to set admin role');
  }
});
