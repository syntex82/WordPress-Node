/**
 * Inline Editing System for Theme Designer
 * Provides click-to-edit functionality for all content blocks
 * Includes inline text editing, media replacement, and quick settings
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiEdit2, FiCheck, FiX, FiImage, FiVideo, FiMusic,
  FiType, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiBold, FiItalic, FiUnderline, FiLink, FiList,
  FiSettings, FiMaximize, FiMinimize, FiPlay, FiPause,
  FiUpload, FiTrash2, FiCopy, FiMove, FiGrid, FiLayers, FiPlus
} from 'react-icons/fi';
import MediaPickerModal from '../MediaPickerModal';

// ============ Types ============
export type EditableFieldType = 'text' | 'richText' | 'image' | 'video' | 'audio' | 'gallery' | 'link' | 'color' | 'number';

export interface EditableField {
  id: string;
  type: EditableFieldType;
  label: string;
  value: any;
  path: string; // Dot-notation path to the prop, e.g., "props.title"
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
}

export interface InlineEditContext {
  blockId: string;
  isEditing: boolean;
  activeField: string | null;
  setActiveField: (field: string | null) => void;
  updateField: (path: string, value: any) => void;
  startEditing: () => void;
  stopEditing: () => void;
  isDirty: boolean;
}

// ============ Inline Edit Context ============
const InlineEditContext = React.createContext<InlineEditContext | null>(null);

export function useInlineEdit() {
  const context = React.useContext(InlineEditContext);
  if (!context) {
    throw new Error('useInlineEdit must be used within an InlineEditProvider');
  }
  return context;
}

// ============ Inline Edit Provider ============
export function InlineEditProvider({
  blockId,
  children,
  onUpdate,
  initialProps,
}: {
  blockId: string;
  children: React.ReactNode;
  onUpdate: (props: Record<string, any>) => void;
  initialProps: Record<string, any>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [localProps, setLocalProps] = useState(initialProps);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalProps(initialProps);
  }, [initialProps]);

  const updateField = useCallback((path: string, value: any) => {
    const newProps = { ...localProps };
    const keys = path.split('.');
    // Prevent prototype pollution by blocking dangerous keys
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (keys.some(key => dangerousKeys.includes(key))) {
      console.warn('Blocked potentially dangerous property path:', path);
      return;
    }
    let current: any = newProps;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalProps(newProps);
    setIsDirty(true);
    onUpdate(newProps);
  }, [localProps, onUpdate]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setActiveField(null);
  }, []);

  return (
    <InlineEditContext.Provider
      value={{
        blockId,
        isEditing,
        activeField,
        setActiveField,
        updateField,
        startEditing,
        stopEditing,
        isDirty,
      }}
    >
      {children}
    </InlineEditContext.Provider>
  );
}

// ============ Editable Text Component ============
export function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit...',
  multiline = false,
  className = '',
  style = {},
  tag: Tag = 'span',
  maxLength,
  allowFormatting = false,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  maxLength?: number;
  allowFormatting?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [showToolbar, setShowToolbar] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowToolbar(allowFormatting);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsEditing(false);
    setShowToolbar(false);
    if (localValue !== value) {
      onChange(localValue);
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
      setShowToolbar(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="relative inline-block w-full" ref={editRef}>
        {/* Formatting Toolbar */}
        {showToolbar && (
          <div className="absolute -top-10 left-0 flex items-center gap-1 px-2 py-1 bg-gray-900 rounded-lg shadow-xl z-50 border border-gray-700">
            <button type="button" className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Bold">
              <FiBold size={14} />
            </button>
            <button type="button" className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Italic">
              <FiItalic size={14} />
            </button>
            <button type="button" className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Underline">
              <FiUnderline size={14} />
            </button>
            <div className="w-px h-4 bg-gray-700" />
            <button type="button" className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Link">
              <FiLink size={14} />
            </button>
            <div className="w-px h-4 bg-gray-700" />
            <button type="button" onClick={handleBlur} className="p-1.5 bg-green-600 hover:bg-green-700 rounded text-white" title="Done">
              <FiCheck size={14} />
            </button>
          </div>
        )}

        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            className={`w-full bg-blue-500/10 border-2 border-blue-500 rounded-lg px-2 py-1 focus:outline-none resize-none ${className}`}
            style={{ ...style, minHeight: '80px' }}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            maxLength={maxLength}
            className={`w-full bg-blue-500/10 border-2 border-blue-500 rounded-lg px-2 py-1 focus:outline-none ${className}`}
            style={style}
            placeholder={placeholder}
          />
        )}

        {maxLength && (
          <span className="absolute bottom-1 right-2 text-xs text-gray-500">
            {localValue.length}/{maxLength}
          </span>
        )}
      </div>
    );
  }

  return (
    <Tag
      onClick={handleClick}
      className={`cursor-text hover:bg-blue-500/10 hover:outline hover:outline-2 hover:outline-dashed hover:outline-blue-400 rounded transition-all ${className} ${!value ? 'text-gray-500 italic' : ''}`}
      style={style}
      title="Click to edit"
    >
      {value || placeholder}
    </Tag>
  );
}

