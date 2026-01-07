/**
 * Playlist Manager Component
 * Manage audio playlists with drag-and-drop reordering
 * Features: Add, remove, reorder tracks, save/load playlists
 */

import { useState, useCallback, useMemo } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragStartEvent, DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FiMusic, FiTrash2, FiPlus, FiMenu, FiPlay, FiPause,
  FiSave, FiUpload, FiEdit2, FiX, FiCheck, FiMoreHorizontal,
  FiClock, FiDisc
} from 'react-icons/fi';
import { AudioTrack } from './EnhancedAudioPlayer';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  tracks: AudioTrack[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistManagerProps {
  playlist: Playlist;
  onPlaylistChange: (playlist: Playlist) => void;
  onTrackPlay?: (track: AudioTrack, index: number) => void;
  currentPlayingId?: string;
  isPlaying?: boolean;
  className?: string;
}

// Sortable track item component
interface SortableTrackProps {
  track: AudioTrack;
  index: number;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: () => void;
  onRemove: () => void;
  isDragging?: boolean;
}

function SortableTrack({ track, index, isPlaying, isCurrent, onPlay, onRemove, isDragging }: SortableTrackProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-3 p-3 rounded-xl transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${isCurrent ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-800/50 hover:bg-slate-700/50'}
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing touch-manipulation"
        aria-label="Drag to reorder"
      >
        <FiMenu size={18} />
      </button>

      {/* Track number / Play indicator */}
      <button
        onClick={onPlay}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center transition-all
          ${isCurrent 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
            : 'bg-slate-700 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-500'
          }
        `}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-white rounded-full animate-equalizer"
                style={{ height: '100%', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : isCurrent ? (
          <FiPause className="text-white" size={18} />
        ) : (
          <span className="text-slate-400 group-hover:hidden text-sm">{index + 1}</span>
        )}
        {!isCurrent && <FiPlay className="text-white hidden group-hover:block" size={16} />}
      </button>

      {/* Cover image */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
        {track.coverImage ? (
          <img src={track.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700">
            <FiMusic className="text-slate-400" size={16} />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
          {track.title}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {track.artist}
          {track.album && <span className="text-slate-500"> • {track.album}</span>}
        </p>
      </div>

      {/* Duration */}
      <span className="text-xs text-slate-500 flex items-center gap-1">
        <FiClock size={12} />
        {track.duration ? formatDuration(track.duration) : '--:--'}
      </span>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Remove from playlist"
      >
        <FiTrash2 size={16} />
      </button>
    </div>
  );
}

// Format duration helper
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlaylistManager({
  playlist,
  onPlaylistChange,
  onTrackPlay,
  currentPlayingId,
  isPlaying = false,
  className = '',
}: PlaylistManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(playlist.description || '');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Total duration
  const totalDuration = useMemo(() => {
    const total = playlist.tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  }, [playlist.tracks]);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedId(null);

    if (over && active.id !== over.id) {
      const oldIndex = playlist.tracks.findIndex(t => t.id === active.id);
      const newIndex = playlist.tracks.findIndex(t => t.id === over.id);
      const newTracks = arrayMove(playlist.tracks, oldIndex, newIndex);

      onPlaylistChange({
        ...playlist,
        tracks: newTracks,
        updatedAt: new Date(),
      });
    }
  };

  const handleRemoveTrack = useCallback((trackId: string) => {
    onPlaylistChange({
      ...playlist,
      tracks: playlist.tracks.filter(t => t.id !== trackId),
      updatedAt: new Date(),
    });
  }, [playlist, onPlaylistChange]);

  const handleSaveEdit = () => {
    onPlaylistChange({
      ...playlist,
      name: editName,
      description: editDescription,
      updatedAt: new Date(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(playlist.name);
    setEditDescription(playlist.description || '');
    setIsEditing(false);
  };

  const draggedTrack = draggedId ? playlist.tracks.find(t => t.id === draggedId) : null;

  return (
    <div className={`bg-slate-900 rounded-2xl overflow-hidden ${className}`}>
      {/* Playlist header */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-purple-600/20 to-slate-900" />

        <div className="relative p-6">
          <div className="flex items-start gap-4">
            {/* Playlist cover */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shadow-2xl flex-shrink-0">
              {playlist.coverImage ? (
                <img src={playlist.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <FiDisc className="text-white/80" size={40} />
                </div>
              )}
            </div>

            {/* Playlist info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Playlist name"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-400 flex items-center gap-1"
                    >
                      <FiCheck size={14} /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 flex items-center gap-1"
                    >
                      <FiX size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Playlist</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 truncate">
                    {playlist.name}
                  </h2>
                  {playlist.description && (
                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">{playlist.description}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    {playlist.tracks.length} tracks • {totalDuration}
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Edit playlist"
              >
                <FiEdit2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="p-4 space-y-2">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-12">
            <FiMusic className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400 mb-2">No tracks in this playlist</p>
            <p className="text-sm text-slate-500">Add tracks to get started</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={playlist.tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {playlist.tracks.map((track, index) => (
                <SortableTrack
                  key={track.id}
                  track={track}
                  index={index}
                  isPlaying={isPlaying && currentPlayingId === track.id}
                  isCurrent={currentPlayingId === track.id}
                  onPlay={() => onTrackPlay?.(track, index)}
                  onRemove={() => handleRemoveTrack(track.id)}
                  isDragging={draggedId === track.id}
                />
              ))}
            </SortableContext>

            {/* Drag overlay */}
            <DragOverlay>
              {draggedTrack && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 shadow-2xl border border-blue-500/50">
                  <FiMenu className="text-slate-400" size={18} />
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <FiMusic className="text-white" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{draggedTrack.title}</p>
                    <p className="text-xs text-slate-400">{draggedTrack.artist}</p>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .animate-equalizer {
          animation: equalizer 0.5s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
}

