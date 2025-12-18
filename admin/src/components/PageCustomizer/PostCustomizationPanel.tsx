/**
 * Post Customization Panel
 * Beautiful component for customizing individual posts
 */

import React, { useState, useEffect } from 'react';
import { FiLayout, FiCode, FiX } from 'react-icons/fi';
import { postCustomizationApi } from '../../services/api';
import toast from 'react-hot-toast';

interface PostCustomizationPanelProps {
  postId: string;
  postTitle: string;
  onClose: () => void;
}

export const PostCustomizationPanel: React.FC<PostCustomizationPanelProps> = ({
  postId,
  postTitle,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [customization, setCustomization] = useState<any>(null);
  const [formData, setFormData] = useState({
    layout: 'default',
    showHeader: true,
    showFooter: true,
    showSidebar: true,
    showAuthor: true,
    showDate: true,
    showCategory: true,
    showTags: true,
    showRelatedPosts: true,
    relatedPostsCount: 3,
    customCSS: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    featuredImagePosition: 'top',
  });

  useEffect(() => {
    loadCustomization();
  }, [postId]);

  const loadCustomization = async () => {
    try {
      setLoading(true);
      const response = await postCustomizationApi.getByPostId(postId);
      if (response.data) {
        setCustomization(response.data);
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to load customization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (customization?.id) {
        await postCustomizationApi.update(customization.id, formData);
        toast.success('Post customization updated!');
      } else {
        await postCustomizationApi.create({ ...formData, postId });
        toast.success('Post customization created!');
      }
      loadCustomization();
    } catch (error) {
      toast.error('Failed to save customization');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiLayout className="text-white text-xl" />
            <div>
              <h2 className="text-white font-bold text-lg">Customize Post</h2>
              <p className="text-purple-100 text-sm">{postTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 p-2 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Layout Options */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Layout</label>
            <select
              value={formData.layout}
              onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="default">Default</option>
              <option value="full-width">Full Width</option>
              <option value="sidebar-left">Sidebar Left</option>
              <option value="sidebar-right">Sidebar Right</option>
            </select>
          </div>

          {/* Visibility Options */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Display Options</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'showHeader', label: 'Show Header' },
                { key: 'showFooter', label: 'Show Footer' },
                { key: 'showSidebar', label: 'Show Sidebar' },
                { key: 'showAuthor', label: 'Show Author' },
                { key: 'showDate', label: 'Show Date' },
                { key: 'showCategory', label: 'Show Category' },
                { key: 'showTags', label: 'Show Tags' },
                { key: 'showRelatedPosts', label: 'Show Related Posts' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof typeof formData] as boolean}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Related Posts Count */}
          {formData.showRelatedPosts && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Related Posts Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.relatedPostsCount}
                onChange={(e) => setFormData({ ...formData, relatedPostsCount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Color Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Background Color</label>
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Text Color</label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Custom CSS */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FiCode size={16} />
              Custom CSS
            </label>
            <textarea
              value={formData.customCSS}
              onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
              placeholder="/* Add custom CSS here */"
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition font-medium disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

