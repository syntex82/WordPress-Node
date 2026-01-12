/**
 * MediaSelector Component
 * Beautiful, reusable media selector for Theme Designer blocks
 * Supports image, video, audio, and gallery selection with modern UI
 * Now with drag-and-drop upload support
 */
import { useState, useCallback } from 'react';
import { FiImage, FiVideo, FiMusic, FiUpload, FiX, FiPlay, FiEdit2, FiGrid, FiExternalLink } from 'react-icons/fi';
import MediaPickerModal from '../MediaPickerModal';
import { mediaApi } from '../../services/api';
import toast from 'react-hot-toast';

// Media item type from the API
export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  url?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export type MediaType = 'image' | 'video' | 'audio' | 'gallery';

// ============ MediaSelector Props ============
interface MediaSelectorProps {
  type: MediaType;
  value?: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  showUrlInput?: boolean;
  className?: string;
}

// ============ Media Preview Component ============
function MediaPreview({ 
  type, 
  src, 
  onRemove, 
  onEdit 
}: { 
  type: MediaType; 
  src: string; 
  onRemove: () => void;
  onEdit: () => void;
}) {
  const isVideo = type === 'video';
  const isAudio = type === 'audio';
  const isImage = type === 'image';

  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
      {/* Preview */}
      {isImage && (
        <img 
          src={src} 
          alt="Selected media" 
          className="w-full h-32 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTUtNS00IDQtMi0yLTcgNyIvPjwvc3ZnPg==';
          }}
        />
      )}
      {isVideo && (
        <div className="w-full h-32 bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FiPlay className="text-white ml-1" size={24} />
          </div>
          <span className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded">
            {src.split('/').pop()?.slice(0, 20)}...
          </span>
        </div>
      )}
      {isAudio && (
        <div className="w-full h-32 bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex flex-col items-center justify-center gap-2 p-4">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <FiMusic className="text-white" size={20} />
          </div>
          <span className="text-xs text-white/80 truncate max-w-full">
            {src.split('/').pop() || 'Audio file'}
          </span>
        </div>
      )}

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={onEdit}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
          title="Change media"
        >
          <FiEdit2 className="text-white" size={16} />
        </button>
        <button
          onClick={onRemove}
          className="p-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg backdrop-blur-sm transition-colors"
          title="Remove"
        >
          <FiX className="text-white" size={16} />
        </button>
      </div>
    </div>
  );
}

// ============ Empty State Placeholder with Drag-and-Drop ============
function EmptyMediaPlaceholder({
  type,
  onClick,
  onDrop,
  isUploading = false,
}: {
  type: MediaType;
  onClick: () => void;
  onDrop?: (file: File) => void;
  isUploading?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const icons = {
    image: FiImage,
    video: FiVideo,
    audio: FiMusic,
    gallery: FiGrid,
  };
  const Icon = icons[type];

  const labels = {
    image: 'Select Image',
    video: 'Select Video',
    audio: 'Select Audio',
    gallery: 'Select Images',
  };

  const acceptedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4'],
    gallery: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => acceptedTypes[type].includes(file.type));

    if (validFile && onDrop) {
      onDrop(validFile);
    } else if (files.length > 0) {
      // Show error for invalid file type
      const fileType = files[0].type || 'unknown';
      const expectedTypes = type === 'gallery' ? 'images' : type;
      toast.error(`Invalid file type: ${fileType}. Please select ${expectedTypes}.`);
    }
  };

  return (
    <button
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all group ${
        isDragging
          ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
          : 'border-gray-600 hover:border-blue-500 hover:bg-gray-800/50'
      }`}
      disabled={isUploading}
    >
      {isUploading ? (
        <>
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-400">Uploading...</span>
        </>
      ) : (
        <>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-500/20' : 'bg-gray-700 group-hover:bg-blue-500/20'
          }`}>
            {isDragging ? (
              <FiUpload className="text-blue-400" size={22} />
            ) : (
              <Icon className="text-gray-400 group-hover:text-blue-400" size={22} />
            )}
          </div>
          <span className={`text-sm transition-colors ${
            isDragging ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'
          }`}>
            {isDragging ? 'Drop to upload' : labels[type]}
          </span>
          <span className="text-xs text-gray-500">
            or drag & drop
          </span>
        </>
      )}
    </button>
  );
}

