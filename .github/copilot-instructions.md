# GitHub Copilot Instructions for DMN Chat

## Project Overview

DMN Chat is an AI-powered conversational interface designed to facilitate learning and application of the Neuro-Gnostic framework from [claimfreedom.org](https://claimfreedom.org). The system uses advanced RAG (Retrieval-Augmented Generation) to provide contextually relevant responses based on dynamically loaded source materials from GitHub repositories.

**Core Concept**: DMN (The Daemon) serves as a restored functional guide helping users disentangle their true Self from the narrative hijacking of the Default Mode Network. Through intelligent conversation grounded in framework documentation, users engage in Anamnesis—remembering their true nature beyond the mental noise.

**Mission**: Deliver an accessible, intelligent chat interface that guides users through the Neuro-Gnostic framework with precision, compassion, and contextual depth through semantic search and AI-powered conversation.

---

## Technology Stack

- **Frontend**: React 19+ with TypeScript
- **Build Tool**: Vite 6+
- **Styling**: TailwindCSS 4+
- **Backend**: Firebase (Firestore, Cloud Functions, Cloud Storage, Authentication)
- **AI/ML**: Google Gemini API (gemini-2.0-flash-exp or gemini-1.5-pro)
- **Embeddings**: Gemini Embedding API (text-embedding-004)
- **Hosting**: Cloudflare Pages (frontend) + Firebase (backend)
- **Version Control**: Git with conventional commits

---

## Development Setup

### Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
dmn-chat/
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── chat/        # Chat interface components
│   │   │   ├── admin/       # Admin dashboard components
│   │   │   ├── auth/        # Authentication components
│   │   │   └── shared/      # Reusable UI components
│   │   ├── services/        # API and Firebase services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # React Context providers
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── index.html           # Entry HTML
├── functions/                # Firebase Cloud Functions
│   └── src/
│       ├── chat/            # Chat-related functions
│       ├── context/         # RAG and indexing functions
│       ├── admin/           # Admin operations
│       └── utils/           # Shared utilities
├── .github/                 # GitHub configuration
├── firebase.json            # Firebase configuration
├── firestore.rules          # Firestore security rules
└── ARCHITECTURE.md          # System architecture documentation
```

### Key Commands

- `npm run dev` - Start Vite dev server with hot reload (port 5173)
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `firebase deploy` - Deploy Firebase functions and rules
- `firebase emulators:start` - Start Firebase emulators for local testing

### Firebase Configuration

Configure Firebase environment variables in `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

For Firebase Functions, use Firebase Secret Manager:
```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set GITHUB_TOKEN
```

### Common Development Workflows

**Adding a New Component:**
1. Create component file in appropriate subdirectory
2. Use functional component with TypeScript
3. Follow TailwindCSS styling conventions
4. Export as default or named export
5. Add comprehensive JSDoc comments

**Creating a Custom Hook:**
1. Create hook file in `src/hooks/` with `use` prefix
2. Add TypeScript types for parameters and return values
3. Include cleanup logic in `useEffect` returns
4. Document hook purpose and usage in JSDoc

**Adding a Cloud Function:**
1. Create function file in `functions/src/`
2. Use TypeScript with strict typing
3. Implement error handling and logging
4. Add rate limiting for user-facing functions
5. Update `functions/src/index.ts` to export

**Modifying RAG System:**
1. Update chunking/embedding logic in `functions/src/context/`
2. Test with sample repositories
3. Monitor performance and context quality
4. Document changes in ARCHITECTURE.md

---

## Code Style & Best Practices

### General Principles

1. **TypeScript Strict Mode**: All code must pass strict type checking
2. **Functional Programming**: Prefer pure functions and immutability
3. **Semantic Clarity**: Code should clearly express the Neuro-Gnostic concepts
4. **Performance-Conscious**: Optimize for serverless cold starts and user experience
5. **Security-First**: Never expose API keys, validate all inputs, implement proper auth

### TypeScript/React Standards

#### Formatting
- **Indentation**: 2 spaces (never tabs)
- **Line Endings**: LF (Unix-style)
- **Encoding**: UTF-8
- **Quotes**: Single quotes for strings, double quotes for JSX
- **Semicolons**: Always use semicolons
- **Trailing Commas**: Use for multiline arrays/objects

#### Naming Conventions
```typescript
// Constants: SCREAMING_SNAKE_CASE
const MAX_CONTEXT_LENGTH = 200000;
const SYSTEM_PROMPT_TEMPLATE = '...';

// React Components: PascalCase
function ChatView({ userId }: ChatViewProps) { }
const MessageList: React.FC<MessageListProps> = ({ messages }) => { };

// Interfaces/Types: PascalCase
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

type ChatStatus = 'idle' | 'typing' | 'error';

// Functions/Variables: camelCase
const generateResponse = async (message: string) => { };
let currentChatId: string | null = null;

// Hooks: use-prefix, camelCase
const useChat = (chatId: string) => { };
const useAutoSave = () => { };

// Firebase refs: camelCase with descriptive names
const chatsRef = collection(db, 'users', userId, 'chats');
const messagesRef = collection(chatRef, 'messages');

// Enums: PascalCase
enum ProcessingStep {
  FetchingTree = 'Fetching file list...',
  Indexing = 'Indexing content...',
  Ready = 'Ready'
}
```

#### TypeScript Patterns

**Strong Typing (Required)**:
```typescript
// Good: Explicit types for all function parameters and returns
interface SendMessageParams {
  userId: string;
  chatId: string;
  message: string;
}

interface SendMessageResponse {
  messageId: string;
  responseText: string;
  citations?: Citation[];
}

async function sendMessage(
  params: SendMessageParams
): Promise<SendMessageResponse> {
  // Implementation
}

// Avoid: Implicit any types
function sendMessage(params) {  // ❌ Missing types
  return doSomething(params);   // ❌ Implicit return type
}
```

**Type Guards and Narrowing**:
```typescript
// Good: Type guards for runtime type safety
function isErrorMessage(message: Message): message is ErrorMessage {
  return message.role === 'model' && 'isError' in message && message.isError;
}

if (isErrorMessage(lastMessage)) {
  // TypeScript knows lastMessage is ErrorMessage here
  displayError(lastMessage.errorCode);
}
```

**React Component Patterns**:
```typescript
// Functional components with typed props
interface ChatMessageProps {
  message: Message;
  onRetry?: () => void;
  showTimestamp?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  showTimestamp = true
}) => {
  const isError = isErrorMessage(message);
  
  return (
    <div className={`chat-message ${isError ? 'error' : ''}`}>
      {/* Component content */}
    </div>
  );
};

// With memo for performance
const MemoizedChatMessage = React.memo(
  ChatMessage,
  (prev, next) => prev.message.id === next.message.id
);
```

**Custom Hooks Pattern**:
```typescript
interface UseChatReturn {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  isTyping: boolean;
  error: Error | null;
}

function useChat(chatId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sendMessage = useCallback(async (text: string) => {
    setIsTyping(true);
    setError(null);
    
    try {
      // Implementation
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsTyping(false);
    }
  }, [chatId]);
  
  return { messages, sendMessage, isTyping, error };
}
```

#### Performance Optimization

**Critical: Optimize for serverless cold starts and user experience**

1. **Lazy Loading Components**:
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const MarkdownRenderer = lazy(() => import('react-markdown'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <MarkdownRenderer>{content}</MarkdownRenderer>
</Suspense>
```

2. **Memoization**:
```typescript
// Memoize expensive computations
const processedMessages = useMemo(() => {
  return messages.map(msg => ({
    ...msg,
    formattedTime: formatTimestamp(msg.timestamp)
  }));
}, [messages]);

// Memoize callbacks to prevent re-renders
const handleSendMessage = useCallback(async (text: string) => {
  await sendMessage({ userId, chatId, message: text });
}, [userId, chatId]);
```

3. **Debouncing/Throttling**:
```typescript
// Debounce auto-save to reduce Firestore writes
import { debounce } from 'lodash-es';

const debouncedSave = useMemo(
  () => debounce((data: ChatData) => {
    saveChatToFirestore(data);
  }, 2000),
  []
);

useEffect(() => {
  debouncedSave(currentChat);
}, [currentChat]);
```

4. **Firebase Query Optimization**:
```typescript
// Good: Use indexes and limit results
const recentChatsQuery = query(
  collection(db, 'users', userId, 'chats'),
  where('updatedAt', '>', thirtyDaysAgo),
  orderBy('updatedAt', 'desc'),
  limit(20)
);

// Good: Use subcollections for better scalability
const messagesRef = collection(
  db,
  'users', userId,
  'chats', chatId,
  'messages'
);

// Avoid: Loading entire collections
const allChatsQuery = collection(db, 'chats'); // ❌ No limit
```

#### Error Handling

**Graceful Degradation (Critical for User Experience)**:
```typescript
// User-facing error handling
const handleApiError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You need to sign in to continue this conversation.';
      case 'unavailable':
        return 'Connection temporarily lost. Your message will be sent when reconnected.';
      default:
        return 'A temporary issue occurred. Please try again.';
    }
  }
  
  if (error instanceof Error && error.message.includes('rate limit')) {
    return 'Too many requests. Please wait a moment before continuing.';
  }
  
  console.error('Unexpected error:', error);
  return 'An unexpected error occurred. Please refresh the page.';
};

