/**
 * Search Context Cloud Function
 *
 * Performs semantic search over indexed content chunks
 * Currently using keyword-based search until embeddings are generated
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

interface SearchContextData {
  query: string;
  maxResults?: number;
}

interface Chunk {
  sourceId: string;
  repoName: string;
  filePath: string;
  content: string;
  chunkIndex: number;
}

interface SearchResult {
  chunk: Chunk;
  score: number;
}

/**
 * Calculate keyword-based relevance score
 */
function calculateKeywordScore(content: string, query: string): number {
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();

  // Extract keywords (words longer than 3 characters)
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
  if (queryWords.length === 0) return 0;

  let score = 0;

  // Count keyword occurrences
  for (const word of queryWords) {
    const regex = new RegExp(word, "gi");
    const matches = contentLower.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  // Boost score if exact phrase appears
  if (contentLower.includes(queryLower)) {
    score += 10;
  }

  return score;
}

export const searchContext = onCall<SearchContextData>(
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { query, maxResults = 10 } = request.data;

    if (!query) {
      throw new HttpsError("invalid-argument", "query is required");
    }

    try {
      const db = getFirestore();

      // Get all chunks (TODO: optimize with better indexing/embeddings)
      const chunksSnapshot = await db.collection("chunks").limit(500).get();

      if (chunksSnapshot.empty) {
        logger.info("No chunks found in database");
        return {
          chunks: [],
          totalResults: 0
        };
      }

      const results: SearchResult[] = [];

      // Score each chunk
      chunksSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const chunk: Chunk = {
          sourceId: data.sourceId,
          repoName: data.repoName,
          filePath: data.filePath,
          content: data.content,
          chunkIndex: data.chunkIndex
        };

        const score = calculateKeywordScore(chunk.content, query);

        if (score > 0) {
          results.push({ chunk, score });
        }
      });

      // Sort by score and take top results
      results.sort((a, b) => b.score - a.score);
      const topResults = results.slice(0, maxResults);

      logger.info(`Found ${results.length} relevant chunks, returning top ${topResults.length}`);

      return {
        chunks: topResults.map(r => r.chunk),
        totalResults: results.length
      };
    } catch (error) {
      logger.error("Error searching context:", error);
      throw new HttpsError("internal", "Failed to search context");
    }
  }
);
