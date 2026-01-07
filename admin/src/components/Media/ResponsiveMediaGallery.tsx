/**
 * Responsive Media Gallery Component
 * A fully responsive gallery for images, videos, and audio
 * Features: Drag-and-drop reordering, touch-friendly controls, adaptive layouts
 */

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FiImage, FiVideo, FiMusic, FiTrash2, FiPlay, FiPause,
  FiMaximize2, FiEye, FiDownload, FiMenu, FiX,
  FiChevronLeft, FiChevronRight
} from 'react-icons/fi';

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  src: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
}

export interface ResponsiveMediaGalleryProps {
  items: MediaItem[];
  onReorder?: (items: MediaItem[]) => void;
  onDelete?: (id: string) => void;
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  columns?: { sm: number; md: number; lg: number; xl: number };
  aspectRatio?: 'square' | 'video' | 'auto';
  gap?: number;
  showActions?: boolean;
  draggable?: boolean;
  className?: string;
}

// Type icons
const TYPE_ICONS = {
  image: FiImage,
  video: FiVideo,
  audio: FiMusic,
};

// Sortable media item
interface SortableMediaItemProps {
  item: MediaItem;
  isSelected: boolean;
  isDragging: boolean;
  aspectRatio: string;
  showActions: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onPreview: () => void;
}

function SortableMediaItem({
  item, isSelected, isDragging, aspectRatio, showActions, onSelect, onDelete, onPreview
}: SortableMediaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' 
    : aspectRatio === 'video' ? 'aspect-video' 
    : '';

  const Icon = TYPE_ICONS[item.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative rounded-xl overflow-hidden transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
        ${isHovered ? 'shadow-xl shadow-black/30 z-10' : 'shadow-lg shadow-black/20'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Media content */}
      <div className={`relative bg-slate-800 ${aspectClass}`}>
        {item.type === 'image' && (
          <img
            src={item.thumbnail || item.src}
            alt={item.title || 'Gallery image'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {item.type === 'video' && (
          <>
            <img
              src={item.thumbnail || '/video-placeholder.jpg'}
              alt={item.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <FiPlay className="text-white ml-1" size={24} />
              </div>
            </div>
          </>
        )}

        {item.type === 'audio' && (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col items-center justify-center p-4">
            <FiMusic className="text-white/80 mb-2" size={32} />
            <p className="text-white text-sm font-medium text-center truncate w-full">
              {item.title || 'Audio'}
            </p>
            {item.duration && (
              <p className="text-white/60 text-xs mt-1">
                {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
              </p>
            )}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/50 backdrop-blur-sm">
          <Icon className="text-white" size={14} />
        </div>

        {/* Selection checkbox */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Hover overlay with actions */}
        {showActions && (
          <div className={`
            absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
            flex items-end justify-between p-3 transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            <div className="flex gap-2">
              {/* Drag handle */}
              <button
                {...attributes}
                {...listeners}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white cursor-grab active:cursor-grabbing touch-manipulation"
                aria-label="Drag to reorder"
              >
                <FiMenu size={16} />
              </button>

              {/* Preview */}
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                aria-label="Preview"
              >
                <FiEye size={16} />
              </button>
            </div>

            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white"
                aria-label="Delete"
              >
                <FiTrash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white text-sm font-medium truncate">{item.title}</p>
        </div>
      )}
    </div>
  );
}

export default function ResponsiveMediaGallery({
  items,
  onReorder,
  onDelete,
  onSelect,
  selectable = false,
  selectedIds = new Set(),
  columns = { sm: 2, md: 3, lg: 4, xl: 5 },
  aspectRatio = 'square',
  gap = 4,
  showActions = true,
  draggable = true,
  className = '',
}: ResponsiveMediaGalleryProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedId(null);

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handlePreview = (item: MediaItem, index: number) => {
    setPreviewItem(item);
    setPreviewIndex(index);
  };

  const handlePrevPreview = () => {
    if (previewIndex > 0) {
      setPreviewIndex(previewIndex - 1);
      setPreviewItem(items[previewIndex - 1]);
    }
  };

  const handleNextPreview = () => {
    if (previewIndex < items.length - 1) {
      setPreviewIndex(previewIndex + 1);
      setPreviewItem(items[previewIndex + 1]);
    }
  };

  const draggedItem = draggedId ? items.find(i => i.id === draggedId) : null;

  // Grid column classes
  const gridCols = `grid-cols-${columns.sm} md:grid-cols-${columns.md} lg:grid-cols-${columns.lg} xl:grid-cols-${columns.xl}`;

  if (items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FiImage className="mx-auto text-slate-600 mb-4" size={48} />
        <p className="text-slate-400 mb-2">No media items</p>
        <p className="text-sm text-slate-500">Upload media to see it here</p>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
            <div className={`grid gap-${gap} ${gridCols}`}
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${100/columns.sm}%), 1fr))`
              }}
            >
              {items.map((item, index) => (
                <SortableMediaItem
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  isDragging={draggedId === item.id}
                  aspectRatio={aspectRatio}
                  showActions={showActions}
                  onSelect={() => onSelect?.(item)}
                  onDelete={onDelete ? () => onDelete(item.id) : undefined}
                  onPreview={() => handlePreview(item, index)}
                />
              ))}
            </div>
          </SortableContext>

          {/* Drag overlay */}
          <DragOverlay>
            {draggedItem && (
              <div className="rounded-xl overflow-hidden shadow-2xl ring-2 ring-blue-500 opacity-80">
                {draggedItem.type === 'image' && (
                  <img
                    src={draggedItem.thumbnail || draggedItem.src}
                    alt=""
                    className="w-32 h-32 object-cover"
                  />
                )}
                {draggedItem.type !== 'image' && (
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    {draggedItem.type === 'video' ? <FiVideo size={32} className="text-white" /> : <FiMusic size={32} className="text-white" />}
                  </div>
                )}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Lightbox preview modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setPreviewItem(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            onClick={() => setPreviewItem(null)}
            aria-label="Close preview"
          >
            <FiX size={24} />
          </button>

          {/* Navigation */}
          {previewIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => { e.stopPropagation(); handlePrevPreview(); }}
              aria-label="Previous"
            >
              <FiChevronLeft size={24} />
            </button>
          )}
          {previewIndex < items.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={(e) => { e.stopPropagation(); handleNextPreview(); }}
              aria-label="Next"
            >
              <FiChevronRight size={24} />
            </button>
          )}

          {/* Content */}
          <div className="max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            {previewItem.type === 'image' && (
              <img
                src={previewItem.src}
                alt={previewItem.title || ''}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            )}
            {previewItem.type === 'video' && (
              <video
                src={previewItem.src}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            )}
            {previewItem.type === 'audio' && (
              <div className="bg-slate-800 p-8 rounded-xl text-center">
                <FiMusic className="mx-auto text-blue-400 mb-4" size={64} />
                <p className="text-white text-xl font-bold mb-2">{previewItem.title || 'Audio'}</p>
                <audio src={previewItem.src} controls autoPlay className="w-full mt-4" />
              </div>
            )}

            {/* Info */}
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{previewItem.title}</p>
              <p className="text-slate-400 text-sm">{previewIndex + 1} of {items.length}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

