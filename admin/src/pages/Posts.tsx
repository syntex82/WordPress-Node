/**
 * Posts Page
 * Enhanced mobile post management with social media-style cards
 * Features: Recording, rich media previews, swipe gestures, haptic feedback
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi } from '../services/api';
import { useThemeClasses } from '../contexts/SiteThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { PostCustomizationPanel } from '../components/PageCustomizer';
import MobileMediaRecorder from '../components/MobileMediaRecorder';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiSliders, FiHelpCircle,
  FiVideo, FiMic, FiHeart, FiMessageCircle, FiShare2, FiMoreHorizontal,
  FiGrid, FiList, FiCalendar, FiUser, FiImage, FiPlay, FiBookmark,
  FiTrendingUp, FiClock, FiExternalLink
} from 'react-icons/fi';
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
  recordVideo: { title: 'Record Video', content: 'Record a video directly from your device camera.' },
  recordAudio: { title: 'Record Audio', content: 'Record audio directly from your device microphone.' },
};

// View mode type
type ViewMode = 'cards' | 'table';

export default function Posts() {
  const navigate = useNavigate();
  const theme = useThemeClasses();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [showRecorder, setShowRecorder] = useState(false);
  const [recorderMode, setRecorderMode] = useState<'video' | 'audio'>('video');
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; postId: string | null }>({
    isOpen: false,
    postId: null,
  });
  const [customizePanel, setCustomizePanel] = useState<{ isOpen: boolean; postId: string | null; postTitle: string | null }>({
    isOpen: false,
    postId: null,
    postTitle: null,
  });

  // Touch/swipe handling refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Haptic feedback helper
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(patterns[type]);
    }
  };

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

  // Toggle like on a post (local state for demo)
  const toggleLike = (postId: string) => {
    triggerHaptic('light');
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Toggle bookmark on a post
  const toggleBookmark = (postId: string) => {
    triggerHaptic('medium');
    setBookmarkedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        toast.success('Removed from bookmarks');
      } else {
        newSet.add(postId);
        toast.success('Added to bookmarks');
      }
      return newSet;
    });
  };

  // Handle media recording complete
  const handleMediaCaptured = (media: { type: 'VIDEO' | 'AUDIO'; url: string }) => {
    // Navigate to post editor with the captured media
    navigate('/posts/new', { state: { capturedMedia: media } });
    setShowRecorder(false);
  };

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent, postId: string) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX.current - touchStartX.current;

    // Swipe left to delete (threshold: 100px)
    if (swipeDistance < -100) {
      triggerHaptic('medium');
      setDeleteConfirm({ isOpen: true, postId });
    }
    // Swipe right to edit (threshold: 100px)
    else if (swipeDistance > 100) {
      triggerHaptic('light');
      navigate(`/posts/edit/${postId}`);
    }
  };

  // Extract excerpt from HTML content
  const extractExcerpt = (content: string, maxLength: number = 150) => {
    const stripped = content?.replace(/<[^>]*>/g, '') || '';
    return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
  };

  // Check if content has media
  const hasMedia = (post: any) => {
    return post.featuredImage || post.content?.includes('<img') || post.content?.includes('<video');
  };

  // Get featured image from post
  const getFeaturedImage = (post: any) => {
    if (post.featuredImage) return post.featuredImage;
    const imgMatch = post.content?.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="pb-24 lg:pb-0">
      {/* Mobile-First Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl sm:text-3xl font-bold ${theme.titleGradient}`}>Posts</h1>
          <Tooltip title="About Posts" content="Blog posts are time-based content that appears in your blog feed. Use posts for news, articles, and updates." position="right" variant="help">
            <button className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${theme.icon} hover:text-blue-400`}>
              <FiHelpCircle size={20} />
            </button>
          </Tooltip>
        </div>

        {/* Action Buttons - Touch Optimized */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View Toggle */}
          <div className={`hidden sm:flex items-center rounded-xl border ${theme.card} p-1`}>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards'
                ? 'bg-blue-500 text-white'
                : theme.isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <FiGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table'
                ? 'bg-blue-500 text-white'
                : theme.isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <FiList size={18} />
            </button>
          </div>

          {/* Recording Buttons - Mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <Tooltip title={POSTS_TOOLTIPS.recordVideo.title} content={POSTS_TOOLTIPS.recordVideo.content}>
              <button
                onClick={() => { setRecorderMode('video'); setShowRecorder(true); }}
                className={`p-3 min-w-[48px] min-h-[48px] rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                  theme.isDark
                    ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
                    : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                }`}
              >
                <FiVideo size={22} />
              </button>
            </Tooltip>
            <Tooltip title={POSTS_TOOLTIPS.recordAudio.title} content={POSTS_TOOLTIPS.recordAudio.content}>
              <button
                onClick={() => { setRecorderMode('audio'); setShowRecorder(true); }}
                className={`p-3 min-w-[48px] min-h-[48px] rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                  theme.isDark
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                }`}
              >
                <FiMic size={22} />
              </button>
            </Tooltip>
          </div>

          {/* Create Post Button */}
          <Tooltip title={POSTS_TOOLTIPS.addNew.title} content={POSTS_TOOLTIPS.addNew.content} position="left">
            <button
              onClick={() => navigate('/posts/new')}
              className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 sm:py-2 rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all active:scale-95 min-h-[48px]"
            >
              <FiPlus className="mr-2" size={20} />
              <span className="hidden sm:inline">Add New Post</span>
              <span className="sm:hidden">New</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Search, Filters and Recording Options */}
      <div className={`backdrop-blur rounded-2xl border p-4 mb-6 ${theme.card}`}>
        <div className="flex flex-col gap-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FiSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.icon}`} size={20} />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-base focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 ${theme.input}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-3 rounded-xl text-base focus:ring-2 focus:ring-blue-500/50 min-h-[48px] ${theme.select}`}
            >
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* Desktop Recording Options */}
          <div className="hidden sm:flex items-center gap-3 pt-2 border-t border-dashed ${theme.border}">
            <span className={`text-sm ${theme.textMuted}`}>Quick create:</span>
            <button
              onClick={() => { setRecorderMode('video'); setShowRecorder(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                theme.isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              }`}
            >
              <FiVideo size={18} />
              Record Video
            </button>
            <button
              onClick={() => { setRecorderMode('audio'); setShowRecorder(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                theme.isDark
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                  : 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100'
              }`}
            >
              <FiMic size={18} />
              Record Audio
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPosts.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center gap-4 ${theme.border}">
            <span className={`text-sm ${theme.textMuted}`}>{selectedPosts.length} selected</span>
            <button
              onClick={handleBulkDelete}
              className="text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Posts Display - Cards (Mobile Default) or Table */}
      {filteredPosts.length === 0 ? (
        <div className={`backdrop-blur rounded-2xl border p-12 text-center ${theme.card}`}>
          <FiImage size={48} className={`mx-auto mb-4 ${theme.textMuted}`} />
          <p className={`text-lg ${theme.textMuted}`}>No posts found</p>
          <p className={`text-sm mt-2 ${theme.textMuted}`}>Create your first post to get started</p>
          <button
            onClick={() => navigate('/posts/new')}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            Create Post
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Social Media Style Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredPosts.map((post) => {
            const featuredImage = getFeaturedImage(post);
            const isLiked = likedPosts.has(post.id);
            const isBookmarked = bookmarkedPosts.has(post.id);

            return (
              <div
                key={post.id}
                className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  theme.isDark
                    ? 'bg-slate-800/80 border-slate-700/50 hover:border-slate-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onTouchStart={handleTouchStart}
                onTouchEnd={(e) => handleTouchEnd(e, post.id)}
              >
                {/* Featured Image / Media Preview */}
                {featuredImage && (
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Play button overlay for video content */}
                    {post.content?.includes('<video') && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <FiPlay size={24} className="text-gray-800 ml-1" />
                        </div>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-sm ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}>
                        {post.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    {/* Bookmark Button */}
                    <button
                      onClick={() => toggleBookmark(post.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all active:scale-90 ${
                        isBookmarked
                          ? 'bg-blue-500 text-white'
                          : 'bg-black/30 text-white hover:bg-black/50'
                      }`}
                    >
                      <FiBookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                    </button>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4">
                  {/* Author Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        theme.isDark ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                      }`}>
                        {post.author?.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${theme.textPrimary}`}>{post.author?.name}</p>
                        <div className={`flex items-center gap-1 text-xs ${theme.textMuted}`}>
                          <FiClock size={12} />
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveCardMenu(activeCardMenu === post.id ? null : post.id)}
                        className={`p-2 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                          theme.isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <FiMoreHorizontal size={20} className={theme.icon} />
                      </button>

                      {activeCardMenu === post.id && (
                        <div className={`absolute right-0 top-full mt-1 w-48 rounded-xl shadow-xl border z-20 overflow-hidden ${
                          theme.isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'
                        }`}>
                          <button
                            onClick={() => { navigate(`/posts/edit/${post.id}`); setActiveCardMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              theme.isDark ? 'hover:bg-slate-600 text-slate-200' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <FiEdit2 size={16} className="text-blue-400" />
                            Edit Post
                          </button>
                          <button
                            onClick={() => { window.open(`/post/${post.slug}`, '_blank'); setActiveCardMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              theme.isDark ? 'hover:bg-slate-600 text-slate-200' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <FiExternalLink size={16} className="text-green-400" />
                            View Live
                          </button>
                          <button
                            onClick={() => { setCustomizePanel({ isOpen: true, postId: post.id, postTitle: post.title }); setActiveCardMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                              theme.isDark ? 'hover:bg-slate-600 text-slate-200' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <FiSliders size={16} className="text-purple-400" />
                            Customize
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm({ isOpen: true, postId: post.id }); setActiveCardMenu(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors ${
                              theme.isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                            }`}
                          >
                            <FiTrash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    className={`font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-500 transition-colors ${theme.textPrimary}`}
                    onClick={() => navigate(`/posts/edit/${post.id}`)}
                  >
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className={`text-sm line-clamp-2 mb-4 ${theme.textMuted}`}>
                    {post.excerpt || extractExcerpt(post.content)}
                  </p>

                  {/* Engagement Actions - Social Media Style */}
                  <div className={`flex items-center justify-between pt-3 border-t ${theme.border}`}>
                    <div className="flex items-center gap-1">
                      {/* Like Button */}
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 min-h-[44px] ${
                          isLiked
                            ? 'text-red-500 bg-red-500/10'
                            : theme.isDark
                              ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700'
                              : 'text-gray-500 hover:text-red-500 hover:bg-gray-100'
                        }`}
                      >
                        <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
                        <span className="text-sm font-medium">{isLiked ? 1 : 0}</span>
                      </button>

                      {/* Comment indicator */}
                      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${theme.textMuted}`}>
                        <FiMessageCircle size={18} />
                        <span className="text-sm">0</span>
                      </div>

                      {/* Share Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
                          toast.success('Link copied!');
                          triggerHaptic('light');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95 min-h-[44px] ${
                          theme.isDark
                            ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'
                            : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
                        }`}
                      >
                        <FiShare2 size={18} />
                      </button>
                    </div>

                    {/* Analytics indicator */}
                    <div className={`flex items-center gap-1 text-xs ${theme.textMuted}`}>
                      <FiTrendingUp size={14} />
                      <span>—</span>
                    </div>
                  </div>
                </div>

                {/* Selection checkbox - hidden but accessible */}
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
                  className="sr-only"
                  aria-label={`Select ${post.title}`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View (Desktop) */
        <div className={`backdrop-blur rounded-2xl border overflow-hidden ${theme.card}`}>
          <table className={`min-w-full divide-y ${theme.border}`}>
            <thead className={theme.tableHeader}>
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                    onChange={toggleSelectAll}
                    className={`rounded text-blue-500 focus:ring-blue-500/50 ${theme.isDark ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-white'}`}
                  />
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>Post</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>Author</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>Status</th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>Date</th>
                <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${theme.textMuted}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {filteredPosts.map((post) => (
                <tr key={post.id} className={`${theme.tableRow} transition-colors`}>
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
                    <div className="flex items-center gap-3">
                      {getFeaturedImage(post) && (
                        <img
                          src={getFeaturedImage(post)}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <div className={`font-medium ${theme.textPrimary}`}>{post.title}</div>
                        <div className={`text-sm ${theme.textMuted}`}>{extractExcerpt(post.content, 60)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600`}>
                        {post.author?.name?.charAt(0) || 'A'}
                      </div>
                      <span className={`text-sm ${theme.textMuted}`}>{post.author?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-full ${
                      post.status === 'PUBLISHED' ? theme.badgeSuccess : theme.badgeWarning
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textMuted}`}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => window.open(`/post/${post.slug}`, '_blank')}
                        className={`p-2 rounded-lg transition-colors ${theme.icon} hover:text-blue-400 hover:bg-blue-500/10`}
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/posts/edit/${post.id}`)}
                        className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => setCustomizePanel({ isOpen: true, postId: post.id, postTitle: post.title })}
                        className="p-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                      >
                        <FiSliders size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, postId: post.id })}
                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          onClick={() => navigate('/posts/new')}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <FiPlus size={24} />
        </button>
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

      {/* Mobile Media Recorder */}
      <MobileMediaRecorder
        isOpen={showRecorder}
        onClose={() => setShowRecorder(false)}
        onMediaCaptured={handleMediaCaptured}
        mode={recorderMode}
      />

      {/* Click outside to close card menus */}
      {activeCardMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveCardMenu(null)}
        />
      )}
    </div>
  );
}


