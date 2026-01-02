import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import ChatMessage from './components/chat/ChatMessage';
import MessageInput from './components/chat/MessageInput';
import ChatHeader from './components/chat/ChatHeader';
import ChatHistorySidebar from './components/chat/ChatHistorySidebar';
import JourneySelector from './components/chat/JourneySelector';
import SuggestionChips from './components/chat/SuggestionChips';
import VoiceConversation from './components/chat/VoiceConversation';
import AdminDashboard from './components/admin/AdminDashboard';
import AuthModal from './components/auth/AuthModal';
import { Repository } from './types';
import { useChat } from './hooks/useChat';
import { useAuth } from './hooks/useAuth';
import { signOut } from './services/authService';
import { subscribeToContextSources } from './services/adminService';
import { getSuggestions, getWelcomeSuggestions } from './utils/suggestionService';
import { checkVoiceSupport } from './services/voiceService';
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
  const [journeySelectorOpen, setJourneySelectorOpen] = useState(false);
  const [voiceConversationOpen, setVoiceConversationOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<{ focus: () => void }>(null);

  const { user, profile, loading: authLoading } = useAuth();
  const { messages, isTyping, error, chatId: activeChatId, journeyId, sendMessage, clearError, resetChat, setJourneyId } = useChat(chatId);

  // Update URL when a NEW chat is created (activeChatId goes from null to a value)
  useEffect(() => {
    // Only update URL if we created a new chat (had no chatId in URL, but now have one)
    if (activeChatId && !chatId) {
      navigate(`/chat/${activeChatId}`, { replace: true });
    }
    // If we had a chatId in URL but activeChatId is now null (chat not found), clear the URL
    else if (chatId && !activeChatId) {
      navigate('/', { replace: true });
    }
  }, [activeChatId, chatId, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update suggestions based on conversation state
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const allSuggestions = getSuggestions({
      hasMessages: messages.length > 0,
      lastMessageRole: lastMessage?.role
    });

    // Limit to 3 suggestions on mobile, 5 on desktop
    const isMobile = window.innerWidth < 640; // Tailwind sm breakpoint
    const maxSuggestions = isMobile ? 3 : 5;
    setSuggestions(allSuggestions.slice(0, maxSuggestions));
  }, [messages]);

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
    // Focus input after sending message (only on non-touch devices to avoid keyboard popping up on mobile)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      setTimeout(() => messageInputRef.current?.focus(), 0);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setInput(suggestion);
    // Auto-send the suggestion
    handleSendMessage(suggestion);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewChat = () => {
    resetChat();
    navigate('/');
    setHistorySidebarOpen(false);
    // Open journey selector for new chats
    setJourneySelectorOpen(true);
  };

  const handleSelectJourney = (selectedJourneyId: string | undefined) => {
    setJourneyId(selectedJourneyId || null);
    setJourneySelectorOpen(false);
    // Focus input after selecting journey
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  const handleSelectChat = (selectedChatId: string) => {
    navigate(`/chat/${selectedChatId}`);
    setHistorySidebarOpen(false);
  };

  const handleVoiceClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Check if browser supports voice features
    const voiceSupport = checkVoiceSupport();
    if (!voiceSupport.supported) {
      alert(`Voice mode not supported: ${voiceSupport.missingFeatures.join(', ')}`);
      return;
    }

    setVoiceConversationOpen(true);
  };

  return (
    <div className="flex h-dvh w-full max-w-full bg-slate-950 text-slate-200 overflow-hidden relative pt-2 sm:pt-0">
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

      {/* Voice Conversation Modal */}
      {voiceConversationOpen && (
        <VoiceConversation
          onClose={() => setVoiceConversationOpen(false)}
          chatId={activeChatId || chatId || undefined}
          onChatUpdated={(updatedChatId) => {
            // Navigate to the chat that was updated by voice message
            if (updatedChatId && updatedChatId !== chatId) {
              navigate(`/chat/${updatedChatId}`);
            }
          }}
        />
      )}

      {/* Journey Selector Modal */}
      {journeySelectorOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setJourneySelectorOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-200 mb-2">Begin Your Journey</h2>
              <p className="text-sm text-slate-400">
                Select a guided journey or continue with general guidance.
              </p>
            </div>
            <JourneySelector
              selectedJourneyId={journeyId || undefined}
              onSelectJourney={handleSelectJourney}
            />
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setJourneySelectorOpen(false)}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
          journeyId={journeyId}
          onSignIn={() => setAuthModalOpen(true)}
          onSignOut={handleSignOut}
          onOpenAdmin={() => setAdminDashboardOpen(true)}
          onToggleHistory={() => setHistorySidebarOpen(!historySidebarOpen)}
          onVoiceClick={handleVoiceClick}
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
            {/* Empty state with journey selector button */}
            {messages.filter(m => m.role === 'user').length === 0 && !isTyping && user && (
              <div className="flex flex-col items-center justify-center min-h-full py-12">
                <div className="max-w-2xl text-center space-y-6 px-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-900/20">
                    <span className="text-3xl text-white">🧭</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-200">
                      {journeyId ? 'Journey Awaits' : 'Begin Your Journey'}
                    </h2>
                    <p className="text-slate-400">
                      {journeyId
                        ? 'Ready to explore. Send a message to start.'
                        : 'Choose a guided journey or start with general guidance.'}
                    </p>
                  </div>
                  {!journeyId && (
                    <button
                      onClick={() => setJourneySelectorOpen(true)}
                      className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-sky-900/30"
                    >
                      Select a Journey
                    </button>
                  )}

                  {/* Welcome suggestions */}
                  <div className="pt-4">
                    <p className="text-xs text-slate-500 mb-3">Try asking:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {getWelcomeSuggestions().map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/70 active:bg-slate-800 border border-slate-700/50 hover:border-sky-500/50 rounded-lg text-sm text-slate-300 hover:text-sky-400 transition-all touch-manipulation"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {/* Suggestion Chips - only show after user has sent at least one message */}
        {user && suggestions.length > 0 && messages.filter(m => m.role === 'user').length > 0 && (
          <SuggestionChips
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            disabled={isTyping}
          />
        )}

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
  return (
    <Routes>
      <Route path="/" element={<ChatView />} />
      <Route path="/chat" element={<ChatView />} />
      <Route path="/chat/:chatId" element={<ChatView />} />
    </Routes>
  );
};

export default App;
