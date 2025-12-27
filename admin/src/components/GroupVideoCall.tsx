/**
 * GroupVideoCall Component - Shows member list for 1-on-1 video calls
 * Video calls in groups are 1-on-1 only - select a member to call
 */

import { useState, useEffect } from 'react';
import { FiX, FiVideo, FiPhone, FiUsers } from 'react-icons/fi';
import { useAuthStore } from '../stores/authStore';
import { Socket } from 'socket.io-client';

interface GroupMember {
  id: string;
  name: string;
  avatar: string | null;
  isOnline?: boolean;
}

interface GroupVideoCallProps {
  groupId: string;
  groupName: string;
  userName: string;
  socket: Socket | null;
  members?: GroupMember[];
  onlineUsers?: string[];
  onCallUser?: (userId: string) => void;
  onClose: () => void;
}

export default function GroupVideoCall({
  groupId,
  groupName,
  socket,
  members = [],
  onlineUsers = [],
  onCallUser,
  onClose,
}: GroupVideoCallProps) {
  const { user } = useAuthStore();
  const [availableMembers, setAvailableMembers] = useState<GroupMember[]>([]);

  useEffect(() => {
    // Filter out current user and mark online status
    const filtered = members
      .filter(m => m.id !== user?.id)
      .map(m => ({
        ...m,
        isOnline: onlineUsers.includes(m.id),
      }));
    setAvailableMembers(filtered);
  }, [members, onlineUsers, user?.id]);

  const handleCallMember = (memberId: string) => {
    if (onCallUser) {
      onCallUser(memberId);
    }
    // Notify via socket
    if (socket?.connected) {
      socket.emit('call:initiate', { targetUserId: memberId, groupId });
    }
    onClose();
  };

  return (
    <div className="fixed z-50 bottom-4 right-4 w-[350px] max-w-[95vw] bg-gray-900 shadow-2xl rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center gap-2">
          <FiVideo className="text-white" size={20} />
          <span className="text-white font-medium">Video Call</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white">
          <FiX size={18} />
        </button>
      </div>

      {/* Info Banner */}
      <div className="px-4 py-3 bg-blue-500/20 border-b border-blue-500/30">
        <div className="flex items-start gap-2">
          <FiUsers className="text-blue-400 mt-0.5" size={16} />
          <div>
            <p className="text-blue-200 text-sm font-medium">1-on-1 Video Calls</p>
            <p className="text-blue-300/70 text-xs">Select a member from {groupName} to start a private video call</p>
          </div>
        </div>
      </div>

      {/* Member List */}
      <div className="max-h-[300px] overflow-y-auto">
        {availableMembers.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <FiUsers size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No other members in this group</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {availableMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {member.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{member.name}</p>
                    <p className={`text-xs ${member.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                      {member.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCallMember(member.id)}
                  disabled={!member.isOnline}
                  className={`p-2.5 rounded-full transition-all ${
                    member.isOnline
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  title={member.isOnline ? `Call ${member.name}` : 'User is offline'}
                >
                  <FiPhone size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-800/50 border-t border-gray-700">
        <p className="text-gray-400 text-xs text-center">
          Only online members can receive calls
        </p>
      </div>
    </div>
  );
}

