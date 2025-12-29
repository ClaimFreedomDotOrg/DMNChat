import React from 'react';
import { Menu, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  repoCount: number;
  onToggleSidebar: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ repoCount, onToggleSidebar }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            DMN
          </h1>
        </div>
      </div>

      <div className="text-xs text-slate-500 font-mono hidden sm:block">
        {repoCount > 0
          ? `${repoCount} Knowledge Base${repoCount > 1 ? 's' : ''} Loaded`
          : 'No Context Loaded'}
      </div>
    </header>
  );
};

export default ChatHeader;
