/**
 * MobileMediaRecorder Component
 * Modern, responsive audio/video recording inspired by TikTok and LinkedIn
 * Works seamlessly across mobile, tablet, and desktop devices
 * Features: beautiful animations, proper aspect ratios, waveform visualization
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FiVideo, FiMic, FiSquare, FiPause, FiPlay, FiX, FiCheck,
  FiRefreshCw, FiVolume2, FiUpload
} from 'react-icons/fi';
import { mediaApi } from '../services/api';
import toast from 'react-hot-toast';

interface MobileMediaRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaCaptured: (media: { type: 'VIDEO' | 'AUDIO'; url: string; thumbnail?: string }) => void;
  mode?: 'video' | 'audio';
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview';

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Initialize camera/microphone
  const initializeMedia = useCallback(async () => {
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
      toast.error('Unable to access camera/microphone. Please check permissions.');
      onClose();
    }
  }, [mode, facingMode, onClose, startAudioMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    if (isOpen) {
      initializeMedia();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isOpen, initializeMedia]);

  // Switch camera
  const switchCamera = async () => {
    triggerHaptic('light');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (isOpen && mode === 'video') {
      initializeMedia();
    }
  }, [facingMode, isOpen, mode, initializeMedia]);

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;
    triggerHaptic('medium');

    chunksRef.current = [];
    const mimeType = mode === 'video'
      ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
         MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4')
      : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
         MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType,
      videoBitsPerSecond: mode === 'video' ? 2500000 : undefined,
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
        type: mode === 'video' ? 'VIDEO' : 'AUDIO',
        url: mediaUrl,
      });

      toast.success(`${mode === 'video' ? 'Video' : 'Audio'} saved successfully!`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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

          {/* Camera switch - only for video in idle/recording state */}
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
          {(mode === 'audio' || recordingState === 'preview') && (
            <div className="w-12" />
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {mode === 'video' ? (
            recordingState === 'preview' && previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  loop
                  className="max-w-full max-h-full object-contain rounded-lg sm:rounded-2xl"
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
                  style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                {/* Camera overlay gradient */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                {/* Recording frame indicator */}
                {recordingState === 'recording' && (
                  <div className="absolute inset-4 sm:inset-8 border-2 border-red-500/50 rounded-2xl pointer-events-none animate-pulse" />
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
              {mode === 'video' ? <FiVideo size={16} className="text-slate-400" /> : <FiMic size={16} className="text-slate-400" />}
              <span className="text-slate-400 text-sm font-medium">
                {mode === 'video' ? 'Video' : 'Audio'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

