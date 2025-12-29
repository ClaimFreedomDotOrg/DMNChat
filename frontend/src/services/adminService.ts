import { collection, doc, getDoc, getDocs, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Repository } from '@/types';

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
    }).catch(error => {
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

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: `${data.config.owner}/${data.config.repo}`,
        url: `https://github.com/${data.config.owner}/${data.config.repo}`,
        branch: data.config.branch,
        status: data.status.state,
        progress: data.status.progress,
        fileCount: data.stats.fileCount,
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

  return onSnapshot(sourcesRef, (snapshot) => {
    const repos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: `${data.config.owner}/${data.config.repo}`,
        url: `https://github.com/${data.config.owner}/${data.config.repo}`,
        branch: data.config.branch,
        status: data.status.state,
        progress: data.status.progress,
        fileCount: data.stats.fileCount,
        error: data.status.error
      } as Repository;
    });
    callback(repos);
  });
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
