/**
 * Activity Feed Page
 * Shows timeline posts from followed users and discover content
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { timelineApi, profileApi, TimelinePost, SuggestedUser } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  FiUsers, FiCompass, FiHeart, FiMessageCircle, FiTrendingUp,
  FiUserPlus, FiRefreshCw, FiShare2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import PostMediaGallery from '../../components/PostMediaGallery';

type TabType = 'following' | 'discover';

export default function ActivityFeed() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('following');
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const fetchFn = activeTab === 'following' ? timelineApi.getFeed : timelineApi.getDiscover;
      const res = await fetchFn(currentPage, 20);

      if (reset) {
        setPosts(res.data.data);
      } else {
        setPosts(prev => [...prev, ...res.data.data]);
      }
      setHasMore(res.data.meta.hasMore);
    } catch (err) {
      console.error('Error loading feed:', err);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, page]);

  const loadSuggestedUsers = async () => {
    try {
      const res = await profileApi.getSuggestedUsers(5);
      setSuggestedUsers(res.data);
    } catch (err) {
      console.error('Error loading suggested users:', err);
    }
  };

  useEffect(() => {
    loadFeed(true);
    loadSuggestedUsers();
  }, [activeTab]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadFeed(false);
  };

  const handleFollow = async (userId: string) => {
    try {
      await profileApi.followUser(userId);
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Now following user');
    } catch (err) {
      toast.error('Failed to follow user');
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await timelineApi.likePost(postId);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p
      ));
    } catch (err) {
      // Already liked - try unlike
      try {
        await timelineApi.unlikePost(postId);
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1), isLiked: false } : p
        ));
      } catch (e) {
        toast.error('Failed to update like');
      }
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Activity Feed</h1>
          <p className="text-gray-600 dark:text-gray-400">Stay updated with your network's activities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'following'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  Following
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'discover'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <FiCompass className="w-4 h-4" />
                  Discover
                </button>
              </div>
            </div>

            {/* Refresh */}
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => loadFeed(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Posts List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <FiUsers className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {activeTab === 'following' ? 'No posts yet' : 'Nothing to discover'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'following'
                    ? 'Follow more users to see their posts here'
                    : 'Check back later for trending content'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <Link to={`/profile/${post.user.username || post.user.id}`}>
                        {post.user.avatar ? (
                          <img src={post.user.avatar} alt={post.user.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {post.user.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/profile/${post.user.username || post.user.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600">
                            {post.user.name}
                          </Link>
                          <span className="text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-3">{post.content}</p>
                        {post.media && post.media.length > 0 && (
                          <PostMediaGallery
                            media={post.media.map(m => ({
                              id: m.id,
                              type: m.type,
                              url: m.url,
                              thumbnail: m.thumbnail,
                              altText: m.altText,
                            }))}
                            className="mb-3"
                          />
                        )}
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                          >
                            <FiHeart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                            {post.likesCount || 0}
                          </button>
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <FiMessageCircle className="w-4 h-4" />
                            {post.commentsCount || 0}
                          </span>
                          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition">
                            <FiShare2 className="w-4 h-4" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 text-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4 text-blue-500" />
                  Suggested for you
                </h3>
              </div>
              {suggestedUsers.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No suggestions available</p>
              ) : (
                <div className="space-y-4">
                  {suggestedUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Link to={`/profile/${user.username || user.id}`}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${user.username || user.id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 truncate block">
                          {user.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.headline || `${user.followersCount} followers`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleFollow(user.id)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
