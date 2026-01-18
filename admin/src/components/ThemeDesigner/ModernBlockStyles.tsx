/**
 * Modern Block Styles
 * Enhanced, polished UI components for Theme Designer blocks
 * Features: Beautiful gradients, smooth transitions, loading states, and modern design patterns
 */
import React, { useState, useCallback } from 'react';
import { FiImage, FiPlay, FiLoader, FiAlertCircle, FiCheck } from 'react-icons/fi';

// ============ Modern Image Component with Loading State ============
interface ModernImageProps {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio?: 'auto' | 'square' | 'video' | 'portrait' | 'wide';
  objectFit?: 'cover' | 'contain' | 'fill';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  overlay?: boolean;
  hoverZoom?: boolean;
}

export function ModernImage({
  src,
  alt = '',
  className = '',
  aspectRatio = 'auto',
  objectFit = 'cover',
  rounded = 'lg',
  overlay = false,
  hoverZoom = false,
}: ModernImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    auto: '',
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  if (!src) {
    return (
      <div className={`${aspectClasses[aspectRatio]} ${roundedClasses[rounded]} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <FiImage className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-sm text-gray-500">No image selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${roundedClasses[rounded]} ${className} ${hoverZoom ? 'group' : ''}`}>
      {/* Loading Skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center p-4">
            <FiAlertCircle className="mx-auto text-red-400 mb-2" size={24} />
            <p className="text-sm text-gray-500">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-transform duration-500 ${objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : 'object-fill'} ${hoverZoom ? 'group-hover:scale-110' : ''} ${isLoading || hasError ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Optional Overlay */}
      {overlay && !hasError && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      )}
    </div>
  );
}

