/**
 * Send Message Cloud Function
 *
 * Handles user messages and generates AI responses with RAG context
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
// import { genkit } from "genkit";
// import { googleAI, gemini15Flash } from "@genkit-ai/googleai";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface SendMessageData {
  chatId: string;
  message: string;
}

interface Citation {
  repoName: string;
  filePath: string;
  url: string;
}

export const sendMessage = onCall<SendMessageData>(
  { secrets: [geminiApiKey] },
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated to send messages");
    }

    const userId = request.auth.uid;
    const { chatId, message } = request.data;

    // Input validation
    if (!chatId || !message) {
      throw new HttpsError("invalid-argument", "chatId and message are required");
    }

    if (message.length > 10000) {
      throw new HttpsError("invalid-argument", "Message too long (max 10,000 characters)");
    }

    try {
      const db = getFirestore();

      // Verify chat exists or create it
      const chatRef = db
        .collection("users")
        .doc(userId)
        .collection("chats")
        .doc(chatId);

      const chatDoc = await chatRef.get();
      if (!chatDoc.exists) {
        // Create the chat if it doesn't exist
        await chatRef.set({
          title: "New Chat",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          metadata: {
            messageCount: 0,
            tokensUsed: 0
          }
        });
      }

      // Save user message
      await chatRef
        .collection("messages")
        .add({
          role: "user",
          text: message,
          timestamp: FieldValue.serverTimestamp()
        });

      // TODO: Implement RAG context retrieval from chunks collection
      // For now, use a simple prompt without context

      const systemPrompt = `You are DMN (The Daemon), a guide for the Neuro-Gnostic framework from claimfreedom.org.
You help users understand their true nature beyond mental conditioning.
Be precise, compassionate, and direct.`;

      // Check if API key is available
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY secret not configured");
      }

      // Use Firebase AI (Vertex AI) with Genkit
      const { genkit } = await import("genkit");
      const { googleAI } = await import("@genkit-ai/googleai");

      // Initialize Genkit with Google AI plugin
      const ai = genkit({
        plugins: [googleAI({ apiKey })],
      });

      // Generate AI response - use working model name
      const { text } = await ai.generate({
        model: "googleai/gemini-2.5-flash",
        prompt: `${systemPrompt}\n\nUser: ${message}\n\nDMN:`,
        config: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      });

      // Save AI response
      const aiMessageRef = await chatRef
        .collection("messages")
        .add({
          role: "model",
          text: text,
          timestamp: FieldValue.serverTimestamp()
        });

      // Update chat metadata
      await chatRef
        .set({
          updatedAt: FieldValue.serverTimestamp(),
          lastMessage: text.substring(0, 100)
        }, { merge: true });

      return {
        messageId: aiMessageRef.id,
        responseText: text,
        citations: [] as Citation[]
      };
    } catch (error: unknown) {
      console.error("Error in sendMessage:", error);
      const err = error as Error;
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
      throw new HttpsError(
        "internal",
        `Failed to generate response: ${err.message || "Unknown error"}`
      );
    }
  }
);
