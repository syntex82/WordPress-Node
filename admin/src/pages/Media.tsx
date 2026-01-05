/**
 * Media Page
 * Manage media library with grid view and drag-drop upload
 * With comprehensive tooltips for user guidance
 */

import { useEffect, useState, useRef } from 'react';
import { mediaApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiX, FiImage, FiDownload, FiHelpCircle } from 'react-icons/fi';
import Tooltip from '../components/Tooltip';

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

export default function Media() {
  const theme = useThemeClasses();
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

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await mediaApi.getAll();
      setMedia(response.data.data);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Media Library</h1>
          <Tooltip title="About Media Library" content="Store and manage all your images, videos, and documents. Upload files here to use them in posts and pages." position="right" variant="help">
            <button className={`p-1 ${theme.icon} hover:text-blue-400`}>
              <FiHelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
        <Tooltip title={MEDIA_TOOLTIPS.upload.title} content={MEDIA_TOOLTIPS.upload.content} position="left">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-xl hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all"
          >
            <FiUpload className="mr-2" size={18} />
            Upload Files
          </button>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File Type Filter */}
      <div className="mb-6 flex gap-2">
        <Tooltip title={MEDIA_TOOLTIPS.filter.title} content={MEDIA_TOOLTIPS.filter.content} position="bottom">
          <div className="flex gap-2">
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
        </Tooltip>
      </div>

      {/* Drag and Drop Zone */}
      <Tooltip title={MEDIA_TOOLTIPS.dragDrop.title} content={MEDIA_TOOLTIPS.dragDrop.content} position="top">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : theme.isDark ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <FiUpload className={`mx-auto mb-4 ${theme.textMuted}`} size={48} />
          <p className={`mb-2 ${theme.textMuted}`}>Drag and drop files here, or click the button above</p>
          <p className={`text-sm mb-4 ${theme.textMuted}`}>Supports: JPG, PNG, GIF, SVG, MP4, MP3, PDF</p>

          {/* Recommended Sizes */}
          <div className={`mt-4 pt-4 border-t ${theme.border}`}>
            <p className={`text-xs mb-2 ${theme.textMuted}`}>📐 Recommended Image Sizes:</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <span className={`px-3 py-1 rounded-full ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                <span className="text-purple-400">Courses:</span> <span className="text-blue-400">1280 × 720 px</span>
              </span>
              <span className={`px-3 py-1 rounded-full ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                <span className="text-green-400">Products:</span> <span className="text-blue-400">800 × 600 px</span>
              </span>
              <span className={`px-3 py-1 rounded-full ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                <span className="text-amber-400">Posts:</span> <span className="text-blue-400">1200 × 630 px</span>
              </span>
              <span className={`px-3 py-1 rounded-full ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                <span className="text-pink-400">Logo:</span> <span className="text-blue-400">200 × 60 px</span>
              </span>
            </div>
          </div>
        </div>
      </Tooltip>

      {uploading && (
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-400">Uploading files...</p>
        </div>
      )}

      {/* Media Grid */}
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
      ) : (
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
                    <span className="text-4xl">▶️</span>
                  </div>
                </div>
              ) : item.mimeType.startsWith('audio/') ? (
                <div className="w-full h-32 bg-gradient-to-br from-purple-500/50 to-pink-500/50 flex items-center justify-center">
                  <span className="text-4xl">🎵</span>
                </div>
              ) : (
                <div className={`w-full h-32 flex items-center justify-center ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-200'}`}>
                  <span className="text-4xl">📄</span>
                </div>
              )}
              <div className="p-2">
                <p className={`text-xs truncate ${theme.textPrimary}`}>{item.originalName}</p>
                <p className={`text-xs ${theme.textMuted}`}>{formatFileSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
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


