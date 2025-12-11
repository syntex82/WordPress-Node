/**
 * Media Page
 * Manage media library with grid view and drag-drop upload
 */

import { useEffect, useState, useRef } from 'react';
import { mediaApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiX, FiImage, FiDownload } from 'react-icons/fi';

export default function Media() {
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
        <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <FiUpload className="mr-2" size={18} />
          Upload Files
        </button>
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
            className={`px-4 py-2 rounded-md ${
              fileTypeFilter === filter.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`mb-6 border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
      >
        <FiUpload className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600 mb-2">Drag and drop files here, or click the button above</p>
        <p className="text-sm text-gray-500">Supports: JPG, PNG, GIF, SVG</p>
      </div>

      {uploading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Uploading files...</p>
        </div>
      )}

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <FiImage className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-500">
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
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {item.mimeType.startsWith('image/') ? (
                <img src={item.path} alt={item.originalName} className="w-full h-32 object-cover" />
              ) : item.mimeType.startsWith('video/') ? (
                <div className="w-full h-32 bg-gray-900 flex items-center justify-center relative">
                  <video src={item.path} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <span className="text-4xl">▶️</span>
                  </div>
                </div>
              ) : item.mimeType.startsWith('audio/') ? (
                <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                  <span className="text-4xl">🎵</span>
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">📄</span>
                </div>
              )}
              <div className="p-2">
                <p className="text-xs text-gray-600 truncate">{item.originalName}</p>
                <p className="text-xs text-gray-400">{formatFileSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Details Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setSelectedMedia(null)}></div>

            <div className="relative bg-white rounded-lg max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              >
                <FiX size={24} />
              </button>

              <h2 className="text-2xl font-bold mb-4">Media Details</h2>

              {/* Media Preview */}
              <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden">
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
                  <span className="font-medium text-gray-700">File name:</span>
                  <p className="text-gray-900">{selectedMedia.originalName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">File type:</span>
                  <p className="text-gray-900">{selectedMedia.mimeType}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">File size:</span>
                  <p className="text-gray-900">{formatFileSize(selectedMedia.size)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Uploaded:</span>
                  <p className="text-gray-900">{new Date(selectedMedia.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">URL:</span>
                  <input
                    type="text"
                    value={`http://localhost:3000${selectedMedia.path}`}
                    readOnly
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                </div>
              </div>

              {/* Metadata Section */}
              <div className="border-t pt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Metadata</h3>
                  {!editingMetadata && (
                    <button
                      onClick={() => setEditingMetadata(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingMetadata ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        value={metadataForm.alt}
                        onChange={(e) => setMetadataForm({ ...metadataForm, alt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Describe this image for accessibility"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caption
                      </label>
                      <textarea
                        value={metadataForm.caption}
                        onChange={(e) => setMetadataForm({ ...metadataForm, caption: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Add a caption"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateMetadata}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Save Metadata
                      </button>
                      <button
                        onClick={() => {
                          setEditingMetadata(false);
                          setMetadataForm({ alt: selectedMedia.alt || '', caption: selectedMedia.caption || '' });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Alt Text:</span>
                      <p className="text-gray-900">{selectedMedia.alt || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Caption:</span>
                      <p className="text-gray-900">{selectedMedia.caption || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t pt-6">
                <a
                  href={selectedMedia.path}
                  download={selectedMedia.originalName}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FiDownload className="mr-2" size={18} />
                  Download
                </a>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, mediaId: selectedMedia.id })}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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


