import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Clock, ChevronLeft } from 'lucide-react';
import { Chat } from '@/types';
import { getUserChats, deleteChat } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  currentChatId,
  onSelectChat,
  onNewChat,
}) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadChats();
    }
  }, [isOpen, user]);

  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userChats = await getUserChats(user.uid);
      setChats(userChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user || !confirm('Delete this conversation?')) return;

    try {
      await deleteChat(user.uid, chatId);
      setChats(chats.filter(c => c.id !== chatId));

      // If deleting current chat, trigger new chat
      if (chatId === currentChatId) {
        onNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed lg:absolute left-0 top-0 h-full w-[85vw] max-w-sm lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 border-b border-slate-800">
          <h2 className="text-base sm:text-lg font-semibold text-slate-200">Chat History</h2>
          <button
            onClick={onNewChat}
            className="p-1.5 sm:p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
            title="New Chat"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare size={28} className="sm:w-8 sm:h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm text-slate-500">No saved conversations</p>
              <p className="text-xs text-slate-600 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                  }}
                  className={`group relative p-2.5 sm:p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-2 sm:gap-3 active:scale-[0.98] ${
                    chat.id === currentChatId
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate mb-0.5 sm:mb-1">
                      {chat.title || 'Untitled Chat'}
                    </h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs opacity-70">
                      <Clock size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(chat.updatedAt)}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{chat.messages.length} messages</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    className={`p-1.5 sm:p-1 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ${
                      chat.id === currentChatId
                        ? 'hover:bg-sky-700'
                        : 'hover:bg-slate-700'
                    }`}
                    title="Delete chat"
                  >
                    <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Collapse Button */}
        <div className="p-3 sm:p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 truncate">
              {chats.length} saved conversation{chats.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors flex-shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;
