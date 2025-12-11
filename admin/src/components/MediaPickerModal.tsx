/**
 * Media Picker Modal
 * Select media from library for insertion into editor
 */

import { useEffect, useState } from 'react';
import { mediaApi } from '../services/api';
import { FiX, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface MediaPickerModalProps {
  type: 'image' | 'video' | 'audio' | 'gallery';
  onSelect: (media: any) => void;
  onClose: () => void;
}

export default function MediaPickerModal({ type, onSelect, onClose }: MediaPickerModalProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await mediaApi.getAll();
      let allMedia = response.data.data;
      
      // Filter by type
      if (type === 'image') {
        allMedia = allMedia.filter((m: any) => m.mimeType.startsWith('image/'));
      } else if (type === 'video') {
        allMedia = allMedia.filter((m: any) => m.mimeType.startsWith('video/'));
      } else if (type === 'audio') {
        allMedia = allMedia.filter((m: any) => m.mimeType.startsWith('audio/'));
      }
      
      setMedia(allMedia);
    } catch (error) {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(file => mediaApi.upload(file));

    try {
      await Promise.all(uploadPromises);
      toast.success(`${files.length} file(s) uploaded`);
      fetchMedia();
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>

          <h2 className="text-2xl font-bold mb-4">Select {type}</h2>

          {/* Upload Button */}
          <div className="mb-4">
            <label className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer w-fit">
              <FiUpload className="mr-2" size={18} />
              Upload {type}
              <input
                type="file"
                multiple
                accept={
                  type === 'image' ? 'image/*' :
                  type === 'video' ? 'video/*' :
                  type === 'audio' ? 'audio/*' : '*'
                }
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploading && <p className="text-blue-600 mb-4">Uploading...</p>}

          {/* Media Grid */}
          {loading ? (
            <p>Loading...</p>
          ) : media.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No {type} files found. Upload some to get started!</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              {media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
                >
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.path} alt={item.originalName} className="w-full h-32 object-cover" />
                  ) : item.mimeType.startsWith('video/') ? (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">🎥</span>
                    </div>
                  ) : item.mimeType.startsWith('audio/') ? (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">🎵</span>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl">📄</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-600 truncate">{item.originalName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


