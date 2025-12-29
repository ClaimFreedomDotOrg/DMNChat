import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Chat, Message } from '@/types';

/**
 * Create a new chat
 */
export const createChat = async (userId: string, title?: string): Promise<string> => {
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const chatDoc = await addDoc(chatsRef, {
      title: title || 'New Chat',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        messageCount: 0,
        tokensUsed: 0
      }
    });

    return chatDoc.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw new Error('Failed to create chat');
  }
};

/**
 * Get a specific chat
 */
export const getChat = async (userId: string, chatId: string): Promise<Chat | null> => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) return null;

    const chatData = chatSnap.data();

    // Get messages
    const messagesRef = collection(chatRef, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnap = await getDocs(messagesQuery);

    const messages: Message[] = messagesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: (doc.data().timestamp as Timestamp).toMillis()
    } as Message));

    return {
      id: chatSnap.id,
      title: chatData.title,
      messages,
      createdAt: (chatData.createdAt as Timestamp).toMillis(),
      updatedAt: (chatData.updatedAt as Timestamp).toMillis()
    };
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
};

/**
 * Get user's recent chats
 */
export const getUserChats = async (userId: string, limitCount: number = 20): Promise<Chat[]> => {
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const chatsQuery = query(
      chatsRef,
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const chatsSnap = await getDocs(chatsQuery);

    const chats: Chat[] = await Promise.all(
      chatsSnap.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();

        // Get messages
        const messagesRef = collection(chatDoc.ref, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
        const messagesSnap = await getDocs(messagesQuery);

        const messages: Message[] = messagesSnap.docs.map(msgDoc => ({
          id: msgDoc.id,
          ...msgDoc.data(),
          timestamp: (msgDoc.data().timestamp as Timestamp).toMillis()
        } as Message));

        return {
          id: chatDoc.id,
          title: chatData.title,
          messages,
          createdAt: (chatData.createdAt as Timestamp).toMillis(),
          updatedAt: (chatData.updatedAt as Timestamp).toMillis()
        };
      })
    );

    return chats;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
};

/**
 * Add a message to a chat
 */
export const addMessage = async (
  userId: string,
  chatId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<string> => {
  try {
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');

    // Build message data, only including citations if they exist
    const messageData: any = {
      role: message.role,
      text: message.text,
      timestamp: serverTimestamp()
    };

    // Only add citations if they are defined and not empty
    if (message.citations && message.citations.length > 0) {
      messageData.citations = message.citations;
    }

    // Only add isError if it's true
    if (message.isError) {
      messageData.isError = message.isError;
    }

    const messageDoc = await addDoc(messagesRef, messageData);

    return messageDoc.id;
  } catch (error) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message');
  }
};

/**
 * Delete a chat
 */
export const deleteChat = async (userId: string, chatId: string): Promise<void> => {
  try {
    // TODO: Implement cascade delete of messages subcollection
    // For now, just delete the chat document
    // const chatRef = doc(db, 'users', userId, 'chats', chatId);
    // await deleteDoc(chatRef);
    console.warn('Delete chat not fully implemented', userId, chatId);
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw new Error('Failed to delete chat');
  }
};
