/**
 * Timeline Page
 * Rich media timeline with posts, images, videos, and interactions
 * Includes trending hashtags, sharing, mentions, and real-time updates
 * Now with TikTok-style immersive feed mode!
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { timelineApi, profileApi, TimelinePost, SuggestedUser } from '../../services/api';
import PostCard from '../../components/PostCard';
import CreatePostForm from '../../components/CreatePostForm';
import CommentModal from '../../components/CommentModal';
import EditPostModal from '../../components/EditPostModal';
import ImmersiveFeed from '../../components/ImmersiveFeed';
import { FiUsers, FiCompass, FiTrendingUp, FiRefreshCw, FiHash, FiBell, FiGrid, FiPlay } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../stores/authStore';

type TabType = 'following' | 'discover' | 'hashtag';
type ViewMode = 'grid' | 'immersive';

interface TrendingHashtag {
  id: string;
  tag: string;
  postCount: number;
}

export default function Timeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('following');
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [commentModalPostId, setCommentModalPostId] = useState<string | null>(null);
  const [commentModalPost, setCommentModalPost] = useState<TimelinePost | null>(null);
  const [editModalPost, setEditModalPost] = useState<TimelinePost | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();

  // If in immersive mode, render the ImmersiveFeed
  if (viewMode === 'immersive') {
    return (
      <ImmersiveFeed
        initialPosts={posts}
        onSwitchToGrid={() => setViewMode('grid')}
      />
    );
  }

  const loadPosts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        setNewPostsCount(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      let res;

      if (activeTab === 'hashtag' && activeHashtag) {
        res = await timelineApi.getPostsByHashtag(activeHashtag, currentPage, 20);
      } else if (activeTab === 'following') {
        res = await timelineApi.getFeed(currentPage, 20);
      } else {
        res = await timelineApi.getDiscover(currentPage, 20);
      }

      if (reset) {
        setPosts(res.data.data);
      } else {
        setPosts((prev) => [...prev, ...res.data.data]);
      }
      setHasMore(res.data.meta.hasMore);
    } catch (err) {
      console.error('Error loading posts:', err);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, activeHashtag, page]);

  const loadSuggestedUsers = async () => {
    try {
      const res = await profileApi.getSuggestedUsers(5);
      setSuggestedUsers(res.data);
    } catch (err) {
      console.error('Error loading suggested users:', err);
    }
  };

  const loadTrendingHashtags = async () => {
    try {
      const res = await timelineApi.getTrendingHashtags(8);
      setTrendingHashtags(res.data);
    } catch (err) {
      console.error('Error loading trending hashtags:', err);
    }
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!token) return;

    const socket = io(`${window.location.protocol}//${window.location.host}/timeline`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to timeline WebSocket');
    });

    socket.on('post:new', (post: TimelinePost) => {
      // Don't add duplicate posts
      setPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) return prev;
        // Increment new posts count instead of adding directly
        setNewPostsCount((c) => c + 1);
        return prev;
      });
    });

    socket.on('post:liked', ({ postId, likesCount }: { postId: string; likesCount: number }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likesCount } : p))
      );
    });

    socket.on('post:unliked', ({ postId, likesCount }: { postId: string; likesCount: number }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likesCount } : p))
      );
    });

    socket.on('post:commented', ({ postId, commentsCount }: { postId: string; commentsCount: number }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount } : p))
      );
    });

    socket.on('post:shared', ({ originalPostId, sharesCount }: { originalPostId: string; sharesCount: number }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === originalPostId ? { ...p, sharesCount } : p))
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Handle hashtag from URL
  useEffect(() => {
    const hashtagParam = searchParams.get('hashtag');
    if (hashtagParam) {
      setActiveHashtag(hashtagParam);
      setActiveTab('hashtag');
    }
  }, [searchParams]);

  useEffect(() => {
    loadPosts(true);
    loadSuggestedUsers();
    loadTrendingHashtags();
  }, [activeTab, activeHashtag]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
    loadPosts(false);
  };

  const handlePostCreated = () => {
    loadPosts(true);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleFollow = async (userId: string) => {
    try {
      await profileApi.followUser(userId);
      setSuggestedUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success('Now following user');
    } catch {
      toast.error('Failed to follow user');
    }
  };

  const handleHashtagClick = (tag: string) => {
    setActiveHashtag(tag);
    setActiveTab('hashtag');
    setSearchParams({ hashtag: tag });
  };

  const handleClearHashtag = () => {
    setActiveHashtag(null);
    setActiveTab('following');
    setSearchParams({});
  };

  const handleShowNewPosts = () => {
    loadPosts(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mobile: edge-to-edge, Desktop: centered with max-width */}
      <div className="max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-8">
        {/* Header - hidden on mobile for immersive feel, visible on desktop */}
        <div className="hidden sm:flex mb-8 px-4 sm:px-0 items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Timeline</h1>
            <p className="text-gray-600 dark:text-gray-400">Share and discover posts from your network</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-blue-500 text-white shadow-md"
            >
              <FiGrid className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('immersive')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FiPlay className="w-4 h-4" />
              Immersive
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-8">
          {/* Main Feed - full width on mobile */}
          <div className="lg:col-span-2">
            {/* Create Post - padded on mobile */}
            <div className="px-4 sm:px-0">
              <CreatePostForm onPostCreated={handlePostCreated} />
            </div>

            {/* Tabs - sticky on mobile for easy navigation */}
            <div className="bg-white dark:bg-gray-800 sm:rounded-xl shadow-sm mb-0 sm:mb-6 sticky top-0 z-20">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => { setActiveTab('following'); handleClearHashtag(); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors ${
                    activeTab === 'following'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <FiUsers className="w-4 h-4" />
                  <span className="hidden sm:inline">Following</span>
                </button>
                <button
                  onClick={() => { setActiveTab('discover'); setActiveHashtag(null); setSearchParams({}); }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors ${
                    activeTab === 'discover'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  <FiCompass className="w-4 h-4" />
                  <span className="hidden sm:inline">Discover</span>
                </button>
                {activeTab === 'hashtag' && activeHashtag && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                    <FiHash className="w-4 h-4" />
                    <span className="truncate max-w-[80px] sm:max-w-none">#{activeHashtag}</span>
                    <button
                      onClick={handleClearHashtag}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* New Posts Notification */}
            {newPostsCount > 0 && (
              <button
                onClick={handleShowNewPosts}
                className="w-full mb-0 sm:mb-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 sm:rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <FiBell className="w-4 h-4" />
                {newPostsCount} new {newPostsCount === 1 ? 'post' : 'posts'} available
              </button>
            )}

            {/* Refresh Button - hidden on mobile, shown on desktop */}
            <div className="hidden sm:flex justify-end mb-4">
              <button
                onClick={() => loadPosts(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Posts List - continuous flow on mobile */}
            {loading ? (
              <div className="space-y-0 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 sm:rounded-xl p-4 sm:p-6 animate-pulse border-b sm:border-b-0 border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      </div>
                    </div>
                    {/* Skeleton for media */}
                    <div className="mt-3 h-48 sm:h-64 bg-gray-200 dark:bg-gray-700 rounded-none sm:rounded-xl" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 sm:rounded-xl p-8 sm:p-12 text-center mx-4 sm:mx-0">
                <FiUsers className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {activeTab === 'hashtag' && activeHashtag
                    ? `No posts with #${activeHashtag}`
                    : activeTab === 'following'
                    ? 'No posts yet'
                    : 'Nothing to discover'}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  {activeTab === 'hashtag'
                    ? 'Be the first to post with this hashtag'
                    : activeTab === 'following'
                    ? 'Follow more users or create your first post'
                    : 'Check back later for trending content'}
                </p>
              </div>
            ) : (
              <div className="space-y-0 sm:space-y-4 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={handlePostDeleted}
                    onEdit={setEditModalPost}
                    onHashtagClick={handleHashtagClick}
                    onCommentClick={(postId, postData) => {
                      setCommentModalPostId(postId);
                      setCommentModalPost(postData);
                    }}
                  />
                ))}

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-4 sm:py-3 text-center text-blue-600 hover:text-blue-700 font-medium bg-white dark:bg-gray-800 sm:rounded-xl"
                  >
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - hidden on mobile */}
          <div className="hidden lg:block space-y-6">
            {/* Trending Hashtags */}
            {trendingHashtags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiHash className="w-4 h-4 text-purple-500" />
                    Trending Hashtags
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingHashtags.map((hashtag) => (
                    <button
                      key={hashtag.id}
                      onClick={() => handleHashtagClick(hashtag.tag)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        activeHashtag === hashtag.tag
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      #{hashtag.tag}
                      <span className="ml-1 text-xs opacity-70">({hashtag.postCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                  {suggestedUsers.map((user) => (
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
                        <Link
                          to={`/profile/${user.username || user.id}`}
                          className="font-medium text-sm text-gray-900 dark:text-white hover:text-blue-600 truncate block"
                        >
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

      {/* Comment Modal */}
      <CommentModal
        postId={commentModalPostId || ''}
        post={commentModalPost || undefined}
        isOpen={!!commentModalPostId}
        onClose={() => {
          setCommentModalPostId(null);
          setCommentModalPost(null);
        }}
        onCommentAdded={() => {
          // Update comment count in the posts list
          setPosts(prev => prev.map(p =>
            p.id === commentModalPostId
              ? { ...p, commentsCount: p.commentsCount + 1 }
              : p
          ));
        }}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        post={editModalPost}
        isOpen={!!editModalPost}
        onClose={() => setEditModalPost(null)}
        onPostUpdated={(updatedPost) => {
          setPosts(prev => prev.map(p =>
            p.id === updatedPost.id ? updatedPost : p
          ));
        }}
      />
    </div>
  );
}
