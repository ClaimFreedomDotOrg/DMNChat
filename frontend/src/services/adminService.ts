import { collection, doc, getDoc, getDocs, addDoc, onSnapshot, serverTimestamp, FirestoreError, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Repository, SystemConfig } from '@/types';
import { DEFAULT_SYSTEM_CONFIG } from '@/config/systemDefaults';

export interface ContextSource {
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
    lastSync?: number;
    error?: string;
  };
  stats: {
    fileCount: number;
    chunkCount: number;
  };
  createdAt: number;
}

/**
 * Parse GitHub URL to extract owner, repo, and branch
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  try {
    // Handle various GitHub URL formats
    const patterns = [
      // https://github.com/owner/repo
      /github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/,
      // https://github.com/owner/repo/tree/branch
      /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', ''),
          branch: match[3] || undefined
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}

/**
 * Add a new context source (repository)
 */
export const addContextSource = async (repoUrl: string, branch: string = 'main'): Promise<string> => {
  try {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      throw new Error('Invalid GitHub URL format');
    }

    // Use provided branch or parsed branch or default to 'main'
    const finalBranch = branch || parsed.branch || 'main';

    // Create document in contextSources collection
    const sourcesRef = collection(db, 'contextSources');
    const sourceDoc = await addDoc(sourcesRef, {
      type: 'github',
      config: {
        owner: parsed.owner,
        repo: parsed.repo,
        branch: finalBranch
      },
      status: {
        state: 'pending',
        progress: 0
      },
      stats: {
        fileCount: 0,
        chunkCount: 0
      },
      isActive: true,
      createdAt: serverTimestamp()
    });

    // Trigger indexing via Cloud Function
    const indexRepoFn = httpsCallable(functions, 'indexRepository');
    indexRepoFn({
      sourceId: sourceDoc.id,
      repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
      branch: finalBranch
    }).catch((error: Error) => {
      console.error('Error triggering indexing:', error);
    });

    return sourceDoc.id;
  } catch (error) {
    console.error('Error adding context source:', error);
    throw error;
  }
};

/**
 * Remove a context source
 */
export const removeContextSource = async (sourceId: string): Promise<void> => {
  try {
    // Call Cloud Function to remove source and all associated chunks
    const removeSourceFn = httpsCallable(functions, 'removeContextSource');
    await removeSourceFn({ sourceId });
  } catch (error) {
    console.error('Error removing context source:', error);
    throw error;
  }
};

/**
 * Get all context sources
 */
export const getContextSources = async (): Promise<Repository[]> => {
  try {
    const sourcesRef = collection(db, 'contextSources');
    const snapshot = await getDocs(sourcesRef);

    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: `${data.config.owner}/${data.config.repo}`,
        url: `https://github.com/${data.config.owner}/${data.config.repo}`,
        branch: data.config.branch,
        status: data.status.state,
        progress: data.status.progress,
        fileCount: data.stats.fileCount,
        chunkCount: data.stats.chunkCount,
        error: data.status.error
      } as Repository;
    });
  } catch (error) {
    console.error('Error fetching context sources:', error);
    return [];
  }
};

/**
 * Subscribe to context sources updates
 */
export const subscribeToContextSources = (
  callback: (repos: Repository[]) => void
): (() => void) => {
  const sourcesRef = collection(db, 'contextSources');

  return onSnapshot(
    sourcesRef,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const repos = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: `${data.config.owner}/${data.config.repo}`,
          url: `https://github.com/${data.config.owner}/${data.config.repo}`,
          branch: data.config.branch,
          status: data.status.state,
          progress: data.status.progress,
          fileCount: data.stats.fileCount,
          chunkCount: data.stats.chunkCount,
          error: data.status.error
        } as Repository;
      });
      callback(repos);
    },
    (error: FirestoreError) => {
      console.error('Error subscribing to context sources:', error);
      // Return empty array on error to prevent component crashes
      callback([]);
    }
  );
};

/**
 * Trigger re-indexing of a repository
 */
