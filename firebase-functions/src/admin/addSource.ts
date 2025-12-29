/**
 * Add Context Source Cloud Function
 *
 * Adds a new context source (GitHub repository) to the system
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

interface AddSourceData {
  type: "github";
  config: {
    owner: string;
    repo: string;
    branch: string;
  };
}

export const addContextSource = onCall<AddSourceData>(
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

    const { type, config } = request.data;

    if (type !== "github") {
      throw new HttpsError("invalid-argument", "Only github type is supported");
    }

    if (!config || !config.owner || !config.repo || !config.branch) {
      throw new HttpsError("invalid-argument", "Invalid config");
    }

    // TODO: Create context source document
    // TODO: Trigger indexing

    return {
      sourceId: "temp-id",
      status: "pending"
    };
  }
);
