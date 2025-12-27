/**
 * Direct Messages Page - Professional Real-time Chat Interface
 * Modern design with conversation list and chat panel
 */

import { useState, useEffect, useRef } from 'react';
import { FiSend, FiSearch, FiMessageSquare, FiCheck, FiCheckCircle, FiPlus, FiX, FiTrash2, FiVideo, FiPaperclip, FiPhone, FiSmile, FiBell, FiArrowLeft, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import { messagesApi, profileApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import VideoCall from '../components/VideoCall';
import {
  requestNotificationPermission,
  checkNotificationPermission,
  checkMediaPermissionStatus,
  requestMediaPermissions,
  subscribeToPermissionChanges,
  getPermissionInstructions,
  clearPermissionCache,
  PermissionStatus
} from '../utils/permissions';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface MediaAttachment {
  url: string;
  type: 'image' | 'video';
  filename: string;
  size: number;
  mimeType: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  isRead: boolean;
  sender: User;
  media?: MediaAttachment[];
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
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [pendingMedia, setPendingMedia] = useState<MediaAttachment[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<MediaAttachment | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string; callerAvatar: string | null; conversationId: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [mediaPermission, setMediaPermission] = useState<PermissionStatus>('prompt');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Check permissions on mount and subscribe to changes
  useEffect(() => {
    const checkPermissions = async () => {
      // Check notification permission
      const notifStatus = checkNotificationPermission();
      setNotificationPermission(notifStatus);

      // Check media permissions
      const mediaStatus = await checkMediaPermissionStatus();
      setMediaPermission(mediaStatus);
    };
    checkPermissions();

    // Subscribe to permission changes (works on Chrome/Edge)
    const unsubscribe = subscribeToPermissionChanges((status) => {
      console.log('Permission status changed:', status);
      setMediaPermission(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Show browser notification for incoming calls
  const showCallNotification = (callerName: string) => {
    if (notificationPermission === 'granted' && 'Notification' in window) {
      new Notification('Incoming Video Call', {
        body: `${callerName} is calling you`,
        icon: '/favicon.ico',
        tag: 'incoming-call',
        requireInteraction: true
      });
    }
  };

  const handleRequestNotificationPermission = async () => {
    const result = await requestNotificationPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      toast.success('Notifications enabled!');
    } else if (result === 'denied') {
      toast.error('Notifications blocked. Enable them in browser settings.');
    }
  };

  const handleRequestMediaPermission = async () => {
    // Clear any stale cache before requesting
    clearPermissionCache();

    const result = await requestMediaPermissions();
    if (result.granted) {
      setMediaPermission('granted');
      toast.success('Camera & microphone enabled!');
      // Stop the test stream
      if (result.stream) {
        result.stream.getTracks().forEach(t => t.stop());
      }
    } else {
      setMediaPermission('denied');
      // Show platform-specific instructions
      const errorMsg = result.error || `Permission denied. ${getPermissionInstructions()}`;
      toast.error(errorMsg, { duration: 6000 });
    }
  };

  // Handler to retry permission check (for denied state)
  const handleRetryMediaPermission = async () => {
    clearPermissionCache();
    const mediaStatus = await checkMediaPermissionStatus();
    setMediaPermission(mediaStatus);
    if (mediaStatus === 'granted') {
      toast.success('Camera & microphone are now enabled!');
    } else if (mediaStatus === 'prompt') {
      toast('Click "Enable" to grant camera & microphone access');
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (token) {
      // Use current origin for WebSocket connection (works in both dev and production)
      const wsUrl = `${window.location.protocol}//${window.location.host}/messages`;
      const newSocket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Track if this is a reconnection
      let isReconnection = false;

      newSocket.on('connect', () => {
        console.log('Connected to messages gateway', isReconnection ? '(reconnected)' : '');
        setSocketConnected(true);

        // On reconnection, request the online users list again
        if (isReconnection) {
          newSocket.emit('users:request:list');
        }
        isReconnection = true;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from messages gateway:', reason);
        setSocketConnected(false);

        // If server disconnected us, try to reconnect manually
        if (reason === 'io server disconnect') {
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        setSocketConnected(false);
      });

      // Listen for initial online users list (sent on connection)
      newSocket.on('users:online:list', (data: { users: string[] }) => {
        console.log('Received online users list:', data.users);
        setOnlineUsers(data.users);
      });

      // Listen for individual online/offline status updates
      newSocket.on('user:online', (data: { userId: string }) => {
        console.log('User came online:', data.userId);
        setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
      });

      newSocket.on('user:offline', (data: { userId: string }) => {
        console.log('User went offline:', data.userId);
        setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
      });

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

      // Video call events - use toast.dismiss and unique ID to prevent flood
      newSocket.on('call:incoming', (data: { callerId: string; callerName: string; callerAvatar: string | null; conversationId: string }) => {
        // Only show toast if not already showing an incoming call
        setIncomingCall((prev) => {
          if (prev?.callerId === data.callerId) {
            // Already have incoming call from same person, ignore duplicate
            return prev;
          }
          // Dismiss any existing call toasts and show new one
          toast.dismiss('incoming-call');
          toast('Incoming video call from ' + data.callerName, {
            icon: '📞',
            duration: 10000,
            id: 'incoming-call' // Use unique ID to prevent duplicates
          });
          // Show browser notification
          showCallNotification(data.callerName);
          return data;
        });
      });

      newSocket.on('call:accepted', () => {
        toast.success('Call accepted');
      });

      newSocket.on('call:rejected', (data: { reason: string }) => {
        toast.error(data.reason || 'Call declined');
        setShowVideoCall(false);
      });

      newSocket.on('call:ended', () => {
        toast('Call ended', { icon: '📞' });
        setShowVideoCall(false);
        setIncomingCall(null);
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

  // Handle emoji selection
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!deleteConfirmation) return;

    try {
      setDeleting(true);
      console.log('Deleting conversation:', deleteConfirmation.id);
      const response = await messagesApi.deleteConversation(deleteConfirmation.id);
      console.log('Delete response:', response);
      toast.success('Conversation deleted');
      setConversations((prev) => prev.filter((c) => c.id !== deleteConfirmation.id));
      if (activeConversation?.id === deleteConfirmation.id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Delete conversation error:', error.response?.data || error.message || error);
      toast.error(error.response?.data?.message || 'Failed to delete conversation');
    } finally {
      setDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingMedia.length === 0) || !activeConversation || sending) return;

    const messageContent = newMessage.trim();
    const mediaToSend = [...pendingMedia];
    setNewMessage('');
    setPendingMedia([]);
    setSending(true);
    handleStopTyping();

    try {
      // Try WebSocket first if connected
      if (socket && socketConnected) {
        // Use callback acknowledgement to confirm message was sent
        socket.emit(
          'dm:send',
          {
            conversationId: activeConversation.id,
            content: messageContent,
            media: mediaToSend.length > 0 ? mediaToSend : undefined,
          },
          (response: { success?: boolean; error?: string; message?: Message }) => {
            if (response?.error) {
              toast.error(response.error);
              setNewMessage(messageContent);
              setPendingMedia(mediaToSend);
            } else if (response?.success) {
              toast.success('Message sent');
              scrollToBottom();
            }
            setSending(false);
            inputRef.current?.focus();
          },
        );
        return; // Let the callback handle the rest
      } else {
        // Fallback to HTTP API
        const res = await messagesApi.sendMessage(activeConversation.id, messageContent, mediaToSend.length > 0 ? mediaToSend : undefined);
        // Add message to local state since WebSocket isn't connected
        setMessages((prev) => {
          if (prev.find((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        loadConversations();
        scrollToBottom();
        toast.success('Message sent');
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      setNewMessage(messageContent); // Restore message on failure
      setPendingMedia(mediaToSend); // Restore media on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle file selection for media upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    try {
      const res = await messagesApi.uploadMedia(formData);
      setPendingMedia((prev) => [...prev, ...res.data.media]);
      toast.success(`${files.length} file(s) ready to send`);
    } catch (error) {
      toast.error('Failed to upload media');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove pending media
  const removePendingMedia = (index: number) => {
    setPendingMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleTyping = () => {
    if (!socket || !socketConnected || !activeConversation) return;
    socket.emit('dm:typing:start', { conversationId: activeConversation.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
  };

  const handleStopTyping = () => {
    if (!socket || !socketConnected || !activeConversation) return;
    socket.emit('dm:typing:stop', { conversationId: activeConversation.id });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;
    if (!confirm('Delete this message?')) return;

    try {
      if (socket && socketConnected) {
        socket.emit('dm:delete', { messageId, conversationId: activeConversation.id });
      } else {
        // HTTP fallback for delete
        await messagesApi.deleteMessage(activeConversation.id, messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
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
    <div className="flex h-screen bg-slate-900">
      {/* Conversations Sidebar - Full width on mobile when no active conversation */}
      <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-slate-800 border-r border-slate-700/50 flex-col`}>
        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <button onClick={() => setShowNewChat(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors">
              <FiPlus size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <div className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm inline-flex items-center gap-2">
                <FiMessageSquare size={14} /> {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
              </div>
            )}
            <div className={`px-2 py-1 rounded-lg text-xs inline-flex items-center gap-1 ${socketConnected ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
              {socketConnected ? 'Live' : 'Connecting...'}
            </div>
          </div>
        </div>

        {/* Camera/Microphone Permission Banner - Prompt State */}
        {mediaPermission === 'prompt' && (
          <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
            <div className="flex items-center gap-3">
              <FiVideo className="text-indigo-400 flex-shrink-0" size={18} />
              <div className="flex-1">
                <p className="text-indigo-200 text-sm">Enable camera & mic for video calls</p>
              </div>
              <button
                onClick={handleRequestMediaPermission}
                className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-sm rounded-lg transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        )}

        {/* Camera/Microphone Permission Banner - Denied State */}
        {mediaPermission === 'denied' && (
          <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-red-400 flex-shrink-0" size={18} />
              <div className="flex-1">
                <p className="text-red-200 text-sm">Camera/mic blocked - video calls disabled</p>
                <p className="text-red-300/60 text-xs mt-0.5">{getPermissionInstructions()}</p>
              </div>
              <button
                onClick={handleRetryMediaPermission}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <FiRefreshCw size={14} /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Notification Permission Banner */}
        {notificationPermission === 'default' && (
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <FiBell className="text-amber-400 flex-shrink-0" size={18} />
              <div className="flex-1">
                <p className="text-amber-200 text-sm">Enable notifications for calls</p>
              </div>
              <button
                onClick={handleRequestNotificationPermission}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm rounded-lg transition-colors"
              >
                Enable
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-indigo-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMessageSquare className="text-2xl text-indigo-400" />
              </div>
              <p className="text-slate-400">No conversations yet</p>
              <button onClick={() => setShowNewChat(true)} className="mt-3 text-indigo-400 font-medium hover:underline">Start a new chat</button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} onClick={() => setActiveConversation(conv)}
                className={`group flex items-center gap-3 p-4 cursor-pointer border-b border-slate-700/50 transition-colors ${activeConversation?.id === conv.id ? 'bg-indigo-500/20 border-l-4 border-l-indigo-500' : 'hover:bg-slate-700/50'}`}>
                <div className="relative flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(conv.otherUser.name)} flex items-center justify-center text-white font-semibold shadow-sm`}>
                    {conv.otherUser.avatar ? <img src={conv.otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : conv.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(conv.otherUser.id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white truncate">{conv.otherUser.name}</p>
                    {conv.lastMessage && <span className="text-xs text-slate-500">{formatTime(conv.lastMessage.createdAt)}</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">{conv.unreadCount}</span>
                    )}
                  </div>
                </div>
                {/* Delete Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmation(conv); }}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete conversation"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel - Full width on mobile, hidden when no active conversation on mobile */}
      <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="text-4xl text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
              <p className="text-slate-400 mb-6">Select a conversation or start a new one</p>
              <button onClick={() => setShowNewChat(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20">
                <FiPlus className="inline mr-2" /> New Message
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700/50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Back button on mobile */}
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
                >
                  <FiArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${getAvatarColor(activeConversation.otherUser.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                    {activeConversation.otherUser.avatar ? <img src={activeConversation.otherUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : activeConversation.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(activeConversation.otherUser.id) && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-base md:text-lg text-white">{activeConversation.otherUser.name}</h2>
                  <p className="text-xs md:text-sm text-slate-400">{onlineUsers.includes(activeConversation.otherUser.id) ? <span className="text-green-400">● Online</span> : 'Offline'}</p>
                </div>
              </div>
              {/* Video Call Button */}
              <button
                onClick={() => setShowVideoCall(true)}
                disabled={!socketConnected || !onlineUsers.includes(activeConversation.otherUser.id)}
                className={`p-2.5 md:p-3 rounded-xl transition-all ${socketConnected && onlineUsers.includes(activeConversation.otherUser.id) ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                title={!onlineUsers.includes(activeConversation.otherUser.id) ? 'User is offline' : 'Start video call'}
              >
                <FiPhone size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 bg-slate-900">
              {loadingMessages ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-indigo-500"></div></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-slate-400">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedMessages.map((group, groupIdx) => (
                    <div key={groupIdx}>
                      <div className="flex items-center justify-center my-6">
                        <div className="px-4 py-1.5 bg-slate-800 rounded-full border border-slate-700/50 text-xs font-medium text-slate-400">{formatMessageDate(group.messages[0].createdAt)}</div>
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
                                <div className={`px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-md' : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-md'}`}>
                                  {/* Media Attachments */}
                                  {message.media && message.media.length > 0 && (
                                    <div className={`flex flex-wrap gap-2 ${message.content ? 'mb-2' : ''}`}>
                                      {(message.media as MediaAttachment[]).map((media, idx) => (
                                        <div key={idx} className="cursor-pointer" onClick={() => setLightboxMedia(media)}>
                                          {media.type === 'image' ? (
                                            <img src={media.url} alt={media.filename} className="max-w-[200px] max-h-[200px] rounded-lg object-cover hover:opacity-90 transition-opacity" />
                                          ) : (
                                            <video src={media.url} className="max-w-[200px] max-h-[200px] rounded-lg" controls />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {message.content && <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                  <span className="text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
                                  {isOwn && (message.isRead ? <FiCheckCircle className="text-indigo-400" size={12} /> : <FiCheck className="text-slate-500" size={12} />)}
                                  {isOwn && (
                                    <button onClick={() => handleDeleteMessage(message.id)} className="ml-1 opacity-0 group-hover/msg:opacity-100 text-slate-500 hover:text-red-400 transition-all" title="Delete message">
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
              <div className="px-6 py-2 bg-slate-800/50 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span>{typingUser} is typing...</span>
                </div>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-slate-800/50 backdrop-blur border-t border-slate-700/50 p-3 md:p-4 pb-safe">
              {/* Pending Media Preview */}
              {pendingMedia.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {pendingMedia.map((media, idx) => (
                    <div key={idx} className="relative group">
                      {media.type === 'image' ? (
                        <img src={media.url} alt={media.filename} className="w-16 h-16 object-cover rounded-lg border border-slate-600" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center">
                          <FiVideo className="text-slate-400" size={24} />
                        </div>
                      )}
                      <button type="button" onClick={() => removePendingMedia(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiX size={12} />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white text-center truncate px-1 rounded-b-lg">{formatFileSize(media.size)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 bg-slate-700/50 rounded-2xl px-4 py-2 border border-slate-600/50 relative">
                {/* File Upload Button */}
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia} className="p-2 text-slate-400 hover:text-indigo-400 transition-colors" title="Attach media">
                  {uploadingMedia ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiPaperclip size={20} />
                  )}
                </button>
                {/* Emoji Picker Button */}
                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-400 hover:text-yellow-400 transition-colors" title="Add emoji">
                  <FiSmile size={20} />
                </button>
                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-14 left-0 z-50">
                    <EmojiPicker
                      theme={Theme.DARK}
                      onEmojiClick={handleEmojiSelect}
                      width={320}
                      height={400}
                      emojiStyle={EmojiStyle.NATIVE}
                    />
                  </div>
                )}
                <input ref={inputRef} type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                  placeholder="Type your message..." className="flex-1 bg-transparent py-2 text-white placeholder-slate-500 focus:outline-none text-[15px]" disabled={sending} />
                <button type="submit" disabled={(!newMessage.trim() && pendingMedia.length === 0) || sending} className={`p-3 rounded-xl transition-all ${(newMessage.trim() || pendingMedia.length > 0) && !sending ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg' : 'bg-slate-600 text-slate-400'}`}>
                  {sending ? (
                    <div className="w-[18px] h-[18px] border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiSend size={18} />
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold">New Message</h2>
              <button onClick={() => { setShowNewChat(false); setSearchUsers(''); setUserResults([]); }} className="p-2 hover:bg-white/20 rounded-lg"><FiX size={20} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Search users..." value={searchUsers} onChange={(e) => { setSearchUsers(e.target.value); searchForUsers(e.target.value); }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {userResults.length === 0 && searchUsers && <p className="text-center text-slate-400 py-4">No users found</p>}
                {userResults.map((u) => (
                  <div key={u.id} onClick={() => startConversation(u)} className="flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(u.name)} flex items-center justify-center text-white font-semibold`}>
                      {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-sm text-slate-400">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox */}
      {lightboxMedia && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setLightboxMedia(null)}>
          <button onClick={() => setLightboxMedia(null)} className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg z-10">
            <FiX size={24} />
          </button>
          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.type === 'image' ? (
              <img src={lightboxMedia.url} alt={lightboxMedia.filename} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            ) : (
              <video src={lightboxMedia.url} className="max-w-full max-h-[90vh] rounded-lg" controls autoPlay />
            )}
            <p className="text-center text-white/70 mt-2 text-sm">{lightboxMedia.filename}</p>
          </div>
        </div>
      )}

      {/* Video Call - WebRTC 1-on-1 */}
      {showVideoCall && activeConversation && user && socket && (
        <VideoCall
          socket={socket}
          currentUser={{ id: user.id, name: user.name || '', avatar: null }}
          remoteUser={activeConversation.otherUser}
          conversationId={activeConversation.id}
          isIncoming={!!incomingCall}
          onClose={() => {
            setShowVideoCall(false);
            setIncomingCall(null);
          }}
        />
      )}

      {/* Incoming Call Modal - only show if not already in a video call */}
      {incomingCall && !showVideoCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 p-8 text-center max-w-sm w-full">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse">
              <FiPhone className="text-white" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Incoming Video Call</h2>
            <p className="text-slate-400 mb-6">{incomingCall.callerName} is calling...</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  socket?.emit('call:reject', { callerId: incomingCall.callerId });
                  setIncomingCall(null);
                }}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <FiX size={20} /> Decline
              </button>
              <button
                onClick={() => {
                  // Start video call and find the conversation
                  const conv = conversations.find(c => c.otherUser.id === incomingCall.callerId);
                  if (conv) setActiveConversation(conv);
                  setShowVideoCall(true);
                  // Keep incomingCall set so VideoCall knows it's incoming
                }}
                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <FiPhone size={20} /> Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 p-6 max-w-sm w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <FiTrash2 className="text-red-400" size={28} />
            </div>
            <h2 className="text-xl font-bold text-white text-center mb-2">Delete Conversation?</h2>
            <p className="text-slate-400 text-center mb-6">
              Are you sure you want to delete your conversation with <span className="text-white font-semibold">{deleteConfirmation.otherUser.name}</span>?
              This will permanently delete all messages and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiTrash2 size={18} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

