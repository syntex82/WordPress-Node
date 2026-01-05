/**
 * PostMediaGallery Component
 * Displays media attachments in timeline posts with gallery layout and lightbox
 */

import { useState } from 'react';
import { FiX, FiPlay, FiChevronLeft, FiChevronRight, FiMaximize2 } from 'react-icons/fi';

interface MediaItem {
  id?: string;
  type: 'IMAGE' | 'VIDEO' | 'GIF';
  url: string;
  thumbnail?: string;
  altText?: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface PostMediaGalleryProps {
  media: MediaItem[];
  className?: string;
}

export default function PostMediaGallery({ media, className = '' }: PostMediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

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

  const renderMedia = (item: MediaItem, index: number, inLightbox = false) => {
    const isVideo = item.type === 'VIDEO';

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

    // Video file
    if (isVideo) {
      return (
        <div className="relative w-full h-full">
          {inLightbox ? (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-w-full max-h-[80vh]"
            />
          ) : (
            <>
              <video
                src={item.url}
                className="w-full h-full object-cover"
                poster={item.thumbnail}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <FiPlay className="w-6 h-6 text-gray-800 ml-1" />
                </div>
              </div>
              {item.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
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
        className={inLightbox ? 'max-w-full max-h-[80vh] object-contain' : 'w-full h-full object-cover'}
        onClick={() => !inLightbox && openLightbox(index)}
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

  // Get aspect ratio class based on media count and screen size
  const getAspectClass = (index: number) => {
    if (media.length === 1) {
      // Single image: larger aspect ratio for better mobile viewing
      return 'aspect-[4/3] sm:aspect-video';
    }
    if (media.length === 2) {
      // Two images: taller on mobile when stacked
      return 'aspect-[4/3] sm:aspect-square';
    }
    if (media.length === 3 && index === 0) {
      // First of three: spans full width on mobile
      return 'aspect-[16/9] sm:aspect-square sm:row-span-2';
    }
    // Default square for grids
    return 'aspect-square';
  };

  return (
    <>
      <div className={`grid ${getGridClass()} gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl overflow-hidden ${className}`}>
        {media.slice(0, 4).map((item, index) => (
          <div
            key={item.id || index}
            onClick={() => openLightbox(index)}
            className={`relative cursor-pointer overflow-hidden ${getAspectClass(index)}
              ${media.length === 3 && index === 0 ? 'col-span-full sm:col-span-1 sm:row-span-2' : ''}
              hover:opacity-95 transition-opacity`}
          >
            {renderMedia(item, index)}
            {index === 3 && media.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xl sm:text-2xl font-bold">+{media.length - 4}</span>
              </div>
            )}
            {/* Expand icon for single images on mobile */}
            {media.length === 1 && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-1.5 sm:p-2 bg-black/50 rounded-full opacity-70 hover:opacity-100 transition-opacity">
                <FiMaximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox - Enhanced for mobile */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4"
          onClick={closeLightbox}
        >
          {/* Close button - larger touch target on mobile */}
          <button
            onClick={closeLightbox}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-2 text-white/80 hover:text-white z-10 bg-black/30 rounded-full"
          >
            <FiX className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>

          {/* Navigation - positioned for mobile touch */}
          {media.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/80 hover:text-white bg-black/40 sm:bg-black/30 rounded-full z-10"
              >
                <FiChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-white/80 hover:text-white bg-black/40 sm:bg-black/30 rounded-full z-10"
              >
                <FiChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </>
          )}

          {/* Content - full width on mobile */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-full h-full max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] sm:max-h-[90vh]"
          >
            {renderMedia(media[lightboxIndex], lightboxIndex, true)}
          </div>

          {/* Counter - better visibility on mobile */}
          {media.length > 1 && (
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-xs sm:text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {media.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
