/**
 * Page Editor
 * Create and edit pages
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pagesApi } from '../services/api';
import RichTextEditor from '../components/RichTextEditor';
import toast from 'react-hot-toast';
import { FiSave, FiEye, FiArrowLeft } from 'react-icons/fi';

export default function PageEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
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
      // Don't send slug - backend auto-generates it from title
      const { slug, ...dataToSend } = formData;
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/pages')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Page' : 'Create New Page'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FiEye className="mr-2" size={18} />
            Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSave className="mr-2" size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Page title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-3xl font-bold border-none focus:ring-0 focus:outline-none"
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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Page Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="page-url-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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