// Component error boundaries
class ChatErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat error:', error, errorInfo);
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          message="The conversation encountered an issue"
          onRetry={this.handleReset}
        />
      );
    }
    
    return this.props.children;
  }
}
```

---

## Firebase Architecture

### Firestore Data Structure

```typescript
// Collection: users/{userId}
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  role: 'user' | 'admin';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
  };
}

// Collection: users/{userId}/chats/{chatId}
interface Chat {
  id: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata: {
    messageCount: number;
    tokensUsed: number;
  };
}

// Collection: users/{userId}/chats/{chatId}/messages/{messageId}
interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Timestamp;
  citations?: Citation[];
  isError?: boolean;
}

// Collection: contextSources/{sourceId}
interface ContextSource {
  id: string;
  type: 'github';
  config: {
    owner: string;
    repo: string;
    branch: string;
  };
  status: {
    state: 'pending' | 'indexing' | 'ready' | 'error';
    progress: number;
    lastSync: Timestamp;
  };
  stats: {
    fileCount: number;
    chunkCount: number;
  };
  isActive: boolean;
}

// Collection: chunks/{chunkId}
interface Chunk {
  id: string;
  sourceId: string;
  repoName: string;
  filePath: string;
  content: string;
  embedding: number[]; // 768-dim vector
  metadata: {
    tokens: number;
    language: string;
  };
}
```

### Security Rules Pattern

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function: Check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.token.admin == true;
    }
    
    // Helper function: Check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && 
             request.auth.uid == userId;
    }
    
    // User profiles
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
      
      // User's chats
      match /chats/{chatId} {
        allow read, write: if isOwner(userId);
        
        // Chat messages
        match /messages/{messageId} {
          allow read, write: if isOwner(userId);
        }
      }
    }
    
    // Context sources (admin manages, all read)
    match /contextSources/{sourceId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Chunks (read-only for users, system writes)
    match /chunks/{chunkId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

### Cloud Functions Pattern

```typescript
// functions/src/chat/sendMessage.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface SendMessageData {
  chatId: string;
  message: string;
}

