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
export { sendMessage, getChatHistory, streamResponse, sendVoiceMessage } from "./chat/index";
export { indexRepository, searchContext, updateRepositoryCache } from "./context/index";
export { addContextSource, removeContextSource, getSystemStats, setAdminRole } from "./admin/index";
export { createUserProfile, deleteUserData, updateUserRole } from "./user/index";