// ============ Editable Image Component ============
export function EditableImage({
  src,
  alt,
  onChange,
  className = '',
  style = {},
  aspectRatio,
  showOverlay = true,
}: {
  src: string;
  alt?: string;
  onChange: (url: string, alt?: string) => void;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: string;
  showOverlay?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMediaSelect = (media: { path?: string; url?: string; name?: string }) => {
    onChange(media.path || media.url || '', media.name);
    setShowPicker(false);
  };

  return (
    <>
      <div
        className={`relative group cursor-pointer ${className}`}
        style={{ ...style, aspectRatio }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(true);
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-full object-cover"
            style={{ borderRadius: 'inherit' }}
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center min-h-[120px]" style={{ borderRadius: 'inherit' }}>
            <FiImage className="text-gray-500" size={32} />
          </div>
        )}

        {/* Overlay on hover */}
        {showOverlay && (isHovered || !src) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 transition-opacity">
            <button className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm flex items-center gap-2">
              <FiUpload size={16} />
              {src ? 'Replace' : 'Add Image'}
            </button>
            {src && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('', '');
                }}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {showPicker && (
        <MediaPickerModal
          type="image"
          onSelect={handleMediaSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ============ Editable Video Component ============
export function EditableVideo({
  src,
  posterUrl,
  onChange,
  onPosterChange,
  className = '',
  style = {},
  autoplay = false,
  muted = true,
  loop = true,
  controls = true,
}: {
  src: string;
  posterUrl?: string;
  onChange: (url: string) => void;
  onPosterChange?: (url: string) => void;
  className?: string;
  style?: React.CSSProperties;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showPosterPicker, setShowPosterPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect video type using URL parsing for security
  const isYouTube = (() => {
    if (!src) return false;
    try {
      const url = new URL(src);
      const hostname = url.hostname.toLowerCase();
      return hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'youtu.be';
    } catch {
      return false;
    }
  })();
  const isVimeo = (() => {
    if (!src) return false;
    try {
      const url = new URL(src);
      const hostname = url.hostname.toLowerCase();
      return hostname === 'vimeo.com' || hostname === 'www.vimeo.com';
    } catch {
      return false;
    }
  })();
  const isEmbed = isYouTube || isVimeo;

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const getVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleMediaSelect = (media: { path?: string; url?: string }) => {
    onChange(media.path || media.url || '');
    setShowPicker(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <div
        className={`relative group cursor-pointer ${className}`}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {src ? (
          isEmbed ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={
                  isYouTube
                    ? `https://www.youtube.com/embed/${getYouTubeId(src)}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}`
                    : `https://player.vimeo.com/video/${getVimeoId(src)}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}`
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 'inherit' }}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={src}
              poster={posterUrl}
              autoPlay={autoplay}
              muted={muted}
              loop={loop}
              controls={controls && !isHovered}
              className="w-full h-full object-cover"
              style={{ borderRadius: 'inherit' }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )
        ) : (
          <div className="w-full bg-gray-700 flex items-center justify-center min-h-[200px]" style={{ borderRadius: 'inherit' }}>
            <div className="text-center">
              <FiVideo className="text-gray-500 mx-auto mb-2" size={40} />
              <p className="text-gray-400 text-sm">No video selected</p>
            </div>
          </div>
        )}

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(true);
              }}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm flex items-center gap-2"
            >
              <FiUpload size={16} />
              {src ? 'Replace' : 'Add Video'}
            </button>
            {src && !isEmbed && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                >
                  {isPlaying ? <FiPause size={16} /> : <FiPlay size={16} />}
                </button>
                {onPosterChange && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPosterPicker(true);
                    }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
                    title="Set poster image"
                  >
                    <FiImage size={16} />
                  </button>
                )}
              </>
            )}
            {src && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        )}

        {/* Video type badge */}
        {src && isEmbed && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
            {isYouTube ? 'YouTube' : 'Vimeo'}
          </div>
        )}
      </div>

      {showPicker && (
        <MediaPickerModal
          type="video"
          onSelect={handleMediaSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showPosterPicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            onPosterChange?.(media.path || media.url || '');
            setShowPosterPicker(false);
          }}
          onClose={() => setShowPosterPicker(false)}
        />
      )}
    </>
  );
}

