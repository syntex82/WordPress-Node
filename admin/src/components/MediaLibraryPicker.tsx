/**
 * MediaLibraryPicker Component
 * Modal for selecting media from library or uploading new files
 */

import { useState, useEffect, useRef } from 'react';
import { FiX, FiUpload, FiImage, FiVideo, FiCheck, FiSearch, FiLoader } from 'react-icons/fi';
import { mediaApi } from '../services/api';
import toast from 'react-hot-toast';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

interface MediaLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  accept?: 'all' | 'image' | 'video';
}

export default function MediaLibraryPicker({
  isOpen,
  onClose,
  onSelect,
  multiple = true,
  accept = 'all',
}: MediaLibraryPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const mimeFilter = accept === 'image' ? 'image' : accept === 'video' ? 'video' : undefined;
      const res = await mediaApi.getAll({ limit: 50, mimeType: mimeFilter });
      setMedia(res.data.data || []);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploaded: MediaItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await mediaApi.upload(file, (progress) => {
          setUploadProgress(Math.round((i / files.length) * 100 + progress / files.length));
        });
        uploaded.push({ ...res.data, path: res.data.url || res.data.path });
      }
      setMedia((prev) => [...uploaded, ...prev]);
      toast.success(`${files.length} file(s) uploaded`);
      setActiveTab('library');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      if (!multiple) newSelected.clear();
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selected = media.filter((m) => selectedIds.has(m.id));
    onSelect(selected);
    onClose();
  };

  const filteredMedia = media.filter((m) =>
    m.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const getAcceptString = () => {
    if (accept === 'image') return 'image/*';
    if (accept === 'video') return 'video/*';
    return 'image/*,video/*';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-white">Media Library</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg touch-manipulation min-w-[40px] min-h-[40px] flex items-center justify-center">
            <FiX className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-3 sm:p-4 border-b border-slate-700 flex-shrink-0">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition touch-manipulation text-sm sm:text-base ${
              activeTab === 'library'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <FiImage className="w-4 h-4 inline mr-1 sm:mr-2" />
            Library
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition touch-manipulation text-sm sm:text-base ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            <FiUpload className="w-4 h-4 inline mr-1 sm:mr-2" />
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          {activeTab === 'upload' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
              className="border-2 border-dashed border-slate-600 rounded-xl p-8 sm:p-12 text-center cursor-pointer hover:border-blue-500 transition touch-manipulation"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptString()}
                multiple={multiple}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              {uploading ? (
                <div className="space-y-3">
                  <FiLoader className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-blue-500 animate-spin" />
                  <p className="text-slate-400 text-sm sm:text-base">Uploading... {uploadProgress}%</p>
                  <div className="w-40 sm:w-48 mx-auto h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <FiUpload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-500 mb-3 sm:mb-4" />
                  <p className="text-slate-400 mb-2 text-sm sm:text-base">Tap to select files</p>
                  <p className="text-xs sm:text-sm text-slate-500">Images and videos</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-3 sm:mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              {/* Media Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-spin" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">No media found</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {filteredMedia.map((item) => {
                    const isVideo = item.mimeType?.startsWith('video/');
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition touch-manipulation ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-transparent hover:border-slate-500'
                        }`}
                      >
                        {isVideo ? (
                          <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                            <FiVideo className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
                          </div>
                        ) : (
                          <img src={item.path} alt={item.originalName} className="w-full h-full object-cover" />
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <FiCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                          </div>
                        )}
                        {isVideo && (
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                            Video
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 p-3 sm:p-4 border-t border-slate-700 bg-slate-800/80 flex-shrink-0">
          <span className="text-xs sm:text-sm text-slate-400 text-center sm:text-left">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-slate-400 hover:bg-slate-700 rounded-lg touch-manipulation text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-sm sm:text-base font-medium"
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

