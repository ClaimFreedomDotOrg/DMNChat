import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  writeBatch,
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
      updatedAt: (chatData.updatedAt as Timestamp).toMillis(),
      isPinned: chatData.isPinned || false
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
          updatedAt: (chatData.updatedAt as Timestamp).toMillis(),
          isPinned: chatData.isPinned || false
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
 * Rename a chat
 */
export const renameChat = async (userId: string, chatId: string, newTitle: string): Promise<void> => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const batch = writeBatch(db);

    batch.update(chatRef, {
      title: newTitle.trim(),
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error renaming chat:', error);
    throw new Error('Failed to rename chat');
  }
};

/**
 * Pin or unpin a chat
 */
export const togglePinChat = async (userId: string, chatId: string, isPinned: boolean): Promise<void> => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const batch = writeBatch(db);

    batch.update(chatRef, {
      isPinned,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error toggling pin:', error);
    throw new Error('Failed to pin/unpin chat');
  }
};

/**
 * Delete a chat and all its messages
 */
export const deleteChat = async (userId: string, chatId: string): Promise<void> => {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const messagesRef = collection(chatRef, 'messages');

    console.log(`Starting deletion of chat ${chatId} for user ${userId}`);

    // Get all messages in the chat
    const messagesSnap = await getDocs(messagesRef);
    console.log(`Found ${messagesSnap.size} messages to delete`);

    // Use a batch to delete all messages and the chat document
    const batch = writeBatch(db);

    // Delete all messages
    messagesSnap.docs.forEach((messageDoc) => {
      console.log(`Queuing message ${messageDoc.id} for deletion`);
      batch.delete(messageDoc.ref);
    });

    // Delete the chat document itself
    console.log(`Queuing chat document ${chatId} for deletion`);
    batch.delete(chatRef);

    // Commit the batch
    console.log('Committing batch deletion...');
    await batch.commit();
    console.log(`Successfully committed deletion of chat ${chatId} and ${messagesSnap.size} messages`);

    // Verify deletion
    const verifySnap = await getDoc(chatRef);
    if (verifySnap.exists()) {
      console.error('WARNING: Chat document still exists after deletion!');
      throw new Error('Deletion verification failed - document still exists');
    } else {
      console.log('Deletion verified - chat document no longer exists');
    }
  } catch (error: any) {
    console.error('Error deleting chat:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    throw error; // Throw the original error to see details in the UI
  }
};
