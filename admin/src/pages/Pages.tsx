/**
 * Pages Page
 * Manage static pages with search, filter, and actions
 * With comprehensive tooltips for user guidance
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pagesApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { PageCustomizationPanel } from '../components/PageCustomizer';
import toast from 'react-hot-toast';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiSearch, FiSliders, FiHelpCircle } from 'react-icons/fi';
import Tooltip from '../components/Tooltip';

// Tooltip content for pages
const PAGES_TOOLTIPS = {
  addNew: { title: 'Create New Page', content: 'Create a static page like About, Contact, or Services. Pages don\'t have dates like posts.' },
  search: { title: 'Search Pages', content: 'Find pages by title. Start typing to filter the list.' },
  statusFilter: { title: 'Filter by Status', content: 'Show only published pages, drafts, or all pages.' },
  edit: { title: 'Edit Page', content: 'Open the page editor to modify content, title, or settings.' },
  view: { title: 'View Page', content: 'Preview how this page looks on your website.' },
  customize: { title: 'Customize Style', content: 'Adjust the visual appearance of this specific page.' },
  delete: { title: 'Delete Page', content: 'Permanently remove this page. This action cannot be undone.' },
};

export default function Pages() {
  const navigate = useNavigate();
  const theme = useThemeClasses();

  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; pageId: string | null }>({
    isOpen: false,
    pageId: null,
  });
  const [customizePanel, setCustomizePanel] = useState<{ isOpen: boolean; pageId: string | null; pageName: string | null }>({
    isOpen: false,
    pageId: null,
    pageName: null,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await pagesApi.getAll();
      setPages(response.data.data);
    } catch (error) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await pagesApi.delete(id);
      toast.success('Page deleted successfully');
      fetchPages();
      setDeleteConfirm({ isOpen: false, pageId: null });
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Pages</h1>
          <Tooltip title="About Pages" content="Static pages are timeless content like About, Contact, or Services. Unlike posts, they don't appear in your blog feed." position="right" variant="help">
            <button className={`p-1 ${theme.icon} hover:text-blue-400`}>
              <FiHelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
        <Tooltip title={PAGES_TOOLTIPS.addNew.title} content={PAGES_TOOLTIPS.addNew.content} position="left">
          <button
            onClick={() => navigate('/pages/new')}
            className="flex items-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2 rounded-xl hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <FiPlus className="mr-2" size={18} />
            Add New Page
          </button>
        </Tooltip>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <Tooltip title={PAGES_TOOLTIPS.search.title} content={PAGES_TOOLTIPS.search.content} position="bottom">
          <div className="flex-1 relative">
            <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.icon}`} size={20} />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 ${theme.input}`}
            />
          </div>
        </Tooltip>
        <Tooltip title={PAGES_TOOLTIPS.statusFilter.title} content={PAGES_TOOLTIPS.statusFilter.content} position="bottom">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 ${theme.select}`}
          >
            <option value="all">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </Tooltip>
      </div>

      <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
        <table className={`min-w-full divide-y ${theme.border}`}>
          <thead className={theme.tableHeader}>
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Title</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Status</th>
              <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Date</th>
              <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${theme.textMuted}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.border}`}>
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan={4} className={`px-6 py-12 text-center ${theme.textMuted}`}>
                  No pages found
                </td>
              </tr>
            ) : (
              filteredPages.map((page) => (
                <tr key={page.id} className={theme.tableRow}>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${theme.textPrimary}`}>{page.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      page.status === 'PUBLISHED' ? theme.badgeSuccess : theme.badgeWarning
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>
                    {new Date(page.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Tooltip title={PAGES_TOOLTIPS.view.title} content={PAGES_TOOLTIPS.view.content} position="top">
                      <button
                        onClick={() => window.open(`http://localhost:3000/${page.slug}`, '_blank')}
                        className={`mr-3 transition-colors ${theme.icon} ${theme.iconHover}`}
                      >
                        <FiEye size={18} />
                      </button>
                    </Tooltip>
                    <Tooltip title={PAGES_TOOLTIPS.edit.title} content={PAGES_TOOLTIPS.edit.content} position="top">
                      <button
                        onClick={() => navigate(`/pages/edit/${page.id}`)}
                        className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </Tooltip>
                    <Tooltip title={PAGES_TOOLTIPS.customize.title} content={PAGES_TOOLTIPS.customize.content} position="top">
                      <button
                        onClick={() => setCustomizePanel({ isOpen: true, pageId: page.id, pageName: page.title })}
                        className="text-purple-400 hover:text-purple-300 mr-3 transition-colors"
                      >
                        <FiSliders size={18} />
                      </button>
                    </Tooltip>
                    <Tooltip title={PAGES_TOOLTIPS.delete.title} content={PAGES_TOOLTIPS.delete.content} position="top" variant="warning">
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, pageId: page.id })}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Page"
        message="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm.pageId && handleDelete(deleteConfirm.pageId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, pageId: null })}
      />

      {/* Page Customization Panel */}
      {customizePanel.isOpen && customizePanel.pageId && customizePanel.pageName && (
        <PageCustomizationPanel
          pageId={customizePanel.pageId}
          pageName={customizePanel.pageName}
          onClose={() => setCustomizePanel({ isOpen: false, pageId: null, pageName: null })}
        />
      )}
    </div>
  );
}


