/**
 * Get System Stats Cloud Function
 *
 * Returns system statistics for admin dashboard
 * Implements caching to reduce expensive queries - stats are cached for 1 hour
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds

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

    try {
      // Check for cached stats
      const cacheRef = db.collection("systemStats").doc("cache");
      const cacheDoc = await cacheRef.get();

      if (cacheDoc.exists) {
        const cachedData = cacheDoc.data();
        const cacheAge = Date.now() - (cachedData?.timestamp || 0);

        // Return cached data if it's less than 1 hour old
        if (cacheAge < CACHE_DURATION_MS) {
          console.log("Returning cached stats (age: " + Math.round(cacheAge / 1000) + "s)");
          return {
            totalUsers: cachedData?.totalUsers || 0,
            totalChats: cachedData?.totalChats || 0,
            totalMessages: cachedData?.totalMessages || 0,
            totalSources: cachedData?.totalSources || 0,
            totalChunks: cachedData?.totalChunks || 0,
            indexingStatus: cachedData?.indexingStatus || [],
            cached: true,
            cacheAge: Math.round(cacheAge / 1000) // age in seconds
          };
        }
      }

      console.log("Cache miss or stale - gathering fresh stats...");

      // Gather fresh statistics from Firestore
      const [usersSnapshot, sourcesSnapshot, chunksSnapshot] = await Promise.all([
        db.collection("users").get(),
        db.collection("contextSources").get(),
        db.collection("chunks").get()
      ]);

      const totalUsers = usersSnapshot.size;
      const totalSources = sourcesSnapshot.size;
      const totalChunks = chunksSnapshot.size;

      // Count total chats across all users
      let totalChats = 0;
      const chatPromises = usersSnapshot.docs.map(async (userDoc) => {
        const chatsSnapshot = await db
          .collection("users")
          .doc(userDoc.id)
          .collection("chats")
          .get();
        return chatsSnapshot.size;
      });
      const chatCounts = await Promise.all(chatPromises);
      totalChats = chatCounts.reduce((sum, count) => sum + count, 0);

      // Get indexing status for each source
      const indexingStatus = sourcesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          sourceId: doc.id,
          name: `${data.config?.owner}/${data.config?.repo}`,
          status: data.status?.state || "unknown",
          progress: data.status?.progress || 0,
          fileCount: data.stats?.fileCount || 0,
          chunkCount: data.stats?.chunkCount || 0
        };
      });

      const statsData = {
        totalUsers,
        totalChats,
        totalMessages: 0, // Not tracking messages separately for performance
        totalSources,
        totalChunks,
        indexingStatus,
        timestamp: Date.now(),
        cached: false
      };

      // Update cache in Firestore (don't await to speed up response)
      cacheRef.set(statsData, { merge: true }).catch(error => {
        console.error("Error updating stats cache:", error);
      });

      console.log("Returning fresh stats and updated cache");

      return statsData;
    } catch (error) {
      console.error("Error gathering stats:", error);
      throw new HttpsError("internal", "Failed to gather statistics");
    }
  }
);