// ============ Gallery Preview ============
function GalleryPreview({ 
  images, 
  onEdit, 
  onRemove 
}: { 
  images: string[]; 
  onEdit: () => void;
  onRemove: (index: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {images.slice(0, 6).map((src, index) => (
          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800">
            <img src={src} alt={`Gallery item ${index + 1}`} className="w-full h-full object-cover" />
            <button
              onClick={() => onRemove(index)}
              className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FiX className="text-white" size={12} />
            </button>
          </div>
        ))}
      </div>
      {images.length > 6 && (
        <p className="text-xs text-gray-400 text-center">+{images.length - 6} more images</p>
      )}
      <button
        onClick={onEdit}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
      >
        <FiEdit2 size={14} /> Manage Gallery
      </button>
    </div>
  );
}

// ============ Main MediaSelector Component ============
export default function MediaSelector({
  type,
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  showUrlInput = true,
  className = '',
}: MediaSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Normalize value to array for gallery
  const values = type === 'gallery'
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : [];
  const singleValue = typeof value === 'string' ? value : '';

  const handleSelect = useCallback((media: MediaItem) => {
    const url = media.path || media.url || '';
    if (type === 'gallery' && multiple) {
      onChange([...values, url]);
    } else {
      onChange(url);
    }
    setShowPicker(false);
  }, [type, multiple, values, onChange]);

  const handleRemove = useCallback((index?: number) => {
    if (type === 'gallery' && typeof index === 'number') {
      const newValues = values.filter((_, i) => i !== index);
      onChange(newValues.length > 0 ? newValues : null);
    } else {
      onChange(null);
    }
  }, [type, values, onChange]);

  const handleUrlChange = useCallback((url: string) => {
    if (type === 'gallery' && multiple) {
      onChange([...values, url]);
    } else {
      onChange(url);
    }
  }, [type, multiple, values, onChange]);

  // Handle drag-and-drop file upload
  const handleFileDrop = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const response = await mediaApi.upload(file);
      const media = response.data;
      const url = media.path || media.url || '';

      if (type === 'gallery' && multiple) {
        onChange([...values, url]);
      } else {
        onChange(url);
      }
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [type, multiple, values, onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}

      {/* Preview or Empty State */}
      {type === 'gallery' ? (
        values.length > 0 ? (
          <GalleryPreview
            images={values}
            onEdit={() => setShowPicker(true)}
            onRemove={handleRemove}
          />
        ) : (
          <EmptyMediaPlaceholder
            type={type}
            onClick={() => setShowPicker(true)}
            onDrop={handleFileDrop}
            isUploading={isUploading}
          />
        )
      ) : singleValue ? (
        <MediaPreview
          type={type}
          src={singleValue}
          onEdit={() => setShowPicker(true)}
          onRemove={() => handleRemove()}
        />
      ) : (
        <EmptyMediaPlaceholder
          type={type}
          onClick={() => setShowPicker(true)}
          onDrop={handleFileDrop}
          isUploading={isUploading}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPicker(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl text-sm font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
        >
          <FiUpload size={16} />
          {singleValue || values.length > 0 ? 'Change' : 'Select'} from Library
        </button>
        {showUrlInput && (
          <button
            onClick={() => setShowUrlField(!showUrlField)}
            className={`p-2.5 rounded-xl border transition-colors ${showUrlField ? 'bg-gray-700 border-gray-600' : 'bg-transparent border-gray-700 hover:border-gray-600'}`}
            title="Enter URL manually"
          >
            <FiExternalLink size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* URL Input Field */}
      {showUrlField && (
        <div className="space-y-2">
          <input
            type="url"
            value={type === 'gallery' ? '' : singleValue}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder || `Enter ${type} URL...`}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <p className="text-xs text-gray-500">
            Paste a direct URL to the {type} file
          </p>
        </div>
      )}

      {/* Media Picker Modal */}
      {showPicker && (
        <MediaPickerModal
          type={type}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

// ============ Specialized Media Selectors ============
export function ImageSelector(props: Omit<MediaSelectorProps, 'type'>) {
  return <MediaSelector {...props} type="image" />;
}

export function VideoSelector(props: Omit<MediaSelectorProps, 'type'>) {
  return <MediaSelector {...props} type="video" />;
}

export function AudioSelector(props: Omit<MediaSelectorProps, 'type'>) {
  return <MediaSelector {...props} type="audio" />;
}

export function GallerySelector(props: Omit<MediaSelectorProps, 'type'>) {
  return <MediaSelector {...props} type="gallery" multiple />;
}

