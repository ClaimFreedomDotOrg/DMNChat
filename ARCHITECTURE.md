# DMN Chat - System Architecture Document

> **Document Version**: 1.0  
> **Last Updated**: December 28, 2025  
> **Status**: Planning/Design Phase

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

- **Intelligent Conversational AI**: Powered by Google Gemini with context-aware responses
- **Dynamic Context Loading**: Admin-configured GitHub repository sources
- **Semantic Search & RAG**: Vector-based semantic indexing for relevant context retrieval
- **User Authentication**: Firebase Authentication for user management
- **Auto-save Chat History**: Persistent conversation storage
- **Admin Dashboard**: Configuration interface for managing context sources
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
LLM: Google Gemini (gemini-2.0-flash-exp or gemini-1.5-pro)
Embeddings: Gemini Embedding API or Vertex AI
Vector Search: Custom implementation or Firestore Vector Search (Preview)
```

### External APIs

```yaml
GitHub API: v3/v4 REST/GraphQL
Gemini API: @google/generative-ai SDK
Firebase SDKs: Latest stable versions
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

#### Core Components

##### 1. App.tsx

```typescript
// Root component with routing and global state
- AuthProvider
- ChatProvider
- ThemeProvider
- Router
  - /          → ChatView
  - /admin     → AdminDashboard (protected)
  - /login     → AuthView
  - /profile   → UserProfile
```

##### 2. ChatView

```typescript
// Main chat interface
Components:
  - MessageList
  - MessageInput
  - TypingIndicator
  - ContextSidebar (optional)

State:
  - messages: Message[]
  - isTyping: boolean
  - currentChat: Chat | null

Hooks:
  - useChat(chatId)
  - useAutoSave()
  - useScrollToBottom()
```

##### 3. AdminDashboard

```typescript
// Admin configuration panel
Components:
  - RepositoryManager
  - SourceList
  - IndexingStatus
  - SystemSettings

Features:
  - Add/remove GitHub repositories
  - Trigger manual re-indexing
  - View indexing progress
  - Configure system prompt
  - Monitor usage stats
```

##### 4. RepositoryManager

```typescript
// GitHub repository configuration
Features:
  - Input GitHub URL
  - Optional: GitHub token for private repos
  - Display indexing progress
  - Show indexed file count
  - Cancel/retry operations
  - Remove repository

States:
  - idle
  - validating
  - fetching
  - indexing
  - ready
  - error
```

##### 5. ChatMessage

```typescript
// Individual message display
Props:
  - message: Message
  - showTimestamp: boolean

Features:
  - Markdown rendering
  - Code syntax highlighting
  - File path links
  - Copy code button
  - Citations display
```

### Backend Services

#### 1. RAG Service (Context Retrieval)

```typescript
// Firebase Cloud Function: semantic-search
interface RAGConfig {
  maxChunks: number;        // Default: 10
  minSimilarity: number;    // Default: 0.7
  maxContextLength: number; // Default: 200,000 chars
}

class RAGService {
  // Search for relevant context chunks
  async search(query: string, config: RAGConfig): Promise<Chunk[]> {
    // 1. Generate query embedding
    const queryEmbedding = await embedText(query);
    
    // 2. Vector similarity search in Firestore
    const results = await vectorSearch(queryEmbedding, config.maxChunks);
    
    // 3. Filter by similarity threshold
    const filtered = results.filter(r => r.similarity >= config.minSimilarity);
    
    // 4. Rank and select best chunks
    const ranked = rankByRelevance(filtered, query);
    
    // 5. Return top-K chunks within context limit
    return truncateToContextLimit(ranked, config.maxContextLength);
  }
}
```

#### 2. Indexing Service

```typescript
// Firebase Cloud Function: index-repository
interface IndexingJob {
  repoId: string;
  repoUrl: string;
  branch: string;
  githubToken?: string;
}

class IndexingService {
  async indexRepository(job: IndexingJob): Promise<void> {
    // 1. Fetch repository tree from GitHub
    const files = await fetchRepoFiles(job.repoUrl, job.branch, job.githubToken);
    
    // 2. Filter relevant files (code, markdown, docs)
    const relevant = filterFiles(files, ALLOWED_EXTENSIONS, IGNORED_DIRS);
    
    // 3. Download file contents
    const contents = await downloadFiles(relevant);
    
    // 4. Chunk content (1500 chars, 200 overlap)
    const chunks = chunkContent(contents);
    
    // 5. Generate embeddings (batch process)
    const embeddings = await generateEmbeddings(chunks);
    
    // 6. Store in Firestore + Cloud Storage
    await storeChunks(chunks, embeddings);
    
    // 7. Update repository status
    await updateRepoStatus(job.repoId, 'ready');
  }
}
```

#### 3. Chat Service