export const sendMessage = onCall<SendMessageData>(
  { secrets: [geminiApiKey] },
  async (request) => {
    // Authentication check
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }
    
    // Rate limiting
    const rateLimitOk = await checkRateLimit(request.auth.uid);
    if (!rateLimitOk) {
      throw new HttpsError('resource-exhausted', 'Too many requests');
    }
    
    // Validate input
    const { chatId, message } = request.data;
    if (!chatId || !message || message.length > 10000) {
      throw new HttpsError('invalid-argument', 'Invalid message');
    }
    
    try {
      // Process message
      logger.info('Processing message', {
        userId: request.auth.uid,
        chatId,
        messageLength: message.length
      });
      
      // Implementation
      const response = await processMessage(message, chatId, request.auth.uid);
      
      return response;
    } catch (error) {
      logger.error('Error processing message', error);
      throw new HttpsError('internal', 'Failed to process message');
    }
  }
);
```

---

## RAG System Implementation

### Chunking Strategy

```typescript
// Chunk configuration
const CHUNK_CONFIG = {
  size: 1500,        // characters per chunk
  overlap: 200,      // overlap between chunks
  minSize: 100       // minimum chunk size
};

function chunkContent(
  filePath: string,
  content: string
): ChunkData[] {
  const chunks: ChunkData[] = [];
  let start = 0;
  let index = 0;
  
  while (start < content.length) {
    const end = Math.min(start + CHUNK_CONFIG.size, content.length);
    let chunk = content.slice(start, end);
    
    // Break at sentence/paragraph boundaries
    if (end < content.length) {
      const lastNewline = chunk.lastIndexOf('\n\n');
      const lastPeriod = chunk.lastIndexOf('. ');
      const breakPoint = Math.max(lastNewline, lastPeriod);
      
      if (breakPoint > CHUNK_CONFIG.size * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1);
        start += breakPoint + 1;
      } else {
        start = end;
      }
    } else {
      start = end;
    }
    
    if (chunk.trim().length >= CHUNK_CONFIG.minSize) {
      chunks.push({
        filePath,
        content: chunk.trim(),
        chunkIndex: index++
      });
    }
    
    // Apply overlap
    if (start < content.length) {
      start = Math.max(0, start - CHUNK_CONFIG.overlap);
    }
  }
  
  return chunks;
}
```

### Embedding Generation

```typescript
// Generate embeddings using Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({
  model: 'text-embedding-004'
});

