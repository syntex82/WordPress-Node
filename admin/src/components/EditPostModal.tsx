/**
 * EditPostModal Component
 * Modal for editing an existing post's content
 */

import { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { TimelinePost, timelineApi } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';

interface EditPostModalProps {
  post: TimelinePost | null;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated?: (updatedPost: TimelinePost) => void;
}

export default function EditPostModal({ post, isOpen, onClose, onPostUpdated }: EditPostModalProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setContent(post.content || '');
      setIsPublic(post.isPublic);
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const res = await timelineApi.updatePost(post.id, { content: content.trim(), isPublic });
      toast.success('Post updated successfully');
      onPostUpdated?.(res.data);
      onClose();
    } catch (error: any) {
      console.error('Failed to update post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl ${
        isDark ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Edit Post
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
          >
            <FiX className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={5}
            className={`w-full p-4 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark 
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
          />

          {/* Visibility toggle */}
          <div className="mt-4 flex items-center gap-3">
            <label className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Visibility:
            </label>
            <select
              value={isPublic ? 'public' : 'private'}
              onChange={(e) => setIsPublic(e.target.value === 'public')}
              className={`px-3 py-1.5 rounded-lg border text-sm ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="public">Public</option>
              <option value="private">Private (Followers only)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium ${
              isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

