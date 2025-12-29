import React, { useState, useEffect } from 'react';
import { Repository } from '@/types';
import { Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { addContextSource, removeContextSource, subscribeToContextSources, reindexRepository } from '@/services/adminService';

const RepositoryPanel: React.FC = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToContextSources((updatedRepos) => {
      setRepos(updatedRepos);
    });

    return () => unsubscribe();
  }, []);

  const handleAddRepo = async () => {
    if (!repoUrl.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      await addContextSource(repoUrl, branch || 'main');
      setRepoUrl('');
      setBranch('main');
    } catch (err) {
      console.error('Error adding repository:', err);
      setError(err instanceof Error ? err.message : 'Failed to add repository');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRepo = async (id: string) => {
    if (!confirm('Are you sure you want to remove this repository? All indexed data will be deleted.')) {
      return;
    }

    try {
      await removeContextSource(id);
    } catch (err) {
      console.error('Error removing repository:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove repository');
    }
  };

  const handleRefreshRepo = async (id: string) => {
    try {
      await reindexRepository(id);
    } catch (err) {
      console.error('Error refreshing repository:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh repository');
    }
  };

  const getStatusIcon = (status: Repository['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle size={20} className="text-emerald-500" />;
      case 'indexing':
        return <Loader size={20} className="text-sky-500 animate-spin" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Loader size={20} className="text-slate-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-200 mb-2">Repository Management</h2>
        <p className="text-slate-400">Load and manage GitHub repositories for RAG context</p>
      </div>

      {/* Add Repository Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Add New Repository</h3>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Branch
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={handleAddRepo}
          disabled={!repoUrl.trim() || isAdding}
          className="mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          {isAdding ? 'Adding Repository...' : 'Add Repository'}
        </button>
      </div>

      {/* Repository List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4">
          Loaded Repositories ({repos.length})
        </h3>

        {repos.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400 mb-2">No repositories loaded</p>
            <p className="text-sm text-slate-500">Add a GitHub repository to enable contextual AI responses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {repos.map(repo => (
              <div
                key={repo.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(repo.status)}
                      <h4 className="text-lg font-medium text-slate-200">{repo.name}</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-500">Branch:</span> {repo.branch}
                      </p>
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-500">URL:</span>{' '}
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline"
                        >
                          {repo.url}
                        </a>
                      </p>
                      {repo.status === 'ready' && (
                        <div className="flex gap-4 text-sm">
                          <p className="text-emerald-400">
                            <span className="text-slate-500">Files:</span> {repo.fileCount || 0}
                          </p>
                          <p className="text-sky-400">
                            <span className="text-slate-500">Chunks:</span> {repo.chunkCount || 0}
                          </p>
                        </div>
                      )}
                      {repo.status === 'error' && repo.error && (
                        <p className="text-sm text-red-400">{repo.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleRefreshRepo(repo.id)}
                      disabled={repo.status === 'indexing'}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-50 transition-colors"
                      title="Re-index repository"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => handleRemoveRepo(repo.id)}
                      className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                      title="Remove repository"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {repo.status === 'indexing' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                      <span>Indexing...</span>
                      <span>{repo.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${repo.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryPanel;
