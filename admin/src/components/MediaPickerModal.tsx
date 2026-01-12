/**
 * Media Picker Modal
 * Select media from library for insertion into editor
 * Supports preview for audio/video before selection
 * Features beautiful waveform visualization and modern design
 */

import { useEffect, useState, useRef } from 'react';
import { mediaApi } from '../services/api';
import { FiX, FiUpload, FiPlay, FiPause, FiCheck, FiMusic, FiVolume2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface MediaPickerModalProps {
  type: 'image' | 'video' | 'audio' | 'gallery';
  onSelect: (media: any) => void;
  onClose: () => void;
}

// Animated Waveform Component
function AudioWaveform({ isPlaying, color = '#8B5CF6' }: { isPlaying: boolean; color?: string }) {
  const bars = 32;
  return (
    <div className="flex items-end justify-center gap-[2px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20;
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-150"
            style={{
              height: `${baseHeight}%`,
              background: `linear-gradient(to top, ${color}, ${color}88)`,
              animation: isPlaying ? `wave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.02}s`,
              opacity: isPlaying ? 1 : 0.5,
            }}
          />
        );
      })}
      <style>{`
        @keyframes wave {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// Circular Progress Ring
function ProgressRing({ progress, size = 120, strokeWidth = 4, color = '#8B5CF6' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </svg>
  );
}

export default function MediaPickerModal({ type, onSelect, onClose }: MediaPickerModalProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  // Stop playback when selection changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedItem]);

  const fetchMedia = async () => {
    try {
      const response = await mediaApi.getAll();
      let allMedia = response.data.data;

      if (type === 'image') {
        allMedia = allMedia.filter((m: any) => m.mimeType.startsWith('image/'));
      } else if (type === 'video') {
        allMedia = allMedia.filter((m: any) => m.mimeType.startsWith('video/'));
      } else if (type === 'audio') {
        allMedia = allMedia.filter((m: any) => m.mimeType.startsWith('audio/'));
      }

      setMedia(allMedia);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(file => mediaApi.upload(file));

    try {
      await Promise.all(uploadPromises);
      toast.success(`${files.length} file(s) uploaded`);
      fetchMedia();
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleItemClick = (item: any) => {
    if (type === 'image' || type === 'gallery') {
      onSelect(item);
    } else {
      setSelectedItem(item);
    }
  };

  const togglePlayback = () => {
    if (type === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const confirmSelection = () => {
    if (selectedItem) {
      onSelect(selectedItem);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl max-w-5xl w-full p-6 shadow-2xl border border-gray-700/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <FiX size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            {type === 'audio' && <FiMusic className="text-purple-400" />}
            {type === 'video' && <span>🎬</span>}
            {type === 'image' && <span>🖼️</span>}
            Select {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>

          <div className="flex gap-6">
            {/* Left: Media Library */}
            <div className="flex-1">
              {/* Upload Button */}
              <div className="mb-4">
                <label className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-purple-500/25 hover:scale-105">
                  <FiUpload className="mr-2" size={18} />
                  Upload {type}
                  <input
                    type="file"
                    multiple
                    accept={
                      type === 'image' ? 'image/*' :
                      type === 'video' ? 'video/*' :
                      type === 'audio' ? 'audio/*' : '*'
                    }
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-purple-400 mb-4">
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              )}

              {/* Media Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-5xl mb-4 opacity-50">
                    {type === 'audio' ? '🎵' : type === 'video' ? '🎬' : '🖼️'}
                  </div>
                  <p>No {type} files found</p>
                  <p className="text-sm mt-1">Upload some to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                        selectedItem?.id === item.id
                          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900 scale-95'
                          : 'hover:scale-95 hover:ring-2 hover:ring-purple-400/50 hover:ring-offset-2 hover:ring-offset-gray-900'
                      }`}
                    >
                      {item.mimeType.startsWith('image/') ? (
                        <img src={item.path} alt={item.originalName} className="w-full h-24 object-cover" />
                      ) : item.mimeType.startsWith('video/') ? (
                        <div className="w-full h-24 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
                          <span className="text-4xl group-hover:scale-110 transition-transform">🎬</span>
                        </div>
                      ) : item.mimeType.startsWith('audio/') ? (
                        <div className="w-full h-24 bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-30">
                            <div className="flex items-end justify-center gap-[2px] h-full p-2">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 bg-white/60 rounded-full"
                                  style={{ height: `${30 + Math.random() * 50}%` }}
                                />
                              ))}
                            </div>
                          </div>
                          <FiMusic size={28} className="text-white/80 relative z-10 group-hover:scale-110 transition-transform" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-700 flex items-center justify-center">
                          <span className="text-3xl">📄</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white/80 truncate">{item.originalName}</p>
                      </div>
                      {selectedItem?.id === item.id && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <FiCheck size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Preview Panel (for audio/video) */}
            {(type === 'audio' || type === 'video') && (
              <div className="w-96 border-l border-gray-700/50 pl-6">
                <h3 className="text-lg font-semibold mb-4 text-white/80">Preview</h3>

                {selectedItem ? (
                  <div className="space-y-4">
                    {/* Audio Preview Player */}
                    {type === 'audio' && (
                      <div className="relative overflow-hidden rounded-2xl">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent)]" />

                        {/* Floating Orbs */}
                        <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                        <div className="absolute bottom-8 right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

                        <div className="relative p-6">
                          {/* Disc/Album Art */}
                          <div className="flex justify-center mb-6">
                            <div className="relative">
                              <div
                                className={`w-32 h-32 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}
                                style={{ animationDuration: '3s' }}
                              >
                                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <ProgressRing progress={progress} size={128} strokeWidth={3} color="#A78BFA" />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-900 z-10" />
                                {/* Vinyl grooves */}
                                <div className="absolute inset-6 rounded-full border border-gray-600/30" />
                                <div className="absolute inset-10 rounded-full border border-gray-600/20" />
                                <div className="absolute inset-14 rounded-full border border-gray-600/10" />
                              </div>
                              {/* Shine effect */}
                              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                            </div>
                          </div>

                          {/* Waveform Visualization */}
                          <AudioWaveform isPlaying={isPlaying} color="#A78BFA" />

                          {/* Hidden Audio Element */}
                          <audio
                            ref={audioRef}
                            src={selectedItem.path}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            onError={(e) => console.error('Audio load error:', selectedItem.path)}
                            className="hidden"
                          />

                          {/* Progress Bar */}
                          <div
                            className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                            onClick={handleSeek}
                          >
                            <div
                              className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-100"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Time Display */}
                          <div className="flex justify-between text-xs text-white/60 mt-2">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center justify-center gap-4 mt-4">
                            <button
                              onClick={togglePlayback}
                              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                            >
                              {isPlaying ? (
                                <FiPause size={24} className="text-white" />
                              ) : (
                                <FiPlay size={24} className="text-white ml-1" />
                              )}
                            </button>
                          </div>

                          {/* Volume */}
                          <div className="flex items-center justify-center gap-2 mt-4">
                            <FiVolume2 size={16} className="text-white/60" />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={volume}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setVolume(val);
                                if (audioRef.current) audioRef.current.volume = val / 100;
                              }}
                              className="w-24 h-1 rounded-full appearance-none bg-white/20 cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, rgba(167,139,250,0.8) ${volume}%, rgba(255,255,255,0.2) ${volume}%)`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Video Preview Player */}
                    {type === 'video' && (
                      <div className="rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 relative">
                        <video
                          ref={videoRef}
                          src={selectedItem.path}
                          onEnded={() => setIsPlaying(false)}
                          onError={(e) => console.error('Video load error:', selectedItem.path)}
                          className="w-full aspect-video"
                          controls
                        />
                      </div>
                    )}

                    {/* File Info Card */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
                      <p className="font-medium text-white truncate">{selectedItem.originalName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                          {selectedItem.mimeType.split('/')[1]?.toUpperCase()}
                        </span>
                        {selectedItem.size && (
                          <span>{(selectedItem.size / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                      </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                      onClick={confirmSelection}
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-green-500/25 hover:scale-[1.02]"
                    >
                      <FiCheck size={20} />
                      Use This {type === 'audio' ? 'Track' : 'Video'}
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 py-16">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                        {type === 'audio' ? (
                          <FiMusic size={32} className="text-purple-400/50" />
                        ) : (
                          <span className="text-4xl opacity-50">🎬</span>
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-600/30 animate-spin" style={{ animationDuration: '10s' }} />
                    </div>
                    <p className="text-gray-400">Click a {type} file to preview</p>
                    <p className="text-sm text-gray-500 mt-1">Listen before selecting</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


