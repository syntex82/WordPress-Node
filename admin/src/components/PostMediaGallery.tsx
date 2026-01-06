/**
 * PostMediaGallery Component
 * Displays media attachments in timeline posts with TikTok-inspired gallery layout and lightbox
 * Features: Large media display, vertical video support, audio player, immersive viewing
 */

import { useState, useRef } from 'react';
import { FiX, FiPlay, FiChevronLeft, FiChevronRight, FiMaximize2, FiVolume2, FiVolumeX, FiLink, FiExternalLink } from 'react-icons/fi';

interface MediaItem {
  id?: string;
  type: 'IMAGE' | 'VIDEO' | 'GIF' | 'AUDIO' | 'LINK';
  url: string;
  thumbnail?: string;
  altText?: string;
  width?: number;
  height?: number;
  duration?: number;
  // Link preview metadata
  linkTitle?: string;
  linkDescription?: string;
  linkSiteName?: string;
}

interface PostMediaGalleryProps {
  media: MediaItem[];
  className?: string;
  /** Enable TikTok-style immersive mode for single videos */
  immersive?: boolean;
}

export default function PostMediaGallery({ media, className = '', immersive = true }: PostMediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<number, boolean>>({});
  const [isMuted, setIsMuted] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  if (!media || media.length === 0) return null;

  // Check if this is a single video/audio for immersive display
  const isSingleVideo = media.length === 1 && media[0].type === 'VIDEO';
  const isSingleAudio = media.length === 1 && media[0].type === 'AUDIO';
  const isVerticalVideo = isSingleVideo && media[0].height && media[0].width && media[0].height > media[0].width;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % media.length);
    }
  };

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + media.length) % media.length);
    }
  };

  // Check if URL is external (YouTube, Vimeo, etc.)
  const isYouTube = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = (url: string) => url.includes('vimeo.com');

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  // Toggle video play/pause
  const toggleVideoPlay = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(prev => ({ ...prev, [index]: true }));
      } else {
        video.pause();
        setIsPlaying(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  // Toggle video mute
  const toggleMute = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(prev => ({ ...prev, [index]: video.muted }));
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMedia = (item: MediaItem, index: number, inLightbox = false) => {
    const isVideo = item.type === 'VIDEO';
    const isAudio = item.type === 'AUDIO';
    const isLink = item.type === 'LINK';
    const isVertical = item.height && item.width && item.height > item.width;

    // Link preview card
    if (isLink) {
      const hostname = (() => {
        try { return new URL(item.url).hostname; } catch { return item.url; }
      })();

      return (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block w-full h-full bg-slate-800 hover:bg-slate-750 transition-colors"
        >
          {/* Link preview image */}
          {item.thumbnail ? (
            <div className="relative h-32 sm:h-40 w-full">
              <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-20 sm:h-24 w-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <FiLink className="w-8 h-8 text-white/80" />
            </div>
          )}

          {/* Link info */}
          <div className="p-3 sm:p-4">
            <h4 className="font-medium text-sm sm:text-base text-white line-clamp-2 mb-1">
              {item.linkTitle || hostname}
            </h4>
            {item.linkDescription && (
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-2">
                {item.linkDescription}
              </p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FiExternalLink className="w-3.5 h-3.5" />
              <span className="truncate">{item.linkSiteName || hostname}</span>
            </div>
          </div>
        </a>
      );
    }

    // YouTube embed
    if (isYouTube(item.url)) {
      const videoId = getYouTubeId(item.url);
      return (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className={inLightbox ? 'max-w-full max-h-full' : 'w-full h-full'}
          style={inLightbox ? { width: '80vw', height: '45vw', maxHeight: '80vh' } : {}}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      );
    }

    // Vimeo embed
    if (isVimeo(item.url)) {
      const videoId = getVimeoId(item.url);
      return (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className={inLightbox ? 'max-w-full max-h-full' : 'w-full h-full'}
          style={inLightbox ? { width: '80vw', height: '45vw', maxHeight: '80vh' } : {}}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
        />
      );
    }

    // Audio file - render audio player
    if (isAudio) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4 min-h-[120px]">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <FiVolume2 className="w-8 h-8 text-white" />
          </div>
          <audio
            src={item.url}
            controls
            className="w-full max-w-[280px]"
            onClick={(e) => e.stopPropagation()}
          />
          {item.duration && (
            <span className="text-white/80 text-sm mt-2">{formatDuration(item.duration)}</span>
          )}
        </div>
      );
    }

    // Video file - TikTok-style inline playback for single videos
    if (isVideo) {
      const showInlineControls = immersive && isSingleVideo && !inLightbox;

      return (
        <div className="relative w-full h-full bg-black">
          {inLightbox ? (
            <video
              src={item.url}
              controls
              playsInline
              className={isVertical
                ? 'max-h-[90vh] max-w-[60vw] sm:max-w-[50vw]'
                : 'max-w-[95vw] max-h-[85vh] sm:max-w-[90vw] sm:max-h-[90vh]'}
            />
          ) : showInlineControls ? (
            // TikTok-style inline video with tap-to-play
            <>
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                src={item.url}
                className={`w-full h-full ${isVertical ? 'object-contain' : 'object-cover'}`}
                poster={item.thumbnail}
                playsInline
                muted={isMuted[index] ?? true}
                loop
                onClick={(e) => toggleVideoPlay(index, e)}
                onEnded={() => setIsPlaying(prev => ({ ...prev, [index]: false }))}
              />
              {/* Play/Pause overlay */}
              {!isPlaying[index] && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                  onClick={(e) => toggleVideoPlay(index, e)}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <FiPlay className="w-8 h-8 sm:w-10 sm:h-10 text-gray-800 ml-1" />
                  </div>
                </div>
              )}
              {/* Mute button */}
              <button
                onClick={(e) => toggleMute(index, e)}
                className="absolute bottom-3 right-3 p-2.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
              >
                {isMuted[index] ?? true ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
              </button>
              {/* Duration badge */}
              {item.duration && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(item.duration)}
                </div>
              )}
            </>
          ) : (
            // Thumbnail mode for grid/multiple videos
            <>
              <video
                src={item.url}
                className="w-full h-full object-cover pointer-events-none"
                poster={item.thumbnail}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                <div className="w-14 h-14 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <FiPlay className="w-7 h-7 sm:w-6 sm:h-6 text-gray-800 ml-1" />
                </div>
              </div>
              {item.duration && (
                <div className="absolute bottom-2 right-10 sm:right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  {formatDuration(item.duration)}
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // Image (including GIF)
    return (
      <img
        src={item.url}
        alt={item.altText || ''}
        className={inLightbox ? 'max-w-[95vw] max-h-[85vh] sm:max-w-[90vw] sm:max-h-[90vh] object-contain' : 'w-full h-full object-cover pointer-events-none'}
      />
    );
  };

  // Grid layout based on number of media items - enhanced for mobile
  const getGridClass = () => {
    switch (media.length) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 sm:grid-cols-2'; // Stack on mobile, side by side on larger
      case 3: return 'grid-cols-1 sm:grid-cols-2';
      case 4: return 'grid-cols-2';
      default: return 'grid-cols-2';
    }
  };

  // Get aspect ratio class based on media count, type, and dimensions
  // Mobile-first: taller aspect ratios for more immersive experience
  const getAspectClass = (index: number) => {
    const item = media[index];

    // Audio: compact player
    if (item.type === 'AUDIO') {
      return 'aspect-[3/1] sm:aspect-[4/1]';
    }

    // Link: no fixed aspect ratio, let content determine height
    if (item.type === 'LINK') {
      return ''; // Link cards have their own internal layout
    }

    if (media.length === 1) {
      // Single vertical video: TikTok-style tall aspect ratio - nearly full screen on mobile
      if (item.type === 'VIDEO' && item.height && item.width && item.height > item.width) {
        return 'aspect-[9/16] max-h-[85vh] sm:max-h-[80vh]';
      }
      // Single horizontal video: taller on mobile for immersive feel
      if (item.type === 'VIDEO') {
        return 'aspect-[4/3] sm:aspect-video';
      }
      // Single image: square on mobile (Instagram-like), wider on desktop
      return 'aspect-square sm:aspect-[4/3]';
    }
    if (media.length === 2) {
      // Two images: taller on mobile when stacked
      return 'aspect-[4/3] sm:aspect-square';
    }
    if (media.length === 3 && index === 0) {
      // First of three: spans full width on mobile
      return 'aspect-[4/3] sm:aspect-square sm:row-span-2';
    }
    // Default square for grids
    return 'aspect-square';
  };

  // Check if item should have inline playback (no lightbox click)
  const hasInlinePlayback = (item: MediaItem) => {
    return immersive && isSingleVideo && item.type === 'VIDEO';
  };

  // Check if item is audio or link (no lightbox needed)
  const isAudioItem = (item: MediaItem) => item.type === 'AUDIO';
  const isLinkItem = (item: MediaItem) => item.type === 'LINK';

  return (
    <>
      <div className={`grid ${getGridClass()} gap-0.5 sm:gap-1.5 rounded-none sm:rounded-2xl overflow-hidden ${className}`}>
        {media.slice(0, 4).map((item, index) => {
          const skipLightbox = hasInlinePlayback(item) || isAudioItem(item) || isLinkItem(item);

          return (
            <div
              key={item.id || index}
              onClick={(e) => {
                e.stopPropagation();
                if (!skipLightbox) openLightbox(index);
              }}
              onTouchEnd={(e) => { e.stopPropagation(); }}
              className={`relative ${skipLightbox ? '' : 'cursor-pointer'} overflow-hidden ${getAspectClass(index)}
                ${media.length === 3 && index === 0 ? 'col-span-full sm:col-span-1 sm:row-span-2' : ''}
                hover:opacity-95 transition-opacity touch-manipulation`}
            >
              {renderMedia(item, index)}
              {index === 3 && media.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xl sm:text-2xl font-bold">+{media.length - 4}</span>
                </div>
              )}
              {/* Expand icon - only show for items that open lightbox */}
              {!skipLightbox && (
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-2 sm:p-2.5 bg-black/60 rounded-full pointer-events-none">
                  <FiMaximize2 className="w-4 h-4 sm:w-4 sm:h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox - Enhanced for mobile */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={closeLightbox}
          style={{ touchAction: 'none' }}
        >
          {/* Close button - larger touch target on mobile */}
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 text-white hover:text-white/80 z-20 bg-black/50 rounded-full touch-manipulation"
          >
            <FiX className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>

          {/* Navigation - positioned for mobile touch */}
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:text-white/80 bg-black/50 rounded-full z-20 touch-manipulation"
              >
                <FiChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:text-white/80 bg-black/50 rounded-full z-20 touch-manipulation"
              >
                <FiChevronRight className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {/* Content - full screen on mobile */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-full h-full p-4"
          >
            {renderMedia(media[lightboxIndex], lightboxIndex, true)}
          </div>

          {/* Counter - better visibility on mobile */}
          {media.length > 1 && (
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 text-white text-sm sm:text-base bg-black/60 px-4 py-2 rounded-full z-20">
              {lightboxIndex + 1} / {media.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
