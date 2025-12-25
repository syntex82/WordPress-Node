/**
 * Group Chat Page - Professional Real-time Chat Interface
 * Modern design with beautiful UI and smooth interactions
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiUsers, FiLogOut, FiSearch, FiCheck, FiShield, FiStar, FiHash, FiMessageSquare, FiTrash2, FiPaperclip, FiVideo, FiX, FiSmile } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import { groupsApi, messagesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

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
  media?: MediaAttachment[];
  sender: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface Member {
  id: string;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  isMember: boolean;
  memberRole?: string;
  owner: {
    id: string;
    name: string;
  };
  _count?: {
    members: number;
  };
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

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'OWNER':
      return { icon: FiStar, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Owner' };
    case 'MODERATOR':
      return { icon: FiShield, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Mod' };
    default:
      return null;
  }
};

export default function GroupChat() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [searchMembers, setSearchMembers] = useState('');
  const [pendingMedia, setPendingMedia] = useState<MediaAttachment[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<MediaAttachment | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadGroup();
      loadMessages();
      loadMembers();
    }
  }, [id]);

  useEffect(() => {
    if (group?.isMember && token) {
      // Use current origin for WebSocket connection (works in both dev and production)
      const wsUrl = `${window.location.protocol}//${window.location.host}/groups`;
      const newSocket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Connected to groups gateway');
        setSocketConnected(true);
        newSocket.emit('group:join', { groupId: id }, (response: any) => {
          if (response.onlineUsers) setOnlineUsers(response.onlineUsers);
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from groups gateway');
        setSocketConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        setSocketConnected(false);
      });

      newSocket.on('group:message:new', (message: Message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      // Listen for initial online users list (sent on connection)
      newSocket.on('users:online:list', (data: { users: string[] }) => {
        console.log('Received online users list:', data.users);
        setOnlineUsers(data.users);
      });

      newSocket.on('group:user:online', (data: { userId: string }) => {
        setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
      });
      newSocket.on('user:online', (data: { userId: string }) => {
        setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
      });

      newSocket.on('group:user:offline', (data: { userId: string }) => {
        setOnlineUsers((prev) => prev.filter((uid) => uid !== data.userId));
      });
      newSocket.on('user:offline', (data: { userId: string }) => {
        setOnlineUsers((prev) => prev.filter((uid) => uid !== data.userId));
      });

      newSocket.on('group:typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingUsers((prev) => [...new Set([...prev, data.userName])]);
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
        }
      });

      newSocket.on('group:message:deleted', (data: { messageId: string }) => {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      });

      setSocket(newSocket);
      return () => {
        newSocket.emit('group:leave', { groupId: id });
        newSocket.disconnect();
      };
    }
  }, [group?.isMember, token, id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroup = async () => {
    try {
      const response = await groupsApi.getById(id!);
      setGroup(response.data);
    } catch (error) {
      toast.error('Failed to load group');
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getMessages(id!);
      setMessages(response.data || []);
    } catch (error) {
      // User might not be a member yet
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await groupsApi.getMembers(id!);
      setMembers(response.data || []);
    } catch (error) {
      // User might not be a member yet
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingMedia.length === 0) || !id || sending) return;

    const messageContent = newMessage.trim();
    const mediaToSend = [...pendingMedia];
    setNewMessage('');
    setPendingMedia([]);
    setSending(true);
    handleStopTyping();

    try {
      if (socket && socketConnected) {
        // Use callback acknowledgement to confirm message was sent
        socket.emit(
          'group:message:send',
          {
            groupId: id,
            content: messageContent,
            media: mediaToSend.length > 0 ? mediaToSend : undefined,
          },
          (response: { success?: boolean; error?: string }) => {
            if (response?.error) {
              toast.error(response.error);
              setNewMessage(messageContent);
              setPendingMedia(mediaToSend);
            } else if (response?.success) {
              toast.success('Message sent');
            }
            setSending(false);
            inputRef.current?.focus();
          },
        );
        return; // Let the callback handle the rest
      } else {
        toast.error('Not connected to chat. Please refresh the page.');
        setNewMessage(messageContent);
        setPendingMedia(mediaToSend);
      }
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      setNewMessage(messageContent);
      setPendingMedia(mediaToSend);
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
    if (!socket || !socketConnected) return;
    socket.emit('group:typing:start', { groupId: id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 2000);
  };

  const handleStopTyping = () => {
    if (!socket || !socketConnected) return;
    socket.emit('group:typing:stop', { groupId: id });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!id) return;
    if (!confirm('Delete this message?')) return;

    try {
      if (socket && socketConnected) {
        socket.emit('group:message:delete', { groupId: id, messageId });
      } else {
        await groupsApi.deleteMessage(id, messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleJoinGroup = async () => {
    try {
      await groupsApi.join(id!);
      toast.success('Welcome to the group!');
      loadGroup();
      loadMessages();
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      await groupsApi.leave(id!);
      toast.success('You left the group');
      loadGroup();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const filteredMembers = members.filter(m =>
    m.user.name.toLowerCase().includes(searchMembers.toLowerCase()) ||
    m.user.email.toLowerCase().includes(searchMembers.toLowerCase())
  );

  const onlineCount = members.filter(m => onlineUsers.includes(m.user.id)).length;

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group.isMember) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/50 backdrop-blur rounded-3xl shadow-2xl border border-slate-700/50 w-full max-w-md overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
            <Link to="/groups" className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors">
              <FiArrowLeft size={20} />
            </Link>
          </div>
          <div className="p-8 text-center -mt-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-lg">
              <FiHash size={28} />
            </div>
            <h2 className="text-2xl font-bold mt-4 mb-2 text-white">{group.name}</h2>
            <p className="text-slate-400 mb-6">{group.description || 'Join this community to start chatting!'}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-8">
              <span className="flex items-center gap-1"><FiUsers /> {group._count?.members || 0} members</span>
            </div>
            <button onClick={handleJoinGroup} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20">
              Join Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700/50 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link to="/groups" className="p-2 hover:bg-slate-700/50 rounded-xl text-slate-400 transition-colors flex-shrink-0">
              <FiArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                <FiHash size={18} className="sm:hidden" />
                <FiHash size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="font-bold text-base sm:text-lg text-white truncate max-w-[120px] sm:max-w-none">{group.name}</h2>
                  <div className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs inline-flex items-center gap-1 flex-shrink-0 ${socketConnected ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                    <span className="hidden xs:inline">{socketConnected ? 'Live' : 'Connecting...'}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 truncate">{onlineCount} online · {members.length} members</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => setShowMembers(!showMembers)} className={`p-2 sm:p-2.5 rounded-xl transition-colors ${showMembers ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-700/50 text-slate-400'}`}>
              <FiUsers size={18} className="sm:hidden" />
              <FiUsers size={20} className="hidden sm:block" />
            </button>
            <button onClick={handleLeaveGroup} className="p-2 sm:p-2.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-colors">
              <FiLogOut size={18} className="sm:hidden" />
              <FiLogOut size={20} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 bg-slate-900">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-indigo-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <FiMessageSquare className="text-2xl sm:text-3xl text-indigo-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No messages yet</h3>
              <p className="text-sm sm:text-base text-slate-400">Be the first to start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {groupedMessages.map((msgGroup, groupIdx) => (
                <div key={groupIdx}>
                  {/* Date Divider */}
                  <div className="flex items-center justify-center my-4 sm:my-6">
                    <div className="px-3 sm:px-4 py-1 sm:py-1.5 bg-slate-800 rounded-full border border-slate-700/50 text-[10px] sm:text-xs font-medium text-slate-400">
                      {formatMessageDate(msgGroup.messages[0].createdAt)}
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="space-y-2 sm:space-y-3">
                    {msgGroup.messages.map((message, idx) => {
                      const isOwn = message.sender.id === user?.id;
                      const showAvatar = idx === 0 || msgGroup.messages[idx - 1].sender.id !== message.sender.id;
                      const canDelete = isOwn || group?.owner?.id === user?.id;
                      return (
                        <div key={message.id} className={`group/msg flex ${isOwn ? 'justify-end' : 'justify-start'} ${!showAvatar ? (isOwn ? 'pr-9 sm:pr-12' : 'pl-9 sm:pl-12') : ''}`}>
                          {!isOwn && showAvatar && (
                            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${getAvatarColor(message.sender.name)} flex items-center justify-center text-white text-xs sm:text-sm font-semibold mr-2 sm:mr-3 flex-shrink-0 shadow-sm`}>
                              {message.sender.avatar ? <img src={message.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : message.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={`max-w-[80%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && showAvatar && <p className="text-[10px] sm:text-xs font-medium text-slate-400 mb-0.5 sm:mb-1 ml-1">{message.sender.name}</p>}
                            <div className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl ${isOwn ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-md' : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-md'}`}>
                              {/* Media Attachments */}
                              {message.media && message.media.length > 0 && (
                                <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${message.content ? 'mb-1.5 sm:mb-2' : ''}`}>
                                  {(message.media as MediaAttachment[]).map((media, idx) => (
                                    <div key={idx} className="cursor-pointer" onClick={() => setLightboxMedia(media)}>
                                      {media.type === 'image' ? (
                                        <img src={media.url} alt={media.filename} className="max-w-[140px] max-h-[140px] sm:max-w-[200px] sm:max-h-[200px] rounded-lg object-cover hover:opacity-90 transition-opacity" />
                                      ) : (
                                        <video src={media.url} className="max-w-[140px] max-h-[140px] sm:max-w-[200px] sm:max-h-[200px] rounded-lg" controls />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.content && <p className="text-[13px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 sm:mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] sm:text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
                              {isOwn && <FiCheck className="text-slate-500" size={10} />}
                              {canDelete && (
                                <button onClick={() => handleDeleteMessage(message.id)} className="ml-1 opacity-0 group-hover/msg:opacity-100 sm:opacity-0 active:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 -m-1" title="Delete message">
                                  <FiTrash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          {isOwn && showAvatar && (
                            <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${getAvatarColor(message.sender.name)} flex items-center justify-center text-white text-xs sm:text-sm font-semibold ml-2 sm:ml-3 flex-shrink-0 shadow-sm`}>
                              {message.sender.avatar ? <img src={message.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : message.sender.name.charAt(0).toUpperCase()}
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
        {typingUsers.length > 0 && (
          <div className="px-3 sm:px-6 py-1.5 sm:py-2 bg-slate-800/50 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="truncate">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-slate-800/50 backdrop-blur border-t border-slate-700/50 p-2.5 sm:p-4">
          {/* Pending Media Preview */}
          {pendingMedia.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {pendingMedia.map((media, idx) => (
                <div key={idx} className="relative group">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={media.filename} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-slate-600" />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-lg border border-slate-600 flex items-center justify-center">
                      <FiVideo className="text-slate-400" size={20} />
                    </div>
                  )}
                  <button type="button" onClick={() => removePendingMedia(idx)} className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <FiX size={12} />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] sm:text-[10px] text-white text-center truncate px-1 rounded-b-lg">{formatFileSize(media.size)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-3 bg-slate-700/50 rounded-2xl px-2 sm:px-4 py-1.5 sm:py-2 border border-slate-600/50 relative">
            {/* File Upload Button */}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingMedia} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-400 transition-colors min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" title="Attach media">
              {uploadingMedia ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiPaperclip size={18} className="sm:hidden" />
              )}
              {!uploadingMedia && <FiPaperclip size={20} className="hidden sm:block" />}
            </button>
            {/* Emoji Picker Button */}
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 sm:p-2 text-slate-400 hover:text-yellow-400 transition-colors min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center" title="Add emoji">
              <FiSmile size={18} className="sm:hidden" />
              <FiSmile size={20} className="hidden sm:block" />
            </button>
            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-12 sm:bottom-14 left-0 z-50">
                <EmojiPicker
                  theme={Theme.DARK}
                  onEmojiClick={handleEmojiSelect}
                  width={280}
                  height={350}
                  emojiStyle={EmojiStyle.NATIVE}
                />
              </div>
            )}
            <input ref={inputRef} type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              placeholder="Type your message..." className="flex-1 bg-transparent py-1.5 sm:py-2 text-white placeholder-slate-500 focus:outline-none text-[14px] sm:text-[15px] min-w-0" disabled={sending} />
            <button type="submit" disabled={(!newMessage.trim() && pendingMedia.length === 0) || sending} className={`p-2.5 sm:p-3 rounded-xl transition-all min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${(newMessage.trim() || pendingMedia.length > 0) && !sending ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-lg' : 'bg-slate-600 text-slate-400'}`}>
              {sending ? (
                <div className="w-4 h-4 sm:w-[18px] sm:h-[18px] border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSend size={16} className="sm:hidden" />
                  <FiSend size={18} className="hidden sm:block" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Members Sidebar - Hidden on mobile, shown as overlay on tablet+ */}
      {showMembers && (
        <div className="hidden md:flex w-72 lg:w-80 bg-slate-800 border-l border-slate-700/50 flex-col">
          <div className="p-3 lg:p-4 border-b border-slate-700/50">
            <h3 className="font-bold text-white mb-2 lg:mb-3 text-sm lg:text-base">Members ({members.length})</h3>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" placeholder="Search members..." value={searchMembers} onChange={(e) => setSearchMembers(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Online Members */}
            <div className="p-2 lg:p-3">
              <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Online — {onlineCount}</p>
              {filteredMembers.filter(m => onlineUsers.includes(m.user.id)).map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-2 lg:gap-3 p-2 lg:p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br ${getAvatarColor(member.user.name)} flex items-center justify-center text-white text-xs lg:text-sm font-semibold shadow-sm`}>
                        {member.user.avatar ? <img src={member.user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <p className="text-xs lg:text-sm font-medium text-white truncate">{member.user.name}</p>
                        {badge && <span className={`px-1 lg:px-1.5 py-0.5 ${badge.bg} ${badge.color} rounded text-[9px] lg:text-[10px] font-semibold flex-shrink-0`}>{badge.label}</span>}
                      </div>
                      <p className="text-[10px] lg:text-xs text-slate-400 truncate">{member.user.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Offline Members */}
            <div className="p-2 lg:p-3 border-t border-slate-700/50">
              <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">Offline — {members.length - onlineCount}</p>
              {filteredMembers.filter(m => !onlineUsers.includes(m.user.id)).map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-2 lg:gap-3 p-2 lg:p-2.5 rounded-xl hover:bg-slate-700/50 transition-colors cursor-pointer opacity-60">
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br ${getAvatarColor(member.user.name)} flex items-center justify-center text-white text-xs lg:text-sm font-semibold`}>
                        {member.user.avatar ? <img src={member.user.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : member.user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2">
                        <p className="text-xs lg:text-sm font-medium text-white truncate">{member.user.name}</p>
                        {badge && <span className={`px-1 lg:px-1.5 py-0.5 ${badge.bg} ${badge.color} rounded text-[9px] lg:text-[10px] font-semibold flex-shrink-0`}>{badge.label}</span>}
                      </div>
                      <p className="text-[10px] lg:text-xs text-slate-400 truncate">{member.user.email}</p>
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}
