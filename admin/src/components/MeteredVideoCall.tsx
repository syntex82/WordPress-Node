/**
 * MeteredVideoCall Component - Metered Video SDK Integration
 * Uses Metered's embedded video conferencing for reliable video calls
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiMaximize2, FiMinimize2, FiPhone } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface MeteredVideoCallProps {
  currentUser: User;
  remoteUser: User;
  conversationId: string;
  onClose: () => void;
}

declare global {
  interface Window {
    MeteredFrame: any;
  }
}

export default function MeteredVideoCall({
  currentUser,
  remoteUser,
  conversationId,
  onClose,
}: MeteredVideoCallProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<any>(null);

  // Create or get video room
  const initializeRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create a room based on conversation ID for consistency
      const roomName = `chat-${conversationId.substring(0, 8)}`;
      
      const response = await fetch('/api/video/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomName }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create video room');
      }

      setRoomUrl(data.room.roomUrl);
    } catch (err) {
      console.error('Failed to initialize video room:', err);
      setError(err instanceof Error ? err.message : 'Failed to start video call');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Load Metered SDK and initialize frame
  useEffect(() => {
    initializeRoom();
  }, [initializeRoom]);

  // Initialize Metered frame when room URL is ready
  useEffect(() => {
    if (!roomUrl || !containerRef.current) return;

    // Load SDK script if not already loaded
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
          frameRef.current.init(
            {
              roomURL: roomUrl,
              autoJoin: true,
              name: currentUser.name || 'User',
              joinVideoOn: true,
              joinAudioOn: true,
            },
            containerRef.current
          );
        }
      } catch (err) {
        console.error('Failed to initialize Metered frame:', err);
        setError('Failed to load video call');
      }
    };

    initFrame();

    return () => {
      // Cleanup frame on unmount
      if (frameRef.current) {
        try {
          frameRef.current.leave();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [roomUrl, currentUser.name]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    if (frameRef.current) {
      try {
        frameRef.current.leave();
      } catch (e) {
        // Ignore
      }
    }
    onClose();
  };

  return (
    <div
      className={`fixed z-50 bg-gray-900 shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'inset-0 rounded-none'
          : 'bottom-4 right-4 w-[480px] h-[640px] max-w-[95vw] max-h-[80vh]'
      }`}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <FiPhone className="text-green-400" />
          <span className="text-white font-medium">
            Call with {remoteUser.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isFullscreen ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="w-full h-full pt-12">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Starting video call...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={initializeRoom}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div
            ref={containerRef}
            id="metered-frame"
            className="w-full h-full"
            style={{ minHeight: isFullscreen ? '100vh' : '500px' }}
          />
        )}
      </div>
    </div>
  );
}