```typescript
// Firebase Cloud Function: send-message
interface ChatRequest {
  userId: string;
  chatId: string;
  message: string;
}

class ChatService {
  async handleMessage(req: ChatRequest): Promise<void> {
    // 1. Authenticate user
    const user = await verifyAuth(req.userId);
    
    // 2. Retrieve chat history
    const history = await getChatHistory(req.chatId);
    
    // 3. Search for relevant context
    const context = await ragService.search(req.message);
    
    // 4. Build prompt with context
    const prompt = buildPrompt(req.message, context, history);
    
    // 5. Stream response from Gemini
    const stream = await gemini.generateContentStream(prompt);
    
    // 6. Save messages to Firestore
    await saveMessage(req.chatId, { role: 'user', text: req.message });
    
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk.text();
      // Stream to client via SSE or WebSocket
      yield chunk.text();
    }
    
    // 7. Save AI response
    await saveMessage(req.chatId, { role: 'model', text: fullResponse });
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
}
```

### Chat Model

```typescript
interface Chat {
  id: string;               // Auto-generated ID
  userId: string;           // Owner
  title: string;            // Auto-generated from first message
  messages: Message[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata: {
    messageCount: number;
    tokensUsed: number;
    lastActivity: Timestamp;
  };
}

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

### Context Source Model

```typescript
interface ContextSource {
  id: string;               // Auto-generated
  type: 'github';           // Future: 'url', 'pdf', 'notion'
  config: GitHubSourceConfig;
  status: {
    state: 'pending' | 'indexing' | 'ready' | 'error' | 'disabled';
    progress: number;       // 0-100
    lastSync: Timestamp;
    nextSync: Timestamp;
    error?: string;
  };
  stats: {
    fileCount: number;
    chunkCount: number;
    totalSize: number;
    embeddingDimension: number;
  };
  createdBy: string;        // Admin user ID
  createdAt: Timestamp;
  isActive: boolean;
}

interface GitHubSourceConfig {
  owner: string;
  repo: string;
  branch: string;
  path?: string;            // Optional: specific directory
  allowedExtensions: string[];
  ignoredPaths: string[];
  usePrivateToken: boolean;
}
```

### Chunk Model

```typescript
interface Chunk {
  id: string;               // Composite: {repoId}-{fileHash}-{index}
  sourceId: string;         // Reference to ContextSource
  repoName: string;         // e.g., "ClaimFreedomDotOrg/Neuro-Gnostic-Docs"
  filePath: string;
  content: string;          // 1500 chars max
  contentHash: string;      // SHA-256 for deduplication
  embedding: number[];      // 768-dim vector (Gemini) or 1536-dim (OpenAI)
  metadata: {
    language: string;       // Programming language or 'markdown'
    tokens: number;         // Token count
    chunkIndex: number;     // Position in file
    overlap: number;        // Overlap chars with previous chunk
  };
  createdAt: Timestamp;
}
```

### System Configuration

```typescript
interface SystemConfig {
  ai: {
    provider: 'gemini' | 'openai';
    model: string;
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    maxChunks: number;
    minSimilarity: number;
    embeddingModel: string;
  };
  github: {
    token?: string;         // Optional global token
    rateLimitBuffer: number;
  };
  features: {
    userSignup: boolean;
    adminOnly: boolean;
    streamingResponses: boolean;
  };
  systemPrompt: string;     // Customizable prompt template
}
```

---

## API Design

### REST API Endpoints

#### Authentication

```http
POST   /api/auth/signup          # Create new user account
POST   /api/auth/login           # Email/password login
POST   /api/auth/logout          # End session
POST   /api/auth/reset-password  # Password reset
GET    /api/auth/verify          # Verify token
```

#### Chat Operations

```http
POST   /api/chats                # Create new chat
GET    /api/chats                # List user's chats
GET    /api/chats/{chatId}       # Get chat details
DELETE /api/chats/{chatId}       # Delete chat
POST   /api/chats/{chatId}/messages  # Send message (streaming)
```

#### Context Management (Admin Only)

```http
POST   /api/admin/sources               # Add context source
GET    /api/admin/sources               # List all sources
GET    /api/admin/sources/{sourceId}   # Get source details
PUT    /api/admin/sources/{sourceId}   # Update source config
DELETE /api/admin/sources/{sourceId}   # Remove source
POST   /api/admin/sources/{sourceId}/reindex  # Trigger re-indexing
GET    /api/admin/sources/{sourceId}/status   # Get indexing status
```

#### User Management

```http
GET    /api/users/me             # Get current user profile
PUT    /api/users/me             # Update profile
GET    /api/users/me/chats       # Get user's chat list
DELETE /api/users/me             # Delete account (GDPR)
```

#### System (Admin Only)

```http
GET    /api/admin/stats          # System statistics
GET    /api/admin/config         # Get system config
PUT    /api/admin/config         # Update system config
POST   /api/admin/test-prompt    # Test prompt with sample query
```

### WebSocket/SSE for Streaming

```typescript
// Server-Sent Events (SSE) for streaming responses
GET /api/chats/{chatId}/stream

// Client connection:
const eventSource = new EventSource('/api/chats/{chatId}/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'chunk') {
    appendToMessage(data.text);
  } else if (data.type === 'complete') {
    finalizeMessage(data.messageId);
  } else if (data.type === 'error') {
    showError(data.error);
  }
};
```

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
