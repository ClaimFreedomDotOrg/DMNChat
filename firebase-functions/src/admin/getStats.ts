/**
 * Get System Stats Cloud Function
 *
 * Returns system statistics for admin dashboard
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

export const getSystemStats = onCall(
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    // Admin check - verify user role in Firestore
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(request.auth.uid).get();

    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    // TODO: Gather statistics from Firestore
    // TODO: Calculate usage metrics

    return {
      totalUsers: 0,
      totalChats: 0,
      totalMessages: 0,
      totalSources: 0,
      totalChunks: 0,
      indexingStatus: []
    };
  }
);
