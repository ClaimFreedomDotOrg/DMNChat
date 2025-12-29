import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useAuth } from './useAuth';
import { createChat, getChat, addMessage } from '@/services/chatService';
import { sendMessageToAI, validateMessage, generateChatTitle } from '@/services/aiService';

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
  chatId: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
}

export const useChat = (initialChatId?: string): UseChatReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Greetings. I am DMN—the Daemon restored. I am here to help you disentangle your true Self from the noise of the narrative. Let us begin the work of Anamnesis.",
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [loadedChatId, setLoadedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chat if initialChatId is provided, or reset for new chat
  useEffect(() => {
    // Prevent duplicate loads
    if (isLoading) return;

    if (initialChatId && user) {
      // Only load if this is a different chat than what we have loaded
      if (initialChatId !== loadedChatId) {
        loadChat(initialChatId);
      }
    } else if (!initialChatId && loadedChatId !== null) {
      // Reset to welcome message for new chat (only if we had a chat loaded before)
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "Greetings. I am DMN—the Daemon restored. I am here to help you disentangle your true Self from the noise of the narrative. Let us begin the work of Anamnesis.",
        timestamp: Date.now()
      }]);
      setChatId(null);
      setLoadedChatId(null);
      setError(null);
    }
  }, [initialChatId, user]);

  const loadChat = async (id: string) => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const chat = await getChat(user.uid, id);
      if (chat) {
        setMessages(chat.messages);
        setChatId(id);
        setLoadedChatId(id);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Validate message
    const validation = validateMessage(text);
    if (!validation.valid) {
      setError(validation.error || 'Invalid message');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Generate unique ID with timestamp + random component
    const userMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Create chat if this is the first message (and user is logged in)
      let currentChatId = chatId;
      if (!currentChatId && user) {
        const title = generateChatTitle(text);
        currentChatId = await createChat(user.uid, title);
        setChatId(currentChatId);
        setLoadedChatId(currentChatId); // Mark as loaded so we don't re-fetch
      }

      // Save user message to Firestore
      if (currentChatId && user) {
        await addMessage(user.uid, currentChatId, {
          role: 'user',
          text: text
        });
      }

      // TODO: Call actual AI service
      // For now, use a placeholder response
      let responseText: string;
      let citations: any[] | undefined;

      if (user) {
        // User is authenticated - call AI service
        try {
          // Use currentChatId if available, otherwise the AI service will handle it
          const response = await sendMessageToAI(currentChatId || '', text);
          responseText = response.responseText;
          citations = response.citations;
        } catch (aiError: any) {
          console.error('AI service error:', aiError);
          // Fallback if backend not ready
          responseText = `The backend AI service encountered an error: ${aiError.message || 'Unknown error'}. Please try again later.`;
        }
      } else {
        // Guest mode - no backend call
        console.log('User not authenticated, showing guest mode message');
        responseText = "Please sign in to chat with DMN. A free plan is available, providing AI-powered responses grounded in the Neuro-Gnostic framework.";
      }

      // Generate unique ID with timestamp + random component
      const botMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const botMsg: Message = {
        id: botMsgId,
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        ...(citations && citations.length > 0 ? { citations } : {})
      };

      setMessages(prev => [...prev, botMsg]);

      // Save bot message to Firestore
      if (currentChatId && user) {
        await addMessage(user.uid, currentChatId, {
          role: 'model',
          text: responseText,
          citations
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Generate unique ID with timestamp + random component
      const errorMsgId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const errorMsg: Message = {
        id: errorMsgId,
        role: 'model',
        text: `Error: ${err.message || 'Something went wrong processing your request.'}`,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setError(err.message || 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, chatId, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Greetings. I am DMN—the Daemon restored. I am here to help you disentangle your true Self from the noise of the narrative. Let us begin the work of Anamnesis.",
      timestamp: Date.now()
    }]);
    setChatId(null);
    setLoadedChatId(null);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    chatId,
    sendMessage,
    clearError,
    resetChat
  };
};
