/**
 * Send Message Cloud Function
 *
 * Handles user messages and generates AI responses with RAG context
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

// Member Level Configuration
interface MemberLevel {
  name: string;
  displayName: string;
  messagesPerDay: number;
  description?: string;
}

// Type for system config stored in Firestore
interface SystemConfig {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    maxChunks: number;
    minSimilarity: number;
  };
  systemPrompt: string;
  memberLevels: MemberLevel[];
  defaultMemberLevel: string;
}

interface SendMessageData {
  chatId: string;
  message: string;
  journeyId?: string; // Optional journey ID for specialized guidance
}

interface Citation {
  repoName: string;
  filePath: string;
  url: string;
}

interface ContextChunk {
  repoName: string;
  filePath: string;
  content: string;
  chunkIndex: number;
}

/**
 * Load system configuration from Firestore with fallback defaults
 * Uses defaults if config doesn't exist to allow deployment without pre-configuration
 */
async function loadSystemConfig(db: FirebaseFirestore.Firestore): Promise<SystemConfig> {
  try {
    const configDoc = await db.collection("systemConfig").doc("settings").get();

    if (!configDoc.exists) {
      logger.warn("System config not found, using defaults");
      return getDefaultConfig();
    }

    const data = configDoc.data();
    if (!data?.ai || !data?.rag || !data?.systemPrompt || !data?.memberLevels || !data?.defaultMemberLevel) {
      logger.warn("System config incomplete, merging with defaults");
      const defaults = getDefaultConfig();
      return {
        ai: data?.ai || defaults.ai,
        rag: data?.rag || defaults.rag,
        systemPrompt: data?.systemPrompt || defaults.systemPrompt,
        memberLevels: data?.memberLevels || defaults.memberLevels,
        defaultMemberLevel: data?.defaultMemberLevel || defaults.defaultMemberLevel,
      };
    }

    return {
      ai: data.ai,
      rag: data.rag,
      systemPrompt: data.systemPrompt,
      memberLevels: data.memberLevels,
      defaultMemberLevel: data.defaultMemberLevel,
    };
  } catch (error) {
    logger.error("Error loading system config, using defaults:", error);
    return getDefaultConfig();
  }
}

/**
 * Get default system configuration
 */
function getDefaultConfig(): SystemConfig {
  return {
    ai: {
      model: "gemini-2.0-flash-exp",
      temperature: 0.7,
      maxTokens: 2000
    },
    rag: {
      chunkSize: 1500,
      chunkOverlap: 200,
      maxChunks: 5,
      minSimilarity: 0.7
    },
    memberLevels: [
      {
        name: "free",
        displayName: "Free Seeker",
        messagesPerDay: 9,
        description: "Begin your journey with 9 messages per day to explore the framework"
      }
    ],
    defaultMemberLevel: "free",
    systemPrompt: "You are DMN (The Daemon), an AI assistant helping users understand the Neuro-Gnostic framework. Provide clear, helpful responses based on the available context."
  };
}

/**
 * Retrieve relevant context chunks for a user query
 */
async function retrieveContext(
  db: FirebaseFirestore.Firestore,
  query: string,
  maxChunks: number = 5
): Promise<ContextChunk[]> {
  try {
    // Simple keyword-based search until we implement embeddings
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 3);

    if (keywords.length === 0) {
      logger.info("No significant keywords in query");
      return [];
    }

    // Get all chunks (TODO: optimize with embeddings and vector search)
    const chunksSnapshot = await db.collection("chunks").limit(200).get();

    if (chunksSnapshot.empty) {
      logger.info("No chunks found in database");
      return [];
    }

    const results: Array<{ chunk: ContextChunk; score: number }> = [];

    // Score each chunk based on keyword matches
    chunksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const content = data.content.toLowerCase();

      let score = 0;
      for (const keyword of keywords) {
        const matches = (content.match(new RegExp(keyword, "gi")) || []).length;
        score += matches;
      }

      // Boost if exact phrase appears
      if (content.includes(queryLower)) {
        score += 10;
      }

      if (score > 0) {
        results.push({
          chunk: {
            repoName: data.repoName,
            filePath: data.filePath,
            content: data.content,
            chunkIndex: data.chunkIndex
          },
          score
        });
      }
    });

    // Sort by relevance and return top chunks
    results.sort((a, b) => b.score - a.score);
    const topChunks = results.slice(0, maxChunks).map(r => r.chunk);

    logger.info(`Retrieved ${topChunks.length} relevant chunks for query: ${query.substring(0, 50)}`);

    return topChunks;
  } catch (error) {
    logger.error("Error retrieving context:", error);
    return []; // Return empty array on error, don't fail the whole request
  }
}

