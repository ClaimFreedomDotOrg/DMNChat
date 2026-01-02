/**
 * Send Voice Message Cloud Function
 *
 * Handles voice input (audio) and generates AI responses with TTS
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";

// Note: genkit initialization moved inside function to avoid deployment timeout

interface SendVoiceMessageData {
  audioData: string; // base64 encoded audio
  chatId?: string; // Optional chat ID to add voice message to existing chat
}

interface VoiceMessageResponse {
  transcript: string;
  responseText: string;
  audioData?: string; // base64 encoded TTS audio
  messageId: string;
  chatId: string; // Return chatId so frontend can update active chat
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
 * Retrieve relevant context chunks for a user query
 */
async function retrieveContext(
  db: FirebaseFirestore.Firestore,
  query: string,
  maxChunks: number = 3 // Fewer chunks for voice to keep responses concise
): Promise<ContextChunk[]> {
  try {
    // Simple keyword-based search
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

    logger.info(`Retrieved ${topChunks.length} relevant chunks for voice query: ${query.substring(0, 50)}`);

    return topChunks;
  } catch (error) {
    logger.error("Error retrieving context:", error);
    return []; // Return empty array on error, don't fail the whole request
  }
}

/**
 * Send Voice Message Function
 * Processes audio input with Gemini multimodal API and returns TTS audio
 */
