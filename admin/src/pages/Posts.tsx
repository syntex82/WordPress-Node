/**
 * Posts Page
 * Manage blog posts with comprehensive tooltips
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { PostCustomizationPanel } from '../components/PageCustomizer';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiSliders, FiHelpCircle } from 'react-icons/fi';
import Tooltip from '../components/Tooltip';

// Tooltip content for posts page
const POSTS_TOOLTIPS = {
  addNew: { title: 'Create New Post', content: 'Start writing a new blog post. Add content, images, and publish when ready.' },
  search: { title: 'Search Posts', content: 'Find posts by title. Start typing to filter the list.' },
  statusFilter: { title: 'Filter by Status', content: 'Show only published posts, drafts, or all posts.' },
  selectAll: { title: 'Select All', content: 'Select all visible posts for bulk actions like delete.' },
  edit: { title: 'Edit Post', content: 'Open the post editor to modify content, title, or settings.' },
  view: { title: 'View Post', content: 'Preview how this post looks on your website.' },
  customize: { title: 'Customize Style', content: 'Adjust the visual appearance of this specific post.' },
  delete: { title: 'Delete Post', content: 'Permanently remove this post. This action cannot be undone.' },
  bulkDelete: { title: 'Delete Selected', content: 'Delete all selected posts at once.' },
};

export default function Posts() {
  const navigate = useNavigate();
  const theme = useThemeClasses();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; postId: string | null }>({
    isOpen: false,
    postId: null,
  });
  const [customizePanel, setCustomizePanel] = useState<{ isOpen: boolean; postId: string | null; postTitle: string | null }>({
    isOpen: false,
    postId: null,
    postTitle: null,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await postsApi.getAll();
      setPosts(response.data.data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await postsApi.delete(id);
      toast.success('Post deleted successfully');
      fetchPosts();
      setDeleteConfirm({ isOpen: false, postId: null });
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;

    if (!window.confirm(`Delete ${selectedPosts.length} posts?`)) return;

    try {
      await Promise.all(selectedPosts.map(id => postsApi.delete(id)));
      toast.success(`${selectedPosts.length} posts deleted`);
      setSelectedPosts([]);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete some posts');
    }
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === filteredPosts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(filteredPosts.map(p => p.id));
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Posts</h1>
          <Tooltip title="About Posts" content="Blog posts are time-based content that appears in your blog feed. Use posts for news, articles, and updates." position="right" variant="help">
            <button className={`p-1 ${theme.icon} hover:text-blue-400`}>
              <FiHelpCircle size={18} />
            </button>
          </Tooltip>
        </div>
        <Tooltip title={POSTS_TOOLTIPS.addNew.title} content={POSTS_TOOLTIPS.addNew.content} position="left">
          <button
            onClick={() => navigate('/posts/new')}
            className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all"
          >
            <FiPlus className="mr-2" size={18} />
            Add New Post
          </button>
        </Tooltip>
      </div>

      {/* Search and Filters */}
      <div className={`backdrop-blur rounded-xl border p-4 mb-6 ${theme.card}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <Tooltip title={POSTS_TOOLTIPS.search.title} content={POSTS_TOOLTIPS.search.content} position="bottom">
            <div className="flex-1 relative">
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.icon}`} size={20} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
              />
            </div>
          </Tooltip>
          <Tooltip title={POSTS_TOOLTIPS.statusFilter.title} content={POSTS_TOOLTIPS.statusFilter.content} position="bottom">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.select}`}
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </Tooltip>
        </div>

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <span className={`text-sm ${theme.textMuted}`}>{selectedPosts.length} selected</span>
            <Tooltip title={POSTS_TOOLTIPS.bulkDelete.title} content={POSTS_TOOLTIPS.bulkDelete.content} position="right" variant="warning">
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Delete Selected
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Posts Table */}
      <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className={theme.textMuted}>No posts found</p>
          </div>
        ) : (
          <table className={`min-w-full divide-y ${theme.border}`}>
            <thead className={theme.tableHeader}>
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === filteredPosts.length}
                    onChange={toggleSelectAll}
                    className={`rounded text-blue-500 focus:ring-blue-500/50 ${theme.isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'}`}
                  />
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Title</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Author</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Date</th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${theme.textMuted}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {filteredPosts.map((post) => (
                <tr key={post.id} className={theme.tableRow}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPosts([...selectedPosts, post.id]);
                        } else {
                          setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                        }
                      }}
                      className={`rounded text-blue-500 focus:ring-blue-500/50 ${theme.isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${theme.textPrimary}`}>{post.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${theme.textMuted}`}>{post.author.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      post.status === 'PUBLISHED' ? theme.badgeSuccess : theme.badgeWarning
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textMuted}`}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Tooltip title={POSTS_TOOLTIPS.view.title} content={POSTS_TOOLTIPS.view.content} position="top">
                      <button
                        onClick={() => window.open(`http://localhost:3000/post/${post.slug}`, '_blank')}
                        className={`mr-3 transition-colors ${theme.icon} ${theme.iconHover}`}
                      >
                        <FiEye size={18} />
                      </button>
                    </Tooltip>
                    <Tooltip title={POSTS_TOOLTIPS.edit.title} content={POSTS_TOOLTIPS.edit.content} position="top">
                      <button
                        onClick={() => navigate(`/posts/edit/${post.id}`)}
                        className="text-blue-400 hover:text-blue-300 mr-3 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </Tooltip>
                    <Tooltip title={POSTS_TOOLTIPS.customize.title} content={POSTS_TOOLTIPS.customize.content} position="top">
                      <button
                        onClick={() => setCustomizePanel({ isOpen: true, postId: post.id, postTitle: post.title })}
                        className="text-purple-400 hover:text-purple-300 mr-3 transition-colors"
                      >
                        <FiSliders size={18} />
                      </button>
                    </Tooltip>
                    <Tooltip title={POSTS_TOOLTIPS.delete.title} content={POSTS_TOOLTIPS.delete.content} position="top" variant="warning">
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, postId: post.id })}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => deleteConfirm.postId && handleDelete(deleteConfirm.postId)}
        onCancel={() => setDeleteConfirm({ isOpen: false, postId: null })}
      />

      {/* Post Customization Panel */}
      {customizePanel.isOpen && customizePanel.postId && customizePanel.postTitle && (
        <PostCustomizationPanel
          postId={customizePanel.postId}
          postTitle={customizePanel.postTitle}
          onClose={() => setCustomizePanel({ isOpen: false, postId: null, postTitle: null })}
        />
      )}
    </div>
  );
}


