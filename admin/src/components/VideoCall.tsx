/**
 * VideoCall Component - WebRTC Video Calling
 * Handles peer-to-peer video calls between users
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiX, FiMaximize2, FiMinimize2, FiRefreshCw } from 'react-icons/fi';
import { Socket } from 'socket.io-client';

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

// ICE servers for WebRTC
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function VideoCall({
  socket,
  currentUser: _currentUser,
  remoteUser,
  conversationId,
  isIncoming = false,
  onClose,
}: VideoCallProps) {
  // Note: currentUser is available for future use (e.g., displaying local user info)
  void _currentUser;
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user');
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize local media stream
  const initLocalStream = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      // Enhanced mobile video constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // Force video to play on mobile (iOS fix)
        localVideoRef.current.play().catch(e => console.log('Local video autoplay prevented:', e));
      }
      return stream;
    } catch (error) {
      console.error('Failed to get local media:', error);
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          targetUserId: remoteUser.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind, event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setHasRemoteVideo(true);
        // Force remote video to play on mobile (iOS fix)
        remoteVideoRef.current.play().catch(e => console.log('Remote video autoplay prevented:', e));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, remoteUser.id]);

  // Start outgoing call
  const startCall = useCallback(async () => {
    const stream = await initLocalStream();
    if (!stream) return;

    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket?.emit('call:offer', {
      targetUserId: remoteUser.id,
      offer: offer,
    });

    setCallStatus('connecting');
  }, [initLocalStream, createPeerConnection, socket, remoteUser.id]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    const stream = await initLocalStream();
    if (!stream) return;

    socket?.emit('call:accept', {
      callerId: remoteUser.id,
      conversationId,
    });

    setCallStatus('connecting');
  }, [initLocalStream, socket, remoteUser.id, conversationId]);

  // End call
  const endCall = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    socket?.emit('call:end', { targetUserId: remoteUser.id });
    setCallStatus('ended');
    setTimeout(onClose, 1000);
  }, [socket, remoteUser.id, onClose]);

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
      // Stop current video track
      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      // Get new stream with different camera (enhanced mobile constraints)
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false // Don't replace audio
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace video track in local stream
      localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newVideoTrack);

      // Update local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(e => console.log('Video play prevented:', e));
      }

      // Replace track in peer connection
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      setCurrentFacingMode(newFacingMode);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      alert('Failed to switch camera. Make sure your device has multiple cameras.');
    }
  };

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (data: { callerId: string; offer: RTCSessionDescriptionInit }) => {
      if (data.callerId !== remoteUser.id) return;
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call:answer', { targetUserId: remoteUser.id, answer });
    };

    const handleAnswer = async (data: { answererId: string; answer: RTCSessionDescriptionInit }) => {
      if (data.answererId !== remoteUser.id) return;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };

    const handleIceCandidate = async (data: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (data.fromUserId !== remoteUser.id) return;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    const handleCallEnded = () => {
      endCall();
    };

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
  }, [socket, remoteUser.id, createPeerConnection, endCall, onClose]);

  // Start call on mount (for outgoing calls)
  useEffect(() => {
    if (!isIncoming && socket) {
      // Notify the other user and immediately start the WebRTC connection
      socket.emit('call:initiate', { targetUserId: remoteUser.id, conversationId });
      // Auto-start the call (get camera and send offer)
      startCall();
    }
  }, [isIncoming, socket, remoteUser.id, conversationId, startCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
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
        {/* Remote Video - Full screen background */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-contain"
          style={{ transform: 'rotateY(0deg)', backgroundColor: '#0f172a' }} // Prevent mirroring, add background
        />

        {/* Placeholder when no remote video */}
        {!hasRemoteVideo && callStatus === 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl sm:text-5xl mb-4">
              {remoteUser.avatar ? <img src={remoteUser.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : remoteUser.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-white/70 text-sm sm:text-base">Waiting for video...</p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) - Mobile optimized */}
        <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-4 w-24 h-32 sm:w-32 sm:h-40 md:w-40 md:h-52 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 bg-slate-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror local video for natural preview
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

