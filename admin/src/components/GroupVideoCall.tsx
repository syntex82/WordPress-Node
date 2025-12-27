/**
 * GroupVideoCall Component - Metered Video SDK for Group Calls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiMaximize2, FiMinimize2, FiVideo } from 'react-icons/fi';
import { useAuthStore } from '../stores/authStore';
import { Socket } from 'socket.io-client';

interface GroupVideoCallProps {
  groupId: string;
  groupName: string;
  userName: string;
  socket: Socket | null;
  onClose: () => void;
}

declare global {
  interface Window {
    MeteredFrame: any;
  }
}

export default function GroupVideoCall({
  groupId,
  groupName,
  userName,
  socket,
  onClose,
}: GroupVideoCallProps) {
  const { token } = useAuthStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<any>(null);

  // Create or get video room for group
  const initializeRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/video/room/group/${groupId}`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create video room');
      }

      console.log('Group video room created:', data.room.roomUrl);
      setRoomUrl(data.room.roomUrl);

      // Notify group members that video call started
      if (socket?.connected) {
        socket.emit('group:video:start', { groupId, roomUrl: data.room.roomUrl });
      }
    } catch (err) {
      console.error('Failed to initialize group video room:', err);
      setError(err instanceof Error ? err.message : 'Failed to start video call');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, token, socket]);

  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  // Initialize Metered frame when room URL is ready
  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    const loadSDK = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.MeteredFrame) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.metered.ca/sdk/frame/1.4.3/sdk-frame.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Metered SDK'));
        document.head.appendChild(script);
      });
    };

    const initFrame = async () => {
      try {
        await loadSDK();
        if (containerRef.current && window.MeteredFrame) {
          frameRef.current = new window.MeteredFrame();
          await frameRef.current.init(
            {
              roomURL: roomUrl,
              autoJoin: true,
              name: userName || 'User',
              joinVideoOn: true,
              joinAudioOn: true,
              enableRequestToJoin: false,
              showInviteLink: false,
            },
            containerRef.current
          );
          // Explicitly join after init
          try {
            await frameRef.current.join();
          } catch (joinErr) {
            console.log('Already joined or join pending');
          }
        }
      } catch (err) {
        console.error('Failed to initialize Metered frame:', err);
        setError('Failed to load video call');
      }
    };

    initFrame();

    return () => {
      if (frameRef.current) {
        try { frameRef.current.leave(); } catch (e) { /* ignore */ }
      }
    };
  }, [roomUrl, userName]);

  const handleClose = () => {
    if (frameRef.current) {
      try { frameRef.current.leave(); } catch (e) { /* ignore */ }
    }
    // Notify group that user left the call
    if (socket?.connected) {
      socket.emit('group:video:end', { groupId });
    }
    onClose();
  };

  return (
    <div className={`fixed z-50 bg-gray-900 shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'inset-0 rounded-none' : 'bottom-4 right-4 w-[600px] h-[700px] max-w-[95vw] max-h-[85vh]'
    }`}>
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <FiVideo className="text-green-400" />
          <span className="text-white font-medium">{groupName} - Video Call</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
          </button>
          <button onClick={handleClose} className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white">
            <FiX size={18} />
          </button>
        </div>
      </div>

      <div className="w-full h-full pt-12">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Starting group video call...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={initializeRoom} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
            </div>
          </div>
        )}
        {!isLoading && !error && (
          <div ref={containerRef} id="metered-group-frame" className="w-full h-full" style={{ minHeight: isFullscreen ? '100vh' : '600px' }} />
        )}
      </div>
    </div>
  );
}