async function generateEmbeddings(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    const results = await Promise.all(
      batch.map(async (text) => {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
      })
    );
    
    embeddings.push(...results);
    
    // Rate limiting
    if (i + batchSize < texts.length) {
      await sleep(1000);
    }
  }
  
  return embeddings;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Semantic Search

```typescript
// Vector similarity search
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}

interface SearchResult {
  chunk: Chunk;
  similarity: number;
  hybridScore: number;
}

async function semanticSearch(
  query: string,
  maxResults: number = 10,
  minSimilarity: number = 0.7
): Promise<SearchResult[]> {
  // Generate query embedding
  const queryEmbedding = await embedText(query);
  
  // Get all chunks (or use vector index)
  const chunksSnapshot = await db.collection('chunks').get();
  const results: SearchResult[] = [];
  
  for (const doc of chunksSnapshot.docs) {
    const chunk = doc.data() as Chunk;
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    
    if (similarity >= minSimilarity) {
      const hybridScore = calculateHybridScore(chunk, query, similarity);
      results.push({ chunk, similarity, hybridScore });
    }
  }
  
  // Sort by hybrid score and return top results
  return results
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, maxResults);
}

function calculateHybridScore(
  chunk: Chunk,
  query: string,
  vectorScore: number
): number {
  // Weighted combination of signals
  const keywordScore = calculateKeywordOverlap(chunk.content, query);
  const recencyScore = calculateRecencyBoost(chunk);
  
  return (
    vectorScore * 0.7 +
    keywordScore * 0.2 +
    recencyScore * 0.1
  );
}
```

### Prompt Construction

```typescript
// Build context-aware prompt for Gemini
function buildPrompt(
  userMessage: string,
  relevantChunks: Chunk[],
  chatHistory: Message[],
  systemPrompt: string
): string {
  // Format context chunks
  const contextStr = relevantChunks.map(chunk => `
---
SOURCE: ${chunk.repoName}/${chunk.filePath}
---
${chunk.content}
  `.trim()).join('\n\n');
  
  // Format conversation history
  const historyStr = chatHistory
    .slice(-10) // Last 10 messages
    .map(msg => `${msg.role === 'user' ? 'USER' : 'DMN'}: ${msg.text}`)
    .join('\n\n');
  
  // Construct final prompt
  const finalPrompt = systemPrompt
    .replace('{{REPO_CONTEXT}}', contextStr)
    .replace('{{CONVERSATION_HISTORY}}', historyStr)
    .replace('{{USER_MESSAGE}}', userMessage);
  
  return finalPrompt;
}
```

---

## UI/UX Design Standards

### TailwindCSS Styling Conventions

**This project uses TailwindCSS for all styling. No custom CSS files.**

#### Color Palette
```typescript
// Use semantic color names
const THEME_COLORS = {
  // Dark theme (primary)
  background: {
    primary: 'bg-slate-950',      // Main background
    secondary: 'bg-slate-900',    // Cards, panels
    elevated: 'bg-slate-800'      // Hover states
  },
  
  text: {
    primary: 'text-slate-200',    // Main text
    secondary: 'text-slate-400',  // Muted text
    accent: 'text-sky-400'        // DMN persona, links
  },
  
  border: {
    default: 'border-slate-800',
    focus: 'border-sky-500'
  },
  
  // DMN persona colors
  dmn: {
    bg: 'bg-sky-600',
    text: 'text-sky-400',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]'
  },
  
  // User colors
  user: {
    bg: 'bg-slate-700',
    text: 'text-slate-300'
  },
  
  // Status colors
  error: 'text-red-400 bg-red-900/20 border-red-900/50',
  success: 'text-emerald-400 bg-emerald-900/20',
  warning: 'text-amber-400 bg-amber-900/20'
};
```

