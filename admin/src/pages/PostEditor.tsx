/**
 * Post Editor Page
 * Create and edit posts with rich text editor
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postsApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import { TranslationEditor } from '../components/TranslationEditor';
import toast from 'react-hot-toast';
import { FiSave, FiEye, FiArrowLeft, FiGlobe } from 'react-icons/fi';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    slug: '',
  });

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const response = await postsApi.getById(id!);
      const post = response.data;
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || '',
        status: post.status,
        slug: post.slug,
      });
    } catch (error) {
      toast.error('Failed to load post');
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      // Prepare data - only include slug if it has a value
      const dataToSend: any = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        status: formData.status,
      };

      // Only send slug if user has entered one (for custom slugs)
      if (formData.slug && formData.slug.trim()) {
        dataToSend.slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
      }

      if (id) {
        await postsApi.update(id, dataToSend);
        toast.success('Post updated successfully');
      } else {
        await postsApi.create(dataToSend);
        toast.success('Post created successfully');
      }
      navigate('/posts');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`http://localhost:3000/post/${formData.slug}`, '_blank');
    } else {
      toast.error('Save the post first to preview');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/posts')}
              className="mr-4 p-2 hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {id ? 'Edit Post' : 'Create New Post'}
            </h1>
          </div>
          <div className="flex gap-2">
            {id && (
              <>
                <button
                  onClick={() => setShowTranslations(!showTranslations)}
                  className={`flex items-center px-4 py-2 border rounded-xl transition-all ${
                    showTranslations
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <FiGlobe className="mr-2" size={18} />
                  Translations
                </button>
                <button
                  onClick={handlePreview}
                  className="flex items-center px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                >
                  <FiEye className="mr-2" size={18} />
                  Preview
                </button>
              </>
            )}
          </div>
        </div>

        {/* Translation Panel */}
        {id && showTranslations && (
          <div className="mb-6">
            <TranslationEditor
              contentType="post"
              contentId={id}
              originalTitle={formData.title}
              originalSlug={formData.slug}
              originalContent={formData.content}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Enter post title"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content
              </label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Write your post content..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                rows={3}
                placeholder="Brief summary of the post (optional)"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="post-url-slug"
              />
              <p className="mt-2 text-sm text-slate-500">
                URL-friendly version of the title. Leave empty to auto-generate.
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/posts')}
              className="px-6 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              <FiSave className="mr-2" size={18} />
              {saving ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