// ============ Modern Button Component ============
interface ModernButtonProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'gradient' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  secondaryColor?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function ModernButton({
  children,
  variant = 'solid',
  size = 'md',
  color = '#3b82f6',
  secondaryColor = '#8b5cf6',
  rounded = 'lg',
  className = '',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
}: ModernButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
    xl: 'px-10 py-5 text-xl gap-3',
  };

  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontWeight: 600,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    switch (variant) {
      case 'solid':
        return { ...base, background: color, color: 'white' };
      case 'outline':
        return { ...base, background: 'transparent', color, border: `2px solid ${color}` };
      case 'gradient':
        return { ...base, background: `linear-gradient(135deg, ${color}, ${secondaryColor})`, color: 'white' };
      case 'ghost':
        return { ...base, background: 'transparent', color };
      case 'glow':
        return { ...base, background: color, color: 'white', boxShadow: `0 0 20px ${color}50, 0 0 40px ${color}30` };
      default:
        return { ...base, background: color, color: 'white' };
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center ${sizeClasses[size]} ${roundedClasses[rounded]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105 hover:shadow-lg active:scale-95'} ${className}`}
      style={getStyles()}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <FiLoader className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}

// ============ Modern Card Component ============
interface ModernCardProps {
  image?: string;
  title: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'gradient' | 'minimal';
  colors: {
    surface: string;
    heading: string;
    text: string;
    textMuted: string;
    primary: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  borderRadius?: string;
  className?: string;
}

export function ModernCard({
  image,
  title,
  description,
  buttonText,
  buttonUrl,
  variant = 'default',
  colors,
  typography,
  borderRadius = '12px',
  className = '',
}: ModernCardProps) {
  const getCardStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
    };

    switch (variant) {
      case 'elevated':
        return { ...base, background: colors.surface, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' };
      case 'glass':
        return { ...base, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' };
      case 'gradient':
        return { ...base, background: `linear-gradient(135deg, ${colors.surface}, ${colors.primary}10)` };
      case 'minimal':
        return { ...base, background: 'transparent', border: `1px solid ${colors.border}` };
      default:
        return { ...base, background: colors.surface, border: `1px solid ${colors.border}` };
    }
  };

  return (
    <div
      className={`group cursor-pointer hover:shadow-xl hover:-translate-y-1 ${className}`}
      style={getCardStyle()}
    >
      {/* Image with overlay */}
      {image && (
        <div className="relative overflow-hidden aspect-[16/10]">
          <ModernImage
            src={image}
            alt={title}
            aspectRatio="auto"
            hoverZoom
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h3
          className="text-lg font-semibold mb-2 line-clamp-2"
          style={{ color: colors.heading, fontFamily: typography.headingFont }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="text-sm mb-4 line-clamp-3"
            style={{ color: colors.textMuted, fontFamily: typography.bodyFont, lineHeight: 1.6 }}
          >
            {description}
          </p>
        )}
        {buttonText && (
          <a
            href={buttonUrl || '#'}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:gap-3"
            style={{ background: colors.primary, color: 'white', borderRadius }}
          >
            {buttonText}
            <span className="text-xs">→</span>
          </a>
        )}
      </div>
    </div>
  );
}

// ============ Modern Hero Section ============
interface ModernHeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  overlay?: number;
  alignment?: 'left' | 'center' | 'right';
  style?: 'default' | 'split' | 'minimal' | 'gradient' | 'glass';
  colors: {
    primary: string;
    secondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: number;
  };
  borderRadius?: string;
}

export function ModernHero({
  title,
  subtitle,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  backgroundImage,
  backgroundVideo,
  overlay = 0.4,
  alignment = 'center',
  style = 'default',
  colors,
  typography,
  borderRadius,
}: ModernHeroProps) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div
      className="relative min-h-[480px] flex items-center justify-center overflow-hidden"
      style={{ borderRadius }}
    >
      {/* Background Image/Video */}
      {backgroundVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      ) : backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      )}

      {/* Overlay with gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,${overlay * 1.2}) 0%, rgba(0,0,0,${overlay * 0.8}) 50%, rgba(0,0,0,${overlay}) 100%)`,
        }}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-1/2 h-full bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-1/2 h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className={`relative z-10 max-w-4xl mx-auto px-8 py-20 flex flex-col ${alignmentClasses[alignment]}`}>
        <h1
          className="text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight"
          style={{
            color: 'white',
            fontFamily: typography.headingFont,
            fontWeight: typography.headingWeight,
            textShadow: '0 2px 20px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl"
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontFamily: typography.bodyFont,
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          {ctaText && (
            <a
              href={ctaUrl || '#'}
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: 'white',
                boxShadow: `0 10px 30px ${colors.primary}40`,
              }}
            >
              {ctaText}
              <span>→</span>
            </a>
          )}
          {secondaryCtaText && (
            <a
              href={secondaryCtaUrl || '#'}
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-xl border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all"
              style={{ color: 'white' }}
            >
              {secondaryCtaText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Modern Testimonial Component ============
interface ModernTestimonialProps {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
  variant?: 'default' | 'card' | 'minimal' | 'featured';
  colors: {
    surface: string;
    heading: string;
    text: string;
    textMuted: string;
    primary: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  borderRadius?: string;
}

export function ModernTestimonial({
  quote,
  author,
  role,
  company,
  avatar,
  rating = 5,
  variant = 'default',
  colors,
  typography,
  borderRadius = '16px',
}: ModernTestimonialProps) {
  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius,
      transition: 'all 0.3s ease',
    };

    switch (variant) {
      case 'card':
        return { ...base, background: colors.surface, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '32px' };
      case 'minimal':
        return { ...base, background: 'transparent', borderLeft: `4px solid ${colors.primary}`, paddingLeft: '24px' };
      case 'featured':
        return { ...base, background: `linear-gradient(135deg, ${colors.primary}10, ${colors.primary}05)`, border: `1px solid ${colors.primary}20`, padding: '40px' };
      default:
        return { ...base, background: colors.surface, border: `1px solid ${colors.border}`, padding: '32px' };
    }
  };

  return (
    <div style={getContainerStyle()}>
      {/* Rating Stars */}
      {rating > 0 && (
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </span>
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote
        className="text-lg md:text-xl mb-6 leading-relaxed"
        style={{
          color: colors.text,
          fontFamily: typography.bodyFont,
          fontStyle: 'italic',
        }}
      >
        "{quote}"
      </blockquote>

      {/* Author Info */}
      <div className="flex items-center gap-4">
        {avatar && (
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white shadow-lg">
            <ModernImage src={avatar} alt={author} aspectRatio="square" rounded="full" />
          </div>
        )}
        <div>
          <p
            className="font-semibold"
            style={{ color: colors.heading, fontFamily: typography.headingFont }}
          >
            {author}
          </p>
          {(role || company) && (
            <p
              className="text-sm"
              style={{ color: colors.textMuted, fontFamily: typography.bodyFont }}
            >
              {role}{role && company && ' at '}{company}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Modern Video Player Component ============
interface ModernVideoPlayerProps {
  videoUrl: string;
  posterImage?: string;
  title?: string;
  description?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'wide';
  borderRadius?: string;
  className?: string;
}

export function ModernVideoPlayer({
  videoUrl,
  posterImage,
  title,
  description,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  aspectRatio = 'video',
  borderRadius = '16px',
  className = '',
}: ModernVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [showOverlay, setShowOverlay] = useState(!autoplay);

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[9/16]',
    wide: 'aspect-[21/9]',
  };

  // Check if it's a YouTube or Vimeo URL using URL parsing (prevents bypass attacks)
  const isYouTube = (() => {
    try {
      const h = new URL(videoUrl || '').hostname.toLowerCase();
      return h === 'youtube.com' || h === 'www.youtube.com' || h === 'youtu.be' || h === 'm.youtube.com';
    } catch { return false; }
  })();
  const isVimeo = (() => {
    try {
      const h = new URL(videoUrl || '').hostname.toLowerCase();
      return h === 'vimeo.com' || h === 'www.vimeo.com' || h === 'player.vimeo.com';
    } catch { return false; }
  })();

  const getEmbedUrl = () => {
    if (isYouTube) {
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`;
    }
    if (isVimeo) {
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
      return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&loop=${loop ? 1 : 0}`;
    }
    return videoUrl;
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ borderRadius }}>
      <div className={`relative ${aspectClasses[aspectRatio]} bg-black`}>
        {isYouTube || isVimeo ? (
          <iframe
            src={getEmbedUrl()}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <video
              src={videoUrl}
              poster={posterImage}
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              controls={controls && isPlaying}
              className="absolute inset-0 w-full h-full object-cover"
              onPlay={() => { setIsPlaying(true); setShowOverlay(false); }}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play Button Overlay */}
            {showOverlay && !isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
                onClick={() => {
                  const video = document.querySelector('video');
                  video?.play();
                }}
              >
                {posterImage && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${posterImage})` }}
                  />
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <FiPlay className="text-gray-900 ml-1" size={32} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Title and Description */}
      {(title || description) && (
        <div className="p-4 bg-gray-900">
          {title && <h4 className="text-white font-semibold mb-1">{title}</h4>}
          {description && <p className="text-gray-400 text-sm">{description}</p>}
        </div>
      )}
    </div>
  );
}

// ============ Modern Audio Player Component ============
interface ModernAudioPlayerProps {
  audioUrl: string;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  showWaveform?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  variant?: 'default' | 'minimal' | 'card' | 'full';
  colors: {
    primary: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  borderRadius?: string;
}

export function ModernAudioPlayer({
  audioUrl,
  title = 'Untitled Track',
  artist,
  album,
  albumArt,
  showWaveform = true,
  autoplay = false,
  loop = false,
  variant = 'default',
  colors,
  borderRadius = '16px',
}: ModernAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'minimal':
        return { ...base, background: 'transparent' };
      case 'card':
        return { ...base, background: colors.surface, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' };
      case 'full':
        return { ...base, background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}05)` };
      default:
        return { ...base, background: colors.surface };
    }
  };

  return (
    <div style={getContainerStyle()} className="p-4">
      <div className="flex items-center gap-4">
        {/* Album Art */}
        {albumArt && (
          <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
            <ModernImage src={albumArt} alt={album || title} aspectRatio="square" />
          </div>
        )}

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate" style={{ color: colors.text }}>
            {title}
          </h4>
          {artist && (
            <p className="text-sm truncate" style={{ color: colors.textMuted }}>
              {artist}{album && ` • ${album}`}
            </p>
          )}

          {/* Progress Bar */}
          <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all"
              style={{ width: `${progress}%`, background: colors.primary }}
            />
          </div>
        </div>

        {/* Play Button */}
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: colors.primary }}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <span className="text-white text-lg">⏸</span>
          ) : (
            <FiPlay className="text-white ml-0.5" size={20} />
          )}
        </button>
      </div>

      {/* Hidden Audio Element */}
      <audio
        src={audioUrl}
        autoPlay={autoplay}
        loop={loop}
        onTimeUpdate={(e) => {
          const audio = e.target as HTMLAudioElement;
          setProgress((audio.currentTime / audio.duration) * 100);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}

// ============ CSS Animation for Shimmer Effect ============
// Add this to your global CSS or tailwind config:
// @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
// .animate-shimmer { animation: shimmer 1.5s infinite; background-size: 200% 100%; }

