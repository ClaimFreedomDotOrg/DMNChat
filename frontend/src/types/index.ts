// Message types
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  citations?: Citation[];
  isError?: boolean;
}

export interface Citation {
  repoName: string;
  filePath: string;
  lineRange?: { start: number; end: number };
  url: string;
}

// Repository/Context Source types
export interface Repository {
  id: string;
  name: string;
  url: string;
  branch: string;
  status: 'pending' | 'indexing' | 'ready' | 'error';
  progress?: number;
  fileCount?: number;
  chunkCount?: number;
  error?: string;
}

// Chat types
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  journeyId?: string; // Optional reference to Journey being followed
}

// User types
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  role: 'user' | 'admin';
  memberLevel: string; // Member tier (e.g., 'free', 'seeker', 'awakened')
  messageUsage?: {
    count: number; // Messages sent today
    resetAt: number; // Timestamp when count resets (start of next day)
  };
}

// Member Level Configuration
export interface MemberLevel {
  name: string; // Unique identifier (e.g., 'free', 'seeker', 'awakened', 'illuminated')
  displayName: string; // Human-readable name (e.g., 'Free Seeker', 'Awakened Soul')
  messagesPerDay: number; // Daily message limit (-1 for unlimited)
  description?: string; // Optional description of the tier
}

// Journey types
export interface Journey {
  id: string;
  title: string;
  description: string;
  systemPrompt: string;
  icon?: string; // Optional emoji or icon identifier
  order?: number; // Display order in lists
  isActive: boolean; // Whether the journey is available to users
  createdAt: number;
  updatedAt: number;
  createdBy?: string; // Admin user ID who created this
}

// System Configuration types
export interface SystemConfig {
  ai: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  rag: {
    chunkSize: number;
    chunkOverlap: number;
    maxChunks: number;
    minSimilarity: number;
  };
  systemPrompt: string;
  memberLevels: MemberLevel[]; // Configurable member tiers
  defaultMemberLevel: string; // Name of the default level for new users
  defaultJourneyId?: string; // Optional default journey for new chats
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
