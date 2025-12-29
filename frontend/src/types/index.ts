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
  error?: string;
}

// Chat types
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
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
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
