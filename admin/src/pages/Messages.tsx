/**
 * Direct Messages Page - Professional Real-time Chat Interface
 * Modern design with conversation list and chat panel
 */

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiSearch, FiMessageSquare, FiCheck, FiCheckCircle, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { messagesApi, profileApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  isRead: boolean;
  sender: User;
}

interface Conversation {
  id: string;
  otherUser: User;
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string | null;
}

// Avatar colors
const avatarColors = [
  'from-blue-400 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-emerald-400 to-emerald-600',
  'from-orange-400 to-orange-600',
  'from-cyan-400 to-cyan-600',
  'from-rose-400 to-rose-600',
  'from-indigo-400 to-indigo-600',
];

const getAvatarColor = (name: string) => {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
};

export default function Messages() {
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:3000/messages', { auth: { token }, transports: ['websocket', 'polling'] });

      newSocket.on('connect', () => console.log('Connected to messages gateway'));
      newSocket.on('user:online', (data: { userId: string }) => setOnlineUsers((prev) => [...new Set([...prev, data.userId])]));
      newSocket.on('user:offline', (data: { userId: string }) => setOnlineUsers((prev) => prev.filter((id) => id !== data.userId)));

      newSocket.on('dm:message:new', (message: Message) => {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        loadConversations();
        scrollToBottom();
      });

      newSocket.on('dm:typing', (data: { conversationId: string; userName: string; isTyping: boolean }) => {
        if (activeConversation?.id === data.conversationId) {
          setTypingUser(data.isTyping ? data.userName : null);
        }
      });

      newSocket.on('dm:read', () => loadConversations());

      newSocket.on('dm:message:deleted', (data: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      });

      setSocket(newSocket);
      return () => { newSocket.disconnect(); };
    }
  }, [token]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      socket?.emit('dm:read', { conversationId: activeConversation.id });
    }
  }, [activeConversation?.id]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadConversations = async () => {
    try {
      const res = await messagesApi.getConversations();
      setConversations(res.data);
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const res = await messagesApi.getMessages(conversationId);
      setMessages(res.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeConversation) return;
    socket.emit('dm:send', { conversationId: activeConversation.id, content: newMessage.trim() });
    setNewMessage('');
    handleStopTyping();
    inputRef.current?.focus();
  };

  const handleTyping = () => {
    if (!socket || !activeConversation) return;
    socket.emit('dm:typing:start', { conversationId: activeConversation.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
  };

  const handleStopTyping = () => {
    if (!socket || !activeConversation) return;
    socket.emit('dm:typing:stop', { conversationId: activeConversation.id });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!socket || !activeConversation) return;
    if (confirm('Delete this message?')) {
      socket.emit('dm:delete', { messageId, conversationId: activeConversation.id });
    }
  };

  const searchForUsers = async (query: string) => {
    if (!query.trim()) { setUserResults([]); return; }
    try {
      // Use profileApi.searchUsers which is accessible to all authenticated users
      const res = await profileApi.searchUsers(query, 1, 10);
      setUserResults((res.data.users || []).filter((u: User) => u.id !== user?.id));
    } catch { setUserResults([]); }
  };

  const startConversation = async (targetUser: User) => {
    try {
      const res = await messagesApi.startConversation(targetUser.id);
      const conv: Conversation = { id: res.data.id, otherUser: targetUser, lastMessage: null, unreadCount: 0, lastMessageAt: null };
      setActiveConversation(conv);
      setShowNewChat(false);
      setSearchUsers('');
      loadConversations();
    } catch { toast.error('Failed to start conversation'); }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], message) => {
    const date = new Date(message.createdAt).toDateString();
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && new Date(lastGroup.messages[0].createdAt).toDateString() === date) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }
    return groups;
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <button onClick={() => setShowNewChat(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors">
              <FiPlus size={20} />
            </button>
          </div>
          {totalUnread > 0 && (
            <div className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm inline-flex items-center gap-2">
              <FiMessageSquare size={14} /> {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMessageSquare className="text-2xl text-indigo-600" />
              </div>
              <p className="text-gray-500">No conversations yet</p>
              <button onClick={() => setShowNewChat(true)} className="mt-3 text-indigo-600 font-medium hover:underline">Start a new chat</button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} onClick={() => setActiveConversation(conv)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-colors ${activeConversation?.id === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-gray-50'}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(conv.otherUser.name)} flex items-center justify-center text-white font-semibold shadow-sm`}>
                    {conv.otherUser.avatar ? <img src={conv.otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : conv.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(conv.otherUser.id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 truncate">{conv.otherUser.name}</p>
                    {conv.lastMessage && <span className="text-xs text-gray-400">{formatTime(conv.lastMessage.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="text-4xl text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Messages</h2>
              <p className="text-gray-500 mb-6">Select a conversation or start a new one</p>
              <button onClick={() => setShowNewChat(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg">
                <FiPlus className="inline mr-2" /> New Message
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(activeConversation.otherUser.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                  {activeConversation.otherUser.avatar ? <img src={activeConversation.otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : activeConversation.otherUser.name.charAt(0).toUpperCase()}
                </div>
                {onlineUsers.includes(activeConversation.otherUser.id) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-900">{activeConversation.otherUser.name}</h2>
                <p className="text-sm text-gray-500">{onlineUsers.includes(activeConversation.otherUser.id) ? <span className="text-green-500">● Online</span> : 'Offline'}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-slate-50 to-white">
              {loadingMessages ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-500">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedMessages.map((group, groupIdx) => (
                    <div key={groupIdx}>
                      <div className="flex items-center justify-center my-6">
                        <div className="px-4 py-1.5 bg-white rounded-full shadow-sm border text-xs font-medium text-gray-500">{formatMessageDate(group.messages[0].createdAt)}</div>
                      </div>
                      <div className="space-y-3">
                        {group.messages.map((message, idx) => {
                          const isOwn = message.senderId === user?.id;
                          const showAvatar = idx === 0 || group.messages[idx - 1].senderId !== message.senderId;
                          return (
                            <div key={message.id} className={`group/msg flex ${isOwn ? 'justify-end' : 'justify-start'} ${!showAvatar ? (isOwn ? 'pr-12' : 'pl-12') : ''}`}>
                              {!isOwn && showAvatar && (
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(message.sender.name)} flex items-center justify-center text-white text-sm font-semibold mr-3 flex-shrink-0 shadow-sm`}>
                                  {message.sender.avatar ? <img src={message.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : message.sender.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="max-w-[65%] relative">
                                <div className={`px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-md' : 'bg-white text-gray-800 shadow-sm border rounded-bl-md'}`}>
                                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-[11px] text-gray-400">{formatTime(message.createdAt)}</span>
                                  {isOwn && (message.isRead ? <FiCheckCircle className="text-indigo-500" size={12} /> : <FiCheck className="text-gray-400" size={12} />)}
                                  {isOwn && (
                                    <button onClick={() => handleDeleteMessage(message.id)} className="ml-1 opacity-0 group-hover/msg:opacity-100 text-gray-400 hover:text-red-500 transition-all" title="Delete message">
                                      <FiTrash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {isOwn && showAvatar && (
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(user?.name || '')} flex items-center justify-center text-white text-sm font-semibold ml-3 flex-shrink-0 shadow-sm`}>
                                  {user?.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Typing Indicator */}
            {typingUser && (
              <div className="px-6 py-2 bg-white border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>{typingUser} is typing...</span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4 shadow-lg">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2">
                <input ref={inputRef} type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  placeholder="Type your message..." className="flex-1 bg-transparent py-2 text-gray-800 placeholder-gray-400 focus:outline-none text-[15px]" />
                <button type="submit" disabled={!newMessage.trim()} className={`p-3 rounded-xl transition-all ${newMessage.trim() ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                  <FiSend size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold">New Message</h2>
              <button onClick={() => { setShowNewChat(false); setSearchUsers(''); setUserResults([]); }} className="p-2 hover:bg-white/20 rounded-lg"><FiX size={20} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search users..." value={searchUsers} onChange={(e) => { setSearchUsers(e.target.value); searchForUsers(e.target.value); }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {userResults.length === 0 && searchUsers && <p className="text-center text-gray-500 py-4">No users found</p>}
                {userResults.map((u) => (
                  <div key={u.id} onClick={() => startConversation(u)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(u.name)} flex items-center justify-center text-white font-semibold`}>
                      {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

