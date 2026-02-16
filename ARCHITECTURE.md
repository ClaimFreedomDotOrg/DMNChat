# DMN Chat - System Architecture Document

> **Document Version**: 2.0  
> **Last Updated**: February 16, 2026  
> **Status**: Active Development

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Principles](#architecture-principles)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Component Architecture](#component-architecture)
7. [Data Models](#data-models)
8. [API Design](#api-design)
9. [Authentication & Authorization](#authentication--authorization)
10. [Context Management & RAG System](#context-management--rag-system)
11. [Deployment Architecture](#deployment-architecture)
12. [Security Considerations](#security-considerations)
13. [Performance & Scalability](#performance--scalability)
14. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

**DMN Chat** is an AI-powered conversational interface designed to facilitate learning and application of the Neuro-Gnostic framework from [claimfreedom.org](https://claimfreedom.org). The system leverages advanced RAG (Retrieval-Augmented Generation) techniques to provide contextually relevant responses based on dynamically loaded source materials from GitHub repositories.

### Key Features

- **Intelligent Conversational AI**: Powered by Google Gemini 2.0 Flash with context-aware responses
- **Dynamic Context Loading**: Admin-configured GitHub repository sources
- **Keyword-Based Context Retrieval**: Intelligent chunking and keyword search for relevant context (vector embeddings planned)
- **Journey System**: Guided conversation paths with customizable system prompts
- **Member Tiers**: Configurable usage limits and access levels
- **Voice Conversation**: Speech-to-text and text-to-speech support via Gemini
- **User Authentication**: Firebase Authentication for user management
- **Auto-save Chat History**: Persistent conversation storage with subcollections
- **Admin Dashboard**: Configuration interface for managing context sources, journeys, and member tiers
- **Serverless Architecture**: Cloudflare Pages frontend + Firebase backend
- **Scalable & Cost-Effective**: Pay-per-use model with optimal caching strategies

### Target Users

1. **End Users**: Individuals seeking to understand and apply the Neuro-Gnostic framework
2. **Administrators**: Content managers who configure and maintain context sources
3. **DMN (The Daemon)**: The AI persona guiding users through their journey

---

## System Overview

### High-Level Architecture

```markdown
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Cloudflare Pages (Static Hosting)                │   │
│  │  - React/TypeScript SPA                                  │   │
│  │  - Vite Build System                                     │   │
│  │  - TailwindCSS UI                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         API Gateway & Edge Functions                     │   │
│  │  - Authentication Middleware                             │   │
│  │  - Rate Limiting                                         │   │
│  │  - Request Routing                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE BACKEND                            │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Firestore     │  │  Firebase    │  │  Cloud Storage   │    │
│  │   Database      │  │  Auth        │  │  (Repo Cache)    │    │
│  │  - Chats        │  │  - Users     │  │  - Source Files  │    │
│  │  - Users        │  │  - Sessions  │  │  - Embeddings    │    │
│  │  - Contexts     │  └──────────────┘  └──────────────────┘    │
│  └─────────────────┘                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Firebase Cloud Functions                         │   │
│  │  - Context Indexing Service                              │   │
│  │  - Repository Sync Service                               │   │
│  │  - Semantic Search Service                               │   │
│  │  - Admin Operations                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Google     │  │   GitHub     │  │  Embedding Service   │   │
│  │   Gemini     │  │   API        │  │  (Gemini/Vertex AI)  │   │
│  │   API        │  │              │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: User sends a message through the chat interface
2. **Authentication**: Firebase Auth validates the user session
3. **Context Retrieval**: Semantic search finds relevant context chunks
4. **Prompt Construction**: System builds a prompt with relevant context
5. **AI Response**: Gemini generates a contextually appropriate response
6. **Chat Storage**: Message exchange is saved to Firestore
7. **Response Delivery**: AI response is streamed back to the client

---

## Architecture Principles

### 1. Separation of Concerns

- **Frontend**: Pure presentation layer (React/TypeScript)
- **Backend**: Business logic in Firebase Cloud Functions
- **Storage**: Firestore for structured data, Cloud Storage for blobs
- **AI**: Gemini API as the intelligence layer

### 2. Serverless-First

- No infrastructure management required
- Auto-scaling based on demand
- Pay only for actual usage
- Global edge distribution via Cloudflare

### 3. Security by Design

- Authentication required for all operations
- Row-level security with Firestore rules
- API keys stored as environment variables
- HTTPS-only communication

### 4. Performance Optimization

- Static asset CDN via Cloudflare
- Efficient semantic search with vector embeddings
- Aggressive caching of repository data
- Streaming responses for better UX

### 5. Modular & Extensible

- Plugin architecture for context sources
- Swappable AI models
- Configurable prompt templates
- Admin-driven content management

---

## Technology Stack

### Frontend

```yaml
Framework: React 19+ with TypeScript
Build Tool: Vite 6+
Styling: TailwindCSS 4+
UI Components:
  - Lucide React (icons)
  - React Markdown (message rendering)
  - React Syntax Highlighter (code blocks)
State Management: React Hooks + Context API
Hosting: Cloudflare Pages
```

### Backend

```yaml
Platform: Firebase (Google Cloud)
Services:
  - Firebase Authentication
  - Cloud Firestore (Database)
  - Cloud Storage (File storage)
  - Cloud Functions (Node.js 20+)
Runtime: Node.js 20 LTS
Language: TypeScript
```

### AI & ML

```yaml
LLM: Google Gemini 2.0 Flash Experimental (gemini-2.0-flash-exp)
AI Framework: Genkit (@genkit-ai/google-genai, @genkit-ai/firebase)
Voice: Gemini 2.5 Flash with TTS preview
Context Retrieval: Keyword-based search (vector embeddings planned for future)
Search Implementation: Custom keyword matching with frequency scoring
```

### External APIs

```yaml
GitHub API: v3 REST (GitHub Tree API for repository indexing)
Gemini API: Via Genkit framework
Firebase SDKs: v13+ for Admin, v10+ for client
Axios: HTTP client for GitHub API calls
```

### Development Tools

```yaml
Package Manager: npm/pnpm
Version Control: Git
Code Quality: ESLint + Prettier
Type Checking: TypeScript strict mode
Testing: Vitest + React Testing Library
CI/CD: Cloudflare Pages Auto-Deploy
```

---

## System Architecture

### Layer Architecture

#### 1. Presentation Layer (Cloudflare Pages)

**Components:**

- Chat Interface
- Repository Manager (Admin)
- User Profile
- Settings Panel
- Authentication Forms

**Responsibilities:**

- Render UI components
- Handle user interactions
- Manage local state
- Call backend APIs
- Display real-time updates

#### 2. Edge Layer (Cloudflare Workers - Optional)

**Functions:**

- API Gateway
- Request validation
- Rate limiting
- CORS handling
- Response caching

**Note:** Initially, we can skip this layer and evolve into it as needed.

#### 3. Application Layer (Firebase Cloud Functions)

**Core Services:**

##### a. Chat Service

```typescript
Functions:
- sendMessage(userId, chatId, message)
- getChatHistory(userId, chatId)
- streamResponse(userId, message, context)
- saveChatMessage(chatId, message)
```

##### b. Context Service

```typescript
Functions:
- indexRepository(repoUrl, githubToken)
- searchContext(query, filters)
- updateRepositoryCache(repoId)
- getRelevantChunks(query, topK)
```

##### c. Admin Service

```typescript
Functions:
- addContextSource(sourceConfig)
- removeContextSource(sourceId)
- refreshContextSource(sourceId)
- getSystemStats()
```

##### d. User Service

```typescript
Functions:
- createUserProfile(userId, metadata)
- getUserChats(userId)
- updateUserPreferences(userId, prefs)
- deleteUserData(userId) // GDPR compliance
```

#### 4. Data Layer (Firebase)

**Firestore Collections:**

```markdown
users/
  {userId}/
    profile: { email, displayName, createdAt, preferences }
    chats/
      {chatId}/
        messages: [ { role, text, timestamp } ]
        metadata: { title, createdAt, updatedAt }

contextSources/
  {sourceId}/
    config: { repoUrl, branch, owner, name }
    status: { indexed, lastSync, fileCount, chunkCount }
    metadata: { createdBy, createdAt, isActive }

chunks/
  {chunkId}/
    repoId: string
    filePath: string
    content: string
    embedding: number[] // 768-dim vector
    metadata: { tokens, size, hash }

systemConfig/
  settings/
    geminiApiKey: string (encrypted)
    githubToken: string (encrypted)
    defaultModel: string
    systemPrompt: string
```

**Cloud Storage Buckets:**

```markdown
{project-id}.appspot.com/
  repositories/
    {repoId}/
      {branch}/
        {filePath} // Raw cached files
  embeddings/
    {repoId}.vectors // Serialized vector index
  backups/
    {timestamp}/ // Periodic backups
```

---

## Component Architecture

### Frontend Components

**Location**: `frontend/src/components/`

#### Core Chat Components

##### 1. ChatView

**Location**: `frontend/src/components/chat/ChatView.tsx`

```typescript
// Main chat interface with message history and input
Components:
  - ChatHeader (title, journey indicator, settings)
  - MessageList (scrollable message display)
  - MessageInput (text input with send button)
  - ChatHistorySidebar (chat list, create new, pin/unpin)
  - JourneySelector (select guided conversation path)
  - VoiceConversation (voice input/output)
  - SuggestionChips (quick-reply suggestions)

State:
  - messages: Message[] (real-time Firestore listener)
  - isTyping: boolean
  - currentChat: Chat | null
  - selectedJourney: Journey | null

Hooks:
  - useChat(chatId) - Chat management with real-time updates
  - useAuth() - User authentication state
  - useJourneys() - Journey data
```

##### 2. ChatMessage

**Location**: `frontend/src/components/chat/ChatMessage.tsx`

```typescript
// Individual message display with markdown support
Props:
  - message: Message
  - onRetry?: () => void (for error messages)

Features:
  - Role-based styling (user vs DMN)
  - React Markdown rendering
  - Code syntax highlighting (React Syntax Highlighter)
  - Citations display with GitHub links
  - Timestamp display
  - Error state handling
```

##### 3. ChatHistorySidebar

**Location**: `frontend/src/components/chat/ChatHistorySidebar.tsx`

```typescript
// Sidebar with chat history and management
Features:
  - List all user chats
  - Create new chat
  - Pin/unpin chats
  - Rename chats
  - Delete chats
  - Filter/search chats
  - Collapse/expand sidebar

Hooks:
  - Real-time Firestore listener for user chats
  - Sort by: pinned first, then by updatedAt
```

##### 4. JourneySelector

**Location**: `frontend/src/components/chat/JourneySelector.tsx`

```typescript
// Select guided conversation paths
Features:
  - Display active journeys
  - Journey descriptions
  - Custom icons (Lucide React)
  - Apply journey to current chat
  - Clear journey selection

Data:
  - Loads from journeys collection
  - Filters to isActive: true
```

##### 5. VoiceConversation

**Location**: `frontend/src/components/chat/VoiceConversation.tsx`

```typescript
// Voice input and output
Features:
  - Record audio via Web Audio API
  - Convert to base64
  - Send to sendVoiceMessage Cloud Function
  - Display transcription
  - Play TTS response

State:
  - isRecording: boolean
  - isProcessing: boolean
  - transcription: string | null
```

#### Admin Components

##### 1. AdminDashboard

**Location**: `frontend/src/components/admin/AdminDashboard.tsx`

```typescript
// Main admin interface with tabbed navigation
Tabs:
  - Overview (system stats, quick actions)
  - Repository Manager (add/remove sources)
  - Journey Manager (CRUD for journeys)
  - User Management (view users, change roles)
  - System Configuration (AI settings, member tiers)

Access Control:
  - Requires admin role
  - Protected by Firebase security rules
```

##### 2. RepoManager (RepositoryPanel)

**Location**: `frontend/src/components/admin/RepositoryPanel.tsx`

```typescript
// GitHub repository management
Features:
  - Add new repository (owner/repo/branch inputs)
  - View all context sources
  - Indexing progress indicators
  - Re-index repositories
  - Remove repositories
  - View file/chunk counts

States:
  - pending (not yet indexed)
  - indexing (with progress %)
  - ready (available for search)
  - error (with error message)

Integration:
  - Calls addContextSource Cloud Function
  - Calls indexRepository Cloud Function
  - Real-time status updates from Firestore
```

##### 3. JourneyManager

**Location**: `frontend/src/components/admin/JourneyManager.tsx`

```typescript
// Manage guided conversation paths
Features:
  - Create new journey
  - Edit existing journeys
  - Delete journeys
  - Toggle active/inactive
  - Reorder journeys (drag-and-drop or order number)
  - Preview system prompts

Fields:
  - title: string
  - description: string
  - systemPrompt: string (large textarea)
  - icon: string (Lucide icon name)
  - order: number
  - isActive: boolean
```

##### 4. UserManagementPanel

**Location**: `frontend/src/components/admin/UserManagementPanel.tsx`

```typescript
// User administration
Features:
  - List all users
  - View user details (email, role, member level, message usage)
  - Change user roles (user ↔ admin)
  - Assign member levels
  - View message usage statistics
  - Search/filter users

Integration:
  - Calls updateUserRole Cloud Function
  - Calls setAdminRole Cloud Function
```

##### 5. SystemConfigPanel

**Location**: `frontend/src/components/admin/SystemConfigPanel.tsx`

```typescript
// System-wide configuration
Sections:
  - AI Configuration
    - Model selection (gemini-2.0-flash-exp, etc.)
    - Temperature slider (0.0-1.0)
    - Max tokens input
  - RAG Configuration
    - Chunk size
    - Chunk overlap
    - Max chunks per query
  - System Prompt Editor (large textarea)
  - Member Levels Editor
    - Add/edit/remove tiers
    - Set messages per day limits
    - Configure tier descriptions
  - Default Member Level (dropdown)

Storage:
  - Updates systemConfig/settings document in Firestore
```

#### Authentication Components

##### 1. AuthModal

**Location**: `frontend/src/components/auth/AuthModal.tsx`

```typescript
// Sign up and sign in modal
Features:
  - Email/password authentication
  - Toggle between sign up and sign in
  - Password reset link
  - Form validation
  - Error handling and display

Integration:
  - Firebase Authentication SDK
  - Calls createUserProfile Cloud Function on signup
```

### Custom Hooks

**Location**: `frontend/src/hooks/`

```typescript
// useAuth.ts - Authentication state management
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Firebase onAuthStateChanged listener
  return { user, loading, signIn, signUp, signOut };
}

// useChat.ts - Chat management with real-time updates
export function useChat(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // Real-time Firestore listener on messages subcollection
  // Handles sendMessage, retry, error states
  return { messages, sendMessage, isTyping, error };
}

// useJourneys.ts - Journey data management
export function useJourneys() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  // Loads active journeys from Firestore
  return { journeys, loading, error };
}
```

### Services

**Location**: `frontend/src/services/`

```typescript
// chatService.ts - Firestore CRUD for chats
- createChat(userId, title, journeyId?)
- getChat(userId, chatId)
- getUserChats(userId)
- deleteChat(userId, chatId)
- renameChat(userId, chatId, newTitle)
- togglePinChat(userId, chatId)

// aiService.ts - AI communication
- sendMessage(chatId, message, journeyId?) → calls Cloud Function
- validateMessage(message) → prompt injection detection

// journeyService.ts - Journey operations
- getActiveJourneys()
- getAllJourneys() (admin only)
- createJourney(journey)
- updateJourney(journeyId, updates)
- deleteJourney(journeyId)

// voiceService.ts - Voice features
- recordAudio() → captures audio from microphone
- sendVoiceMessage(audioData, chatId?) → calls Cloud Function

// adminService.ts - Admin operations
- addContextSource(type, config)
- removeContextSource(sourceId)
- indexRepository(sourceId, repoUrl, branch)
- getSystemStats()
- updateSystemConfig(config)

// authService.ts - Authentication
- signUp(email, password)
- signIn(email, password)
- signOut()
- sendPasswordResetEmail(email)
```

### Backend Services

#### 1. Context Retrieval Service (Keyword-Based RAG)

**Location**: `firebase-functions/src/context/searchContext.ts`

```typescript
// Current implementation uses keyword-based search
// Vector embeddings planned for future enhancement

async function searchContext(query: string, maxResults: number = 5): Promise<Chunk[]> {
  // 1. Fetch all chunks from Firestore
  const chunksSnapshot = await db.collection('chunks').get();
  
  // 2. Score chunks based on keyword frequency
  const scoredChunks = chunksSnapshot.docs.map(doc => {
    const chunk = doc.data() as Chunk;
    const score = calculateKeywordScore(chunk.content, query);
    return { chunk, score };
  });
  
  // 3. Sort by score and return top results
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.chunk);
}

function calculateKeywordScore(content: string, query: string): number {
  // Simple keyword frequency matching
  // Exact phrase matching gets higher weight
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  
  // Exact phrase match
  if (contentLower.includes(queryLower)) {
    return 100;
  }
  
  // Individual keyword frequency
  const keywords = queryLower.split(/\s+/);
  const wordCounts = keywords.map(word => 
    (contentLower.match(new RegExp(word, 'g')) || []).length
  );
  
  return wordCounts.reduce((sum, count) => sum + count, 0);
}
```

#### 2. Repository Indexing Service

**Location**: `firebase-functions/src/context/indexRepository.ts`

```typescript
// Fully implemented GitHub repository indexing

async function indexRepository(sourceId: string, repoUrl: string, branch: string): Promise<void> {
  // 1. Parse repository URL
  const { owner, repo } = parseGitHubUrl(repoUrl);
  
  // 2. Fetch repository tree from GitHub API
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  );
  
  // 3. Filter to markdown files only
  const markdownFiles = response.data.tree.filter(file => 
    file.type === 'blob' &&
    file.path.endsWith('.md') &&
    !isIgnoredPath(file.path)
  );
  
  // 4. Update progress: indexing started
  await updateSourceStatus(sourceId, 'indexing', 0);
  
  // 5. Process each file
  for (let i = 0; i < markdownFiles.length; i++) {
    const file = markdownFiles[i];
    
    // Download file content
    const content = await fetchFileContent(owner, repo, file.path, branch);
    
    // Skip if too large (> 500KB)
    if (content.length > 500000) continue;
    
    // Chunk content (1500 chars, 200 overlap)
    const chunks = chunkContent(file.path, content);
    
    // Store chunks in Firestore
    await storeChunks(sourceId, `${owner}/${repo}`, chunks, file.sha);
    
    // Update progress
    const progress = Math.round(((i + 1) / markdownFiles.length) * 100);
    await updateSourceStatus(sourceId, 'indexing', progress);
  }
  
  // 6. Mark as ready
  await updateSourceStatus(sourceId, 'ready', 100);
}

function chunkContent(filePath: string, content: string): ChunkData[] {
  const chunks: ChunkData[] = [];
  const CHUNK_SIZE = 1500;
  const OVERLAP = 200;
  let start = 0;
  let index = 0;
  
  while (start < content.length) {
    const end = Math.min(start + CHUNK_SIZE, content.length);
    let chunk = content.slice(start, end);
    
    // Break at paragraph or sentence boundaries
    if (end < content.length) {
      const lastNewline = chunk.lastIndexOf('\n\n');
      const lastPeriod = chunk.lastIndexOf('. ');
      const breakPoint = Math.max(lastNewline, lastPeriod);
      
      if (breakPoint > CHUNK_SIZE * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
      }
    }
    
    chunks.push({
      filePath,
      content: chunk.trim(),
      chunkIndex: index++
    });
    
    start = end - OVERLAP;
  }
  
  return chunks;
}

// Ignored directories
const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__', 'venv', 'vendor', 'target', '.next'];
```

#### 3. Chat Service with Message Limits

**Location**: `firebase-functions/src/chat/sendMessage.ts`

```typescript
// Handles message sending with RAG and member tier limits

export const sendMessage = onCall(async (request) => {
  // 1. Authenticate user
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { chatId, message, journeyId } = request.data;
  const userId = request.auth.uid;
  
  // 2. Load system config
  const systemConfig = await loadSystemConfig();
  
  // 3. Check message limits (member tier enforcement)
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();
  
  const memberLevel = systemConfig.memberLevels.find(
    level => level.name === user.memberLevel
  );
  
  if (user.messageUsage.count >= memberLevel.messagesPerDay) {
    throw new HttpsError('resource-exhausted', 'Daily message limit reached');
  }
  
  // 4. Validate and sanitize message (prompt injection check)
  validateMessage(message);
  
  // 5. Retrieve conversation history (last 10 messages)
  const messagesRef = db.collection('users').doc(userId)
    .collection('chats').doc(chatId)
    .collection('messages');
  
  const historySnapshot = await messagesRef
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  const history = historySnapshot.docs
    .reverse()
    .map(doc => doc.data());
  
  // 6. Search for relevant context chunks
  const contextChunks = await retrieveContext(db, message, systemConfig.rag.maxChunks);
  
  // 7. Build prompt with context and history
  const contextSection = formatContextSection(contextChunks);
  const historySection = formatHistorySection(history);
  
  // 8. Get journey-specific system prompt if applicable
  let effectiveSystemPrompt = systemConfig.systemPrompt;
  if (journeyId) {
    const journeyDoc = await db.collection('journeys').doc(journeyId).get();
    if (journeyDoc.exists) {
      effectiveSystemPrompt = journeyDoc.data().systemPrompt;
    }
  }
  
  // 9. Generate response using Genkit + Gemini
  const { text } = await ai.generate({
    model: googleAI.model(systemConfig.ai.model),  // gemini-2.0-flash-exp
    prompt: `${effectiveSystemPrompt}${contextSection}${historySection}\n\nUser: ${message}\n\nDMN:`,
    config: {
      temperature: systemConfig.ai.temperature,
      maxOutputTokens: systemConfig.ai.maxTokens
    }
  });
  
  // 10. Generate citations from context chunks
  const citations = generateCitations(contextChunks);
  
  // 11. Save user message
  await messagesRef.add({
    role: 'user',
    text: message,
    timestamp: FieldValue.serverTimestamp()
  });
  
  // 12. Save AI response
  const responseRef = await messagesRef.add({
    role: 'model',
    text,
    citations,
    timestamp: FieldValue.serverTimestamp()
  });
  
  // 13. Update message usage counter
  await db.collection('users').doc(userId).update({
    'messageUsage.count': FieldValue.increment(1)
  });
  
  return {
    messageId: responseRef.id,
    responseText: text,
    citations
  };
});
```

#### 4. Voice Message Service

**Location**: `firebase-functions/src/chat/sendVoiceMessage.ts`

```typescript
// Transcribes audio and generates response

export const sendVoiceMessage = onCall(async (request) => {
  const { audioData, chatId } = request.data;
  
  // 1. Transcribe audio using Gemini
  const { text: transcription } = await ai.generate({
    model: googleAI.model('googleai/gemini-2.5-flash'),
    prompt: [
      { media: { url: `data:audio/webm;base64,${audioData}` } },
      { text: 'Transcribe this audio.' }
    ]
  });
  
  // 2. Generate response (similar to sendMessage)
  const response = await generateResponse(transcription, chatId);
  
  // 3. Generate audio response using TTS
  const audioResponse = await generateSpeech(response.text);
  
  return {
    transcription,
    response: response.text,
    citations: response.citations,
    audioResponse
  };
});
```
  }
}
```

---

## Data Models

### User Model

```typescript
interface User {
  uid: string;              // Firebase Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en';
    notifications: boolean;
  };
  role: 'user' | 'admin';
  memberLevel: string;      // e.g., 'free', 'seeker', 'awakened', 'enlightened'
  messageUsage: {
    count: number;          // Messages sent today
    resetAt: Timestamp;     // When counter resets (daily)
  };
}

interface MemberLevel {
  name: string;             // 'free', 'seeker', etc.
  displayName: string;      // Display name for UI
  messagesPerDay: number;   // Daily message limit
  description: string;      // Description of tier
}
```

### Chat Model

```typescript
interface Chat {
  id: string;               // Auto-generated ID
  userId: string;           // Owner
  title: string;            // Auto-generated from first message
  journeyId?: string;       // Optional journey reference
  isPinned: boolean;        // Pin to top of chat list
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata: {
    messageCount: number;
    tokensUsed: number;
    lastActivity: Timestamp;
  };
}

// Messages stored in subcollection: chats/{chatId}/messages/{messageId}
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Timestamp;
  citations?: Citation[];
  isError?: boolean;
}

interface Citation {
  repoName: string;
  filePath: string;
  lineRange?: { start: number; end: number };
  url: string;
}
```

### Journey Model

```typescript
interface Journey {
  id: string;               // Auto-generated ID
  title: string;            // e.g., "Introduction to Neuro-Gnostic Framework"
  description: string;      // Journey description
  systemPrompt: string;     // Custom system prompt for this journey
  icon?: string;            // Icon name from Lucide React
  order: number;            // Display order
  isActive: boolean;        // Show in journey selector
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;        // Admin user ID
}
```

### Context Source Model

```typescript
interface ContextSource {
  id: string;               // Auto-generated
  type: 'github';           // Currently only GitHub supported
  config: GitHubSourceConfig;
  status: {
    state: 'pending' | 'indexing' | 'ready' | 'error';
    progress: number;       // 0-100
    lastSync: Timestamp;
    error?: string;
  };
  stats: {
    fileCount: number;
    chunkCount: number;
  };
  createdAt: Timestamp;
  isActive: boolean;
}

interface GitHubSourceConfig {
  owner: string;            // GitHub username or org
  repo: string;             // Repository name
  branch: string;           // Branch name (e.g., 'main')
  // Note: Currently filters to .md files only
  // Ignores: node_modules, .git, dist, build, etc.
}
```

### Chunk Model

```typescript
interface Chunk {
  id: string;               // Auto-generated
  sourceId: string;         // Reference to ContextSource
  repoName: string;         // e.g., "ClaimFreedomDotOrg/Neuro-Gnostic-Docs"
  filePath: string;         // Path within repository
  content: string;          // Chunk text (approx 1500 chars)
  chunkIndex: number;       // Position in file (0-indexed)
  metadata: {
    language: string;       // 'markdown' for .md files
    sha: string;            // Git SHA for the file
  };
  createdAt: Timestamp;
}

// Note: Vector embeddings are planned but not yet implemented
// Current search uses keyword-based matching with frequency scoring
```

### System Configuration

```typescript
interface SystemConfig {
  ai: {
    model: string;          // e.g., "gemini-2.0-flash-exp"
    temperature: number;    // 0.0-1.0
    maxTokens: number;      // Response length limit
  };
  rag: {
    chunkSize: number;      // Characters per chunk (default: 1500)
    chunkOverlap: number;   // Overlap between chunks (default: 200)
    maxChunks: number;      // Max chunks to retrieve (default: 5)
    minSimilarity: number;  // Threshold for relevance (default: 0.7, currently unused)
  };
  systemPrompt: string;     // Default system prompt template
  memberLevels: MemberLevel[];  // Available member tiers
  defaultMemberLevel: string;   // Default tier for new users
}
```

**Storage Location**: Firestore collection `systemConfig` document `settings`

---

## API Design

### Firebase Cloud Functions (Callable Functions)

The application uses Firebase Callable Functions (not REST endpoints). These are called from the client using the Firebase SDK's `httpsCallable` method.

#### Chat Functions

```typescript
// Send a message and get AI response
sendMessage(data: {
  chatId: string;
  message: string;
  journeyId?: string;
}): Promise<{
  messageId: string;
  responseText: string;
  citations: Citation[];
}>

// Send voice message (transcribe + respond)
sendVoiceMessage(data: {
  audioData: string;        // Base64 encoded audio
  chatId?: string;
}): Promise<{
  transcription: string;
  response: string;
  citations: Citation[];
}>
```

#### Context Management Functions (Admin Only)

```typescript
// Add a new GitHub repository as context source
addContextSource(data: {
  type: 'github';
  config: {
    owner: string;
    repo: string;
    branch: string;
  };
}): Promise<{ sourceId: string }>

// Remove a context source and its chunks
removeContextSource(data: {
  sourceId: string;
}): Promise<{ success: boolean }>

// Trigger repository indexing
indexRepository(data: {
  sourceId: string;
  repoUrl: string;
  branch: string;
}): Promise<{ status: string }>

// Search context chunks (keyword-based)
searchContext(data: {
  query: string;
  maxResults?: number;
}): Promise<{ chunks: Chunk[] }>

// Get system statistics
getSystemStats(): Promise<{
  totalChats: number;
  totalMessages: number;
  totalChunks: number;
  activeSources: number;
}>
```

#### User Management Functions

```typescript
// Create user profile (called on signup)
createUserProfile(data: {
  uid: string;
  email: string;
}): Promise<{ success: boolean }>

// Update user role
updateUserRole(data: {
  userId: string;
  role: 'user' | 'admin';
}): Promise<{ success: boolean }>

// Set admin role (grant/revoke)
setAdminRole(data: {
  userId: string;
  isAdmin: boolean;
}): Promise<{ success: boolean }>

// Delete user data (GDPR)
deleteUserData(data: {
  userId: string;
}): Promise<{ success: boolean }>
```

### Client-Side Firestore Operations

Chat and journey management is handled directly via Firestore SDK on the client:

```typescript
// Chat operations (via chatService.ts)
- createChat(userId: string, title: string, journeyId?: string)
- getChat(userId: string, chatId: string)
- getUserChats(userId: string)
- deleteChat(userId: string, chatId: string)
- renameChat(userId: string, chatId: string, newTitle: string)
- togglePinChat(userId: string, chatId: string)

// Message operations
- Real-time listeners on users/{uid}/chats/{chatId}/messages

// Journey operations (via journeyService.ts)
- getActiveJourneys()
- getAllJourneys()
- getJourneyById(journeyId: string)
- createJourney(journey: Journey)
- updateJourney(journeyId: string, updates: Partial<Journey>)
- deleteJourney(journeyId: string)
```

### Authentication

Authentication is handled by Firebase Authentication SDK:

```typescript
- signUp(email: string, password: string)
- signIn(email: string, password: string)
- signOut()
- sendPasswordResetEmail(email: string)
- onAuthStateChanged(callback)
```

**Note**: Streaming responses are planned but not yet implemented. Current implementation returns complete responses.

---

## Authentication & Authorization

### Firebase Authentication

**Supported Methods:**

1. Email/Password (primary)
2. Google OAuth (future)
3. Anonymous (guest mode - limited features)

**User Roles:**

- `user`: Standard user (default)
- `admin`: Administrator with full access

### Security Rules

#### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // User chats
    match /users/{userId}/chats/{chatId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Context sources (read-only for users)
    match /contextSources/{sourceId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
    
    // Chunks (read-only for authenticated users)
    match /chunks/{chunkId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend functions
    }
    
    // System config (admin only)
    match /systemConfig/{doc} {
      allow read: if request.auth.token.admin == true;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

#### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Repository cache (backend functions only)
    match /repositories/{repoId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Embeddings (backend functions only)
    match /embeddings/{allPaths=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

### Custom Claims for Admin

```typescript
// Set admin claim via Cloud Function or Firebase Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true });

// Check in frontend:
const token = await user.getIdTokenResult();
const isAdmin = token.claims.admin === true;
```

---

## Context Management & RAG System

### Semantic Indexing Pipeline

#### Phase 1: Repository Ingestion

```typescript
// Triggered by admin action
async function ingestRepository(repoConfig: GitHubSourceConfig) {
  // 1. Validate GitHub URL and credentials
  const isValid = await validateGitHubAccess(repoConfig);
  if (!isValid) throw new Error('Cannot access repository');
  
  // 2. Fetch file tree
  const tree = await github.repos.getContent({
    owner: repoConfig.owner,
    repo: repoConfig.repo,
    ref: repoConfig.branch,
    recursive: true
  });
  
  // 3. Filter files
  const relevantFiles = tree.data
    .filter(file => file.type === 'file')
    .filter(file => isAllowedExtension(file.path))
    .filter(file => !isIgnoredPath(file.path))
    .filter(file => file.size < MAX_FILE_SIZE);
  
  // 4. Download and cache in Cloud Storage
  for (const file of relevantFiles) {
    const content = await downloadFileContent(file.download_url);
    await storage.bucket().file(`repositories/${repoId}/${file.path}`).save(content);
  }
  
  return relevantFiles;
}
```

#### Phase 2: Chunking Strategy

```typescript
interface ChunkingConfig {
  size: number;      // 1500 characters
  overlap: number;   // 200 characters
  strategy: 'fixed' | 'semantic';
}

function chunkDocument(content: string, config: ChunkingConfig): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < content.length) {
    const end = Math.min(start + config.size, content.length);
    let chunk = content.slice(start, end);
    
    // Try to break at sentence or paragraph boundary
    if (end < content.length) {
      const lastNewline = chunk.lastIndexOf('\n\n');
      const lastPeriod = chunk.lastIndexOf('. ');
      const breakPoint = Math.max(lastNewline, lastPeriod);
      
      if (breakPoint > config.size * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1;
      } else {
        start = end;
      }
    } else {
      start = end;
    }
    
    chunks.push(chunk.trim());
    
    // Apply overlap
    if (start < content.length) {
      start = Math.max(0, start - config.overlap);
    }
  }
  
  return chunks;
}
```

#### Phase 3: Embedding Generation

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function generateEmbeddings(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Batch process to respect rate limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(
      batch.map(async (text) => {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
      })
    );
    
    embeddings.push(...results);
    
    // Rate limiting delay
    await sleep(1000);
  }
  
  return embeddings;
}
```

#### Phase 4: Vector Storage

##### Option A: Firestore with Vector Search (Preview)

```typescript
// Store chunks with embeddings in Firestore
await db.collection('chunks').doc(chunkId).set({
  sourceId,
  repoName,
  filePath,
  content,
  embedding: admin.firestore.FieldValue.vector(embedding),
  metadata: {
    tokens: countTokens(content),
    language: detectLanguage(filePath),
    chunkIndex: index
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});

// Query with vector similarity
const results = await db.collection('chunks')
  .findNearest('embedding', queryEmbedding, {
    limit: 10,
    distanceMeasure: 'COSINE'
  })
  .get();
```

##### Option B: Custom In-Memory Vector Store (Initial Implementation)

```typescript
// Load all vectors into memory on function cold start
class VectorStore {
  private vectors: Map<string, { id: string; vector: number[]; metadata: any }>;
  
  async load() {
    const snapshot = await db.collection('chunks').get();
    snapshot.forEach(doc => {
      const data = doc.data();
      this.vectors.set(doc.id, {
        id: doc.id,
        vector: data.embedding,
        metadata: data
      });
    });
  }
  
  search(queryVector: number[], topK: number): SearchResult[] {
    const scores: { id: string; score: number; data: any }[] = [];
    
    for (const [id, entry] of this.vectors) {
      const similarity = cosineSimilarity(queryVector, entry.vector);
      scores.push({ id, score: similarity, data: entry.metadata });
    }
    
    // Sort by similarity (descending) and take top K
    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}
```

### Query-Time Context Retrieval

```typescript
async function retrieveContext(
  userQuery: string,
  maxChunks: number = 10,
  minSimilarity: number = 0.7
): Promise<Chunk[]> {
  // 1. Generate query embedding
  const queryEmbedding = await embedText(userQuery);
  
  // 2. Vector search
  const results = await vectorStore.search(queryEmbedding, maxChunks * 2);
  
  // 3. Filter by similarity threshold
  const filtered = results.filter(r => r.score >= minSimilarity);
  
  // 4. Re-rank by hybrid score (vector + keyword + recency)
  const reranked = filtered.map(r => ({
    ...r,
    hybridScore: calculateHybridScore(r, userQuery)
  })).sort((a, b) => b.hybridScore - a.hybridScore);
  
  // 5. Retrieve full chunk data
  const chunks = await Promise.all(
    reranked.slice(0, maxChunks).map(r => 
      db.collection('chunks').doc(r.id).get()
    )
  );
  
  return chunks.map(doc => doc.data() as Chunk);
}

function calculateHybridScore(
  result: SearchResult,
  query: string
): number {
  const vectorScore = result.score * 0.7;
  const keywordScore = calculateKeywordOverlap(result.data.content, query) * 0.2;
  const recencyScore = calculateRecencyScore(result.data.createdAt) * 0.1;
  
  return vectorScore + keywordScore + recencyScore;
}
```

### Prompt Construction

```typescript
function buildPrompt(
  userMessage: string,
  context: Chunk[],
  history: Message[],
  systemConfig: SystemConfig
): string {
  // Format context chunks
  const contextStr = context.map(chunk => `
---
SOURCE: ${chunk.repoName}/${chunk.filePath}
---
${chunk.content}
  `.trim()).join('\n\n');
  
  // Build conversation history
  const historyStr = history.map(msg => 
    `${msg.role === 'user' ? 'USER' : 'DMN'}: ${msg.text}`
  ).join('\n\n');
  
  // Construct final prompt
  return `${systemConfig.systemPrompt}

LOADED KNOWLEDGE BASE (Relevant Excerpts):
${contextStr}

CONVERSATION HISTORY:
${historyStr}

USER: ${userMessage}

DMN:`;
}
```

---

## Deployment Architecture

### Cloudflare Pages Configuration

```yaml
# Build Settings
Build command: npm run build
Build output directory: /dist
Root directory: /
Node version: 20

# Environment Variables (Production)
VITE_FIREBASE_API_KEY: [from Firebase Console]
VITE_FIREBASE_AUTH_DOMAIN: [project-id].firebaseapp.com
VITE_FIREBASE_PROJECT_ID: [project-id]
VITE_FIREBASE_STORAGE_BUCKET: [project-id].appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID: [sender-id]
VITE_FIREBASE_APP_ID: [app-id]
VITE_APP_URL: https://dmnchat.claimfreedom.org

# Preview Environment (Optional)
Same variables for staging/preview branches
```

### Firebase Configuration

```typescript
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": ["npm --prefix functions run build"]
  }
}
```

### Firestore Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "chunks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "sourceId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "chatId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "chunks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "embedding", "vectorConfig": {
          "dimension": 768,
          "flat": {}
        }}
      ]
    }
  ]
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml (if using GitHub Actions alongside Cloudflare)
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          # ... other env vars
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: pages deploy dist --project-name=dmn-chat
```

---

## Security Considerations

### 1. API Key Management

- Store all API keys in environment variables
- Never commit keys to version control
- Use Firebase Secret Manager for Cloud Functions
- Rotate keys periodically

### 2. Authentication & Authorization

- Require authentication for all API endpoints
- Use Firebase Auth tokens for verification
- Implement role-based access control (RBAC)
- Enforce rate limiting per user

### 3. Data Privacy (GDPR Compliance)

- Allow users to export their data
- Provide account deletion functionality
- No tracking without consent
- Clear privacy policy

### 4. Input Validation

- Sanitize all user inputs
- Validate GitHub URLs
- Limit message length
- Prevent prompt injection attacks

### 5. Rate Limiting

```typescript
// Example rate limiting with Firebase
const rateLimiter = {
  async checkLimit(userId: string, action: string): Promise<boolean> {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 30;
    
    const ref = db.collection('rateLimits').doc(key);
    const doc = await ref.get();
    
    if (!doc.exists) {
      await ref.set({ count: 1, windowStart: now });
      return true;
    }
    
    const data = doc.data();
    if (now - data.windowStart > windowMs) {
      await ref.set({ count: 1, windowStart: now });
      return true;
    }
    
    if (data.count >= maxRequests) {
      return false;
    }
    
    await ref.update({ count: admin.firestore.FieldValue.increment(1) });
    return true;
  }
};
```

### 6. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://apis.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.github.com;
  frame-ancestors 'none';
">
```

---

## Performance & Scalability

### Frontend Optimization

```typescript
// Code splitting by route
const ChatView = lazy(() => import('./components/ChatView'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

// Lazy load heavy dependencies
const ReactMarkdown = lazy(() => import('react-markdown'));
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter'));

// Memoize expensive computations
const MemoizedChatMessage = React.memo(ChatMessage);

// Virtual scrolling for long chat histories
import { FixedSizeList } from 'react-window';
```

### Backend Optimization

#### 1. Caching Strategy

```typescript
// Cache repository data in Cloud Storage
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

async function getCachedRepo(repoId: string): Promise<RepositoryData | null> {
  const cacheFile = storage.bucket().file(`cache/${repoId}.json`);
  const [exists] = await cacheFile.exists();
  
  if (!exists) return null;
  
  const [metadata] = await cacheFile.getMetadata();
  const age = Date.now() - new Date(metadata.updated).getTime();
  
  if (age > CACHE_TTL) return null;
  
  const [contents] = await cacheFile.download();
  return JSON.parse(contents.toString());
}
```

#### 2. Batch Processing

```typescript
// Process embeddings in batches to avoid timeout
async function batchProcessEmbeddings(chunks: Chunk[]) {
  const BATCH_SIZE = 50;
  const batches = [];
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    batches.push(batch);
  }
  
  // Process batches sequentially to respect rate limits
  for (const batch of batches) {
    await Promise.all(
      batch.map(chunk => generateAndStoreEmbedding(chunk))
    );
    await sleep(1000); // Rate limit buffer
  }
}
```

#### 3. Database Optimization

```typescript
// Use subcollections for better scalability
users/
  {userId}/
    profile: { ... }
    chats/
      {chatId}/
        metadata: { ... }
        messages/ // Subcollection
          {messageId}: { ... }

// Query optimization with composite indexes
db.collection('users/{userId}/chats')
  .where('updatedAt', '>', thirtyDaysAgo)
  .orderBy('updatedAt', 'desc')
  .limit(20);
```

### Scalability Considerations

1. **Cloudflare Pages**: Auto-scales to handle traffic spikes
2. **Firebase Firestore**: Automatically scales reads/writes
3. **Cloud Functions**: Scales instances based on demand
4. **Cloud Storage**: Unlimited storage capacity
5. **Vector Search**: Consider migration to specialized vector DB (Pinecone, Weaviate) if scale exceeds 10M+ chunks

### Monitoring & Observability

```typescript
// Firebase Performance Monitoring
import { trace } from 'firebase/performance';

const t = trace(perf, 'rag-search');
t.start();
const results = await vectorStore.search(query, 10);
t.stop();

// Cloud Functions logging
import { logger } from 'firebase-functions/v2';

logger.info('Indexing started', {
  repoId,
  fileCount,
  estimatedTime: fileCount * 2
});

// Error tracking
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## Implementation Status

### ✅ Fully Implemented Features

#### Core Chat Functionality
- ✅ **Chat Interface**: Complete chat UI with message history, input, and real-time updates
- ✅ **Message Management**: Create, send, display messages with role-based styling
- ✅ **Chat Management**: Create, rename, delete, pin/unpin chats
- ✅ **Chat History Sidebar**: Navigate between chats, search, and organize
- ✅ **Citations**: Display source references with GitHub links

#### Authentication & User Management
- ✅ **Firebase Authentication**: Email/password sign up and sign in
- ✅ **User Profiles**: User profile creation and management
- ✅ **Role Management**: User and admin roles with proper access control
- ✅ **Member Tiers**: Configurable member levels with daily message limits
- ✅ **Usage Tracking**: Daily message counter with automatic reset

#### Journey System
- ✅ **Journey Model**: Guided conversation paths with custom system prompts
- ✅ **Journey Selector**: UI component to choose journey for chat
- ✅ **Journey Management**: Admin CRUD operations for journeys
- ✅ **Journey Integration**: Apply journey-specific prompts in AI responses

#### Context Management & RAG
- ✅ **GitHub Integration**: Fetch repository files via GitHub API
- ✅ **Repository Indexing**: Full indexing pipeline for markdown files
- ✅ **Content Chunking**: Smart chunking (1500 chars, 200 overlap) with boundary detection
- ✅ **Chunk Storage**: Store chunks in Firestore with metadata
- ✅ **Keyword Search**: Frequency-based keyword matching for context retrieval
- ✅ **Context Injection**: Include relevant chunks in AI prompts
- ✅ **File Filtering**: Filter to .md files only, ignore common build directories

#### AI Integration
- ✅ **Genkit Framework**: Integration with @genkit-ai packages
- ✅ **Gemini 2.0 Flash**: Using gemini-2.0-flash-exp model
- ✅ **Configurable AI Settings**: Temperature, max tokens via system config
- ✅ **System Prompts**: Default and journey-specific prompt templates
- ✅ **Conversation History**: Include last 10 messages in context

#### Voice Features
- ✅ **Voice Recording**: Capture audio via Web Audio API
- ✅ **Audio Transcription**: Convert speech to text using Gemini
- ✅ **Voice Response**: Generate spoken responses with TTS
- ✅ **Voice UI Component**: Complete voice conversation interface

#### Admin Dashboard
- ✅ **Repository Management**: Add, remove, re-index GitHub repositories
- ✅ **Repository Status**: Track indexing progress and status
- ✅ **Journey Management**: Full CRUD for guided conversation paths
- ✅ **User Management**: View users, change roles, manage access
- ✅ **System Configuration**: Edit AI settings, RAG config, member tiers
- ✅ **System Stats**: View usage statistics and system metrics

#### Security & Validation
- ✅ **Firestore Security Rules**: Proper access control for all collections
- ✅ **Authentication Checks**: Verify auth on all Cloud Functions
- ✅ **Prompt Injection Detection**: Basic validation to prevent prompt injection
- ✅ **Input Validation**: Message length and content validation
- ✅ **Rate Limiting**: Per-user message limits based on member tier

### 🚧 Partially Implemented / In Progress

#### Context Retrieval
- 🚧 **Vector Embeddings**: Planned but not yet implemented
  - Current: Keyword-based search with frequency scoring
  - Planned: Semantic search with vector embeddings
- 🚧 **Semantic Similarity**: minSimilarity config exists but not used
  - Current: Simple keyword matching
  - Planned: Cosine similarity with embedding vectors

#### Response Streaming
- 🚧 **Streaming API**: Function stub exists but not implemented
  - Current: Complete responses only
  - Planned: Token-by-token streaming via SSE or WebSocket

### ❌ Not Yet Implemented

#### Advanced Features
- ❌ **Chat History API**: getChatHistory Cloud Function stub exists but empty
- ❌ **Cache Updates**: updateCache Cloud Function not implemented
- ❌ **Private Repositories**: GitHub token support in indexing
- ❌ **Multiple File Types**: Currently only .md files supported
- ❌ **Reindexing Detection**: Automatic reindexing on repo changes
- ❌ **Vector Database Migration**: Currently using Firestore for chunks

#### Future Enhancements
- ❌ **Google OAuth**: Additional authentication method
- ❌ **Anonymous Mode**: Guest access with limited features
- ❌ **Export Chat History**: Download conversations
- ❌ **Advanced Analytics**: Detailed usage metrics and insights
- ❌ **Multi-language Support**: I18n beyond English
- ❌ **Dark/Light Theme Toggle**: Currently dark theme only

### Technology Stack Summary

**Current Implementation:**
- Frontend: React 19 + TypeScript + Vite + TailwindCSS
- Backend: Firebase (Firestore, Auth, Functions, Storage)
- AI: Genkit + Gemini 2.0 Flash Experimental
- Search: Keyword-based frequency matching
- Hosting: Cloudflare Pages (planned, currently local dev)

**Dependencies:**
```json
Frontend:
  - react: ^19.2.0
  - firebase: ^11.1.0
  - react-markdown: ^10.1.0
  - lucide-react: ^0.562.0

Backend (Functions):
  - firebase-functions: ^7.0.2
  - firebase-admin: ^13.6.0
  - genkit: ^1.27.0
  - @genkit-ai/google-genai: ^1.27.0
  - axios: ^1.7.0
```

### File Statistics (as of February 2026)

**Collection Structure:**
```
Firestore Collections:
  - users/{uid}
    - chats/{chatId}
      - messages/{messageId}
  - journeys/{journeyId}
  - contextSources/{sourceId}
  - chunks/{chunkId}
  - systemConfig/settings
```

**Implementation Files:**
- Frontend Components: ~20 files
- Backend Functions: ~15 files
- TypeScript Types: Defined in frontend/src/types/
- Services: 6 main service files

### Next Priority Items

1. **Vector Embeddings**: Implement semantic search with Gemini embeddings
2. **Streaming Responses**: Enable real-time token streaming
3. **Cloudflare Deployment**: Deploy frontend to production
4. **Testing Suite**: Add comprehensive tests
5. **Documentation**: API documentation and user guides

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Frontend:**

- [x] Set up Vite + React + TypeScript project
- [ ] Configure TailwindCSS
- [ ] Implement authentication UI (login/signup)
- [ ] Create basic chat interface
- [ ] Set up routing

**Backend:**

- [ ] Initialize Firebase project
- [ ] Configure Firestore database
- [ ] Set up Firebase Authentication
- [ ] Implement basic security rules
- [ ] Create user profile management

**Deliverable:** Users can sign up, log in, and see an empty chat interface.

---

### Phase 2: Core Chat Functionality (Weeks 3-4)

**Frontend:**

- [ ] Build message input component
- [ ] Implement message list with auto-scroll
- [ ] Add markdown rendering
- [ ] Implement chat history storage

**Backend:**

- [ ] Create Cloud Function: `sendMessage`
- [ ] Integrate Gemini API
- [ ] Implement basic prompt construction
- [ ] Add message persistence to Firestore
- [ ] Enable streaming responses (SSE)

**Deliverable:** Users can have conversations with DMN (without context loading yet).

---

### Phase 3: Context Management (Weeks 5-7)

**Frontend:**

- [ ] Build admin dashboard
- [ ] Create repository manager UI
- [ ] Implement progress indicators
- [ ] Add repository list view

**Backend:**

- [ ] Create Cloud Function: `indexRepository`
- [ ] Implement GitHub API integration
- [ ] Build file fetching logic
- [ ] Create chunking algorithm
- [ ] Set up Cloud Storage for caching

**Deliverable:** Admins can add GitHub repositories and see indexing progress.

---

### Phase 4: RAG System (Weeks 8-10)

**Backend:**

- [ ] Integrate Gemini Embedding API
- [ ] Implement vector embedding generation
- [ ] Build vector storage system (in-memory or Firestore)
- [ ] Create semantic search function
- [ ] Implement hybrid ranking algorithm

**Integration:**

- [ ] Connect RAG system to chat service
- [ ] Build dynamic prompt construction
- [ ] Add context citation formatting
- [ ] Implement context window management

**Deliverable:** Chat responses now include relevant context from loaded repositories.

---

### Phase 5: Enhanced Features (Weeks 11-12)

**Frontend:**

- [ ] Add chat history sidebar
- [ ] Implement chat title generation
- [ ] Add export chat functionality
- [ ] Create user settings panel
- [ ] Improve mobile responsiveness

**Backend:**

- [ ] Implement auto-save functionality
- [ ] Add chat search
- [ ] Create batch embedding processing
- [ ] Optimize query performance

**Deliverable:** Full-featured chat experience with history management.

---

### Phase 6: Admin Tools & Monitoring (Weeks 13-14)

**Admin Dashboard:**

- [ ] System statistics view
- [ ] Indexing status monitoring
- [ ] User management panel
- [ ] System configuration editor
- [ ] Usage analytics

**Monitoring:**

- [ ] Set up Firebase Performance Monitoring
- [ ] Implement error tracking (Sentry)
- [ ] Add logging and alerting
- [ ] Create admin notification system

**Deliverable:** Complete admin toolkit for system management.

---

### Phase 7: Optimization & Polish (Weeks 15-16)

**Performance:**

- [ ] Implement lazy loading
- [ ] Add service worker for offline support
- [ ] Optimize bundle size
- [ ] Enable response caching
- [ ] Improve cold start times

**UX/UI:**

- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add keyboard shortcuts
- [ ] Create onboarding tutorial
- [ ] Polish animations and transitions

**Testing:**

- [ ] Write unit tests
- [ ] Add integration tests
- [ ] Perform load testing
- [ ] Conduct security audit

**Deliverable:** Production-ready application.

---

### Phase 8: Launch & Beyond (Week 17+)

**Pre-Launch:**

- [ ] Final security review
- [ ] Load content from claimfreedom.org repos
- [ ] User acceptance testing
- [ ] Documentation finalization
- [ ] Marketing materials

**Post-Launch:**

- [ ] Monitor system performance
- [ ] Gather user feedback
- [ ] Iterate on features
- [ ] Scale infrastructure as needed

**Future Enhancements:**

- [ ] Multi-modal support (images, PDFs)
- [ ] Advanced admin analytics
- [ ] API for third-party integrations
- [ ] Mobile apps (React Native)
- [ ] Voice input/output
- [ ] Multi-language support

---

## Appendix

### A. File Structure

```markdown
dmn-chat/
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatView.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── TypingIndicator.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── RepositoryManager.tsx
│   │   │   │   ├── SourceList.tsx
│   │   │   │   ├── IndexingStatus.tsx
│   │   │   │   └── SystemSettings.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── shared/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── services/
│   │   │   ├── firebase.ts
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   └── admin.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useAutoSave.ts
│   │   │   └── useAdmin.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChatContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── types/
│   │   │   ├── chat.ts
│   │   │   ├── user.ts
│   │   │   └── admin.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── functions/
│   ├── src/
│   │   ├── chat/
│   │   │   ├── sendMessage.ts
│   │   │   ├── getChatHistory.ts
│   │   │   └── streamResponse.ts
│   │   ├── context/
│   │   │   ├── indexRepository.ts
│   │   │   ├── searchContext.ts
│   │   │   ├── ragService.ts
│   │   │   └── embeddings.ts
│   │   ├── admin/
│   │   │   ├── addSource.ts
│   │   │   ├── removeSource.ts
│   │   │   ├── getStats.ts
│   │   │   └── updateConfig.ts
│   │   ├── github/
│   │   │   ├── fetchRepository.ts
│   │   │   ├── parseUrl.ts
│   │   │   └── validateAccess.ts
│   │   ├── utils/
│   │   │   ├── chunking.ts
│   │   │   ├── vectorSearch.ts
│   │   │   ├── promptBuilder.ts
│   │   │   └── rateLimiter.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .gitignore
├── README.md
├── ARCHITECTURE.md
└── package.json
```

### B. Environment Variables

#### Frontend Environment Variables (.env)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Application Configuration
VITE_APP_NAME=DMN Chat
VITE_APP_URL=https://dmnchat.claimfreedom.org
VITE_ADMIN_EMAIL=admin@claimfreedom.org

# Optional: Analytics
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GA_MEASUREMENT_ID=your_ga_id
```

#### Backend Environment Variables (Firebase Functions)

```bash
# Set via Firebase CLI:
# firebase functions:secrets:set GEMINI_API_KEY
# firebase functions:secrets:set GITHUB_TOKEN

GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
NODE_ENV=production
```

### C. Key Dependencies

#### Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.1.0",
    "firebase": "^11.1.0",
    "@google/generative-ai": "^1.34.0",
    "react-markdown": "^10.1.0",
    "react-syntax-highlighter": "^16.1.0",
    "lucide-react": "^0.562.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^6.2.0",
    "typescript": "^5.8.0",
    "tailwindcss": "^4.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.1.0"
  }
}
```

#### Backend Dependencies (Functions)

```json
{
  "dependencies": {
    "firebase-admin": "^13.0.0",
    "firebase-functions": "^6.2.0",
    "@google-cloud/storage": "^8.2.0",
    "@google/generative-ai": "^1.34.0",
    "axios": "^1.7.0",
    "cors": "^2.8.5",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "@types/node": "^22.14.0",
    "firebase-functions-test": "^3.3.0"
  }
}
```

### D. Glossary

- **RAG**: Retrieval-Augmented Generation - enhancing LLM responses with retrieved context
- **DMN**: Default Mode Network (neuroscience) / The Daemon (persona in this app)
- **Chunk**: A segment of text (typically 1500 chars) used for semantic search
- **Embedding**: Vector representation of text for similarity search
- **Vector Search**: Finding similar items using cosine similarity in vector space
- **SSE**: Server-Sent Events - one-way streaming from server to client
- **Firebase**: Google's backend-as-a-service platform
- **Cloudflare Pages**: Static site hosting with edge computing
- **Gemini**: Google's large language model API

---

## Conclusion

This architecture document provides a comprehensive blueprint for building DMN Chat from scratch. The system leverages modern serverless technologies (Cloudflare Pages + Firebase) to create a scalable, cost-effective, and maintainable AI chat application with sophisticated context management capabilities.

**Key architectural decisions:**

1. **Serverless architecture** for automatic scaling and low operational overhead
2. **RAG-based approach** for grounding AI responses in authoritative sources
3. **Firebase backend** for rapid development and built-in features
4. **Vector embeddings** for semantic search and relevance
5. **Admin-driven content** allowing dynamic context updates without code changes

The phased implementation roadmap ensures steady progress from MVP to production-ready application over approximately 16 weeks.

For questions or clarifications, contact the development team or refer to the source code documentation.
