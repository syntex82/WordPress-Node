/**
 * MobileMediaRecorder Component
 * Modern, responsive audio/video recording inspired by TikTok and LinkedIn
 * Works seamlessly across mobile, tablet, and desktop devices
 * Features: beautiful animations, proper aspect ratios, waveform visualization
 * Uses React Portal to render at document body level for proper z-index layering
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FiVideo, FiMic, FiSquare, FiPause, FiPlay, FiX, FiCheck,
  FiRefreshCw, FiVolume2, FiUpload, FiMonitor
} from 'react-icons/fi';
import { mediaApi } from '../services/api';
import toast from 'react-hot-toast';

interface MobileMediaRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaCaptured: (media: { type: 'VIDEO' | 'AUDIO'; url: string; thumbnail?: string }) => void;
  mode?: 'video' | 'audio' | 'screen';
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'checking';

export default function MobileMediaRecorder({
  isOpen,
  onClose,
  onMediaCaptured,
  mode = 'video'
}: MobileMediaRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionState, setPermissionState] = useState<PermissionState>('checking');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Haptic feedback helper
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(patterns[type]);
    }
  };

  // Audio level monitoring for waveform
  const startAudioMonitoring = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Audio monitoring not available');
    }
  }, []);

  // Check permissions on mount
  const checkPermissions = useCallback(async () => {
    setPermissionState('checking');
    setPermissionError(null);

    // Screen capture doesn't need pre-permission check - goes straight to prompt
    if (mode === 'screen') {
      setPermissionState('prompt');
      return;
    }

    try {
      // Check if permissions API is available
      if (navigator.permissions) {
        const cameraPermission = mode === 'video'
          ? await navigator.permissions.query({ name: 'camera' as PermissionName })
          : null;
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

        const cameraState = cameraPermission?.state || 'granted';
        const micState = micPermission?.state || 'prompt';

        if (cameraState === 'denied' || micState === 'denied') {
          setPermissionState('denied');
          setPermissionError(
            cameraState === 'denied' && micState === 'denied'
              ? 'Camera and microphone access denied'
              : cameraState === 'denied'
              ? 'Camera access denied'
              : 'Microphone access denied'
          );
          return;
        }

        if (cameraState === 'granted' && (mode === 'audio' || micState === 'granted')) {
          setPermissionState('granted');
          return;
        }
      }

      // Default to prompt if we can't check
      setPermissionState('prompt');
    } catch (e) {
      // Permissions API not fully supported, show prompt
      setPermissionState('prompt');
    }
  }, [mode]);

  // Request permissions and initialize media
  const requestPermissions = useCallback(async () => {
    setPermissionState('checking');
    setPermissionError(null);

    try {
      let stream: MediaStream;

      if (mode === 'screen') {
        // Screen capture using getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: true // Capture system audio if available
        });

        // Also get microphone audio for commentary
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          // Combine screen video with microphone audio
          audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
        } catch (audioError) {
          console.warn('Could not get microphone for screen recording:', audioError);
          // Continue without mic - screen audio might be available
        }
      } else if (mode === 'video') {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode,
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            aspectRatio: { ideal: 16/9 }
          },
          audio: true
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        // Audio only
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
      }

      streamRef.current = stream;
      setPermissionState('granted');

      if (videoRef.current && (mode === 'video' || mode === 'screen')) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if (mode === 'audio') {
        startAudioMonitoring(stream);
      }

      // Handle screen share ending (user clicks "Stop sharing")
      if (mode === 'screen') {
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          handleClose();
          toast('Screen sharing stopped');
        });
      }
    } catch (error: any) {
      console.error('Failed to access media devices:', error);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setPermissionError(mode === 'screen'
          ? 'Screen sharing was cancelled or denied.'
          : 'Permission denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionState('denied');
        setPermissionError(mode === 'video' ? 'No camera found on this device.' : 'No microphone found.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionState('denied');
        setPermissionError('Camera/microphone is already in use by another app.');
      } else if (error.name === 'AbortError') {
        // User cancelled screen picker
        handleClose();
        return;
      } else {
        setPermissionState('denied');
        setPermissionError(mode === 'screen'
          ? 'Unable to capture screen. Please try again.'
          : 'Unable to access camera/microphone. Please check permissions.');
      }
    }
  }, [mode, facingMode, startAudioMonitoring]);

  // Initialize camera/microphone (for camera switching - not used for screen mode)
  const initializeMedia = useCallback(async () => {
    if (permissionState !== 'granted') return;
    // Screen mode doesn't support reinitializing - user would need to restart
    if (mode === 'screen') return;

    try {
      const constraints: MediaStreamConstraints = mode === 'video'
        ? {
            video: {
              facingMode,
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              aspectRatio: { ideal: 16/9 }
            },
            audio: true
          }
        : { audio: { echoCancellation: true, noiseSuppression: true } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current && mode === 'video') {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if (mode === 'audio') {
        startAudioMonitoring(stream);
      }
    } catch (error) {
      console.error('Failed to access media devices:', error);
      toast.error('Unable to access camera/microphone.');
    }
  }, [mode, facingMode, startAudioMonitoring, permissionState]);

  // Check permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      checkPermissions();
    } else {
      // Reset state when closed
      setPermissionState('checking');
      setPermissionError(null);
    }
  }, [isOpen, checkPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [previewUrl]);

  // Switch camera
  const switchCamera = async () => {
    triggerHaptic('light');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (isOpen && (mode === 'video' || mode === 'audio')) {
      initializeMedia();
    }
  }, [facingMode, isOpen, mode, initializeMedia]);

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;
    triggerHaptic('medium');

    chunksRef.current = [];
    const isVideoMode = mode === 'video' || mode === 'screen';
    const mimeType = isVideoMode
      ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
         MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4')
      : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
         MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: isVideoMode ? 2500000 : undefined,
      audioBitsPerSecond: 128000
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setRecordingState('preview');
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };

    mediaRecorder.start(1000);
    setRecordingState('recording');
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    triggerHaptic('light');

    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
  };

  // Stop recording
  const stopRecording = () => {
    triggerHaptic('heavy');
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Retry recording
  const retryRecording = () => {
    triggerHaptic('light');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioLevel(0);
    initializeMedia();
  };

  // Upload and save
  const saveRecording = async () => {
    if (!previewUrl) return;
    triggerHaptic('medium');
    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const extension = mode === 'video' ? 'webm' : 'webm';
      const filename = `${mode}-${Date.now()}.${extension}`;
      const file = new File([blob], filename, { type: blob.type });

      const uploadRes = await mediaApi.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      const mediaUrl = uploadRes.data.url || uploadRes.data.path;

      onMediaCaptured({
        type: mode === 'audio' ? 'AUDIO' : 'VIDEO', // Screen recordings are video
        url: mediaUrl,
      });

      const modeLabel = mode === 'video' ? 'Video' : mode === 'screen' ? 'Screen recording' : 'Audio';
      toast.success(`${modeLabel} saved successfully!`);
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to save recording. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Close and cleanup
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setPreviewUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setAudioLevel(0);
    onClose();
  };

  if (!isOpen) return null;

  // Generate waveform bars for audio visualization
  const waveformBars = Array.from({ length: 40 }, (_, i) => {
    const baseHeight = Math.sin((i / 40) * Math.PI) * 0.5 + 0.5;
    const animatedHeight = recordingState === 'recording'
      ? baseHeight * (0.3 + audioLevel * 0.7 + Math.sin(Date.now() / 100 + i) * 0.2)
      : baseHeight * 0.3;
    return Math.max(0.1, Math.min(1, animatedHeight));
  });

  // Permission request screen - rendered via portal to document.body
  if (permissionState === 'checking' || permissionState === 'prompt' || permissionState === 'denied') {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={handleClose} />
        <div className="relative w-full h-full sm:w-[90vw] sm:h-auto sm:max-w-md sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:shadow-2xl sm:border sm:border-slate-700/50 flex flex-col items-center justify-center p-6 sm:p-8">

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <FiX size={20} />
          </button>

          {permissionState === 'checking' ? (
            <>
              {/* Loading spinner */}
              <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-purple-500 animate-spin mb-6" />
              <p className="text-white text-lg">Checking permissions...</p>
            </>
          ) : permissionState === 'denied' ? (
            <>
              {/* Denied state */}
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <FiX className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-3 text-center">Permission Denied</h3>
              <p className="text-slate-400 text-center mb-6 max-w-xs">
                {permissionError || 'Camera and microphone access is required to record.'}
              </p>
              <p className="text-slate-500 text-sm text-center mb-6">
                Please enable permissions in your browser settings and try again.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={requestPermissions}
                  className="px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all"
                >
                  Try Again
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Prompt state - ask for permission */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mb-6">
                {mode === 'video' ? (
                  <FiVideo className="w-12 h-12 text-purple-400" />
                ) : mode === 'screen' ? (
                  <FiMonitor className="w-12 h-12 text-purple-400" />
                ) : (
                  <FiMic className="w-12 h-12 text-purple-400" />
                )}
              </div>
              <h3 className="text-white text-xl font-bold mb-3 text-center">
                {mode === 'video' ? 'Camera & Microphone Access' : mode === 'screen' ? 'Screen Sharing' : 'Microphone Access'}
              </h3>
              <p className="text-slate-400 text-center mb-8 max-w-xs">
                {mode === 'video'
                  ? 'Allow access to your camera and microphone to record videos.'
                  : mode === 'screen'
                  ? 'Select a window, tab, or your entire screen to share.'
                  : 'Allow access to your microphone to record audio.'}
              </p>
              <button
                onClick={requestPermissions}
                className="w-full max-w-xs px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
              >
                {mode === 'screen' ? 'Share Screen' : 'Allow Access'}
              </button>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // Main recorder UI - rendered via portal to document.body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={recordingState === 'idle' ? handleClose : undefined}
      />

      {/* Main Container - Responsive sizing */}
      <div className="relative w-full h-full sm:w-[90vw] sm:h-[85vh] sm:max-w-4xl sm:max-h-[700px] sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:shadow-2xl sm:border sm:border-slate-700/50 flex flex-col">

        {/* Header */}
        <div className="relative z-20 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-black/60 to-transparent">
          <button
            onClick={handleClose}
            aria-label="Close recorder"
            className="p-3 sm:p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white min-w-[48px] min-h-[48px] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <FiX size={22} />
          </button>

          {/* Recording indicator and timer */}
          {recordingState !== 'idle' && (
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10">
              {recordingState === 'recording' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              {recordingState === 'paused' && (
                <div className="w-3 h-3 rounded-sm bg-yellow-500" />
              )}
              <span className="text-white font-mono text-lg font-medium tracking-wider">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}

          {/* Camera switch - only for video camera mode in idle/recording state (not screen mode) */}
          {mode === 'video' && (recordingState === 'idle' || recordingState === 'recording') && (
            <button
              onClick={switchCamera}
              aria-label="Switch camera"
              className="p-3 sm:p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white min-w-[48px] min-h-[48px] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 hover:rotate-180"
            >
              <FiRefreshCw size={22} />
            </button>
          )}

          {/* Placeholder for alignment when no camera switch */}
          {(mode === 'audio' || mode === 'screen' || recordingState === 'preview') && (
            <div className="w-12" />
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {(mode === 'video' || mode === 'screen') ? (
            recordingState === 'preview' && previewUrl ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black p-4">
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  loop
                  className="w-auto h-auto max-w-full max-h-full rounded-lg sm:rounded-2xl"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ transform: mode === 'video' && facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                {/* Camera/Screen overlay gradient */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Recording frame indicator */}
                {recordingState === 'recording' && (
                  <div className={`absolute inset-4 sm:inset-8 border-2 ${mode === 'screen' ? 'border-blue-500/50' : 'border-red-500/50'} rounded-2xl pointer-events-none animate-pulse`} />
                )}
              </div>
            )
          ) : (
            /* Audio Recording UI */
            <div className="flex flex-col items-center justify-center gap-8 p-8 w-full">
              {/* Microphone Icon with animated rings */}
              <div className="relative">
                {recordingState === 'recording' && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 animate-ping"
                         style={{ animationDuration: '1.5s' }} />
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-10 animate-ping"
                         style={{ animationDuration: '2s' }} />
                  </>
                )}
                <div className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-500 ${
                  recordingState === 'recording'
                    ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/50'
                    : recordingState === 'preview'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50'
                      : 'bg-gradient-to-br from-slate-700 to-slate-800'
                }`}>
                  {recordingState === 'preview' ? (
                    <FiVolume2 size={48} className="text-white" />
                  ) : (
                    <FiMic size={48} className="text-white" />
                  )}
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className="flex items-end justify-center gap-1 h-20 sm:h-24 w-full max-w-md px-4">
                {waveformBars.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1.5 sm:w-2 rounded-full transition-all duration-100 ${
                      recordingState === 'recording'
                        ? 'bg-gradient-to-t from-purple-500 to-pink-400'
                        : recordingState === 'preview'
                          ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                          : 'bg-slate-600'
                    }`}
                    style={{
                      height: `${height * 100}%`,
                      opacity: recordingState === 'idle' ? 0.5 : 1
                    }}
                  />
                ))}
              </div>

              {/* Audio preview player */}
              {recordingState === 'preview' && previewUrl && (
                <div className="w-full max-w-sm">
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full h-12 rounded-xl"
                    style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                  />
                </div>
              )}

              {/* Mode label */}
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
                {recordingState === 'recording' ? 'Recording Audio...' :
                 recordingState === 'paused' ? 'Paused' :
                 recordingState === 'preview' ? 'Preview Recording' :
                 'Ready to Record'}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="relative z-20 p-6 sm:p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            {recordingState === 'idle' && (
              <button
                onClick={startRecording}
                aria-label="Start recording"
                className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-4 border-white/80 group-hover:border-white transition-colors" />
                {/* Inner button */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50 group-hover:shadow-red-500/70 transition-shadow" />
              </button>
            )}

            {(recordingState === 'recording' || recordingState === 'paused') && (
              <>
                <button
                  onClick={togglePause}
                  aria-label={recordingState === 'paused' ? 'Resume' : 'Pause'}
                  className="p-4 sm:p-5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/10"
                >
                  {recordingState === 'paused' ? <FiPlay size={28} /> : <FiPause size={28} />}
                </button>

                <button
                  onClick={stopRecording}
                  aria-label="Stop recording"
                  className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/80 group-hover:border-white transition-colors" />
                  {/* Stop icon */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50" />
                </button>
              </>
            )}

            {recordingState === 'preview' && (
              <>
                <button
                  onClick={retryRecording}
                  aria-label="Retry"
                  className="p-4 sm:p-5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white min-w-[56px] min-h-[56px] sm:min-w-[64px] sm:min-h-[64px] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-white/10"
                >
                  <FiRefreshCw size={28} />
                </button>

                <button
                  onClick={saveRecording}
                  disabled={uploading}
                  aria-label="Save recording"
                  className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-green-400/80 group-hover:border-green-400 transition-colors" />
                  {/* Inner button */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/50 group-hover:shadow-green-500/70 flex items-center justify-center transition-shadow">
                    {uploading ? (
                      <div className="relative w-8 h-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="16" fill="none" stroke="white" strokeWidth="3"
                            strokeDasharray={`${uploadProgress} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <FiUpload className="absolute inset-0 m-auto text-white" size={16} />
                      </div>
                    ) : (
                      <FiCheck size={32} className="text-white" />
                    )}
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Mode indicator */}
          <div className="flex justify-center mt-5">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              {mode === 'video' ? <FiVideo size={16} className="text-slate-400" /> : mode === 'screen' ? <FiMonitor size={16} className="text-slate-400" /> : <FiMic size={16} className="text-slate-400" />}
              <span className="text-slate-400 text-sm font-medium">
                {mode === 'video' ? 'Video' : mode === 'screen' ? 'Screen Recording' : 'Audio'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

