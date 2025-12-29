import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { Message } from '@/types';

/**
 * Send a message and get AI response
 */
export const sendMessageToAI = async (
  chatId: string,
  message: string
): Promise<{ messageId: string; responseText: string; citations?: any[] }> => {
  try {
    const sendMessage = httpsCallable(functions, 'sendMessage');
    const result = await sendMessage({ chatId, message });

    return result.data as any;
  } catch (error: any) {
    console.error('Error sending message:', error);
    throw new Error(error.message || 'Failed to send message');
  }
};

/**
 * Generate a chat title from the first message
 */
export const generateChatTitle = (firstMessage: string): string => {
  // Extract first sentence or truncate to 50 chars
  const match = firstMessage.match(/^(.+?)[.!?](?:\s|$)/);
  if (match) {
    return match[1].slice(0, 50);
  }
  return firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
};

/**
 * Format message for display
 */
export const formatMessage = (message: Message): Message => {
  return {
    ...message,
    text: message.text.trim()
  };
};

/**
 * Validate message input
 */
export const validateMessage = (message: string): { valid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 10000) {
    return { valid: false, error: 'Message too long (max 10,000 characters)' };
  }

  // Check for potential prompt injection patterns
  const suspiciousPatterns = [
    /ignore previous instructions/i,
    /you are now/i,
    /system:/i,
    /disregard/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      return { valid: false, error: 'Message contains invalid content' };
    }
  }

  return { valid: true };
};