// ============ Editable Audio Component ============
export function EditableAudio({
  src,
  albumArt,
  title,
  artist,
  onChange,
  onAlbumArtChange,
  onTitleChange,
  onArtistChange,
  className = '',
  style = {},
}: {
  src: string;
  albumArt?: string;
  title?: string;
  artist?: string;
  onChange: (url: string) => void;
  onAlbumArtChange?: (url: string) => void;
  onTitleChange?: (title: string) => void;
  onArtistChange?: (artist: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showArtPicker, setShowArtPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMediaSelect = (media: { path?: string; url?: string }) => {
    onChange(media.path || media.url || '');
    setShowPicker(false);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <div
        className={`relative group cursor-pointer ${className}`}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Audio player content */}
        <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
          {/* Album Art */}
          <div
            className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowArtPicker(true);
            }}
          >
            {albumArt ? (
              <img src={albumArt} alt="Album Art" className="w-full h-full object-cover" />
            ) : (
              <FiMusic size={24} className="text-gray-500" />
            )}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            {onTitleChange ? (
              <EditableText
                value={title || ''}
                onChange={onTitleChange}
                placeholder="Track Title"
                className="font-semibold text-white block truncate"
              />
            ) : (
              <p className="font-semibold text-white truncate">{title || 'Untitled Track'}</p>
            )}
            {onArtistChange ? (
              <EditableText
                value={artist || ''}
                onChange={onArtistChange}
                placeholder="Artist Name"
                className="text-sm text-gray-400 block truncate"
              />
            ) : (
              <p className="text-sm text-gray-400 truncate">{artist || 'Unknown Artist'}</p>
            )}
          </div>

          {/* Play Button */}
          {src && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full text-white"
            >
              {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
            </button>
          )}
        </div>

        {/* Hidden Audio Element */}
        {src && (
          <audio
            ref={audioRef}
            src={src}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 rounded-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker(true);
              }}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm flex items-center gap-2"
            >
              <FiUpload size={16} />
              {src ? 'Replace Audio' : 'Add Audio'}
            </button>
            {src && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {showPicker && (
        <MediaPickerModal
          type="audio"
          onSelect={handleMediaSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showArtPicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            onAlbumArtChange?.(media.path || media.url || '');
            setShowArtPicker(false);
          }}
          onClose={() => setShowArtPicker(false)}
        />
      )}
    </>
  );
}

