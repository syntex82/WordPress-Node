/**
 * FollowersModal Component
 * Shows followers/following list in a modal with follow/unfollow actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiUsers, FiUserPlus, FiUserCheck, FiLoader } from 'react-icons/fi';
import { profileApi } from '../services/api';
import { useSiteTheme } from '../contexts/SiteThemeContext';
import toast from 'react-hot-toast';

interface UserItem {
  id: string;
  username?: string;
  name: string;
  avatar?: string;
  headline?: string;
  isFollowing?: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username?: string;
  type: 'followers' | 'following';
  isOwnProfile?: boolean;
}

export default function FollowersModal({ isOpen, onClose, userId, username, type, isOwnProfile }: FollowersModalProps) {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [loadingFollow, setLoadingFollow] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsers([]);
      setPage(1);
      setHasMore(true);
      loadUsers(1, true);
    }
  }, [isOpen, userId, type]);

  const loadUsers = async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const identifier = username || userId;
      const res = type === 'followers'
        ? await profileApi.getProfileFollowers(identifier, pageNum, 20)
        : await profileApi.getProfileFollowing(identifier, pageNum, 20);

      const newUsers = res.data.data || res.data || [];
      setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
      setHasMore(res.data.pagination?.page < res.data.pagination?.pages);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error(`Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (user: UserItem) => {
    const identifier = user.username || user.id;
    setLoadingFollow(user.id);
    try {
      const isCurrentlyFollowing = followingStates[user.id] ?? user.isFollowing;
      if (isCurrentlyFollowing) {
        await profileApi.unfollowUser(identifier);
        setFollowingStates(prev => ({ ...prev, [user.id]: false }));
        toast.success(`Unfollowed ${user.name}`);
      } else {
        await profileApi.followUser(identifier);
        setFollowingStates(prev => ({ ...prev, [user.id]: true }));
        toast.success(`Now following ${user.name}`);
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    } finally {
      setLoadingFollow(null);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadUsers(nextPage);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className={`fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto z-50 rounded-2xl shadow-2xl overflow-hidden
        ${isDark ? 'bg-slate-900' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading && users.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <FiUsers className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => {
                const isFollowing = followingStates[user.id] ?? user.isFollowing;
                return (
                  <div key={user.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}>
                    <Link to={`/profile/${user.username || user.id}`} onClick={onClose} className="flex-shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user.username || user.id}`} onClick={onClose}
                        className={`font-medium hover:underline truncate block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {user.name}
                      </Link>
                      {user.headline && (
                        <p className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{user.headline}</p>
                      )}
                    </div>
                    {!isOwnProfile || user.id !== userId ? (
                      <button
                        onClick={() => handleFollow(user)}
                        disabled={loadingFollow === user.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          isFollowing
                            ? isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } disabled:opacity-50`}
                      >
                        {loadingFollow === user.id ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          <><FiUserCheck className="w-4 h-4" /> Following</>
                        ) : (
                          <><FiUserPlus className="w-4 h-4" /> Follow</>
                        )}
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {/* Load More */}
              {hasMore && !loading && (
                <button
                  onClick={loadMore}
                  className={`w-full py-3 text-sm font-medium rounded-xl transition-colors ${
                    isDark ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  Load more
                </button>
              )}
              {loading && users.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

