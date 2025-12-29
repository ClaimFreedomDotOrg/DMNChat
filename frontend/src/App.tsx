import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
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

// Chat View Component
const ChatView: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [input, setInput] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<{ focus: () => void }>(null);

  const { user, profile, loading: authLoading } = useAuth();
  const { messages, isTyping, error, chatId: activeChatId, sendMessage, clearError } = useChat(chatId);

  // Update URL when chatId changes
  useEffect(() => {
    if (activeChatId && activeChatId !== chatId) {
      navigate(`/chat/${activeChatId}`, { replace: true });
    }
  }, [activeChatId, chatId, navigate]);

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
    navigate('/');
    setHistorySidebarOpen(false);
  };

  const handleSelectChat = (selectedChatId: string) => {
    navigate(`/chat/${selectedChatId}`);
    setHistorySidebarOpen(false);
  };

  return (
    <div className="flex h-dvh w-full bg-slate-950 text-slate-200 overflow-hidden relative pt-4 sm:pt-0">
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

      {/* Backdrop overlay for mobile sidebar */}
      {historySidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setHistorySidebarOpen(false)}
        />
      )}

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={historySidebarOpen}
        onClose={() => setHistorySidebarOpen(false)}
        currentChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col h-full min-h-0 relative"
        onClick={() => historySidebarOpen && setHistorySidebarOpen(false)}
      >
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
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
              <p className="text-sm text-red-400 flex-1 min-w-0">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Auth Status */}
        {!authLoading && !user && (
          <div className="px-4 py-3 bg-amber-900/20 border-b border-amber-900/50">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
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
        <div className="flex-1 overflow-y-auto scroll-smooth min-h-0">
          <div className="min-h-full p-4 pb-2">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <div className="flex w-full py-4 sm:py-6 px-3 sm:px-4 max-w-4xl mx-auto gap-3 sm:gap-6">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span className="text-white text-xs sm:text-sm">D</span>
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

// Main App Component with Routing
const App: React.FC = () => {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/" element={<ChatView key="/" />} />
      <Route path="/chat/:chatId" element={<ChatView key={location.pathname} />} />
    </Routes>
  );
};

export default App;