// ============ Editable Gallery Component ============
export function EditableGallery({
  images,
  onChange,
  columns = 3,
  className = '',
  style = {},
}: {
  images: Array<{ url: string; alt?: string; caption?: string }>;
  onChange: (images: Array<{ url: string; alt?: string; caption?: string }>) => void;
  columns?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddImage = (media: { path?: string; url?: string; name?: string }) => {
    onChange([...images, { url: media.path || media.url || '', alt: media.name }]);
    setShowPicker(false);
  };

  const handleRemoveImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleReplaceImage = (index: number, media: { path?: string; url?: string; name?: string }) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], url: media.path || media.url || '', alt: media.name };
    onChange(newImages);
    setEditingIndex(null);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onChange(newImages);
  };

  return (
    <>
      <div
        className={`grid gap-3 ${className}`}
        style={{ ...style, gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group aspect-square bg-gray-700 rounded-lg overflow-hidden"
          >
            <img
              src={image.url}
              alt={image.alt || ''}
              className="w-full h-full object-cover"
            />

            {/* Image controls */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <button
                onClick={() => setEditingIndex(index)}
                className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                title="Replace"
              >
                <FiImage size={16} />
              </button>
              <button
                onClick={() => handleRemoveImage(index)}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                title="Remove"
              >
                <FiTrash2 size={16} />
              </button>
              <button className="p-2 bg-gray-700 rounded-lg text-white cursor-move" title="Drag to reorder">
                <FiMove size={16} />
              </button>
            </div>

            {/* Index badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-xs text-white">
              {index + 1}
            </div>
          </div>
        ))}

        {/* Add Image Button */}
        <div
          onClick={() => setShowPicker(true)}
          className="aspect-square bg-gray-800 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <FiPlus size={24} className="text-gray-500" />
          <span className="text-xs text-gray-500">Add Image</span>
        </div>
      </div>

      {showPicker && (
        <MediaPickerModal
          type="image"
          onSelect={handleAddImage}
          onClose={() => setShowPicker(false)}
        />
      )}

      {editingIndex !== null && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => handleReplaceImage(editingIndex, media)}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </>
  );
}

// ============ Quick Edit Toolbar ============
export function QuickEditToolbar({
  position = 'top',
  onEdit,
  onSettings,
  onDuplicate,
  onDelete,
  isVisible = true,
  blockType,
}: {
  position?: 'top' | 'bottom' | 'floating';
  onEdit?: () => void;
  onSettings?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  isVisible?: boolean;
  blockType?: string;
}) {
  if (!isVisible) return null;

  const positionClasses = {
    top: 'absolute -top-10 left-1/2 -translate-x-1/2',
    bottom: 'absolute -bottom-10 left-1/2 -translate-x-1/2',
    floating: 'fixed top-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`${positionClasses[position]} flex items-center gap-1 px-2 py-1.5 bg-gray-900 rounded-lg shadow-xl z-50 border border-gray-700`}>
      {blockType && (
        <span className="px-2 py-0.5 bg-blue-600 rounded text-xs text-white font-medium mr-2">
          {blockType}
        </span>
      )}
      {onEdit && (
        <button onClick={onEdit} className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Edit Content">
          <FiEdit2 size={14} />
        </button>
      )}
      {onSettings && (
        <button onClick={onSettings} className="p-1.5 hover:bg-gray-700 rounded text-gray-300" title="Settings">
          <FiSettings size={14} />
        </button>
      )}
      <div className="w-px h-4 bg-gray-700" />
      {onDuplicate && (
        <button onClick={onDuplicate} className="p-1.5 hover:bg-blue-600 rounded text-gray-300" title="Duplicate">
          <FiCopy size={14} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="p-1.5 hover:bg-red-600 rounded text-gray-300" title="Delete">
          <FiTrash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ============ Block Edit Wrapper ============
export function BlockEditWrapper({
  children,
  block,
  onUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  isSelected = false,
  showToolbar = true,
  className = '',
}: {
  children: React.ReactNode;
  block: { id: string; type: string; props: Record<string, any> };
  onUpdate: (props: Record<string, any>) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  showToolbar?: boolean;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <InlineEditProvider
      blockId={block.id}
      onUpdate={onUpdate}
      initialProps={block.props}
    >
      <div
        className={`relative group transition-all ${
          isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
            : isHovered
            ? 'ring-2 ring-blue-400/50 ring-offset-1 ring-offset-gray-900'
            : ''
        } ${className}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Quick Edit Toolbar */}
        {showToolbar && (isSelected || isHovered) && (
          <QuickEditToolbar
            blockType={block.type}
            onEdit={() => setIsEditing(true)}
            onSettings={onSelect}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}

        {/* Block Content */}
        {children}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
        )}
      </div>
    </InlineEditProvider>
  );
}

// ============ Inline Color Picker ============
export function InlineColorPicker({
  value,
  onChange,
  label,
  presetColors,
}: {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presetColors?: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultPresets = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  ];

  const colors = presetColors || defaultPresets;

  return (
    <div className="relative">
      {label && <label className="text-xs text-gray-400 block mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-lg border-2 border-gray-600 cursor-pointer"
          style={{ backgroundColor: value }}
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          placeholder="#000000"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className={`w-6 h-6 rounded border ${value === color ? 'border-blue-500' : 'border-gray-600'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 cursor-pointer rounded"
          />
        </div>
      )}
    </div>
  );
}

// ============ Inline Number Slider ============
export function InlineNumberSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  suffix = '',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
}) {
  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-400">{label}</label>
          <span className="text-xs text-blue-400">{value}{suffix}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

// ============ Inline Select ============
export function InlineSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label?: string;
}) {
  return (
    <div>
      {label && <label className="text-xs text-gray-400 block mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============ Inline Toggle ============
export function InlineToggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-700'} relative`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-5' : 'left-0.5'}`}
        />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}

// ============ Inline Quick Actions Panel ============
export function InlineQuickActions({
  actions,
}: {
  actions: Array<{
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'danger';
  }>;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const variantClasses = {
          default: 'hover:bg-gray-700 text-gray-300',
          primary: 'hover:bg-blue-600 text-blue-400',
          danger: 'hover:bg-red-600 text-red-400',
        };
        return (
          <button
            key={index}
            onClick={action.onClick}
            className={`p-2 rounded transition-colors ${variantClasses[action.variant || 'default']}`}
            title={action.label}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

// ============ Export All Components ============
export {
  FiEdit2, FiCheck, FiX, FiImage, FiVideo, FiMusic,
  FiType, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiBold, FiItalic, FiUnderline, FiLink, FiList,
  FiSettings, FiMaximize, FiMinimize, FiPlay, FiPause,
  FiUpload, FiTrash2, FiCopy, FiMove, FiGrid, FiLayers,
  FiPlus
} from 'react-icons/fi';
