/**
 * Send Message Cloud Function
 *
 * Handles user messages and generates AI responses with RAG context
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface SendMessageData {
  chatId: string;
  message: string;
}

export const sendMessage = onCall<SendMessageData>(
  { secrets: [geminiApiKey] },
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated to send messages');
    }

    const userId = request.auth.uid;
    const { chatId, message } = request.data;

    // Input validation
    if (!chatId || !message) {
      throw new HttpsError('invalid-argument', 'chatId and message are required');
    }

    if (message.length > 10000) {
      throw new HttpsError('invalid-argument', 'Message too long (max 10,000 characters)');
    }

    // TODO: Implement rate limiting
    // TODO: Implement RAG context retrieval
    // TODO: Implement Gemini API call
    // TODO: Save messages to Firestore

    return {
      messageId: 'temp-id',
      responseText: 'Response generation not yet implemented',
      citations: []
    };
  }
);