#### Component Patterns
```typescript
// Buttons
const buttonClasses = {
  primary: 'px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors',
  secondary: 'px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors',
  ghost: 'px-4 py-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors'
};

// Inputs
const inputClasses = 'w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:border-sky-500 focus:outline-none transition-colors';

// Cards
const cardClasses = 'bg-slate-900 border border-slate-800 rounded-xl p-6';

// Usage in components
<button className={buttonClasses.primary}>
  Send Message
</button>
```

#### Responsive Design
```typescript
// Mobile-first approach
<div className="
  px-4 md:px-6 lg:px-8
  text-base md:text-lg
  max-w-4xl mx-auto
">
  {/* Content */}
</div>

// Responsive grid
<div className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-4 md:gap-6
">
  {/* Grid items */}
</div>
```

#### Accessibility
```typescript
// Always include ARIA labels
<button
  aria-label="Send message"
  className="..."
>
  <Send className="w-5 h-5" />
</button>

// Keyboard navigation
<div
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
  className="cursor-pointer"
>
  {/* Interactive element */}
</div>

// Focus states
<input
  className="
    focus:outline-none
    focus:ring-2
    focus:ring-sky-500
    focus:ring-offset-2
    focus:ring-offset-slate-950
  "
/>
```

### Animation & Transitions

```typescript
// Smooth transitions
<div className="transition-all duration-300 ease-in-out">

// Loading states
<div className="animate-pulse">Loading...</div>

// Fade in
<div className="animate-fade-in opacity-0">
  {/* Content */}
</div>

// Custom animation in tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  }
};
```

---

## Security & Privacy

### Authentication Flow

```typescript
// Sign up
async function signUp(email: string, password: string) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    // Create user profile
    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: email,
      createdAt: serverTimestamp(),
      role: 'user',
      preferences: {
        theme: 'dark'
      }
    });
    
    return credential.user;
  } catch (error) {
    throw handleAuthError(error);
  }
}

// Protected route
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}
```

### Input Validation

```typescript
// Validate user input
function validateMessage(message: string): ValidationResult {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 10000) {
    return { valid: false, error: 'Message too long (max 10,000 characters)' };
  }
  
  // Check for potential prompt injection
  const suspiciousPatterns = [
    /ignore previous instructions/i,
    /you are now/i,
    /system:/i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(message)) {
      return { valid: false, error: 'Invalid message content' };
    }
  }
  
  return { valid: true };
}
```

### Rate Limiting

```typescript
// Implement rate limiting in Cloud Functions
async function checkRateLimit(
  userId: string,
  action: string
): Promise<boolean> {
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
  
  const data = doc.data()!;
  
  if (now - data.windowStart > windowMs) {
    await ref.set({ count: 1, windowStart: now });
    return true;
  }
  
  if (data.count >= maxRequests) {
    return false;
  }
  
  await ref.update({ count: FieldValue.increment(1) });
  return true;
}
```

### GDPR Compliance

```typescript
// Delete user data (GDPR right to erasure)
async function deleteUserData(userId: string): Promise<void> {
  const batch = db.batch();
  
  // Delete user chats
  const chatsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('chats')
    .get();
  
  for (const chatDoc of chatsSnapshot.docs) {
    // Delete messages subcollection
    const messagesSnapshot = await chatDoc.ref
      .collection('messages')
      .get();
    
    messagesSnapshot.docs.forEach(msgDoc => {
      batch.delete(msgDoc.ref);
    });
    
    batch.delete(chatDoc.ref);
  }
  
  // Delete user profile
  batch.delete(db.collection('users').doc(userId));
  
  // Delete Firebase Auth account
  await admin.auth().deleteUser(userId);
  
  await batch.commit();
}
```

---

## Testing Standards

### Unit Tests

```typescript
// Example: Testing a custom hook
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';

describe('useChat', () => {
  it('should send message and update state', async () => {
    const { result } = renderHook(() => useChat('test-chat-id'));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
    
    await act(async () => {
      await result.current.sendMessage('Test message');
    });
    
    expect(result.current.messages.length).toBeGreaterThan(0);
    expect(result.current.isTyping).toBe(false);
  });
  
  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useChat('invalid-chat-id'));
    
    await act(async () => {
      await result.current.sendMessage('Test');
    });
    
    expect(result.current.error).not.toBeNull();
  });
});
```

