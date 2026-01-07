/**
 * Drag and Drop Upload Zone Component
 * A beautiful, responsive upload zone with visual feedback for all media types
 * Supports batch uploads, progress tracking, and file validation
 */

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { FiUpload, FiImage, FiMusic, FiVideo, FiFile, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  preview?: string;
}

export interface DragDropUploadZoneProps {
  accept?: 'all' | 'image' | 'audio' | 'video' | 'document';
  multiple?: boolean;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  onUploadComplete?: (results: UploadFile[]) => void;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
}

const ACCEPT_TYPES = {
  all: '*/*',
  image: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
  audio: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac',
  video: 'video/mp4,video/webm,video/ogg,video/quicktime',
  document: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain',
};

const TYPE_ICONS = {
  image: FiImage,
  audio: FiMusic,
  video: FiVideo,
  document: FiFile,
  all: FiUpload,
};

export default function DragDropUploadZone({
  accept = 'all',
  multiple = true,
  maxFileSize = 50,
  maxFiles = 20,
  onFilesSelected,
  onUploadComplete,
  className = '',
  compact = false,
  disabled = false,
}: DragDropUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return { valid: false, error: `File exceeds ${maxFileSize}MB limit` };
    }

    // Check file type
    if (accept !== 'all') {
      const acceptedTypes = ACCEPT_TYPES[accept].split(',');
      if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
        return { valid: false, error: `Invalid file type for ${accept}` };
      }
    }

    return { valid: true };
  }, [accept, maxFileSize]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    const validFiles: File[] = [];
    const newUploadQueue: UploadFile[] = [];

    fileArray.forEach(file => {
      const validation = validateFile(file);
      const uploadFile: UploadFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };

      newUploadQueue.push(uploadFile);
      if (validation.valid) {
        validFiles.push(file);
      }
    });

    setUploadQueue(prev => [...prev, ...newUploadQueue]);
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [maxFiles, validateFile, onFilesSelected]);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    if (disabled) return;

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue(prev => prev.filter(f => f.id !== id));
  };

  const clearQueue = () => {
    uploadQueue.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
    setUploadQueue([]);
  };

  const Icon = TYPE_ICONS[accept];

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_TYPES[accept]}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
        aria-label={`Upload ${accept} files`}
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        aria-label={`Drag and drop ${accept} files here or click to browse`}
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300 ease-out
          border-2 border-dashed rounded-2xl
          ${compact ? 'p-4' : 'p-8 md:p-12'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800/70'
          }
        `}
      >
        {/* Animated background on drag */}
        {isDragging && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 animate-pulse" />
        )}

        <div className={`relative z-10 text-center ${compact ? 'space-y-2' : 'space-y-4'}`}>
          {/* Icon container with animation */}
          <div className={`
            inline-flex items-center justify-center rounded-full transition-all duration-300
            ${compact ? 'w-12 h-12' : 'w-16 h-16 md:w-20 md:h-20'}
            ${isDragging
              ? 'bg-blue-500 scale-110 rotate-12'
              : 'bg-slate-700 group-hover:bg-slate-600'
            }
          `}>
            <Icon
              className={`transition-all duration-300 ${isDragging ? 'text-white' : 'text-blue-400'}`}
              size={compact ? 24 : 32}
            />
          </div>

          {/* Text content */}
          <div>
            <h3 className={`font-semibold text-white transition-colors ${compact ? 'text-base' : 'text-lg md:text-xl'}`}>
              {isDragging ? 'Drop files here!' : 'Drag & drop files'}
            </h3>
            {!compact && (
              <p className="text-slate-400 text-sm md:text-base mt-1">
                or <span className="text-blue-400 hover:text-blue-300 underline">browse</span> to upload
              </p>
            )}
          </div>

          {/* File type info */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-1 bg-slate-700/50 rounded-full">
              {accept === 'all' ? 'All file types' : accept.charAt(0).toUpperCase() + accept.slice(1)}
            </span>
            <span className="px-2 py-1 bg-slate-700/50 rounded-full">Max {maxFileSize}MB</span>
            {multiple && <span className="px-2 py-1 bg-slate-700/50 rounded-full">Up to {maxFiles} files</span>}
          </div>
        </div>
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{uploadQueue.length} file(s) in queue</span>
            <button
              onClick={clearQueue}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-600">
            {uploadQueue.map(item => (
              <div
                key={item.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl transition-all
                  ${item.status === 'error' ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/50'}
                `}
              >
                {/* Preview or icon */}
                {item.preview ? (
                  <img src={item.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <FiFile className="text-slate-400" size={20} />
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    {item.error && <span className="text-red-400 ml-2">{item.error}</span>}
                  </p>
                </div>

                {/* Status icon */}
                <div className="flex items-center gap-2">
                  {item.status === 'success' && <FiCheck className="text-green-400" size={18} />}
                  {item.status === 'error' && <FiAlertCircle className="text-red-400" size={18} />}
                  {item.status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

