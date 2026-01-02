/**
 * Public Profile Page
 * View another user's profile with follow functionality and timeline
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileApi, timelineApi, UserProfile, ProfileStats, ActivityItem, TimelinePost } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import PostCard from '../../components/PostCard';
import CreatePostForm from '../../components/CreatePostForm';
import CommentModal from '../../components/CommentModal';
import {
  FiMapPin, FiCalendar, FiUsers, FiBook, FiAward, FiExternalLink,
  FiTwitter, FiLinkedin, FiGithub, FiYoutube, FiActivity, FiUserPlus, FiUserCheck,
  FiEdit3, FiMessageCircle
} from 'react-icons/fi';

export default function PublicProfile() {
  const { identifier } = useParams<{ identifier: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [commentModalPostId, setCommentModalPostId] = useState<string | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (identifier) loadProfile();
  }, [identifier]);

  const loadProfile = async () => {
    try {
      const [profileRes, statsRes, activityRes] = await Promise.all([
        profileApi.getProfile(identifier!),
        profileApi.getProfileStats(identifier!),
        profileApi.getProfileActivity(identifier!),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setActivities(activityRes.data?.activities || []);

      // Load timeline posts for this user
      if (profileRes.data?.id) {
        loadUserPosts(profileRes.data.id, true);
      }

      // Check if following
      if (currentUser) {
        try {
          const followRes = await profileApi.getFollowingStatus(identifier!);
          setIsFollowing(followRes.data.isFollowing);
        } catch {}
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = useCallback(async (userId: string, reset = false) => {
    try {
      setLoadingPosts(true);
      const currentPage = reset ? 1 : postsPage;
      const res = await timelineApi.getUserPosts(userId, currentPage, 10);

      if (reset) {
        setTimelinePosts(res.data.data || []);
        setPostsPage(1);
      } else {
        setTimelinePosts(prev => [...prev, ...(res.data.data || [])]);
      }
      setHasMorePosts(res.data.meta?.hasMore || false);
    } catch (err) {
      console.error('Error loading user posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [postsPage]);

  const handlePostCreated = () => {
    // Reload posts after creating
    if (profile?.id) {
      loadUserPosts(profile.id, true);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setTimelinePosts(prev => prev.filter(p => p.id !== postId));
  };

  const loadMorePosts = () => {
    if (profile?.id && hasMorePosts && !loadingPosts) {
      setPostsPage(prev => prev + 1);
      loadUserPosts(profile.id, false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileApi.unfollowUser(identifier!);
        setIsFollowing(false);
        setProfile({ ...profile, followersCount: profile.followersCount - 1 });
      } else {
        await profileApi.followUser(identifier!);
        setIsFollowing(true);
        setProfile({ ...profile, followersCount: profile.followersCount + 1 });
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = currentUser?.id === profile?.id;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-slate-700 border-t-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 px-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Profile Not Found</h2>
        <p className="text-slate-400 text-sm sm:text-base text-center">This profile doesn't exist or is private.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-56 md:h-80 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Header */}
      <div className="relative px-2 sm:px-6 pb-4 sm:pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-20 md:-mt-24">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-800 bg-slate-800 shadow-xl overflow-hidden mx-auto md:mx-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-3xl sm:text-5xl font-bold text-white">{profile.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 text-center md:text-left">
            <div className="min-w-0">
              <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">{profile.name}</h1>
                {profile.role === 'ADMIN' && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-500/20 text-red-400 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0">Admin</span>
                )}
              </div>
              {profile.headline && <p className="text-sm sm:text-base md:text-lg text-slate-400 mt-1 truncate">{profile.headline}</p>}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500">
                {profile.location && (
                  <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {profile.location}</span>
                )}
                {profile.company && (
                  <span className="flex items-center gap-1">@ {profile.company}</span>
                )}
                <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3 sm:w-4 sm:h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 justify-center md:justify-end">
              {isOwnProfile ? (
                <Link to="/profile" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-600 transition text-sm sm:text-base">
                  Edit Profile
                </Link>
              ) : currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition disabled:opacity-50 text-sm sm:text-base ${
                    isFollowing ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                  }`}
                >
                  {isFollowing ? <><FiUserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Following</> : <><FiUserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Follow</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-6 mb-6 sm:mb-8">
        {[
          { label: 'Followers', value: profile.followersCount, icon: FiUsers, color: 'bg-blue-500' },
          { label: 'Following', value: profile.followingCount, icon: FiUsers, color: 'bg-green-500' },
          { label: 'Posts', value: stats?.postsPublished || 0, icon: FiBook, color: 'bg-purple-500' },
          { label: 'Courses', value: stats?.coursesCompleted || 0, icon: FiAward, color: 'bg-orange-500' },
          { label: 'Certificates', value: stats?.certificatesEarned || 0, icon: FiAward, color: 'bg-pink-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-700/50 hover:bg-slate-700/50 transition">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.color} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Profile Tabs */}
      <div className="px-2 sm:px-6 mb-4">
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'posts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FiEdit3 className="w-4 h-4" /> Posts
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'about' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FiBook className="w-4 h-4" /> About
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-6 pb-6 sm:pb-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {activeTab === 'posts' ? (
            <>
              {/* Create Post (only on own profile) */}
              {isOwnProfile && (
                <CreatePostForm onPostCreated={handlePostCreated} />
              )}

              {/* Timeline Posts */}
              {timelinePosts.length > 0 ? (
                <div className="space-y-4">
                  {timelinePosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDelete={handlePostDeleted}
                      onCommentClick={setCommentModalPostId}
                    />
                  ))}
                  {hasMorePosts && (
                    <button
                      onClick={loadMorePosts}
                      disabled={loadingPosts}
                      className="w-full py-3 bg-slate-800/50 text-slate-400 rounded-xl hover:bg-slate-700/50 transition disabled:opacity-50"
                    >
                      {loadingPosts ? 'Loading...' : 'Load More Posts'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-8 border border-slate-700/50 text-center">
                  <FiMessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No posts yet</p>
                  {isOwnProfile && <p className="text-slate-500 text-sm mt-1">Share what's on your mind!</p>}
                </div>
              )}
            </>
          ) : (
            <>
              {/* About Tab Content */}
              {profile.bio && (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">About</h2>
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Skills</h2>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs sm:text-sm font-medium">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog Posts */}
              {profile.posts && profile.posts.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <FiBook className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Blog Posts
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {profile.posts.map(post => (
                      <a key={post.id} href={`/post/${post.slug}`} className="group block p-3 sm:p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition">
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition line-clamp-2 text-sm sm:text-base">{post.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses */}
              {profile.instructedCourses && profile.instructedCourses.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
                  <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <FiAward className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Courses
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {profile.instructedCourses.map(course => (
                      <a key={course.id} href={`/courses/${course.slug}`} className="group flex gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition">
                        <div className="w-16 h-12 sm:w-20 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-medium text-white group-hover:text-blue-400 transition text-sm sm:text-base truncate">{course.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{course.shortDescription}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Social Links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Connect</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"><FiTwitter className="w-4 h-4 sm:w-5 sm:h-5" /></a>
                )}
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"><FiLinkedin className="w-4 h-4 sm:w-5 sm:h-5" /></a>
                )}
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-600/70 transition"><FiGithub className="w-4 h-4 sm:w-5 sm:h-5" /></a>
                )}
                {profile.socialLinks.youtube && (
                  <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"><FiYoutube className="w-4 h-4 sm:w-5 sm:h-5" /></a>
                )}
              </div>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-3 sm:mt-4 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition text-sm sm:text-base">
                  <FiExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="truncate">{profile.website}</span>
                </a>
              )}
            </div>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Badges</h2>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {profile.badges.map(({ badge }, i) => (
                  <div key={i} className="flex flex-col items-center p-2 sm:p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20" title={badge.description}>
                    <span className="text-xl sm:text-2xl">{badge.icon || '🏆'}</span>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-300 mt-1 text-center">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Activity
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {activities.slice(0, 5).map((activity, i) => {
                const getActivityStyle = () => {
                  switch (activity.type) {
                    case 'post_published':
                      return { bg: 'bg-blue-500/20 text-blue-400', icon: <FiBook className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> };
                    case 'timeline_post':
                      return { bg: 'bg-cyan-500/20 text-cyan-400', icon: <FiEdit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> };
                    case 'certificate_earned':
                      return { bg: 'bg-green-500/20 text-green-400', icon: <FiAward className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> };
                    case 'course_enrolled':
                      return { bg: 'bg-orange-500/20 text-orange-400', icon: <FiBook className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> };
                    case 'course_completed':
                      return { bg: 'bg-emerald-500/20 text-emerald-400', icon: <FiAward className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> };
                    default:
                      return { bg: 'bg-purple-500/20 text-purple-400', icon: <FiActivity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> };
                  }
                };
                const style = getActivityStyle();
                return (
                  <Link key={i} to={activity.link || '#'} className="flex items-start gap-2 sm:gap-3 hover:bg-slate-700/30 rounded-lg p-1 -m-1 transition">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-slate-300 truncate">{activity.title}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </Link>
                );
              })}
              {activities.length === 0 && <p className="text-slate-500 text-xs sm:text-sm">No recent activity</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        postId={commentModalPostId || ''}
        isOpen={!!commentModalPostId}
        onClose={() => setCommentModalPostId(null)}
        onCommentAdded={() => {
          setTimelinePosts(prev => prev.map(p =>
            p.id === commentModalPostId
              ? { ...p, commentsCount: p.commentsCount + 1 }
              : p
          ));
        }}
      />
    </div>
  );
}