export const reindexRepository = async (sourceId: string): Promise<void> => {
  try {
    // Get source details
    const sourceRef = doc(db, 'contextSources', sourceId);
    const sourceSnap = await getDoc(sourceRef);

    if (!sourceSnap.exists()) {
      throw new Error('Source not found');
    }

    const data = sourceSnap.data();

    // Trigger indexing via Cloud Function
    const indexRepoFn = httpsCallable(functions, 'indexRepository');
    await indexRepoFn({
      sourceId: sourceId,
      repoUrl: `https://github.com/${data.config.owner}/${data.config.repo}`,
      branch: data.config.branch
    });
  } catch (error) {
    console.error('Error re-indexing repository:', error);
    throw error;
  }
};

/**
 * Update a user's role (admin only)
 */
export const updateUserRole = async (
  userId: string,
  role: 'user' | 'admin'
): Promise<void> => {
  try {
    const updateRoleFn = httpsCallable(functions, 'updateUserRole');
    await updateRoleFn({ userId, role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Update a user's member level (admin only)
 * Updates the member level directly in Firestore
 */
export const updateUserMemberLevel = async (
  userId: string,
  memberLevel: string
): Promise<void> => {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      memberLevel: memberLevel,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user member level:', error);
    throw error;
  }
};


/**
 * Check if system configuration has been initialized
 */
export const isSystemConfigInitialized = async (): Promise<boolean> => {
  try {
    const configRef = doc(db, 'systemConfig', 'settings');
    const configDoc = await getDoc(configRef);
    return configDoc.exists();
  } catch (error) {
    console.error('Error checking system config:', error);
    return false;
  }
};

/**
 * Get the current system configuration directly from Firestore
 */
export const getSystemConfig = async (): Promise<SystemConfig> => {
  try {
    const configRef = doc(db, 'systemConfig', 'settings');
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
      // Return defaults if no config exists yet
      return DEFAULT_SYSTEM_CONFIG;
    }

    const data = configDoc.data();
    return {
      ai: data?.ai || DEFAULT_SYSTEM_CONFIG.ai,
      rag: data?.rag || DEFAULT_SYSTEM_CONFIG.rag,
      systemPrompt: data?.systemPrompt || DEFAULT_SYSTEM_CONFIG.systemPrompt,
      memberLevels: data?.memberLevels || DEFAULT_SYSTEM_CONFIG.memberLevels,
      defaultMemberLevel: data?.defaultMemberLevel || DEFAULT_SYSTEM_CONFIG.defaultMemberLevel,
    } as SystemConfig;
  } catch (error) {
    console.error('Error getting system config:', error);
    throw error;
  }
};

/**
 * Get system statistics (admin only)
 */
export const getSystemStats = async (): Promise<{
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  totalSources: number;
  totalChunks: number;
  indexingStatus: any[];
}> => {
  try {
    const getStatsFn = httpsCallable(functions, 'getSystemStats');
    const result = await getStatsFn();
    return result.data as any;
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
};

/**
 * Update the system configuration directly in Firestore
 */
export const updateSystemConfigService = async (
  config: Partial<SystemConfig>
): Promise<SystemConfig> => {
  try {
    const { setDoc } = await import('firebase/firestore');
    const configRef = doc(db, 'systemConfig', 'settings');

    // Get current config first
    const currentConfig = await getSystemConfig();

    // Merge with new config
    const updatedConfig: SystemConfig = {
      ai: {
        ...currentConfig.ai,
        ...(config.ai || {}),
      },
      rag: {
        ...currentConfig.rag,
        ...(config.rag || {}),
      },
      systemPrompt: config.systemPrompt ?? currentConfig.systemPrompt,
      memberLevels: config.memberLevels ?? currentConfig.memberLevels,
      defaultMemberLevel: config.defaultMemberLevel ?? currentConfig.defaultMemberLevel,
    };

    // Save to Firestore
    await setDoc(configRef, {
      ...updatedConfig,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return updatedConfig;
  } catch (error) {
    console.error('Error updating system config:', error);
    throw error;
  }
};
