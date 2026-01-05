/**
 * Group Chat Page - Premium Real-time Chat Interface
 * LinkedIn/Discord-inspired design with glass-morphism effects
 * Features: Smooth animations, mobile-first UX, media recording
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiUsers, FiLogOut, FiSearch, FiCheck, FiShield, FiStar, FiHash, FiMessageSquare, FiTrash2, FiPaperclip, FiVideo, FiX, FiSmile, FiMic, FiMonitor, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import EmojiPicker, { EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import { groupsApi, messagesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import GroupVideoCall from '../components/GroupVideoCall';
import VideoCall from '../components/VideoCall';
import MobileMediaRecorder from '../components/MobileMediaRecorder';

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
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallTarget, setVideoCallTarget] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [activeVideoCall, setActiveVideoCall] = useState<{ roomUrl: string; startedBy: { id: string; name: string } } | null>(null);
  const [messagesSocket, setMessagesSocket] = useState<Socket | null>(null); // For video calls via messages namespace
  const [showMediaRecorder, setShowMediaRecorder] = useState(false);
  const [mediaRecorderMode, setMediaRecorderMode] = useState<'video' | 'audio' | 'screen'>('video');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

      // Video call events
      newSocket.on('group:video:started', (data: { groupId: string; roomUrl: string; startedBy: { id: string; name: string } }) => {
        console.log('Video call started by:', data.startedBy.name);
        setActiveVideoCall({ roomUrl: data.roomUrl, startedBy: data.startedBy });
        toast.success(`${data.startedBy.name} started a video call`);
      });

      newSocket.on('group:video:ended', () => {
        setActiveVideoCall(null);
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

  // Connect to messages namespace for video calls (so target user receives the call)
  useEffect(() => {
    if (token && group?.isMember) {
      const wsUrl = `${window.location.protocol}//${window.location.host}/messages`;
      const msgSocket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      msgSocket.on('connect', () => {
        console.log('Messages socket connected for video calls');
      });

      setMessagesSocket(msgSocket);

      return () => {
        msgSocket.disconnect();
        setMessagesSocket(null);
      };
    }
  }, [token, group?.isMember]);

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

  // Handle media captured from mobile recorder
  const handleMediaCaptured = (media: { type: 'VIDEO' | 'AUDIO'; url: string }) => {
    // Add the captured media to pending media
    const mediaAttachment: MediaAttachment = {
      url: media.url,
      type: media.type === 'VIDEO' ? 'video' : 'image', // Use image type for audio placeholder
      filename: `${media.type.toLowerCase()}-${Date.now()}.webm`,
      size: 0,
      mimeType: media.type === 'VIDEO' ? 'video/webm' : 'audio/webm',
    };
    setPendingMedia((prev) => [...prev, mediaAttachment]);
    setShowMediaRecorder(false);
    toast.success(`${media.type === 'VIDEO' ? 'Video' : 'Audio'} ready to send`);
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-700 border-t-indigo-500 mx-auto"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-14 w-14 border-4 border-indigo-500/20 mx-auto"></div>
          </div>
          <p className="text-slate-400 mt-4">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group.isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/30 w-full max-w-md overflow-hidden">
          <div className="h-36 sm:h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
            <Link to="/groups" className="absolute top-4 left-4 p-2.5 bg-black/20 backdrop-blur-md rounded-xl text-white hover:bg-black/30 transition-all duration-200 border border-white/10">
              <FiArrowLeft size={20} />
            </Link>
          </div>
          <div className="p-6 sm:p-8 text-center -mt-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-2xl ring-4 ring-slate-800">
              <FiHash size={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mt-5 mb-2 text-white">{group.name}</h2>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">{group.description || 'Join this community to start chatting!'}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-8">
              <span className="flex items-center gap-2 bg-slate-700/30 px-3 py-1.5 rounded-lg">
                <FiUsers className="text-indigo-400" /> {group._count?.members || 0} members
              </span>
            </div>
            <button
              onClick={handleJoinGroup}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/70 backdrop-blur-xl border-b border-slate-700/30 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link to="/groups" className="p-2.5 hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all duration-200 flex-shrink-0">
              <FiArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/10 flex-shrink-0">
                <FiHash size={18} className="sm:hidden" />
                <FiHash size={20} className="hidden sm:block" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h2 className="font-bold text-base sm:text-lg text-white truncate max-w-[120px] sm:max-w-none">{group.name}</h2>
                  <div className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs inline-flex items-center gap-1.5 flex-shrink-0 backdrop-blur-sm ${socketConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
                    <span className="hidden xs:inline">{socketConnected ? 'Live' : 'Connecting...'}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">{onlineCount} online · {members.length} members</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Video Call Button */}
            <button
              onClick={() => setShowVideoCall(true)}
              disabled={!socketConnected}
              className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${socketConnected ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105 active:scale-95' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}
              title="Start group video call"
            >
              <FiVideo size={18} className="sm:hidden" />
              <FiVideo size={20} className="hidden sm:block" />
            </button>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 ${showMembers ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'}`}
            >
              <FiUsers size={18} className="sm:hidden" />
              <FiUsers size={20} className="hidden sm:block" />
            </button>
            <button
              onClick={handleLeaveGroup}
              className="p-2.5 sm:p-3 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all duration-200"
            >
              <FiLogOut size={18} className="sm:hidden" />
              <FiLogOut size={20} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Active Video Call Banner */}
        {activeVideoCall && !showVideoCall && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                <FiVideo className="text-white" size={18} />
              </div>
              <span className="text-white font-medium text-sm sm:text-base">
                {activeVideoCall.startedBy.id === user?.id
                  ? 'You started a video call'
                  : `${activeVideoCall.startedBy.name} started a video call`}
              </span>
            </div>
            <button
              onClick={() => setShowVideoCall(true)}
              className="px-4 py-2 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            >
              Join Call
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-slate-900/50 to-slate-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-indigo-500"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-indigo-500/20"></div>
              </div>
              <p className="text-slate-400 text-sm mt-4">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <FiMessageSquare className="text-3xl sm:text-4xl text-indigo-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No messages yet</h3>
              <p className="text-sm sm:text-base text-slate-400">Be the first to start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {groupedMessages.map((msgGroup, groupIdx) => (
                <div key={groupIdx}>
                  {/* Date Divider */}
                  <div className="flex items-center justify-center my-4 sm:my-6">
                    <div className="px-4 sm:px-5 py-1.5 sm:py-2 bg-slate-800/70 backdrop-blur-sm rounded-full border border-slate-700/30 text-[10px] sm:text-xs font-medium text-slate-400 shadow-lg">
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
                        <div key={message.id} className={`group/msg flex w-full ${isOwn ? 'justify-end' : 'justify-start'} ${!showAvatar ? (isOwn ? 'pr-10 sm:pr-12' : 'pl-10 sm:pl-12') : ''}`}>
                          {!isOwn && showAvatar && (
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(message.sender.name)} flex items-center justify-center text-white text-xs sm:text-sm font-semibold mr-2 sm:mr-3 flex-shrink-0 shadow-lg ring-2 ring-white/10`}>
                              {message.sender.avatar ? <img src={message.sender.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : message.sender.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className={`max-w-[75%] sm:max-w-[65%] min-w-0 ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && showAvatar && <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mb-1 sm:mb-1.5 ml-1">{message.sender.name}</p>}
                            <div className={`px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-lg ${isOwn ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-br-md' : 'bg-slate-800/80 backdrop-blur-sm text-slate-200 border border-slate-700/30 rounded-bl-md'}`}>
                              {/* Media Attachments */}
                              {message.media && message.media.length > 0 && (
                                <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${message.content ? 'mb-2 sm:mb-2.5' : ''}`}>
                                  {(message.media as MediaAttachment[]).map((media, idx) => (
                                    <div key={idx} className="cursor-pointer group/media" onClick={() => setLightboxMedia(media)}>
                                      {media.type === 'image' ? (
                                        <img src={media.url} alt={media.filename} className="max-w-[140px] max-h-[140px] sm:max-w-[200px] sm:max-h-[200px] rounded-xl object-cover group-hover/media:opacity-90 transition-all duration-200 shadow-lg" />
                                      ) : (
                                        <video src={media.url} className="max-w-[140px] max-h-[140px] sm:max-w-[200px] sm:max-h-[200px] rounded-xl shadow-lg" controls />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {message.content && <p className="text-[13px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>}
                            </div>
                            <div className={`flex items-center gap-1.5 mt-1 sm:mt-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] sm:text-[11px] text-slate-500">{formatTime(message.createdAt)}</span>
                              {isOwn && <FiCheck className="text-indigo-400" size={10} />}
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="ml-1 opacity-0 group-hover/msg:opacity-100 sm:opacity-0 active:opacity-100 text-slate-500 hover:text-red-400 transition-all duration-200 p-1 -m-1 hover:bg-red-500/10 rounded"
                                  title="Delete message"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          {isOwn && showAvatar && (
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(message.sender.name)} flex items-center justify-center text-white text-xs sm:text-sm font-semibold ml-2 sm:ml-3 flex-shrink-0 shadow-lg ring-2 ring-white/10`}>
                              {message.sender.avatar ? <img src={message.sender.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : message.sender.name.charAt(0).toUpperCase()}
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
          <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-800/70 backdrop-blur-sm border-t border-slate-700/30">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="truncate text-slate-300">{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          </div>
        )}

        {/* Message Input - Improved Layout */}
        <form onSubmit={handleSendMessage} className="bg-slate-800/70 backdrop-blur-xl border-t border-slate-700/30 pb-safe flex-shrink-0">
          {/* Pending Media Preview */}
          {pendingMedia.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-700/30 border-b border-slate-700/30">
              {pendingMedia.map((media, idx) => (
                <div key={idx} className="relative group">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={media.filename} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-slate-600/50 shadow-lg" />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-700 rounded-lg border border-slate-600/50 flex items-center justify-center shadow-lg">
                      <FiVideo className="text-slate-400" size={18} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePendingMedia(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-white text-center truncate px-0.5 rounded-b-lg backdrop-blur-sm">{formatFileSize(media.size)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Bar - Above text input */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-700/30 bg-slate-800/50 relative">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleFileSelect} className="hidden" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingMedia}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-600/50 rounded-lg transition-all flex items-center justify-center active:scale-95"
              title="Attach photo/video"
            >
              {uploadingMedia ? (
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiImage size={20} />
              )}
            </button>

            <button
              type="button"
              onClick={() => { setMediaRecorderMode('video'); setShowMediaRecorder(true); }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-600/50 rounded-lg transition-all flex items-center justify-center active:scale-95"
              title="Record video"
            >
              <FiVideo size={20} />
            </button>

            <button
              type="button"
              onClick={() => { setMediaRecorderMode('audio'); setShowMediaRecorder(true); }}
              className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-600/50 rounded-lg transition-all flex items-center justify-center active:scale-95"
              title="Record audio"
            >
              <FiMic size={20} />
            </button>

            <button
              type="button"
              onClick={() => { setMediaRecorderMode('screen'); setShowMediaRecorder(true); }}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-600/50 rounded-lg transition-all hidden sm:flex items-center justify-center active:scale-95"
              title="Share screen"
            >
              <FiMonitor size={20} />
            </button>

            <div className="w-px h-5 bg-slate-600/50 mx-1"></div>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 hover:bg-slate-600/50 rounded-lg transition-all flex items-center justify-center active:scale-95 ${showEmojiPicker ? 'text-yellow-400 bg-slate-600/50' : 'text-slate-400 hover:text-yellow-400'}`}
              title="Add emoji"
            >
              <FiSmile size={20} />
            </button>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-xl overflow-hidden">
                <EmojiPicker
                  theme={Theme.DARK}
                  onEmojiClick={handleEmojiSelect}
                  width={280}
                  height={320}
                  emojiStyle={EmojiStyle.NATIVE}
                />
              </div>
            )}
          </div>

          {/* Text Input Row - Clean and focused */}
          <div className="flex items-end gap-2 p-2 sm:p-3">
            <div className="flex-1 bg-slate-700/50 rounded-2xl border border-slate-600/30 overflow-hidden">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                  // Auto-resize textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim() || pendingMedia.length > 0) {
                      handleSendMessage(e as unknown as React.FormEvent);
                    }
                  }
                }}
                placeholder="Type your message..."
                className="w-full bg-transparent px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none text-[15px] resize-none min-h-[40px] max-h-[100px]"
                disabled={sending}
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={(!newMessage.trim() && pendingMedia.length === 0) || sending}
              className={`p-2.5 sm:p-3 rounded-xl transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 ${
                (newMessage.trim() || pendingMedia.length > 0) && !sending
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-105 active:scale-95'
                  : 'bg-slate-600/50 text-slate-500'
              }`}
            >
              {sending ? (
                <div className="w-[18px] h-[18px] border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FiSend size={18} />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Members Sidebar - Hidden on mobile, shown as overlay on tablet+ */}
      {showMembers && (
        <div className="hidden md:flex w-72 lg:w-80 bg-slate-800/70 backdrop-blur-xl border-l border-slate-700/30 flex-col">
          <div className="p-4 lg:p-5 border-b border-slate-700/30">
            <h3 className="font-bold text-white mb-3 lg:mb-4 text-sm lg:text-base">Members ({members.length})</h3>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search members..."
                value={searchMembers}
                onChange={(e) => setSearchMembers(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/30 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* Online Members */}
            <div className="p-3 lg:p-4">
              <p className="text-[10px] lg:text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Online — {onlineCount}
              </p>
              {filteredMembers.filter(m => onlineUsers.includes(m.user.id)).map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 lg:p-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(member.user.name)} flex items-center justify-center text-white text-xs lg:text-sm font-semibold shadow-lg ring-2 ring-white/10 group-hover:ring-white/20 transition-all`}>
                        {member.user.avatar ? <img src={member.user.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-lg"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{member.user.name}</p>
                        {badge && <span className={`px-1.5 py-0.5 ${badge.bg} ${badge.color} rounded-md text-[9px] lg:text-[10px] font-semibold flex-shrink-0`}>{badge.label}</span>}
                      </div>
                      <p className="text-[10px] lg:text-xs text-slate-400 truncate">{member.user.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Offline Members */}
            <div className="p-3 lg:p-4 border-t border-slate-700/30">
              <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Offline — {members.length - onlineCount}</p>
              {filteredMembers.filter(m => !onlineUsers.includes(m.user.id)).map((member) => {
                const badge = getRoleBadge(member.role);
                return (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 lg:p-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 cursor-pointer opacity-50 hover:opacity-70">
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(member.user.name)} flex items-center justify-center text-white text-xs lg:text-sm font-semibold shadow-lg`}>
                        {member.user.avatar ? <img src={member.user.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : member.user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{member.user.name}</p>
                        {badge && <span className={`px-1.5 py-0.5 ${badge.bg} ${badge.color} rounded-md text-[9px] lg:text-[10px] font-semibold flex-shrink-0`}>{badge.label}</span>}
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setLightboxMedia(null)}>
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-4 right-4 p-3 text-white hover:bg-white/10 rounded-xl z-10 transition-colors"
          >
            <FiX size={24} />
          </button>
          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.type === 'image' ? (
              <img src={lightboxMedia.url} alt={lightboxMedia.filename} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            ) : (
              <video src={lightboxMedia.url} className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" controls />
            )}
            <p className="text-center text-white/60 mt-3 text-sm">{lightboxMedia.filename}</p>
          </div>
        </div>
      )}

      {/* Group Video Call - Member Picker */}
      {showVideoCall && !videoCallTarget && group && user && (
        <GroupVideoCall
          groupId={group.id}
          groupName={group.name}
          userName={user.name || 'User'}
          socket={socket}
          members={members.map(m => ({
            id: m.user.id,
            name: m.user.name,
            avatar: m.user.avatar,
          }))}
          onlineUsers={onlineUsers}
          onCallUser={(userId) => {
            const targetMember = members.find(m => m.user.id === userId);
            if (targetMember) {
              setVideoCallTarget({
                id: targetMember.user.id,
                name: targetMember.user.name,
                avatar: targetMember.user.avatar,
              });
            }
          }}
          onClose={() => {
            setShowVideoCall(false);
            setActiveVideoCall(null);
          }}
        />
      )}

      {/* Active 1-on-1 Video Call - uses messages socket so target receives call */}
      {videoCallTarget && messagesSocket?.connected && user && (
        <VideoCall
          socket={messagesSocket}
          currentUser={{
            id: user.id,
            name: user.name || 'User',
            avatar: user.avatar || null,
          }}
          remoteUser={videoCallTarget}
          conversationId={`group-call-${group?.id}-${videoCallTarget.id}`}
          isIncoming={false}
          onClose={() => {
            setVideoCallTarget(null);
            setShowVideoCall(false);
          }}
        />
      )}

      {/* Mobile Media Recorder */}
      <MobileMediaRecorder
        isOpen={showMediaRecorder}
        onClose={() => setShowMediaRecorder(false)}
        onMediaCaptured={handleMediaCaptured}
        mode={mediaRecorderMode}
      />
    </div>
  );
}