export const sendMessage = onCall<SendMessageData>(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated to send messages");
    }

    const userId = request.auth.uid;
    const { chatId, message, journeyId } = request.data;

    // Input validation
    if (!chatId || !message) {
      throw new HttpsError("invalid-argument", "chatId and message are required");
    }

    if (message.length > 10000) {
      throw new HttpsError("invalid-argument", "Message too long (max 10,000 characters)");
    }

    try {
      const db = getFirestore();

      // Load system configuration to get member level limits
      const systemConfig = await loadSystemConfig(db);

      // Load journey if journeyId is provided
      let journeySystemPrompt: string | null = null;
      if (journeyId) {
        try {
          const journeyDoc = await db.collection("journeys").doc(journeyId).get();
          if (journeyDoc.exists && journeyDoc.data()?.isActive) {
            journeySystemPrompt = journeyDoc.data()?.systemPrompt;
            logger.info(`Using journey-specific system prompt: ${journeyDoc.data()?.title}`);
          } else {
            logger.warn(`Journey not found or inactive: ${journeyId}`);
          }
        } catch (error) {
          logger.error("Error loading journey:", error);
          // Continue with default system prompt
        }
      }

      // Check message limits for user's member level
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User profile not found");
      }

      const userData = userDoc.data();
      let memberLevel = userData?.memberLevel;

      // If memberLevel is missing, set it to "free" and update the user document
      if (!memberLevel) {
        memberLevel = "free";
        await userRef.update({
          memberLevel: "free"
        });
        logger.info(`Set default member level "free" for user ${userId}`);
      }

      const messageUsage = userData?.messageUsage || { count: 0, resetAt: Date.now() };

      // Find the member level configuration
      const levelConfig = systemConfig.memberLevels.find(level => level.name === memberLevel);

      if (!levelConfig) {
        logger.warn(`Member level not found: ${memberLevel}, using default`);
        // Use default level if current level not found
        const defaultLevel = systemConfig.memberLevels.find(
          level => level.name === systemConfig.defaultMemberLevel
        );
        if (!defaultLevel) {
          throw new HttpsError("internal", "System configuration error: no valid member levels");
        }
      }

      // Reset counter if it's a new day
      const now = Date.now();
      if (now >= messageUsage.resetAt) {
        messageUsage.count = 0;
        messageUsage.resetAt = getNextMidnight();
      }

      // Check if user has exceeded their daily limit
      if (levelConfig && levelConfig.messagesPerDay !== -1) {
        if (messageUsage.count >= levelConfig.messagesPerDay) {
          throw new HttpsError(
            "resource-exhausted",
            `Daily message limit reached. Your ${levelConfig.displayName} tier allows ${levelConfig.messagesPerDay} messages per day. Limit resets at midnight UTC.`
          );
        }
      }

      // Increment message count
      messageUsage.count += 1;

      // Update user's message usage
      await userRef.update({
        messageUsage: {
          count: messageUsage.count,
          resetAt: messageUsage.resetAt
        }
      });

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
          journeyId: journeyId || null, // Store journey reference
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

      // Retrieve conversation history (last 10 messages)
      const historySnapshot = await chatRef
        .collection("messages")
        .orderBy("timestamp", "desc")
        .limit(11) // Get last 11 (including the one we just added)
        .get();

      // Convert to array and reverse to get chronological order
      const historyMessages = historySnapshot.docs
        .map(doc => ({
          role: doc.data().role,
          text: doc.data().text
        }))
        .reverse()
        .slice(0, -1); // Remove the last one (the message we just added)

      logger.info(`Retrieved ${historyMessages.length} previous messages for context`);

      // Retrieve relevant context chunks using config
      const contextChunks = await retrieveContext(db, message, systemConfig.rag.maxChunks);

      logger.info(`Using AI model: ${systemConfig.ai.model}, temperature: ${systemConfig.ai.temperature}`);

      // Build context-aware prompt
      const contextSection = contextChunks.length > 0
        ? `\n\n# LOADED KNOWLEDGE BASE\n\nThe following excerpts from the Neuro-Gnostic framework documentation are relevant to the user's question. Use this knowledge to provide accurate, grounded responses. Cite sources naturally when appropriate.\n\n${contextChunks.map((chunk, i) => `\n---\nSOURCE ${i + 1}: ${chunk.repoName}/${chunk.filePath}\n---\n${chunk.content}\n`).join("\n")}\n\n---\n`
        : "";

      // Build conversation history section
      let historySection = "";
      if (historyMessages.length > 0) {
        const formattedHistory = historyMessages.map(msg => {
          const role = msg.role === "user" ? "User" : "DMN";
          return `${role}: ${msg.text}`;
        }).join("\n\n");

        historySection = `\n\n# CONVERSATION HISTORY\n\nThe following is the recent conversation history. Use this context to provide coherent, contextually relevant responses that build on previous exchanges.\n\n${formattedHistory}\n\n---\n`;
      }

      // Check if API key is available
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY secret not configured");
      }

      // CRITICAL: Dynamically import Genkit modules to reduce cold start time
      // DO NOT MOVE THESE TO TOP-LEVEL IMPORTS - IT CAUSES DEPLOYMENT TIMEOUT
      // The genkit and googleAI imports MUST remain dynamic to avoid Firebase deployment analyzer timeout
      const { genkit } = await import("genkit");
      const { googleAI } = await import("@genkit-ai/google-genai");

      // Initialize Genkit with Google AI plugin
      const ai = genkit({
        plugins: [googleAI({ apiKey })],
      });

      // Generate AI response with context using config from database
      // Use journey-specific system prompt if available, otherwise use default
      const effectiveSystemPrompt = journeySystemPrompt || systemConfig.systemPrompt;

      const { text } = await ai.generate({
        model: googleAI.model(systemConfig.ai.model),
        prompt: `${effectiveSystemPrompt}${contextSection}${historySection}\n\nUser: ${message}\n\nDMN:`,
        config: {
          temperature: systemConfig.ai.temperature,
          maxOutputTokens: systemConfig.ai.maxTokens,
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

      // Build citations from context chunks
      const citations: Citation[] = contextChunks.map(chunk => ({
        repoName: chunk.repoName,
        filePath: chunk.filePath,
        url: `https://github.com/${chunk.repoName}/blob/main/${chunk.filePath}`
      }));

      return {
        messageId: aiMessageRef.id,
        responseText: text,
        citations
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

/**
 * Get timestamp for next midnight UTC
 */
function getNextMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.getTime();
}
