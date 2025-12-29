import React, { useState } from 'react';
import { Repository } from '@/types';
import { Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface RepoManagerProps {
  repos: Repository[];
  setRepos: React.Dispatch<React.SetStateAction<Repository[]>>;
}

const RepoManager: React.FC<RepoManagerProps> = ({ repos, setRepos }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddRepo = async () => {
    if (!repoUrl.trim()) return;

    setIsAdding(true);
    const newRepo: Repository = {
      id: Date.now().toString(),
      name: extractRepoName(repoUrl),
      url: repoUrl,
      branch: branch || 'main',
      status: 'pending',
      progress: 0
    };

    setRepos(prev => [...prev, newRepo]);
    setRepoUrl('');
    setBranch('main');

    // TODO: Implement actual API call to index repository
    // Simulate indexing process
    setTimeout(() => {
      setRepos(prev => prev.map(r =>
        r.id === newRepo.id
          ? { ...r, status: 'indexing' as const, progress: 50 }
          : r
      ));
    }, 1000);

    setTimeout(() => {
      setRepos(prev => prev.map(r =>
        r.id === newRepo.id
          ? { ...r, status: 'ready' as const, progress: 100, fileCount: 42 }
          : r
      ));
      setIsAdding(false);
    }, 3000);
  };

  const handleRemoveRepo = (id: string) => {
    setRepos(prev => prev.filter(r => r.id !== id));
  };

  const handleRefreshRepo = (id: string) => {
    setRepos(prev => prev.map(r =>
      r.id === id
        ? { ...r, status: 'indexing' as const, progress: 0 }
        : r
    ));

    // TODO: Implement actual re-indexing
    setTimeout(() => {
      setRepos(prev => prev.map(r =>
        r.id === id
          ? { ...r, status: 'ready' as const, progress: 100 }
          : r
      ));
    }, 2000);
  };

  const extractRepoName = (url: string): string => {
    const match = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
    if (match) return match[1].replace('.git', '');
    return url;
  };

  const getStatusIcon = (status: Repository['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'indexing':
        return <Loader size={16} className="text-sky-500 animate-spin" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Loader size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-semibold text-slate-200 mb-1">Context Sources</h2>
        <p className="text-xs text-slate-500">Load GitHub repositories for RAG</p>
      </div>

      {/* Add Repository Form */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="GitHub URL"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Branch (default: main)"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
        <button
          onClick={handleAddRepo}
          disabled={!repoUrl.trim() || isAdding}
          className="w-full px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {isAdding ? 'Adding...' : 'Add Repository'}
        </button>
      </div>

      {/* Repository List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {repos.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            <p>No repositories loaded</p>
            <p className="text-xs mt-2">Add a GitHub repository to enable contextual responses</p>
          </div>
        ) : (
          repos.map(repo => (
            <div
              key={repo.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-2"
            >
              {/* Repo Name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">
                    {repo.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {repo.branch}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(repo.status)}
                </div>
              </div>

              {/* Progress Bar */}
              {repo.status === 'indexing' && (
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-sky-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${repo.progress || 0}%` }}
                  />
                </div>
              )}

              {/* Status Text */}
              <div className="text-xs text-slate-500">
                {repo.status === 'ready' && `${repo.fileCount || 0} files indexed`}
                {repo.status === 'indexing' && 'Indexing...'}
                {repo.status === 'error' && repo.error}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRefreshRepo(repo.id)}
                  disabled={repo.status === 'indexing'}
                  className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                  title="Re-index repository"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
                <button
                  onClick={() => handleRemoveRepo(repo.id)}
                  className="px-2 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs font-medium transition-colors"
                  title="Remove repository"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 text-center">
          Admin features require authentication
        </p>
      </div>
    </div>
  );
};

export default RepoManager;
