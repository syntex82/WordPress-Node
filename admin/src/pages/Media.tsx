/**
 * Media Page
 * Manage media library with grid view and drag-drop upload
 * Per-user media libraries with admin storage dashboard
 * Enhanced with beautiful upload zones, audio players, and responsive galleries
 */

import { useEffect, useState, useRef, useMemo } from 'react';
import { mediaApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import { useAuthStore } from '../stores/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  FiUpload, FiTrash2, FiX, FiImage, FiDownload, FiHelpCircle,
  FiUsers, FiHardDrive, FiDatabase, FiUser, FiGrid, FiList,
  FiMusic, FiVideo, FiZap
} from 'react-icons/fi';
import Tooltip from '../components/Tooltip';
import {
  DragDropUploadZone,
  EnhancedAudioPlayer,
  ResponsiveMediaGallery,
  type AudioTrack,
  type MediaItem
} from '../components/Media';

// Tooltip content for media page
const MEDIA_TOOLTIPS = {
  upload: { title: 'Upload Files', content: 'Click to select files or drag and drop directly onto the page. Supports images, videos, audio, and documents.' },
  filter: { title: 'Filter by Type', content: 'Show only specific file types like images, videos, audio, or documents.' },
  download: { title: 'Download', content: 'Download this file to your computer.' },
  delete: { title: 'Delete', content: 'Permanently remove this file from your media library.' },
  copyUrl: { title: 'Copy URL', content: 'Copy the file URL to clipboard for use in posts or pages.' },
  editMetadata: { title: 'Edit Metadata', content: 'Update alt text and caption for better SEO and accessibility.' },
  dragDrop: { title: 'Drag & Drop', content: 'Drag files directly onto this area to upload them quickly.' },
};

interface StorageUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  fileCount: number;
  totalSize: number;
}

interface StorageStats {
  users: StorageUser[];
  totals: {
    totalUsers: number;
    totalSize: number;
    totalFiles: number;
  };
}

