/**
 * Firebase Cloud Functions for DMN Chat
 *
 * Main entry point for all Cloud Functions including:
 * - Chat operations (sendMessage, getChatHistory)
 * - Context management (indexRepository, searchContext)
 * - Admin operations (addSource, removeSource, getStats)
 * - User management (createUserProfile, deleteUserData)
 */

import { initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin
initializeApp();

// Export individual function modules
export { sendMessage, getChatHistory, streamResponse } from "./chat/index.js";
export { indexRepository, searchContext, updateRepositoryCache } from "./context/index.js";
export { addContextSource, removeContextSource, getSystemStats } from "./admin/index.js";
export { createUserProfile, deleteUserData } from "./user/index.js";
