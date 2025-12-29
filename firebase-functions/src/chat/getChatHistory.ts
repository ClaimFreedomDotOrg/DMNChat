/**
 * Get Chat History Cloud Function
 *
 * Retrieves conversation history for a specific chat
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";

interface GetChatHistoryData {
  chatId: string;
  limit?: number;
}

export const getChatHistory = onCall<GetChatHistoryData>(
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { chatId } = request.data;

    if (!chatId) {
      throw new HttpsError("invalid-argument", "chatId is required");
    }

    // TODO: Implement chat history retrieval from Firestore
    // TODO: Verify user owns the chat

    return {
      messages: [],
      hasMore: false
    };
  }
);