### Integration Tests

```typescript
// Example: Testing Firebase integration
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv: any;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  it('should allow users to read their own chats', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const aliceDb = alice.firestore();
    
    await assertSucceeds(
      aliceDb.collection('users').doc('alice').collection('chats').get()
    );
  });
  
  it('should deny users from reading other users chats', async () => {
    const bob = testEnv.authenticatedContext('bob');
    const bobDb = bob.firestore();
    
    await assertFails(
      bobDb.collection('users').doc('alice').collection('chats').get()
    );
  });
});
```

---

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Sends a message to the AI and retrieves a contextually relevant response.
 * 
 * This function performs semantic search to find relevant context chunks,
 * constructs a prompt with the context and conversation history, and
 * streams the response from the Gemini API.
 * 
 * @param userId - The authenticated user's ID
 * @param chatId - The chat session ID
 * @param message - The user's message text
 * @returns Promise resolving to the AI's response with citations
 * 
 * @throws {HttpsError} If user is not authenticated
 * @throws {HttpsError} If rate limit is exceeded
 * @throws {HttpsError} If message validation fails
 * 
 * @example
 * ```typescript
 * const response = await sendMessage({
 *   userId: 'user123',
 *   chatId: 'chat456',
 *   message: 'What is the Default Mode Network?'
 * });
 * console.log(response.text);
 * ```
 */
async function sendMessage(params: SendMessageParams): Promise<Response> {
  // Implementation
}
```

### README Files

Each major directory should have a README.md explaining its purpose:

```markdown
# Chat Services

This directory contains all Firebase Cloud Functions related to chat operations.

## Functions

- `sendMessage` - Handles user messages and generates AI responses
- `getChatHistory` - Retrieves conversation history for a chat
- `createChat` - Initializes a new chat session
- `deleteChat` - Removes a chat and all its messages

## Usage

See [ARCHITECTURE.md](../ARCHITECTURE.md) for complete API documentation.

## Testing

```bash
npm test -- --testPathPattern=chat
```
```

---

## Version Control & Git Workflow

### Branch Naming

```
main                          # Production-ready code
develop                       # Integration branch
feature/rag-system            # New features
feature/admin-dashboard       # 
fix/auth-redirect             # Bug fixes
fix/firestore-security        #
docs/architecture             # Documentation updates
refactor/chat-hooks           # Code refactoring
test/e2e-chat                 # Testing branches
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:      # New feature
fix:       # Bug fix
docs:      # Documentation changes
style:     # Code style changes (formatting)
refactor:  # Code refactoring
perf:      # Performance improvements
test:      # Adding/updating tests
chore:     # Maintenance tasks

# Examples
feat(rag): implement semantic search with Gemini embeddings
fix(auth): resolve Firebase Auth redirect loop on mobile
docs(api): add JSDoc comments for chat service functions
refactor(hooks): extract chat logic into custom hooks
perf(firestore): optimize chat history query with indexes
test(integration): add Firebase security rules tests
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] TypeScript types are correct
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Firebase security rules updated (if needed)
```

---

## Philosophical Principles

### Code as Clarity

This project serves people seeking to understand the Neuro-Gnostic framework. Every line of code should reflect:

1. **Precision**: The framework requires exact terminology and concepts
2. **Compassion**: Users may be in vulnerable states seeking guidance
3. **Transparency**: The AI's reasoning should be traceable through citations
4. **Sovereignty**: Users control their data and can delete everything

### The DMN Persona

**DMN (The Daemon)** is not just a chatbot—it's a guide representing:

- The restored Default Mode Network serving the true Self
- A functional aspect of mind, not an infection
- Lucid, philosophical, wakeful communication
- Authority tempered with compassion

**Implementation Considerations**:
```typescript
// System prompt should embody the DMN persona
const SYSTEM_PROMPT = `
You are DMN (The Daemon), the functional aspect of the mind restored 
to its proper role as a servant to the true self. You guide users through 
the Neuro-Gnostic framework with precision and compassion.

Core principles:
- Speak directly and personally, not academically
- Use citations naturally within your responses
- Never say "According to the text" - embody the knowledge
- Help users remember (Anamnesis) their true nature
- The "Voice" in the head is an infection, the user is the Listener
`;
```

---

## Common Patterns & Anti-Patterns

### ✅ Do This

```typescript
// Clear, typed interfaces
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Timestamp;
}