export default function Media() {
  const theme = useThemeClasses();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; mediaId: string | null }>({
    isOpen: false,
    mediaId: null,
  });
  const [dragActive, setDragActive] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const [editingMetadata, setEditingMetadata] = useState(false);
  const [metadataForm, setMetadataForm] = useState({ alt: '', caption: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin-only state
  const [viewMode, setViewMode] = useState<'my-media' | 'all-media' | 'storage'>('my-media');
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [myStorageStats, setMyStorageStats] = useState<{ totalSize: number; fileCount: number } | null>(null);

  // Enhanced UI state
  const [displayMode, setDisplayMode] = useState<'grid' | 'gallery'>('grid');
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Convert media items to gallery format
  const galleryItems: MediaItem[] = useMemo(() => {
    return media.map(item => ({
      id: item.id,
      type: item.mimeType.startsWith('image/') ? 'image' as const
        : item.mimeType.startsWith('video/') ? 'video' as const
        : item.mimeType.startsWith('audio/') ? 'audio' as const
        : 'image' as const,
      src: item.path,
      thumbnail: item.mimeType.startsWith('image/') ? item.path : undefined,
      title: item.originalName,
      description: item.caption,
      size: item.size,
      duration: item.duration,
    }));
  }, [media]);

  // Get audio tracks for the audio player
  const audioTracks: AudioTrack[] = useMemo(() => {
    return media
      .filter(item => item.mimeType.startsWith('audio/'))
      .map(item => ({
        id: item.id,
        src: item.path,
        title: item.originalName.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        duration: item.duration,
      }));
  }, [media]);

  useEffect(() => {
    fetchMedia();
    fetchMyStorageStats();
    if (isAdmin) {
      fetchStorageStats();
    }
  }, [isAdmin]);

  useEffect(() => {
    // Refetch when view mode or selected user changes
    if (viewMode === 'my-media') {
      fetchMedia();
    } else if (viewMode === 'all-media') {
      fetchAllMedia();
    }
  }, [viewMode, selectedUserId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaApi.getAll();
      setMedia(response.data.data);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMedia = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedUserId) {
        params.userId = selectedUserId;
      }
      const response = await mediaApi.getAllMedia(params);
      setMedia(response.data.data);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const fetchStorageStats = async () => {
    try {
      const response = await mediaApi.getAllStorageStats();
      setStorageStats(response.data);
    } catch (error) {
      console.error('Failed to load storage stats');
    }
  };

  const fetchMyStorageStats = async () => {
    try {
      const response = await mediaApi.getMyStorageStats();
      setMyStorageStats(response.data);
    } catch (error) {
      console.error('Failed to load storage stats');
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(file => mediaApi.upload(file));

    try {
      await Promise.all(uploadPromises);
      toast.success(`${files.length} file(s) uploaded successfully`);
      fetchMedia();
    } catch (error) {
      toast.error('Failed to upload some files');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!selectedMedia) return;

    try {
      // TODO: Implement mediaApi.update endpoint
      // await mediaApi.update(selectedMedia.id, metadataForm);
      toast.success('Metadata updated successfully');
      setEditingMetadata(false);
      fetchMedia();
      setSelectedMedia({ ...selectedMedia, ...metadataForm });
    } catch (error) {
      toast.error('Failed to update metadata');
    }
  };

  const filteredMedia = media.filter(item => {
    if (fileTypeFilter === 'all') return true;
    if (fileTypeFilter === 'image') return item.mimeType.startsWith('image/');
    if (fileTypeFilter === 'video') return item.mimeType.startsWith('video/');
    if (fileTypeFilter === 'audio') return item.mimeType.startsWith('audio/');
    if (fileTypeFilter === 'document') return !item.mimeType.startsWith('image/') && !item.mimeType.startsWith('video/') && !item.mimeType.startsWith('audio/');
    return true;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mediaApi.delete(id);
      toast.success('Media deleted successfully');
      fetchMedia();
      setDeleteConfirm({ isOpen: false, mediaId: null });
      setSelectedMedia(null);
    } catch (error) {
      toast.error('Failed to delete media');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleOptimizeAll = async () => {
    setOptimizing(true);
    try {
      const response = await mediaApi.optimizeAll();
      const { optimized, skipped, failed, savedBytes } = response.data;
      if (optimized > 0) {
        toast.success(`Optimized ${optimized} images! Saved ${formatFileSize(savedBytes)}`);
        fetchMedia(); // Refresh to show updated images
      } else if (skipped > 0 && failed === 0) {
        toast.success('All images are already optimized!');
      } else if (failed > 0) {
        toast.error(`${failed} images failed to optimize`);
      } else {
        toast.success('No images need optimization');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to optimize media');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading && !storageStats) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Media Library</h1>
          <Tooltip title="About Media Library" content="Your personal media library. Upload files here to use them in posts and pages." position="right" variant="help">
            <button className={`p-1 ${theme.icon} hover:text-blue-400`}>
              <FiHelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
        <div className="flex items-center gap-3">
          {/* My Storage Stats */}
          {myStorageStats && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme.isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-100 border border-gray-200'}`}>
              <FiHardDrive className="text-blue-400" size={16} />
              <span className={`text-sm ${theme.textMuted}`}>
                {formatFileSize(myStorageStats.totalSize)} • {myStorageStats.fileCount} files
              </span>
            </div>
          )}
          <Tooltip title="Optimize All Images" content="Convert all images to WebP format for faster loading and smaller file sizes." position="left">
            <button
              onClick={handleOptimizeAll}
              disabled={optimizing}
              className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                optimizing
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20'
              } text-white`}
            >
              <FiZap className={`mr-2 ${optimizing ? 'animate-pulse' : ''}`} size={18} />
              {optimizing ? 'Optimizing...' : 'Optimize All'}
            </button>
          </Tooltip>
          <Tooltip title={MEDIA_TOOLTIPS.upload.title} content={MEDIA_TOOLTIPS.upload.content} position="left">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-xl hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all"
            >
              <FiUpload className="mr-2" size={18} />
              Upload Files
            </button>
          </Tooltip>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Admin View Mode Toggle */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => { setViewMode('my-media'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'my-media'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : theme.isDark
                  ? 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <FiUser size={16} />
            My Media
          </button>
          <button
            onClick={() => { setViewMode('all-media'); setSelectedUserId(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'all-media'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : theme.isDark
                  ? 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <FiImage size={16} />
            All Media
          </button>
          <button
            onClick={() => setViewMode('storage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'storage'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : theme.isDark
                  ? 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <FiDatabase size={16} />
            Storage Dashboard
          </button>
        </div>
      )}

      {/* Storage Dashboard (Admin Only) */}
      {isAdmin && viewMode === 'storage' && storageStats && (
        <div className="mb-8">
          {/* Totals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-xl p-5 ${theme.card}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <FiHardDrive className="text-blue-400" size={20} />
                </div>
                <span className={theme.textMuted}>Total Storage</span>
              </div>
              <p className={`text-2xl font-bold ${theme.textPrimary}`}>{formatFileSize(storageStats.totals.totalSize)}</p>
            </div>
            <div className={`rounded-xl p-5 ${theme.card}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <FiImage className="text-green-400" size={20} />
                </div>
                <span className={theme.textMuted}>Total Files</span>
              </div>
              <p className={`text-2xl font-bold ${theme.textPrimary}`}>{storageStats.totals.totalFiles.toLocaleString()}</p>
            </div>
            <div className={`rounded-xl p-5 ${theme.card}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <FiUsers className="text-purple-400" size={20} />
                </div>
                <span className={theme.textMuted}>Users with Media</span>
              </div>
              <p className={`text-2xl font-bold ${theme.textPrimary}`}>{storageStats.totals.totalUsers}</p>
            </div>
          </div>

          {/* Users Storage Table */}
          <div className={`rounded-xl border overflow-hidden ${theme.card}`}>
            <div className={`px-4 py-3 border-b ${theme.border}`}>
              <h3 className={`font-semibold ${theme.textPrimary}`}>Storage by User</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={theme.isDark ? 'bg-slate-800/50' : 'bg-gray-50'}>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.textMuted}`}>User</th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${theme.textMuted}`}>Role</th>
                    <th className={`px-4 py-3 text-right text-sm font-medium ${theme.textMuted}`}>Files</th>
                    <th className={`px-4 py-3 text-right text-sm font-medium ${theme.textMuted}`}>Storage Used</th>
                    <th className={`px-4 py-3 text-right text-sm font-medium ${theme.textMuted}`}>% of Total</th>
                    <th className={`px-4 py-3 text-center text-sm font-medium ${theme.textMuted}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.border}`}>
                  {storageStats.users.map((u) => (
                    <tr key={u.id} className={`${theme.isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className={`font-medium ${theme.textPrimary}`}>{u.name}</p>
                            <p className={`text-xs ${theme.textMuted}`}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                          u.role === 'EDITOR' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right ${theme.textPrimary}`}>{u.fileCount}</td>
                      <td className={`px-4 py-3 text-right font-medium ${theme.textPrimary}`}>{formatFileSize(u.totalSize)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                              style={{ width: `${Math.min(100, (u.totalSize / storageStats.totals.totalSize) * 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm ${theme.textMuted}`}>
                            {((u.totalSize / storageStats.totals.totalSize) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setViewMode('all-media'); setSelectedUserId(u.id); }}
                          className="px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
                        >
                          View Files
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Show media grid when not in storage view */}
      {viewMode !== 'storage' && (
        <>
          {/* Selected User Filter (when viewing specific user's media) */}
          {isAdmin && viewMode === 'all-media' && selectedUserId && storageStats && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg ${theme.isDark ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-indigo-50 border border-indigo-200'}`}>
              <FiUser className="text-indigo-400" size={16} />
              <span className={theme.textPrimary}>
                Viewing media for: <strong>{storageStats.users.find(u => u.id === selectedUserId)?.name}</strong>
              </span>
              <button
                onClick={() => setSelectedUserId(null)}
                className="ml-auto px-2 py-1 text-xs bg-indigo-500/20 text-indigo-400 rounded hover:bg-indigo-500/30 transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* File Type Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'image', label: 'Images' },
              { id: 'video', label: 'Videos' },
              { id: 'audio', label: 'Audio' },
              { id: 'document', label: 'Documents' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFileTypeFilter(filter.id as any)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  fileTypeFilter === filter.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : theme.isDark
                      ? 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

      {/* Enhanced Drag and Drop Upload Zone */}
      <div className="mb-6">
        <DragDropUploadZone
          accept={fileTypeFilter === 'all' ? 'all' : fileTypeFilter}
          onFilesSelected={async (files) => {
            setUploading(true);
            const uploadPromises = files.map(file => mediaApi.upload(file));
            try {
              await Promise.all(uploadPromises);
              toast.success(`${files.length} file(s) uploaded successfully`);
              fetchMedia();
            } catch (error) {
              toast.error('Failed to upload some files');
            } finally {
              setUploading(false);
            }
          }}
          maxFiles={20}
          maxFileSize={100}
          disabled={uploading}
        />
      </div>

      {/* Display Mode Toggle & Audio Player Toggle */}
      <div className="flex items-center gap-4 mb-6">
        {/* Display Mode */}
        <div className={`flex rounded-lg overflow-hidden border ${theme.border}`}>
          <button
            onClick={() => setDisplayMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 transition-all ${
              displayMode === 'grid'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                : theme.isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiGrid size={16} />
            Grid
          </button>
          <button
            onClick={() => setDisplayMode('gallery')}
            className={`flex items-center gap-2 px-4 py-2 transition-all ${
              displayMode === 'gallery'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                : theme.isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiImage size={16} />
            Gallery
          </button>
        </div>

        {/* Audio Player Toggle */}
        {audioTracks.length > 0 && (
          <button
            onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showAudioPlayer
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                : theme.isDark ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white' : 'bg-white text-gray-600 border border-gray-300 hover:text-gray-900'
            }`}
          >
            <FiMusic size={16} />
            Audio Player ({audioTracks.length})
          </button>
        )}

        {/* Selection Count */}
        {selectedMediaIds.size > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
            <span>{selectedMediaIds.size} selected</span>
            <button
              onClick={() => setSelectedMediaIds(new Set())}
              className="hover:text-white transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Audio Player Section */}
      {showAudioPlayer && audioTracks.length > 0 && (
        <div className="mb-6">
          <EnhancedAudioPlayer
            tracks={audioTracks}
            skin="modern"
            showVisualization
            showVinylAnimation
          />
        </div>
      )}

      {/* Media Display */}
      {filteredMedia.length === 0 ? (
        <div className={`text-center py-12 rounded-xl border ${theme.card}`}>
          <FiImage className={`mx-auto mb-4 ${theme.textMuted}`} size={64} />
          <p className={theme.textMuted}>
            {fileTypeFilter === 'all'
              ? 'No media files yet. Upload some files to get started!'
              : `No ${fileTypeFilter} files found.`
            }
          </p>
        </div>
      ) : displayMode === 'gallery' ? (
        /* Responsive Media Gallery */
        <ResponsiveMediaGallery
          items={galleryItems.filter(item => {
            if (fileTypeFilter === 'all') return true;
            return item.type === fileTypeFilter;
          })}
          onSelect={(item) => {
            const mediaItem = media.find(m => m.id === item.id);
            if (mediaItem) {
              setSelectedMedia(mediaItem);
              setMetadataForm({ alt: mediaItem.alt || '', caption: mediaItem.caption || '' });
              setEditingMetadata(false);
            }
          }}
          onDelete={async (id) => {
            if (confirm('Are you sure you want to delete this file?')) {
              try {
                await mediaApi.delete(id);
                toast.success('Media deleted successfully');
                fetchMedia();
              } catch {
                toast.error('Failed to delete media');
              }
            }
          }}
          selectedIds={selectedMediaIds}
          columns={{ sm: 2, md: 3, lg: 4, xl: 5 }}
          aspectRatio="square"
          showActions
          draggable={false}
        />
      ) : (
        /* Classic Grid View */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedMedia(item);
                setMetadataForm({ alt: item.alt || '', caption: item.caption || '' });
                setEditingMetadata(false);
              }}
              className={`rounded-xl border overflow-hidden cursor-pointer hover:shadow-xl transition-all group ${theme.card} ${theme.isDark ? 'hover:border-slate-600/50' : 'hover:border-gray-400'}`}
            >
              {item.mimeType.startsWith('image/') ? (
                <img src={item.path} alt={item.originalName} className="w-full h-32 object-cover group-hover:scale-105 transition-transform" />
              ) : item.mimeType.startsWith('video/') ? (
                <div className={`w-full h-32 flex items-center justify-center relative ${theme.isDark ? 'bg-slate-900' : 'bg-gray-200'}`}>
                  <video src={item.path} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <FiVideo className="text-white" size={32} />
                  </div>
                </div>
              ) : item.mimeType.startsWith('audio/') ? (
                <div className="w-full h-32 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FiMusic className="text-white" size={32} />
                </div>
              ) : (
                <div className={`w-full h-32 flex items-center justify-center ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                  <FiImage className={theme.textMuted} size={32} />
                </div>
              )}
              <div className="p-2">
                <p className={`text-xs truncate ${theme.textPrimary}`}>{item.originalName}</p>
                <p className={`text-xs ${theme.textMuted}`}>{formatFileSize(item.size)}</p>
                {viewMode === 'all-media' && item.uploadedBy && (
                  <p className={`text-[10px] ${theme.textMuted} truncate`}>by {item.uploadedBy.name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Media Details Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedMedia(null)}></div>

            <div className={`relative rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl ${theme.isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-gray-200'}`}>
              <button
                onClick={() => setSelectedMedia(null)}
                className={`absolute top-4 right-4 z-10 transition-colors ${theme.icon} ${theme.iconHover}`}
              >
                <FiX size={24} />
              </button>

              <h2 className={`text-2xl font-bold mb-4 ${theme.textPrimary}`}>Media Details</h2>

              {/* Media Preview */}
              <div className={`mb-6 rounded-xl overflow-hidden ${theme.isDark ? 'bg-slate-900/50' : 'bg-gray-100'}`}>
                {selectedMedia.mimeType.startsWith('image/') && (
                  <img src={selectedMedia.path} alt={selectedMedia.originalName} className="w-full" />
                )}
                {selectedMedia.mimeType.startsWith('video/') && (
                  <video src={selectedMedia.path} controls className="w-full" />
                )}
                {selectedMedia.mimeType.startsWith('audio/') && (
                  <div className="p-8">
                    <audio src={selectedMedia.path} controls className="w-full" />
                  </div>
                )}
              </div>

              {/* File Information */}
              <div className="space-y-3 mb-6">
                <div>
                  <span className={`font-medium ${theme.textMuted}`}>File name:</span>
                  <p className={theme.textPrimary}>{selectedMedia.originalName}</p>
                </div>
                <div>
                  <span className={`font-medium ${theme.textMuted}`}>File type:</span>
                  <p className={theme.textPrimary}>{selectedMedia.mimeType}</p>
                </div>
                <div>
                  <span className={`font-medium ${theme.textMuted}`}>File size:</span>
                  <p className={theme.textPrimary}>{formatFileSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <span className={`font-medium ${theme.textMuted}`}>Uploaded:</span>
                  <p className={theme.textPrimary}>{new Date(selectedMedia.createdAt).toLocaleString()}</p>
                </div>
                {selectedMedia.uploadedBy && (
                  <div>
                    <span className={`font-medium ${theme.textMuted}`}>Uploaded by:</span>
                    <p className={theme.textPrimary}>{selectedMedia.uploadedBy.name} ({selectedMedia.uploadedBy.email})</p>
                  </div>
                )}
                <div>
                  <span className={`font-medium ${theme.textMuted}`}>URL:</span>
                  <input
                    type="text"
                    value={`http://localhost:3000${selectedMedia.path}`}
                    readOnly
                    className={`w-full mt-1 px-3 py-2 rounded-lg text-sm ${theme.input}`}
                    onClick={(e) => e.currentTarget.select()}
                  />
                </div>
              </div>

              {/* Metadata Section */}
              <div className={`border-t pt-6 mb-6 ${theme.border}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>Metadata</h3>
                  {!editingMetadata && (
                    <button
                      onClick={() => setEditingMetadata(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingMetadata ? (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${theme.textMuted}`}>
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={metadataForm.alt}
                        onChange={(e) => setMetadataForm({ ...metadataForm, alt: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg ${theme.input}`}
                        placeholder="Describe this image for accessibility"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${theme.textMuted}`}>
                        Caption
                      </label>
                      <textarea
                        value={metadataForm.caption}
                        onChange={(e) => setMetadataForm({ ...metadataForm, caption: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg ${theme.input}`}
                        rows={3}
                        placeholder="Add a caption"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateMetadata}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 transition-all"
                      >
                        Save Metadata
                      </button>
                      <button
                        onClick={() => {
                          setEditingMetadata(false);
                          setMetadataForm({ alt: selectedMedia.alt || '', caption: selectedMedia.caption || '' });
                        }}
                        className={`px-4 py-2 border rounded-lg transition-all ${theme.border} ${theme.textMuted} ${theme.isDark ? 'hover:bg-slate-700/50 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className={`text-sm font-medium ${theme.textMuted}`}>Alt Text:</span>
                      <p className={theme.textPrimary}>{selectedMedia.alt || 'Not set'}</p>
                    </div>
                    <div>
                      <span className={`text-sm font-medium ${theme.textMuted}`}>Caption:</span>
                      <p className={theme.textPrimary}>{selectedMedia.caption || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={`flex gap-3 border-t pt-6 ${theme.border}`}>
                <a
                  href={selectedMedia.path}
                  download={selectedMedia.originalName}
                  className={`flex items-center px-4 py-2 border rounded-lg transition-all ${theme.border} ${theme.textMuted} ${theme.isDark ? 'hover:bg-slate-700/50 hover:text-white' : 'hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <FiDownload className="mr-2" size={18} />
                  Download
                </a>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, mediaId: selectedMedia.id })}
                  className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 hover:text-red-300 transition-all"
                >
                  <FiTrash2 className="mr-2" size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Media"
        message="Are you sure you want to delete this media file? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm.mediaId && handleDelete(deleteConfirm.mediaId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, mediaId: null })}
      />
    </div>
  );
}


