/**
 * Homepage Panel Component
 * Allows customization of homepage settings and featured sections
 */

import { useState, useEffect } from 'react';
import { CustomThemeSettings, pagesApi } from '../../services/api';

interface HomepagePanelProps {
  settings: CustomThemeSettings;
  onChange: (path: string, value: any) => void;
}

interface Page {
  id: string;
  title: string;
  slug: string;
}

export default function HomepagePanel({ settings, onChange }: HomepagePanelProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [homepageType, setHomepageType] = useState<'posts' | 'static'>(
    settings.homepage?.type || 'posts'
  );
  const [selectedHomepage, setSelectedHomepage] = useState<string>(
    settings.homepage?.pageId || ''
  );
  const [selectedBlogPage, setSelectedBlogPage] = useState<string>(
    settings.homepage?.blogPageId || ''
  );

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      // Fetch all pages, not just published (in case they want to preview draft pages)
      const response = await pagesApi.getAll({ limit: 100 });
      // Handle different response structures
      const pageData = response.data?.data || response.data?.pages || response.data || [];
      setPages(Array.isArray(pageData) ? pageData : []);
    } catch (error) {
      console.error('Error loading pages:', error);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHomepageTypeChange = (type: 'posts' | 'static') => {
    setHomepageType(type);
    onChange('homepage.type', type);
  };

  const handleHomepageSelect = (pageId: string) => {
    setSelectedHomepage(pageId);
    onChange('homepage.pageId', pageId);
  };

  const handleBlogPageSelect = (pageId: string) => {
    setSelectedBlogPage(pageId);
    onChange('homepage.blogPageId', pageId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Homepage Display</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
            <input
              type="radio"
              name="homepage"
              checked={homepageType === 'posts'}
              onChange={() => handleHomepageTypeChange('posts')}
              className="w-4 h-4"
            />
            <div>
              <div className="text-sm text-white">Latest Posts</div>
              <div className="text-xs text-gray-400">Show your latest blog posts</div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
            <input
              type="radio"
              name="homepage"
              checked={homepageType === 'static'}
              onChange={() => handleHomepageTypeChange('static')}
              className="w-4 h-4"
            />
            <div>
              <div className="text-sm text-white">Static Page</div>
              <div className="text-xs text-gray-400">Select a page as your homepage</div>
            </div>
          </label>
        </div>
      </div>

      {homepageType === 'static' && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Select Homepage</h3>
          <select
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            disabled={loading}
            value={selectedHomepage}
            onChange={(e) => handleHomepageSelect(e.target.value)}
          >
            <option value="">-- Select a page --</option>
            {pages.map(page => (
              <option key={page.id} value={page.id}>{page.title}</option>
            ))}
          </select>
          {loading && <p className="text-xs text-gray-500 mt-1">Loading pages...</p>}
          {!loading && pages.length === 0 && (
            <p className="text-xs text-amber-400 mt-1">No pages found. Create a page first.</p>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Blog Page</h3>
        <select
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          disabled={loading}
          value={selectedBlogPage}
          onChange={(e) => handleBlogPageSelect(e.target.value)}
        >
          <option value="">-- Select blog page --</option>
          {pages.map(page => (
            <option key={page.id} value={page.id}>{page.title}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Where your blog posts will be displayed</p>
        {!loading && pages.length === 0 && (
          <p className="text-xs text-amber-400 mt-1">No pages found. Create a page first.</p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Featured Sections</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="text-sm text-white">Hero Section</div>
              <div className="text-xs text-gray-400">Large banner at the top</div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-600 border-gray-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="text-sm text-white">Featured Posts</div>
              <div className="text-xs text-gray-400">Highlight selected posts</div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-600 border-gray-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="text-sm text-white">Featured Products</div>
              <div className="text-xs text-gray-400">Shop products showcase</div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-600 border-gray-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="text-sm text-white">Featured Courses</div>
              <div className="text-xs text-gray-400">LMS courses showcase</div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-600 border-gray-500" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div>
              <div className="text-sm text-white">Newsletter Signup</div>
              <div className="text-xs text-gray-400">Email subscription form</div>
            </div>
            <input type="checkbox" className="w-5 h-5 rounded bg-gray-600 border-gray-500" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white mb-3">Posts Per Page</h3>
        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
          <option value="6">6 posts</option>
          <option value="9">9 posts</option>
          <option value="12" selected>12 posts</option>
          <option value="15">15 posts</option>
        </select>
      </div>

      {/* Quick Links */}
      <div className="p-4 bg-gray-700 rounded-lg">
        <h4 className="text-xs text-gray-400 uppercase mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <a href="/admin/pages/new" className="block text-sm text-blue-400 hover:underline">
            + Create a new page
          </a>
          <a href="/admin/posts/new" className="block text-sm text-blue-400 hover:underline">
            + Create a new post
          </a>
          <a href="/admin/theme-designer" className="block text-sm text-blue-400 hover:underline">
            → Open Theme Designer
          </a>
        </div>
      </div>
    </div>
  );
}

