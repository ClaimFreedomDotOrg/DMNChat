import React from 'react';
import { Settings, Sparkles, LogIn, LogOut, User as UserIcon, Menu, Compass, Mic } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types';
import { useJourneys } from '@/hooks/useJourneys';

interface ChatHeaderProps {
  repoCount: number;
  user: User | null;
  userProfile: UserProfile | null;
  journeyId: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenAdmin: () => void;
  onToggleHistory: () => void;
  onVoiceClick?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  repoCount,
  user,
  userProfile,
  journeyId,
  onSignIn,
  onSignOut,
  onOpenAdmin,
  onToggleHistory,
  onVoiceClick
}) => {
  const isAdmin = userProfile?.role === 'admin';
  const { journeys } = useJourneys();
  const currentJourney = journeys.find(j => j.id === journeyId);

  return (
    <header
      className="flex-shrink-0 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur z-10"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {user && (
          <button
            onClick={onToggleHistory}
            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-md text-slate-400 transition-colors flex-shrink-0"
            aria-label="Toggle chat history"
            title="Toggle chat history"
          >
            <Menu size={18} className="sm:w-5 sm:h-5" />
          </button>
        )}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 min-w-0 ${user ? 'cursor-pointer' : ''}`}
          onClick={user ? onToggleHistory : undefined}
          role={user ? 'button' : undefined}
          tabIndex={user ? 0 : undefined}
          onKeyDown={user ? (e) => e.key === 'Enter' && onToggleHistory() : undefined}
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-sky-900/20 flex-shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
            DMN
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {currentJourney && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-900/30 border border-sky-700/50 rounded-full text-xs text-sky-300">
            <Compass size={12} />
            <span>{currentJourney.icon}</span>
            <span className="font-medium hidden sm:inline">{currentJourney.title}</span>
          </div>
        )}
        <div className="text-xs text-slate-500 font-mono hidden md:block">
          {repoCount > 0
            ? `${repoCount} Knowledge Base${repoCount > 1 ? 's' : ''} Loaded`
            : 'No Context Loaded'}
        </div>

        {/* Auth button */}
        {user ? (
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Voice Conversation Button */}
            {onVoiceClick && (
              <button
                onClick={onVoiceClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg shadow-lg shadow-purple-900/30 transition-all flex-shrink-0 font-medium"
                title="Voice conversation"
                aria-label="Voice conversation"
              >
                <Mic size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline text-sm">Voice</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0"
                title="Open Admin Dashboard"
              >
                <Settings size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg max-w-[200px]">
              <UserIcon size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-300 truncate">{user.email}</span>
              {isAdmin && (
                <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded flex-shrink-0">
                  ADMIN
                </span>
              )}
            </div>
            <button
              onClick={onSignOut}
              className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <LogIn size={16} />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
