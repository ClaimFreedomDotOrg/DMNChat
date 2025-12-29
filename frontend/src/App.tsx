import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './components/chat/ChatMessage';
import MessageInput from './components/chat/MessageInput';
import ChatHeader from './components/chat/ChatHeader';
import ChatHistorySidebar from './components/chat/ChatHistorySidebar';
import AdminDashboard from './components/admin/AdminDashboard';
import AuthModal from './components/auth/AuthModal';
import { Repository } from './types';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';
import { signOut } from './services/authService';
import { subscribeToContextSources } from './services/adminService';
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [input, setInput] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<{ focus: () => void }>(null);

  const { user, profile, loading: authLoading } = useAuth();
  const { messages, isTyping, error, sendMessage, clearError } = useChat(currentChatId || undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Subscribe to context sources
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToContextSources((updatedRepos) => {
        setRepos(updatedRepos);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;
    setInput('');
    await sendMessage(messageText);
    // Focus input after sending message
    setTimeout(() => messageInputRef.current?.focus(), 0);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setHistorySidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
      />

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historySidebarOpen}
        onClose={() => setHistorySidebarOpen(false)}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${historySidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <ChatHeader
          repoCount={repos.length}
          user={user}
          userProfile={profile}
          onSignIn={() => setAuthModalOpen(true)}
          onSignOut={handleSignOut}
          onOpenAdmin={() => setAdminDashboardOpen(true)}
          onToggleHistory={() => setHistorySidebarOpen(!historySidebarOpen)}
        />

        {/* Error Display */}
        {error && (
          <div className="px-4 py-3 bg-red-900/20 border-b border-red-900/50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Auth Status */}
        {!authLoading && !user && (
          <div className="px-4 py-3 bg-amber-900/20 border-b border-amber-900/50">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
              <p className="text-sm text-amber-400 text-center">
                Please sign in to chat with DMN. A free plan is available for all users.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-full pb-32">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <div className="flex w-full py-6 px-4 max-w-4xl mx-auto gap-6">
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span className="text-white text-sm">D</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-sm">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <MessageInput
          ref={messageInputRef}
          value={input}
          onChange={setInput}
          onSend={handleSendMessage}
          disabled={isTyping}
        />
      </div>
    </div>
  );
};

export default App;
