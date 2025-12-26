/**
 * VideoCall Component - WebRTC Video Calling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiX, FiMaximize2, FiMinimize2, FiRefreshCw, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { Socket } from 'socket.io-client';
import { requestMediaPermissions, getPermissionInstructions, getPermissionDebugInfo, clearPermissionCache } from '../utils/permissions';

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface VideoCallProps {
  socket: Socket | null;
  currentUser: User;
  remoteUser: User;
  conversationId: string;
  isIncoming?: boolean;
  onClose: () => void;
}

// ICE servers for WebRTC - includes STUN and TURN for NAT traversal
// Using Metered.ca TURN server for reliable connections
const iceServers: RTCConfiguration = {
  iceServers: [
    // STUN servers (free, for simple NAT traversal)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Metered STUN server
    { urls: 'stun:wordpressnode.metered.live:80' },
    // Metered TURN servers (UDP)
    {
      urls: 'turn:wordpressnode.metered.live:80',
      username: 'wordpressnode',
      credential: 'E5bjyr9nvSTEmYKk5n6UzDYMt3gn_6_tVni7TjwlbPJaDneR',
    },
    {
      urls: 'turn:wordpressnode.metered.live:443',
      username: 'wordpressnode',
      credential: 'E5bjyr9nvSTEmYKk5n6UzDYMt3gn_6_tVni7TjwlbPJaDneR',
    },
    // Metered TURN servers (TCP - for strict firewalls)
    {
      urls: 'turn:wordpressnode.metered.live:80?transport=tcp',
      username: 'wordpressnode',
      credential: 'E5bjyr9nvSTEmYKk5n6UzDYMt3gn_6_tVni7TjwlbPJaDneR',
    },
    {
      urls: 'turn:wordpressnode.metered.live:443?transport=tcp',
      username: 'wordpressnode',
      credential: 'E5bjyr9nvSTEmYKk5n6UzDYMt3gn_6_tVni7TjwlbPJaDneR',
    },
    // Metered TURNS (TLS - for maximum compatibility)
    {
      urls: 'turns:wordpressnode.metered.live:443',
      username: 'wordpressnode',
      credential: 'E5bjyr9nvSTEmYKk5n6UzDYMt3gn_6_tVni7TjwlbPJaDneR',
    },
  ],
  iceCandidatePoolSize: 10,
};

// Permission Denied Screen Component with Debug Info
function PermissionDeniedScreen({
  error,
  onRetry,
  onClose
}: {
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);

  const loadDebugInfo = async () => {
    const info = await getPermissionDebugInfo();
    setDebugInfo(info);
    setShowDebug(true);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 overflow-y-auto">
      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <FiAlertCircle className="text-red-500" size={40} />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2 text-center">Camera Permission Required</h3>
      <p className="text-white/70 text-sm text-center mb-4 max-w-xs">
        {error || 'Camera and microphone access is required for video calls.'}
      </p>
      <div className="bg-slate-800 rounded-lg p-4 mb-6 max-w-sm">
        <p className="text-amber-400 text-xs font-medium mb-2">📱 How to enable:</p>
        <p className="text-white/60 text-xs leading-relaxed">
          {getPermissionInstructions()}
        </p>
      </div>
      <div className="flex gap-3 mb-4">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <FiRefreshCw size={16} /> Try Again
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
        >
          Close
        </button>
      </div>
      <button
        onClick={loadDebugInfo}
        className="text-white/40 text-xs hover:text-white/60 flex items-center gap-1"
      >
        <FiInfo size={12} /> {showDebug ? 'Hide' : 'Show'} Debug Info
      </button>
      {showDebug && debugInfo && (
        <div className="mt-4 bg-slate-800/80 rounded-lg p-3 max-w-sm w-full">
          <pre className="text-[10px] text-white/50 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function VideoCall({
  socket,
  currentUser: _currentUser,
  remoteUser,
  conversationId,
  isIncoming = false,
  onClose,
}: VideoCallProps) {
  void _currentUser;

  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended' | 'permission_denied'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // End call
  const endCall = useCallback(() => {
    console.log('📞 Ending call');
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    socket?.emit('call:end', { targetUserId: remoteUser.id });
    setCallStatus('ended');
    setTimeout(onClose, 1000);
  }, [socket, remoteUser.id, onClose]);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(iceServers);
    peerConnectionRef.current = pc;

    // Send ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        socket?.emit('call:ice-candidate', {
          targetUserId: remoteUser.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle incoming tracks - display remote video
    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setHasRemoteStream(true);
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        if (!callTimerRef.current) {
          callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
        }
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    return pc;
  }, [socket, remoteUser.id, endCall]);

  // Get local media stream with proper permission handling
  const getLocalStream = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    // Stop existing stream first
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }

    // First check/request permissions
    const permResult = await requestMediaPermissions();

    if (!permResult.granted) {
      console.error('❌ Permission denied:', permResult.error);
      setPermissionError(permResult.error || 'Permission denied');
      setCallStatus('permission_denied');
      // Stop the test stream if it was created
      if (permResult.stream) {
        permResult.stream.getTracks().forEach(t => t.stop());
      }
      return null;
    }

    // Stop the test stream from permission check
    if (permResult.stream) {
      permResult.stream.getTracks().forEach(t => t.stop());
    }

    // Now get the actual stream with our preferred constraints
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setPermissionError(null);
      return stream;
    } catch (error) {
      console.error('❌ Failed to get media:', error);
      setPermissionError('Could not access camera/microphone');
      setCallStatus('permission_denied');
      return null;
    }
  }, []);

  // CALLER: Start outgoing call
  const startCall = useCallback(async () => {
    console.log('📞 Starting call (caller)');
    setCallStatus('connecting');

    const stream = await getLocalStream();
    if (!stream) return;

    const pc = createPeerConnection();

    // Add our tracks to the connection
    stream.getTracks().forEach(track => {
      console.log('➕ Adding local track:', track.kind);
      pc.addTrack(track, stream);
    });

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.log('📤 Sending offer');
    socket?.emit('call:offer', {
      targetUserId: remoteUser.id,
      offer: offer,
    });
  }, [getLocalStream, createPeerConnection, socket, remoteUser.id]);

  // RECEIVER: Accept incoming call
  const acceptCall = useCallback(async () => {
    console.log('📞 Accepting call (receiver)');
    setCallStatus('connecting');

    const stream = await getLocalStream();
    if (!stream) return;

    const pc = createPeerConnection();

    // Add our tracks to the connection
    stream.getTracks().forEach(track => {
      console.log('➕ Adding local track:', track.kind);
      pc.addTrack(track, stream);
    });

    // Process pending offer if we have one
    if (pendingOfferRef.current) {
      console.log('📥 Processing pending offer');
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));

      // Add any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('📤 Sending answer');
      socket?.emit('call:answer', {
        targetUserId: remoteUser.id,
        answer: answer,
      });

      pendingOfferRef.current = null;
    }

    // Also tell caller we accepted (so they can send offer if they haven't)
    socket?.emit('call:accept', { callerId: remoteUser.id, conversationId });
  }, [getLocalStream, createPeerConnection, socket, remoteUser.id, conversationId]);

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    if (!localStreamRef.current || !peerConnectionRef.current) return;

    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    try {
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) oldVideoTrack.stop();

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newVideoTrack);

      setCurrentFacingMode(newFacingMode);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  // Handle socket events for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // RECEIVER: Got offer from caller - store it for when we accept
    const handleOffer = async (data: { callerId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.callerId !== remoteUser.id) return;
      console.log('📥 Received offer');

      // If we already have a peer connection and stream, process immediately
      const pc = peerConnectionRef.current;
      if (pc && localStreamRef.current) {
        try {
          // Only set remote description if we haven't already
          if (!pc.remoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            // Process pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            }
            pendingCandidatesRef.current = [];

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('call:answer', {
              targetUserId: remoteUser.id,
              answer: answer,
            });
            console.log('📤 Answer sent');
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      } else {
        // Store offer - will be processed when acceptCall is called
        console.log('📦 Storing offer for later');
        pendingOfferRef.current = data.offer;
      }
    };

    // CALLER: Got answer from receiver
    const handleAnswer = async (data: { answererId: string; answer: RTCSessionDescriptionInit }) => {
      if (data.answererId !== remoteUser.id) return;
      console.log('📥 Received answer');

      const pc = peerConnectionRef.current;
      if (!pc) return;

      // Only set if we're in the right state
      if (pc.signalingState !== 'have-local-offer') {
        console.log('⚠️ Ignoring answer - wrong state:', pc.signalingState);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Process pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
        pendingCandidatesRef.current = [];
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    };

    // ICE candidate from remote peer
    const handleIceCandidate = async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (data.fromUserId !== remoteUser.id) return;

      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    const handleCallEnded = () => endCall();
    const handleCallRejected = () => {
      setCallStatus('ended');
      setTimeout(onClose, 1000);
    };

    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:rejected', handleCallRejected);

    return () => {
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:rejected', handleCallRejected);
    };
  }, [socket, remoteUser.id, endCall, onClose]);

  // Start call on mount (for outgoing calls)
  useEffect(() => {
    if (!isIncoming && socket) {
      socket.emit('call:initiate', { targetUserId: remoteUser.id, conversationId });
      startCall();
    }
  }, [isIncoming, socket, remoteUser.id, conversationId, startCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return (
    <div className={`fixed inset-0 bg-slate-900 z-50 flex flex-col ${isFullscreen ? '' : 'safe-area-inset'}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {remoteUser.avatar ? <img src={remoteUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : remoteUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-sm sm:text-base">{remoteUser.name}</p>
            <p className="text-white/70 text-xs sm:text-sm">
              {callStatus === 'ringing' && (isIncoming ? 'Incoming call...' : 'Calling...')}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && formatDuration(callDuration)}
              {callStatus === 'ended' && 'Call ended'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 sm:p-3 text-white hover:bg-white/20 active:bg-white/30 rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">
        {/* Remote Video - Full screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-contain bg-slate-900"
        />

        {/* Permission Denied Screen */}
        {callStatus === 'permission_denied' && (
          <PermissionDeniedScreen
            error={permissionError}
            onRetry={async () => {
              clearPermissionCache();
              setPermissionError(null);
              setCallStatus('connecting');
              if (isIncoming) {
                await acceptCall();
              } else {
                await startCall();
              }
            }}
            onClose={onClose}
          />
        )}

        {/* Placeholder when no remote stream */}
        {!hasRemoteStream && callStatus !== 'permission_denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl sm:text-5xl mb-4">
              {remoteUser.avatar ? (
                <img src={remoteUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                remoteUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-white/70 text-sm sm:text-base">
              {callStatus === 'connecting' ? 'Connecting...' : 'Waiting for video...'}
            </p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-4 w-24 h-32 sm:w-32 sm:h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 bg-slate-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
              <FiVideoOff className="text-white/50" size={24} />
            </div>
          )}
        </div>
      </div>

      {/* Controls - Mobile optimized with larger touch targets */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 pb-safe flex items-center justify-center gap-3 sm:gap-4 bg-gradient-to-t from-black/70 to-transparent">
        {callStatus === 'ringing' && isIncoming ? (
          <>
            <button
              onClick={() => { socket?.emit('call:reject', { callerId: remoteUser.id }); onClose(); }}
              className="p-4 sm:p-5 bg-red-500 rounded-full text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center"
              aria-label="Reject call"
            >
              <FiPhoneOff size={24} className="sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={acceptCall}
              className="p-4 sm:p-5 bg-green-500 rounded-full text-white hover:bg-green-600 active:bg-green-700 transition-colors shadow-lg touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center"
              aria-label="Accept call"
            >
              <FiPhone size={24} className="sm:w-7 sm:h-7" />
            </button>
          </>
        ) : callStatus === 'ringing' ? (
          <>
            <button
              onClick={startCall}
              className="p-4 sm:p-5 bg-green-500 rounded-full text-white hover:bg-green-600 active:bg-green-700 transition-colors shadow-lg touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center"
              aria-label="Start call"
            >
              <FiPhone size={24} className="sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={onClose}
              className="p-4 sm:p-5 bg-red-500 rounded-full text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center"
              aria-label="Cancel call"
            >
              <FiX size={24} className="sm:w-7 sm:h-7" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-3 sm:p-4 rounded-full transition-colors shadow-lg touch-manipulation min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] flex items-center justify-center ${isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FiMicOff size={20} className="sm:w-6 sm:h-6" /> : <FiMic size={20} className="sm:w-6 sm:h-6" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 sm:p-4 rounded-full transition-colors shadow-lg touch-manipulation min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] flex items-center justify-center ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'}`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <FiVideoOff size={20} className="sm:w-6 sm:h-6" /> : <FiVideo size={20} className="sm:w-6 sm:h-6" />}
            </button>
            <button
              onClick={switchCamera}
              className="p-3 sm:p-4 rounded-full bg-white/20 text-white hover:bg-white/30 active:bg-white/40 transition-colors shadow-lg touch-manipulation min-w-[48px] min-h-[48px] sm:min-w-[56px] sm:min-h-[56px] flex items-center justify-center"
              title="Switch camera"
              aria-label="Switch camera"
            >
              <FiRefreshCw size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={endCall}
              className="p-4 sm:p-5 bg-red-500 rounded-full text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg touch-manipulation min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center"
              title="End call"
              aria-label="End call"
            >
              <FiPhoneOff size={24} className="sm:w-7 sm:h-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

