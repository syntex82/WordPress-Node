/**
 * Group Chat Page
 * Real-time chat interface for group messaging
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiSend, FiArrowLeft, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { groupsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface Message {
  id: string;
  content: string;
  createdAt: string;
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
}

export default function GroupChat() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      loadGroup();
      loadMessages();
      loadMembers();
    }
  }, [id]);

  useEffect(() => {
    if (group?.isMember && token) {
      // Connect to WebSocket
      const newSocket = io('/groups', {
        auth: { token },
      });

      newSocket.on('connect', () => {
        console.log('Connected to groups gateway');
        newSocket.emit('group:join', { groupId: id }, (response: any) => {
          if (response.onlineUsers) {
            setOnlineUsers(response.onlineUsers);
          }
        });
      });

      newSocket.on('group:message:new', (message: Message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      newSocket.on('group:user:online', (data: { userId: string }) => {
        setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
      });

      newSocket.on('group:user:offline', (data: { userId: string }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
      });

      newSocket.on('group:typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
        if (data.isTyping) {
          setTypingUsers((prev) => [...new Set([...prev, data.userName])]);
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
        }
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('group:message:send', { groupId: id, content: newMessage.trim() });
    setNewMessage('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('group:typing:start', { groupId: id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    if (!socket) return;
    socket.emit('group:typing:stop', { groupId: id });
  };

  const handleJoinGroup = async () => {
    try {
      await groupsApi.join(id!);
      toast.success('Joined group successfully');
      loadGroup();
      loadMessages();
      loadMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!group.isMember) {
    return (
      <div className="p-6">
        <Link to="/groups" className="flex items-center gap-2 text-blue-600 hover:underline mb-6">
          <FiArrowLeft /> Back to Groups
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-2">{group.name}</h2>
          <p className="text-gray-600 mb-6">{group.description || 'No description'}</p>
          <button
            onClick={handleJoinGroup}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Join Group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/groups" className="text-gray-500 hover:text-gray-700">
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h2 className="font-semibold text-lg">{group.name}</h2>
              <p className="text-sm text-gray-500">{onlineUsers.length} online</p>
            </div>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiUsers size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender.id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white shadow'
                  }`}
                >
                  {message.sender.id !== user?.id && (
                    <p className="text-xs font-medium text-gray-500 mb-1">{message.sender.name}</p>
                  )}
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${message.sender.id === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-2 text-sm text-gray-500 bg-gray-50">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FiSend />
            </button>
          </div>
        </form>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-64 bg-white border-l overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Members ({members.length})</h3>
          </div>
          <div className="p-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <div className="relative">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(member.user.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.user.name}</p>
                  <p className="text-xs text-gray-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
