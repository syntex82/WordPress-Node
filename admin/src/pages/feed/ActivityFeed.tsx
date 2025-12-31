/**
 * Activity Feed Page
 * Shows activities from followed users and discover content
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { feedApi, profileApi, FeedActivity, FeedActivityType, SuggestedUser } from '../../services/api';
import {
  FiUsers, FiCompass, FiTrendingUp, FiHeart, FiMessageCircle, FiBook, FiAward,
  FiUserPlus, FiEdit, FiRefreshCw, FiFilter, FiChevronDown, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';

type TabType = 'following' | 'discover';

const activityTypeLabels: Record<FeedActivityType, string> = {
  POST_PUBLISHED: 'Published a post',
  POST_LIKED: 'Liked a post',
  POST_COMMENTED: 'Commented on a post',
  COURSE_ENROLLED: 'Enrolled in a course',
  COURSE_COMPLETED: 'Completed a course',
  CERTIFICATE_EARNED: 'Earned a certificate',
  BADGE_EARNED: 'Earned a badge',
  PROFILE_UPDATED: 'Updated their profile',
  NEW_FOLLOWER: 'Has a new follower',
  STARTED_FOLLOWING: 'Started following',
};

const activityTypeIcons: Record<FeedActivityType, React.ReactNode> = {
  POST_PUBLISHED: <FiEdit className="w-4 h-4" />,
  POST_LIKED: <FiHeart className="w-4 h-4" />,
  POST_COMMENTED: <FiMessageCircle className="w-4 h-4" />,
  COURSE_ENROLLED: <FiBook className="w-4 h-4" />,
  COURSE_COMPLETED: <FiAward className="w-4 h-4" />,
  CERTIFICATE_EARNED: <FiAward className="w-4 h-4" />,
  BADGE_EARNED: <FiAward className="w-4 h-4" />,
  PROFILE_UPDATED: <FiUsers className="w-4 h-4" />,
  NEW_FOLLOWER: <FiUserPlus className="w-4 h-4" />,
  STARTED_FOLLOWING: <FiUserPlus className="w-4 h-4" />,
};

export default function ActivityFeed() {
  const [activeTab, setActiveTab] = useState<TabType>('following');
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState<FeedActivityType | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const loadFeed = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const fetchFn = activeTab === 'following' ? feedApi.getFollowingFeed : feedApi.getDiscoverFeed;
      const res = await fetchFn(currentPage, 20, filterType);

      if (reset) {
        setActivities(res.data.data);
      } else {
        setActivities(prev => [...prev, ...res.data.data]);
      }
      setHasMore(res.data.meta.hasMore);
    } catch (err) {
      console.error('Error loading feed:', err);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, page, filterType]);

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
  }, [activeTab, filterType]);

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

            {/* Filters */}
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FiFilter className="w-4 h-4" />
                  {filterType || 'All Activities'}
                  <FiChevronDown className="w-4 h-4" />
                </button>
                {showFilters && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    <button
                      onClick={() => { setFilterType(undefined); setShowFilters(false); }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      All Activities
                    </button>
                    {Object.entries(activityTypeLabels).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => { setFilterType(type as FeedActivityType); setShowFilters(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => loadFeed(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Activity List */}
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
            ) : activities.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                <FiUsers className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {activeTab === 'following' ? 'No activities yet' : 'Nothing to discover'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'following'
                    ? 'Follow more users to see their activities here'
                    : 'Check back later for trending content'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <Link to={`/profile/${activity.user.username || activity.user.id}`}>
                        {activity.user.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {activity.user.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/profile/${activity.user.username || activity.user.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600">
                            {activity.user.name}
                          </Link>
                          <span className="text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="text-blue-500">{activityTypeIcons[activity.type]}</span>
                          {activityTypeLabels[activity.type]}
                        </div>
                        <h4 className="text-gray-900 dark:text-white font-medium mb-1">{activity.title}</h4>
                        {activity.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{activity.description}</p>
                        )}
                        {activity.link && (
                          <Link to={activity.link} className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700">
                            View details <FiExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      {activity.imageUrl && (
                        <img src={activity.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      )}
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
