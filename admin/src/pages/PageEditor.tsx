/**
 * Page Editor
 * Create and edit pages
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pagesApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import { TranslationEditor } from '../components/TranslationEditor';
import toast from 'react-hot-toast';
import { FiSave, FiEye, FiArrowLeft, FiGlobe } from 'react-icons/fi';
import { useThemeClasses } from '../contexts/SiteThemeContext';

export default function PageEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useThemeClasses();
  const [saving, setSaving] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    try {
      const response = await pagesApi.getById(id!);
      const page = response.data;
      setFormData({
        title: page.title,
        content: page.content,
        slug: page.slug,
        status: page.status,
      });
    } catch (error) {
      toast.error('Failed to load page');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare data - only include slug if it has a value
      const dataToSend: any = {
        title: formData.title,
        content: formData.content,
        status: formData.status,
      };

      // Only send slug if user has entered one (for custom slugs)
      if (formData.slug && formData.slug.trim()) {
        dataToSend.slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
      }

      if (id) {
        await pagesApi.update(id, dataToSend);
        toast.success('Page updated successfully');
      } else {
        await pagesApi.create(dataToSend);
        toast.success('Page created successfully');
      }
      navigate('/pages');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (id) {
      window.open(`http://localhost:3000/${formData.slug}`, '_blank');
    } else {
      toast.error('Please save the page first to preview');
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgPrimary}`}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/pages')}
            className={`mr-4 p-2 rounded-xl ${theme.textMuted} hover:${theme.textPrimary} ${theme.hoverBg} transition-all`}
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {id ? 'Edit Page' : 'Create New Page'}
          </h1>
        </div>
        <div className="flex gap-3">
          {id && (
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className={`flex items-center px-4 py-2 border rounded-xl transition-all ${
                showTranslations
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : `${theme.border} ${theme.textSecondary} ${theme.hoverBg}`
              }`}
            >
              <FiGlobe className="mr-2" size={18} />
              Translations
            </button>
          )}
          <button
            type="button"
            onClick={handlePreview}
            className={`flex items-center px-4 py-2 ${theme.border} border rounded-xl ${theme.textSecondary} ${theme.hoverBg} transition-all`}
          >
            <FiEye className="mr-2" size={18} />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            <FiSave className="mr-2" size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Translation Panel */}
      {id && showTranslations && (
        <div className="mb-6">
          <TranslationEditor
            contentType="page"
            contentId={id}
            originalTitle={formData.title}
            originalSlug={formData.slug}
            originalContent={formData.content}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`${theme.bgCard} backdrop-blur rounded-xl ${theme.border} border p-6`}>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Page title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full text-3xl font-bold bg-transparent border-none focus:ring-0 focus:outline-none ${theme.textPrimary} ${theme.isDark ? 'placeholder-slate-500' : 'placeholder-gray-400'}`}
              required
            />
          </div>

          <div className="mb-6">
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Write your page content..."
            />
          </div>
        </div>

        <div className={`${theme.bgCard} backdrop-blur rounded-xl ${theme.border} border p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>Page Settings</h2>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={`w-full px-4 py-3 ${theme.inputBg} ${theme.border} border rounded-xl ${theme.textPrimary} ${theme.isDark ? 'placeholder-slate-500' : 'placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                placeholder="page-url-slug"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={`w-full px-4 py-3 ${theme.inputBg} ${theme.border} border rounded-xl ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}