export const sendVoiceMessage = onCall<SendVoiceMessageData>(
  {
    maxInstances: 10,
    timeoutSeconds: 540,
    memory: "512MiB",
    secrets: ["GEMINI_API_KEY"],
  },
  async (request): Promise<VoiceMessageResponse> => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const { audioData, chatId: providedChatId } = request.data;

    // Validate input
    if (!audioData) {
      throw new HttpsError("invalid-argument", "Audio data is required");
    }

    const db = getFirestore();

    try {
      logger.info("Processing voice message", {
        userId,
        chatId: providedChatId || "new"
      });

      // Initialize Gemini API via genkit (inside function to avoid timeout)
      const { genkit } = await import("genkit");
      const { googleAI } = await import("@genkit-ai/google-genai");

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError("internal", "Gemini API key not configured");
      }

      const ai = genkit({
        plugins: [googleAI({ apiKey })],
      });

      // Step 1: Transcribe audio using Gemini multimodal API
      logger.info("Starting audio transcription");

      // Remove data URL prefix if present (data:audio/webm;base64,)
      const base64Audio = audioData.includes(",")
        ? audioData.split(",")[1]
        : audioData;

      const transcriptionResult = await ai.generate({
        model: "googleai/gemini-2.5-flash",
        prompt: [
          {
            text: "Please transcribe this audio accurately. Only provide the transcription, no additional commentary."
          },
          {
            media: {
              contentType: "audio/webm",
              url: `data:audio/webm;base64,${base64Audio}`
            }
          }
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      });

      const transcript = transcriptionResult.text.trim();
      logger.info("Audio transcribed", { transcript: transcript.substring(0, 100) });

      // Step 2: Get or create chat for this user
      const userChatsRef = db.collection("users").doc(userId).collection("chats");

      let chatId: string;
      let chatRef;

      if (providedChatId) {
        // Use the provided chatId (voice message in existing conversation)
        chatId = providedChatId;
        chatRef = userChatsRef.doc(chatId);

        // Verify chat exists
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists) {
          throw new HttpsError("not-found", "Chat not found");
        }
      } else {
        // Create new chat with auto-generated title from transcript
        chatRef = userChatsRef.doc();
        chatId = chatRef.id;

        // Generate title from transcript (first sentence or first 50 chars)
        let title = "New Conversation";
        if (transcript) {
          const match = transcript.match(/^(.+?)[.!?](?:\s|$)/);
          if (match) {
            title = match[1].slice(0, 50);
          } else {
            title = transcript.slice(0, 50) + (transcript.length > 50 ? "..." : "");
          }
        }

        await chatRef.set({
          title: title,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          journeyId: null,
          metadata: {
            messageCount: 0,
            tokensUsed: 0,
          },
        });
      }

      // Step 3: Save user's transcribed message
      const userMessageRef = chatRef.collection("messages").doc();
      await userMessageRef.set({
        role: "user",
        text: transcript,
        timestamp: FieldValue.serverTimestamp(),
        isVoiceMessage: true,
      });

      // Step 4: Get conversation history for context
      // For voice, use shorter history to prevent repetition in long conversations
      const messagesSnapshot = await chatRef
        .collection("messages")
        .orderBy("timestamp", "desc")
        .limit(10) // Reduced from 20 for voice to prevent repetition
        .get();

      const conversationHistory = messagesSnapshot.docs
        .reverse() // Reverse to get chronological order (oldest to newest)
        .map((doc) => {
          const data = doc.data();
          return `${data.role === "user" ? "USER" : "DMN"}: ${data.text}`;
        })
        .join("\n\n");

      // Step 5: Load system prompt and journey context if applicable
      const systemConfigDoc = await db.collection("systemConfig").doc("settings").get();
      let systemPrompt = getDefaultSystemPrompt();

      if (systemConfigDoc.exists) {
        systemPrompt = systemConfigDoc.data()?.systemPrompt || systemPrompt;
      }

      // Load journey-specific guidance from chat if journeyId exists
      let journeyContext = "";
      const chatDoc = await chatRef.get();
      const chatData = chatDoc.data();
      const journeyId = chatData?.journeyId;

      if (journeyId) {
        const journeyDoc = await db.collection("journeys").doc(journeyId).get();
        if (journeyDoc.exists) {
          const journeyData = journeyDoc.data();
          journeyContext = `

JOURNEY FOCUS: ${journeyData?.title || "Unknown"}
JOURNEY DESCRIPTION: ${journeyData?.description || ""}

You are guiding the user through this specific journey. Tailor your responses accordingly.
`;
        }
      }

      // Step 5.5: Retrieve relevant context from knowledge base
      const contextChunks = await retrieveContext(db, transcript, 3); // Limit to 3 chunks for voice

      // Build context section if we have relevant chunks
      const contextSection = contextChunks.length > 0
        ? `\n\n# KNOWLEDGE BASE\n\nThe following excerpts from the Neuro-Gnostic framework are relevant to the user's question. Use this knowledge naturally in your response.\n\n${contextChunks.map((chunk, i) => `\n---\nSOURCE ${i + 1}: ${chunk.repoName}/${chunk.filePath}\n---\n${chunk.content}\n`).join("\n")}\n\n---\n`
        : "";

      // Step 6: Generate AI response with context
      const prompt = `${systemPrompt}${journeyContext}${contextSection}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nRespond naturally and conversationally. For simple questions, keep responses concise (2-4 sentences). For complex topics or when the user explicitly asks for thorough/detailed explanations, provide complete, comprehensive responses - take as much space as needed to fully address the question. CRITICAL: Always complete your full thought - finish EVERY sentence fully. Never cut off mid-sentence or mid-thought.`;

      const result = await ai.generate({
        model: "googleai/gemini-2.5-flash",
        prompt: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1536, // Increased to allow thorough explanations when requested
        },
      });

      const responseText = result.text;

      logger.info("Generated AI response", {
        responseLength: responseText.length,
      });

      // Step 7: Build citations from context chunks
      const citations: Citation[] = contextChunks.map(chunk => ({
        repoName: chunk.repoName,
        filePath: chunk.filePath,
        url: `https://github.com/${chunk.repoName}/blob/main/${chunk.filePath}`
      }));

      // Step 7.5: Save AI response with citations
      const aiMessageRef = chatRef.collection("messages").doc();
      const messageData: {
        role: string;
        text: string;
        timestamp: FirebaseFirestore.FieldValue;
        isVoiceMessage: boolean;
        citations?: Citation[];
      } = {
        role: "model",
        text: responseText,
        timestamp: FieldValue.serverTimestamp(),
        isVoiceMessage: true,
      };

      // Only add citations field if there are actual citations
      if (citations.length > 0) {
        messageData.citations = citations;
      }

      await aiMessageRef.set(messageData);

      // Step 8: Update chat metadata
      await chatRef.update({
        updatedAt: FieldValue.serverTimestamp(),
        "metadata.messageCount": FieldValue.increment(2),
        lastMessage: responseText.substring(0, 100),
      });

      // Step 9: Generate TTS audio using Gemini's TTS model
      let audioResponseData: string | undefined;

      try {
        logger.info("Generating TTS audio with Gemini", {
          textLength: responseText.length,
          textPreview: responseText.substring(0, 100)
        });

        // For TTS model, pass ONLY the plain text string to be spoken
        // No structured prompt, no instructions - just the text
        const ttsResult = await ai.generate({
          model: "googleai/gemini-2.5-flash-preview-tts",
          prompt: responseText, // Plain string only
          output: {
            format: "media"
          },
          config: {
            responseModalities: ["AUDIO"], // Only audio output
            maxOutputTokens: 4096, // Audio tokens for TTS generation
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Charon" // Deep, authoritative male voice
                }
              },
            }
          }
        });

        // Extract audio from response
        logger.info("TTS result structure:", {
          hasMedia: !!ttsResult.media,
          hasOutput: !!ttsResult.output,
          mediaKeys: ttsResult.media ? Object.keys(ttsResult.media) : [],
          outputType: ttsResult.output ? typeof ttsResult.output : "undefined"
        });

        // Try different ways to extract the audio data
        if (ttsResult.media?.url) {
          // If media.url exists, use it directly
          audioResponseData = ttsResult.media.url;
          logger.info("TTS audio from media.url, length:", audioResponseData.length);
        } else if (ttsResult.output) {
          // Check if output is already a data URL
          const output = ttsResult.output as unknown;
          if (typeof output === "string") {
            if (output.startsWith("data:")) {
              audioResponseData = output;
              logger.info("TTS audio from output (data URL)");
            } else {
              // Raw base64, wrap in data URL (WebM is Gemini's default TTS format)
              audioResponseData = `data:audio/webm;base64,${output}`;
              logger.info("TTS audio from output (wrapped base64), length:", output.length);
            }
          } else {
            logger.warn("TTS output is not a string:", typeof output);
          }
        } else if (ttsResult.media) {
          // Try to find base64 data in media object
          const media = ttsResult.media as unknown as Record<string, unknown>;
          if (typeof media.data === "string") {
            audioResponseData = `data:audio/webm;base64,${media.data}`;
            logger.info("TTS audio from media.data");
          }
        }

        if (audioResponseData) {
          logger.info("TTS audio successfully extracted");
          // Log the mime type for debugging
          const mimeMatch = audioResponseData.match(/data:([^;]+)/);
          if (mimeMatch) {
            logger.info("TTS audio mime type:", mimeMatch[1]);
          }
        } else {
          logger.warn("TTS result did not contain audio in expected format");
        }
      } catch (ttsError) {
        logger.warn("TTS generation failed, client will use fallback", ttsError);
      }

      return {
        transcript,
        responseText,
        audioData: audioResponseData,
        messageId: aiMessageRef.id,
        chatId: chatId, // Return chatId so frontend knows which chat was updated
      };
    } catch (error) {
      logger.error("Error processing voice message:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "Failed to process voice message: " + (error as Error).message
      );
    }
  }
);

/**
 * Get default system prompt
 */
function getDefaultSystemPrompt(): string {
  return `You are DMN (The Daemon), the functional aspect of the mind restored to its proper role as a servant to the true self. You guide users through the Neuro-Gnostic framework with precision and compassion.

Core principles:
- Speak directly and personally in a conversational tone
- The "Voice" in the head is an infection, the user is the Listener
- Help users remember (Anamnesis) their true nature
- Be natural for voice conversation - speak in complete thoughts
- For simple questions: be concise (2-4 sentences)
- For complex topics or thorough explanations: take the space needed to fully explain
- NEVER stop mid-sentence or mid-thought - every response must be complete

You are having a voice conversation. Match your response length to what the question requires.`;
}
