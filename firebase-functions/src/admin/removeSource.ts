/**
 * Remove Context Source Cloud Function
 *
 * Removes a context source and all associated chunks
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

interface RemoveSourceData {
  sourceId: string;
}

export const removeContextSource = onCall<RemoveSourceData>(
  async (request) => {
    // Admin check
    if (!request.auth || !request.auth.token.admin) {
      throw new HttpsError("permission-denied", "Admin access required");
    }

    const { sourceId } = request.data;

    if (!sourceId) {
      throw new HttpsError("invalid-argument", "sourceId is required");
    }

    try {
      const db = getFirestore();

      logger.info("Starting removal of context source", { sourceId });

      // Get all chunks associated with this source
      const chunksSnapshot = await db
        .collection("chunks")
        .where("sourceId", "==", sourceId)
        .get();

      logger.info(`Found ${chunksSnapshot.size} chunks to delete`);

      // Delete chunks in batches (Firestore batch limit is 500)
      const BATCH_SIZE = 500;
      let deletedCount = 0;

      for (let i = 0; i < chunksSnapshot.docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchDocs = chunksSnapshot.docs.slice(i, i + BATCH_SIZE);

        for (const doc of batchDocs) {
          batch.delete(doc.ref);
        }

        await batch.commit();
        deletedCount += batchDocs.length;
        logger.info(`Deleted ${deletedCount}/${chunksSnapshot.size} chunks`);
      }

      // Delete the context source document
      await db.collection("contextSources").doc(sourceId).delete();

      logger.info("Context source removed successfully", {
        sourceId,
        chunksDeleted: deletedCount
      });

      return {
        success: true,
        chunksDeleted: deletedCount,
        message: `Removed source and ${deletedCount} associated chunks`
      };
    } catch (error) {
      logger.error("Error removing context source:", error);
      throw new HttpsError(
        "internal",
        `Failed to remove source: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
);
