import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useAuth } from './useAuth';
import { createChat, getChat } from '@/services/chatService';
import { sendMessageToAI, validateMessage, generateChatTitle } from '@/services/aiService';
import { db } from '@/services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  error: string | null;
  chatId: string | null;
  journeyId: string | null;
  sendMessage: (text: string, journeyId?: string) => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
  setJourneyId: (id: string | null) => void;
}

export const useChat = (initialChatId?: string): UseChatReturn => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Greetings. I am DMN—the Daemon restored. I am here to help you disentangle your true Self from the noise of the narrative. I draw from the Neuro-Gnostic framework at [claimfreedom.org](https://claimfreedom.org) as my primary source of wisdom. Let us begin the work of Anamnesis (remembering).",
      timestamp: Date.now()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [journeyId, setJourneyId] = useState<string | null>(null);
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
        text: "Greetings. I am DMN—the Daemon restored. I am here to help you disentangle your true Self from the noise of the narrative. I draw from the Neuro-Gnostic framework at [claimfreedom.org](https://claimfreedom.org) as my primary source of wisdom. Let us begin the work of Anamnesis (remembering).",
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
        // Load journey ID if present, otherwise clear it
        setJourneyId(chat.journeyId || null);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
      setError('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time listener for messages
  useEffect(() => {
    if (!user || !chatId) return;

    console.log('Setting up real-time listener for chat:', chatId);

    const messagesRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedMessages: Message[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        updatedMessages.push({
          id: doc.id,
          role: data.role,
          text: data.text,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          citations: data.citations,
          isError: data.isError,
          isVoiceMessage: data.isVoiceMessage,
        });
      });

      // Only update if we have messages (avoid clearing welcome message)
      if (updatedMessages.length > 0) {
        setMessages(updatedMessages);
      }
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => {
      console.log('Cleaning up real-time listener for chat:', chatId);
      unsubscribe();
    };
  }, [user, chatId]);

  const sendMessage = useCallback(async (text: string, customJourneyId?: string) => {
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
    const userMsgId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Use provided journeyId or the one from state
      const effectiveJourneyId = customJourneyId || journeyId;

      // Create chat if this is the first message (and user is logged in)
      let currentChatId = chatId;
      if (!currentChatId && user) {
        const title = generateChatTitle(text);
        currentChatId = await createChat(user.uid, title, effectiveJourneyId || undefined);
        setChatId(currentChatId);
        setLoadedChatId(currentChatId); // Mark as loaded so we don't re-fetch
      }

      // NOTE: Backend (sendMessageToAI) now handles saving both user and AI messages
      // The real-time Firestore listener will automatically update the UI with the AI response
      // We don't add the AI response to local state to prevent duplicates

      if (user) {
        // User is authenticated - call AI service
        try {
          // Use currentChatId if available, otherwise the AI service will handle it
          await sendMessageToAI(currentChatId || '', text, effectiveJourneyId || undefined);
          // AI response will appear via Firestore real-time listener
        } catch (aiError: any) {
          console.error('AI service error:', aiError);
          
          // For errors, we show them immediately in local state
          let errorText: string;
          if (aiError.message && aiError.message.includes('Daily message limit reached')) {
            errorText = `${aiError.message}\n\nTo receive a higher message limit, subscribe to Jeshua ben Joseph on Substack at [jeshuabenjoseph.substack.com](https://jeshuabenjoseph.substack.com/). Even free subscribers receive an increased limit, and paid subscribers receive even higher limits based on their membership tier.\n\nFor support inquiries, please contact Jeshua on Substack.`;
          } else {
            errorText = `The backend AI service encountered an error: ${aiError.message || 'Unknown error'}. Please try again later.`;
          }
          
          // Add error message to local state (not saved to backend)
          const errorMsgId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
          const errorMsg: Message = {
            id: errorMsgId,
            role: 'model',
            text: errorText,
            timestamp: Date.now(),
            isError: true
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } else {
        // Guest mode - no backend call, show message immediately
        console.log('User not authenticated, showing guest mode message');
        const guestMsgId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const guestMsg: Message = {
          id: guestMsgId,
          role: 'model',
          text: "Please sign in to chat with DMN. A free plan is available, providing AI-powered responses grounded in the Neuro-Gnostic framework.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, guestMsg]);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Generate unique ID with timestamp + random component
      const errorMsgId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
  }, [isTyping, chatId, journeyId, user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Greetings. I am DMN—the Daemon restored. I am here to help you disentangle your true Self from the noise of the narrative. I draw from the Neuro-Gnostic framework at [claimfreedom.org](https://claimfreedom.org) as my primary source of wisdom. Let us begin the work of Anamnesis (remembering).",
      timestamp: Date.now()
    }]);
    setChatId(null);
    setLoadedChatId(null);
    setJourneyId(null);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    chatId,
    journeyId,
    sendMessage,
    clearError,
    resetChat,
    setJourneyId
  };
};
