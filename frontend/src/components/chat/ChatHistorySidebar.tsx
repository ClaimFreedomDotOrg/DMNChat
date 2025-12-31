import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Clock, ChevronLeft, Pin, Edit2, Check, X } from 'lucide-react';
import { Chat } from '@/types';
import { getUserChats, deleteChat, renameChat, togglePinChat } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/useJourneys';

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
  const { journeys } = useJourneys();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

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
      // Sort chats: pinned first, then by updatedAt
      const sortedChats = userChats.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
      setChats(sortedChats);
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

      // Reload chats from server to ensure consistency
      await loadChats();

      // If deleting current chat, trigger new chat
      if (chatId === currentChatId) {
        onNewChat();
      }
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      alert(`Failed to delete conversation: ${error?.message || 'Unknown error'}`);
    }
  };

  const handlePinToggle = async (chatId: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) return;

    try {
      await togglePinChat(user.uid, chatId, !currentPinned);
      await loadChats();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to pin/unpin conversation');
    }
  };

  const startEditing = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleRename = async (chatId: string, e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user || !editingTitle.trim()) {
      cancelEditing();
      return;
    }

    try {
      await renameChat(user.uid, chatId, editingTitle);
      await loadChats();
      cancelEditing();
    } catch (error) {
      console.error('Error renaming chat:', error);
      alert('Failed to rename conversation');
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
              {chats.map((chat) => {
                const chatJourney = chat.journeyId ? journeys.find(j => j.id === chat.journeyId) : null;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      if (editingChatId !== chat.id) {
                        onSelectChat(chat.id);
                      }
                    }}
                    className={`group relative p-2.5 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                      chat.id === currentChatId
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200'
                    }`}
                  >
                    {/* Pin Icon - Overlay in bottom-right */}
                    {chat.isPinned && (
                      <div 
                        title="Pinned" 
                        className="absolute bottom-2 right-2 z-10"
                      >
                        <Pin
                          size={12}
                          className="fill-current opacity-70"
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-2 sm:gap-3">

                      {/* Journey Icon or Default */}
                      <span
                        className="flex-shrink-0 text-base"
                        title={chatJourney ? `Journey: ${chatJourney.title}` : 'General Guidance'}
                        aria-label={chatJourney ? `Journey: ${chatJourney.title}` : 'General Guidance'}
                      >
                        {chatJourney ? chatJourney.icon : '💬'}
                      </span>

                      {/* Title and Details */}
                      <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        // Editing Mode
                        <form onSubmit={(e) => handleRename(chat.id, e)} className="mb-1">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-sky-500"
                            autoFocus
                            maxLength={100}
                          />
                        </form>
                      ) : (
                        // Display Mode
                        <h3 className="font-medium text-sm truncate mb-0.5 sm:mb-1 pr-0 lg:pr-0">
                          {chat.title || 'Untitled Chat'}
                        </h3>
                      )}

                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs opacity-70">
                        <Clock size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(chat.updatedAt)}</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{chat.messages.length} messages</span>
                      </div>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile inline, Desktop overlay on hover */}
                    <div className="flex lg:hidden items-center gap-1 mt-2">
                      {editingChatId === chat.id ? (
                        // Edit Mode Buttons
                        <>
                          <button
                            onClick={(e) => handleRename(chat.id, e)}
                            className={`p-1.5 rounded transition-opacity ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-700'
                                : 'hover:bg-slate-700'
                            }`}
                            title="Save"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className={`p-1.5 rounded transition-opacity ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-700'
                                : 'hover:bg-slate-700'
                            }`}
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        // Normal Mode Buttons
                        <>
                          <button
                            onClick={(e) => handlePinToggle(chat.id, chat.isPinned || false, e)}
                            className={`p-1.5 rounded transition-opacity ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-700'
                                : 'hover:bg-slate-700'
                            }`}
                            title={chat.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin
                              size={13}
                              className={chat.isPinned ? 'fill-current' : ''}
                            />
                          </button>
                          <button
                            onClick={(e) => startEditing(chat.id, chat.title, e)}
                            className={`p-1.5 rounded transition-opacity ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-700'
                                : 'hover:bg-slate-700'
                            }`}
                            title="Rename"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className={`p-1.5 rounded transition-opacity ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-700'
                                : 'hover:bg-slate-700'
                            }`}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Desktop Action Buttons - Overlay on hover */}
                    <div className={`hidden lg:flex absolute top-2 right-2 items-center gap-1 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                      chat.id === currentChatId
                        ? 'bg-sky-700'
                        : 'bg-slate-900/95 backdrop-blur'
                    }`}>
                      {editingChatId === chat.id ? (
                        // Edit Mode Buttons
                        <>
                          <button
                            onClick={(e) => handleRename(chat.id, e)}
                            className={`p-1 rounded transition-colors ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-600'
                                : 'hover:bg-slate-800'
                            }`}
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className={`p-1 rounded transition-colors ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-600'
                                : 'hover:bg-slate-800'
                            }`}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        // Normal Mode Buttons
                        <>
                          <button
                            onClick={(e) => handlePinToggle(chat.id, chat.isPinned || false, e)}
                            className={`p-1 rounded transition-colors ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-600'
                                : 'hover:bg-slate-800'
                            }`}
                            title={chat.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin
                              size={14}
                              className={chat.isPinned ? 'fill-current' : ''}
                            />
                          </button>
                          <button
                            onClick={(e) => startEditing(chat.id, chat.title, e)}
                            className={`p-1 rounded transition-colors ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-600'
                                : 'hover:bg-slate-800'
                            }`}
                            title="Rename"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className={`p-1 rounded transition-colors ${
                              chat.id === currentChatId
                                ? 'hover:bg-sky-600'
                                : 'hover:bg-slate-800'
                            }`}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
              );
              })}
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