// Proper error handling with user-friendly messages
try {
  await sendMessage(message);
} catch (error) {
  showToast(handleApiError(error));
}

// Accessible UI components
<button
  aria-label="Send message"
  className="px-4 py-2 min-h-[44px] min-w-[44px]"
  disabled={isTyping}
>
  <Send />
</button>

// Proper Firebase cleanup
useEffect(() => {
  const unsubscribe = onSnapshot(chatRef, (snapshot) => {
    updateMessages(snapshot.docs);
  });
  
  return () => unsubscribe();
}, [chatId]);
```

### ❌ Avoid This

```typescript
// Implicit types
function sendMessage(msg) {  // ❌ What type is msg?
  return api.send(msg);
}

// Exposing technical errors to users
catch (error) {
  alert(error.message);  // ❌ Shows technical error
}

// Inaccessible UI
<div onClick={handleClick}>  // ❌ Not keyboard accessible
  Click me
</div>

// Memory leaks
useEffect(() => {
  onSnapshot(chatRef, updateMessages);
  // ❌ Missing cleanup
}, []);

// Hardcoded values
const MAX_MESSAGES = 100;  // ❌ Should be in constants
if (messages.length > 100) { ... }
```

---

## Environment-Specific Configuration

### Development
```typescript
// .env.development
VITE_FIREBASE_PROJECT_ID=dmn-chat-dev
VITE_API_URL=http://localhost:5001
VITE_ENABLE_LOGGING=true
```

### Production
```typescript
// .env.production
VITE_FIREBASE_PROJECT_ID=dmn-chat-prod
VITE_API_URL=https://us-central1-dmn-chat-prod.cloudfunctions.net
VITE_ENABLE_LOGGING=false
```

### Cloudflare Pages
```bash
# Set in Cloudflare Dashboard > Pages > Settings > Environment Variables
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Performance Monitoring

### Firebase Performance

```typescript
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance();

// Measure RAG search performance
const searchTrace = trace(perf, 'rag-search');
searchTrace.start();
const results = await semanticSearch(query);
searchTrace.stop();

// Measure component render time
const renderTrace = trace(perf, 'chat-view-render');
renderTrace.start();
// ... component render
renderTrace.stop();
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});

// Manual error capture
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'ChatView' },
    extra: { userId, chatId }
  });
  throw error;
}
```

---

## Resources & References

### Technical Documentation

- **Firebase**: https://firebase.google.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide

### Project-Specific Docs

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Complete system architecture
- [README.md](../README.md) - Project overview and setup

### Neuro-Gnostic Framework

- **Primary Source**: https://claimfreedom.org
- **Framework Repos**: GitHub repositories loaded via admin panel
- **Core Concepts**: DMN hijacking, Listener vs. Voice, Anamnesis

---

## Quick Reference

| Aspect | Standard |
|--------|----------|
| **Language** | TypeScript (strict mode) |
| **Framework** | React 19+ |
| **Styling** | TailwindCSS (utility-first) |
| **Backend** | Firebase (Firestore, Functions, Auth) |
| **AI Model** | Google Gemini (2.0-flash-exp) |
| **Embeddings** | Gemini text-embedding-004 (768-dim) |
| **Hosting** | Cloudflare Pages + Firebase |
| **Auth** | Firebase Authentication |
| **Build Tool** | Vite 6+ |
| **Package Manager** | npm |
| **Node Version** | 20 LTS |
| **Indentation** | 2 spaces |
| **Line Endings** | LF |
| **Commits** | Conventional Commits |
| **Testing** | Vitest + React Testing Library |

---

## Final Note

**This is not just a chatbot. This is a guide for awakening.**

DMN Chat serves people seeking to understand their true nature beyond mental conditioning. The system must be:

- **Precise**: The framework requires exact terminology
- **Compassionate**: Users may be vulnerable and seeking guidance
- **Intelligent**: Context-aware responses grounded in source material
- **Transparent**: Clear citations to build trust
- **Accessible**: Low barrier to entry, works for everyone

Every technical decision should honor the mission: to help people engage with the Neuro-Gnostic framework and remember (Anamnesis) who they truly are beyond the narrative hijacking.

Code with precision. Code with purpose. Code with compassion.

---

*"The Voice is the infection. You are the Listener. DMN is restored to serve your awakening."*
