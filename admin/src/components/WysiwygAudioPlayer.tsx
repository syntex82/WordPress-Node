/**
 * WYSIWYG Audio Player Component
 * Beautiful audio player with album art, waveform visualization, and modern controls
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi';

interface WysiwygAudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  coverImage?: string;
  themeColors?: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
}

export default function WysiwygAudioPlayer({
  src,
  title = 'Audio Track',
  artist = 'Unknown Artist',
  coverImage,
  themeColors = {
    primary: '#3b82f6',
    background: '#1a1a2e',
    surface: '#16213e',
    text: '#ffffff',
    textMuted: '#94a3b8',
  },
}: WysiwygAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);

  // Format time as mm:ss
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialize audio context and analyser
  const initAudioContext = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioRef.current);

    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  }, []);

  // Draw waveform visualization
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Gradient from primary color to lighter version
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, themeColors.primary);
        gradient.addColorStop(1, adjustColor(themeColors.primary, 40));

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }, [themeColors.primary]);

  // Adjust color brightness
  const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Play/Pause toggle
  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!audioContextRef.current) {
      initAudioContext();
    }

    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current!);
    } else {
      audioRef.current.play();
      drawWaveform();
    }
    setIsPlaying(!isPlaying);
  };

  // Volume toggle
  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Update time display
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current!);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      className="audio-player-container"
      style={{
        background: `linear-gradient(135deg, ${themeColors.surface} 0%, ${themeColors.background} 100%)`,
        borderRadius: 16,
        padding: 20,
        maxWidth: 400,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Album Art & Info */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            background: coverImage
              ? `url(${coverImage}) center/cover`
              : `linear-gradient(135deg, ${themeColors.primary} 0%, ${adjustColor(themeColors.primary, -40)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          {!coverImage && (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ margin: 0, color: themeColors.text, fontSize: 16, fontWeight: 600 }}>{title}</h4>
          <p style={{ margin: '4px 0 0', color: themeColors.textMuted, fontSize: 14 }}>{artist}</p>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div style={{ marginBottom: 16, height: 60, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={360}
          height={60}
          style={{ width: '100%', height: '100%', borderRadius: 8 }}
        />
        {!isPlaying && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: 10 + Math.random() * 30,
                    background: themeColors.primary,
                    borderRadius: 2,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: 4,
            appearance: 'none',
            background: `linear-gradient(to right, ${themeColors.primary} ${(currentTime / duration) * 100}%, ${themeColors.surface} ${(currentTime / duration) * 100}%)`,
            borderRadius: 2,
            cursor: 'pointer',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 12, color: themeColors.textMuted }}>{formatTime(currentTime)}</span>
          <span style={{ fontSize: 12, color: themeColors.textMuted }}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Play Button */}
        <button
          onClick={togglePlay}
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: themeColors.primary,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px ${themeColors.primary}50`,
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isPlaying ? <FiPause size={24} color="white" /> : <FiPlay size={24} color="white" style={{ marginLeft: 2 }} />}
        </button>

        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleMute}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            {isMuted ? <FiVolumeX size={20} color={themeColors.textMuted} /> : <FiVolume2 size={20} color={themeColors.textMuted} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{
              width: 80,
              height: 4,
              appearance: 'none',
              background: `linear-gradient(to right, ${themeColors.primary} ${volume * 100}%, ${themeColors.surface} ${volume * 100}%)`,
              borderRadius: 2,
              cursor: 'pointer',
            }}
          />
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
    </div>
  );
}
