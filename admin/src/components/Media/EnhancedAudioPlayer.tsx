/**
 * Enhanced Audio Player Component
 * Beautiful audio player with multiple skins, waveform visualization,
 * playlist support, and animated cover art
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2, FiVolumeX,
  FiShuffle, FiRepeat, FiList, FiHeart, FiMoreHorizontal, FiMusic,
  FiChevronUp, FiChevronDown
} from 'react-icons/fi';

// Audio track interface
export interface AudioTrack {
  id: string;
  src: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverImage?: string;
}

// Player skin types
export type PlayerSkin = 'modern' | 'minimal' | 'retro' | 'glassmorphic' | 'neon';

// Player props
export interface EnhancedAudioPlayerProps {
  tracks: AudioTrack[];
  initialTrackIndex?: number;
  skin?: PlayerSkin;
  autoPlay?: boolean;
  showPlaylist?: boolean;
  showVisualization?: boolean;
  showVinylAnimation?: boolean;
  onTrackChange?: (track: AudioTrack, index: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
}

// Format time helper
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Color schemes for skins
const SKIN_COLORS = {
  modern: {
    bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    surface: 'bg-slate-800/60',
    accent: 'from-blue-500 to-purple-500',
    accentSolid: 'bg-blue-500',
    text: 'text-white',
    textMuted: 'text-slate-400',
    border: 'border-slate-700/50',
  },
  minimal: {
    bg: 'bg-white dark:bg-slate-900',
    surface: 'bg-slate-100 dark:bg-slate-800',
    accent: 'from-slate-700 to-slate-900',
    accentSolid: 'bg-slate-800 dark:bg-white',
    text: 'text-slate-900 dark:text-white',
    textMuted: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
  retro: {
    bg: 'bg-gradient-to-br from-amber-900 via-orange-900 to-amber-950',
    surface: 'bg-amber-800/40',
    accent: 'from-orange-400 to-amber-500',
    accentSolid: 'bg-orange-500',
    text: 'text-amber-50',
    textMuted: 'text-amber-300/70',
    border: 'border-amber-700/50',
  },
  glassmorphic: {
    bg: 'bg-white/10 backdrop-blur-xl',
    surface: 'bg-white/5 backdrop-blur-md',
    accent: 'from-pink-500 to-violet-500',
    accentSolid: 'bg-pink-500',
    text: 'text-white',
    textMuted: 'text-white/60',
    border: 'border-white/20',
  },
  neon: {
    bg: 'bg-black',
    surface: 'bg-slate-900',
    accent: 'from-cyan-400 to-fuchsia-500',
    accentSolid: 'bg-cyan-400',
    text: 'text-white',
    textMuted: 'text-cyan-300/70',
    border: 'border-cyan-500/30',
  },
};

export default function EnhancedAudioPlayer({
  tracks,
  initialTrackIndex = 0,
  skin = 'modern',
  autoPlay = false,
  showPlaylist = true,
  showVisualization = true,
  showVinylAnimation = true,
  onTrackChange,
  onPlayStateChange,
  className = '',
}: EnhancedAudioPlayerProps) {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceConnectedRef = useRef(false);

  // State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialTrackIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(showPlaylist);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current track
  const currentTrack = useMemo(() => tracks[currentTrackIndex] || tracks[0], [tracks, currentTrackIndex]);
  const colors = SKIN_COLORS[skin];

  // Shuffle order
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

  useEffect(() => {
    if (isShuffled) {
      const order = tracks.map((_, i) => i).sort(() => Math.random() - 0.5);
      setShuffleOrder(order);
    }
  }, [isShuffled, tracks.length]);

  // Initialize audio context for visualization
  const initAudioContext = useCallback(() => {
    if (!audioRef.current || sourceConnectedRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioRef.current);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceConnectedRef.current = true;
    } catch (err) {
      console.warn('Failed to initialize audio context:', err);
    }
  }, []);

  // Draw waveform/spectrum visualization
  const drawVisualization = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) return;
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Create gradient based on skin
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (skin === 'neon') {
          gradient.addColorStop(0, '#22d3ee');
          gradient.addColorStop(0.5, '#a855f7');
          gradient.addColorStop(1, '#ec4899');
        } else if (skin === 'retro') {
          gradient.addColorStop(0, '#f97316');
          gradient.addColorStop(1, '#fbbf24');
        } else {
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#8b5cf6');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  }, [isPlaying, skin]);

  // Play/Pause toggle
  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (!audioContextRef.current) {
        initAudioContext();
      }

      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        drawVisualization();
      }
      setIsPlaying(!isPlaying);
      onPlayStateChange?.(!isPlaying);
    } catch (err) {
      setError('Failed to play audio');
      console.error('Playback error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isPlaying, initAudioContext, drawVisualization, onPlayStateChange]);

  // Track navigation
  const playTrack = useCallback((index: number) => {
    if (index < 0 || index >= tracks.length) return;
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    onTrackChange?.(tracks[index], index);
  }, [tracks, onTrackChange]);

  const playNext = useCallback(() => {
    if (isShuffled && shuffleOrder.length > 0) {
      const currentShuffleIndex = shuffleOrder.indexOf(currentTrackIndex);
      const nextShuffleIndex = (currentShuffleIndex + 1) % shuffleOrder.length;
      playTrack(shuffleOrder[nextShuffleIndex]);
    } else {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      playTrack(nextIndex);
    }
  }, [currentTrackIndex, isShuffled, shuffleOrder, tracks.length, playTrack]);

  const playPrevious = useCallback(() => {
    if (currentTime > 3) {
      // Restart current track if more than 3 seconds in
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }

    if (isShuffled && shuffleOrder.length > 0) {
      const currentShuffleIndex = shuffleOrder.indexOf(currentTrackIndex);
      const prevShuffleIndex = (currentShuffleIndex - 1 + shuffleOrder.length) % shuffleOrder.length;
      playTrack(shuffleOrder[prevShuffleIndex]);
    } else {
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
      playTrack(prevIndex);
    }
  }, [currentTime, currentTrackIndex, isShuffled, shuffleOrder, tracks.length, playTrack]);

  // Volume controls
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume;
    if (newVolume > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  // Toggle repeat mode
  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all' || currentTrackIndex < tracks.length - 1) {
        playNext();
      } else {
        setIsPlaying(false);
        onPlayStateChange?.(false);
      }
    };
    const handleError = () => setError('Failed to load audio');
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [repeatMode, currentTrackIndex, tracks.length, playNext, onPlayStateChange]);

  // Auto-play on track change
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrackIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Progress percentage for styling
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-2xl overflow-hidden ${className}`}>
      {/* Main player section */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Album Art with vinyl animation */}
          <div className="relative flex-shrink-0 mx-auto md:mx-0">
            <div className={`
              relative w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden
              ${showVinylAnimation && isPlaying ? 'animate-spin-slow' : ''}
              shadow-2xl
            `}>
              {currentTrack.coverImage ? (
                <img
                  src={currentTrack.coverImage}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${colors.accent} flex items-center justify-center`}>
                  <FiMusic className="text-white/80" size={48} />
                </div>
              )}

              {/* Vinyl record overlay effect */}
              {showVinylAnimation && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className={`
                    absolute inset-2 rounded-full border-4 border-black/20
                    ${isPlaying ? 'animate-pulse' : ''}
                  `}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/5 to-transparent" />
                  </div>
                </div>
              )}
            </div>

            {/* Equalizer bars overlay */}
            {showVisualization && isPlaying && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 ${colors.accentSolid} rounded-full animate-equalizer`}
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Track info and controls */}
          <div className="flex-1 flex flex-col justify-center text-center md:text-left">
            {/* Track info */}
            <div className="mb-4">
              <h3 className={`text-lg md:text-xl font-bold ${colors.text} truncate`}>
                {currentTrack.title}
              </h3>
              <p className={`${colors.textMuted} text-sm truncate`}>
                {currentTrack.artist}
                {currentTrack.album && <span> • {currentTrack.album}</span>}
              </p>
            </div>

            {/* Waveform visualization */}
            {showVisualization && (
              <div className="relative h-12 mb-4 rounded-lg overflow-hidden bg-black/20">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={48}
                  className="w-full h-full"
                />
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-end justify-around px-2">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 ${colors.accentSolid} rounded-full opacity-40`}
                        style={{ height: `${20 + Math.random() * 60}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Progress bar */}
            <div className="mb-4">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--tw-gradient-from) ${progress}%, rgba(255,255,255,0.1) ${progress}%)`,
                  '--tw-gradient-from': skin === 'neon' ? '#22d3ee' : skin === 'retro' ? '#f97316' : '#3b82f6',
                } as React.CSSProperties}
                aria-label="Seek audio"
              />
              <div className={`flex justify-between mt-1 text-xs ${colors.textMuted}`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4">
              {/* Shuffle */}
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`p-2 rounded-full transition-all ${
                  isShuffled ? colors.accentSolid + ' text-white' : colors.textMuted + ' hover:' + colors.text
                }`}
                aria-label="Toggle shuffle"
              >
                <FiShuffle size={18} />
              </button>

              {/* Previous */}
              <button
                onClick={playPrevious}
                className={`p-2 rounded-full transition-all ${colors.textMuted} hover:${colors.text}`}
                aria-label="Previous track"
              >
                <FiSkipBack size={24} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center
                  bg-gradient-to-r ${colors.accent} text-white
                  shadow-lg hover:scale-105 transition-all
                  ${isLoading ? 'animate-pulse' : ''}
                `}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <FiPause size={24} />
                ) : (
                  <FiPlay size={24} className="ml-1" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                className={`p-2 rounded-full transition-all ${colors.textMuted} hover:${colors.text}`}
                aria-label="Next track"
              >
                <FiSkipForward size={24} />
              </button>

              {/* Repeat */}
              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-full transition-all relative ${
                  repeatMode !== 'none' ? colors.accentSolid + ' text-white' : colors.textMuted + ' hover:' + colors.text
                }`}
                aria-label="Toggle repeat"
              >
                <FiRepeat size={18} />
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-white text-black w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    1
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Volume control */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-all ${colors.textMuted} hover:${colors.text}`}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1.5 rounded-full appearance-none cursor-pointer rotate-0"
              style={{
                background: `linear-gradient(to right, var(--tw-gradient-from) ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
                '--tw-gradient-from': skin === 'neon' ? '#22d3ee' : skin === 'retro' ? '#f97316' : '#3b82f6',
              } as React.CSSProperties}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Playlist section */}
      {tracks.length > 1 && (
        <div className={`border-t ${colors.border}`}>
          {/* Playlist toggle */}
          <button
            onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 ${colors.surface} ${colors.text} hover:opacity-80 transition-all`}
            aria-expanded={isPlaylistOpen}
            aria-label="Toggle playlist"
          >
            <div className="flex items-center gap-2">
              <FiList size={18} />
              <span className="text-sm font-medium">
                Playlist ({tracks.length} tracks)
              </span>
            </div>
            {isPlaylistOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
          </button>

          {/* Playlist items */}
          {isPlaylistOpen && (
            <div className="max-h-64 overflow-y-auto">
              {tracks.map((track, index) => (
                <button
                  key={track.id}
                  onClick={() => playTrack(index)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 transition-all
                    ${index === currentTrackIndex
                      ? `${colors.surface} border-l-2 border-l-blue-500`
                      : `hover:${colors.surface}`
                    }
                  `}
                >
                  {/* Track number or playing indicator */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === currentTrackIndex ? `bg-gradient-to-r ${colors.accent}` : colors.surface
                  }`}>
                    {index === currentTrackIndex && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-4">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-white rounded-full animate-equalizer"
                            style={{ height: '100%', animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className={`text-xs ${colors.textMuted}`}>{index + 1}</span>
                    )}
                  </div>

                  {/* Track info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-medium ${colors.text} truncate`}>{track.title}</p>
                    <p className={`text-xs ${colors.textMuted} truncate`}>{track.artist}</p>
                  </div>

                  {/* Duration */}
                  <span className={`text-xs ${colors.textMuted}`}>
                    {track.duration ? formatTime(track.duration) : '--:--'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Custom styles for animations */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-equalizer {
          animation: equalizer 0.5s ease-in-out infinite;
          transform-origin: bottom;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
