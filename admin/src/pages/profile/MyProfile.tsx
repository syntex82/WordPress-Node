/**
 * My Profile Page - Premium LinkedIn-Style Design
 * View and edit user profile with glass-morphism, gradients, and smooth animations
 * Features: Modern card design, animated stats, responsive layout
 */

import { useState, useEffect, useRef } from 'react';
import { profileApi, mediaApi, timelineApi, UserProfile, ProfileStats, ActivityItem, TimelinePost } from '../../services/api';
import {
  FiUser, FiEdit2, FiMapPin, FiBriefcase, FiCalendar, FiUsers, FiBook, FiAward,
  FiTwitter, FiLinkedin, FiGithub, FiYoutube, FiGlobe, FiCamera,
  FiCheck, FiX, FiPlus, FiActivity, FiHeart, FiMessageCircle, FiShare2,
  FiMoreHorizontal, FiTrash2, FiImage, FiSend, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CreatePostForm from '../../components/CreatePostForm';
import PostCard from '../../components/PostCard';
import FollowersModal from '../../components/FollowersModal';
import { useSiteTheme } from '../../contexts/SiteThemeContext';

export default function MyProfile() {
  const { resolvedTheme } = useSiteTheme();
  const isDark = resolvedTheme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError(null);
      const [profileRes, statsRes, activityRes] = await Promise.all([
        profileApi.getMyProfile(),
        profileApi.getMyStats(),
        profileApi.getMyActivity(),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setActivities(activityRes.data?.activities || []);
      setFormData(profileRes.data);

      // Load timeline posts
      if (profileRes.data?.id) {
        try {
          const postsRes = await timelineApi.getUserPosts(profileRes.data.id);
          setTimelinePosts(postsRes.data?.data || []);
        } catch (e) {
          console.error('Error loading timeline:', e);
        }
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view your profile.');
      } else if (err.response?.status === 404) {
        setError('Profile not found. This may be a new account.');
      } else {
        setError(err.response?.data?.message || 'Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = async () => {
    // Reload timeline posts after creating a new post
    if (profile?.id) {
      try {
        const postsRes = await timelineApi.getUserPosts(profile.id);
        setTimelinePosts(postsRes.data?.data || []);
      } catch (e) {
        console.error('Error reloading timeline:', e);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await timelineApi.deletePost(postId);
      setTimelinePosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete post';
      toast.error(errorMessage);
    }
    setOpenPostMenu(null);
  };

  const handleLikePost = async (postId: string) => {
    try {
      await timelineApi.likePost(postId);
      setTimelinePosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likesCount: p.likesCount + 1, isLiked: true } : p
      ));
    } catch (err) {
      // Already liked - try unlike
      try {
        await timelineApi.unlikePost(postId);
        setTimelinePosts(prev => prev.map(p =>
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileApi.updateMyProfile(formData);
      setProfile(res.data);
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...(formData.skills || []), newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills?.filter(s => s !== skill) });
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests?.includes(newInterest.trim())) {
      setFormData({ ...formData, interests: [...(formData.interests || []), newInterest.trim()] });
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData({ ...formData, interests: formData.interests?.filter(i => i !== interest) });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await mediaApi.upload(file);
      const imageUrl = res.data.url;
      setFormData({ ...formData, avatar: imageUrl });
      // Save immediately
      await profileApi.updateMyProfile({ avatar: imageUrl });
      setProfile(prev => prev ? { ...prev, avatar: imageUrl } : prev);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploadingCover(true);
    try {
      const res = await mediaApi.upload(file);
      const imageUrl = res.data.url;
      setFormData({ ...formData, coverImage: imageUrl });
      // Save immediately
      await profileApi.updateMyProfile({ coverImage: imageUrl });
      setProfile(prev => prev ? { ...prev, coverImage: imageUrl } : prev);
      toast.success('Cover image updated!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-spin"></div>
            <div className={`absolute inset-1 rounded-full ${isDark ? 'bg-slate-900' : 'bg-gray-100'}`}></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 animate-pulse"></div>
          </div>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className={`border rounded-2xl p-8 text-center shadow-xl ${isDark ? 'bg-red-500/10 border-red-500/20 backdrop-blur-xl' : 'bg-red-50 border-red-200'}`}>
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiX className="w-8 h-8 text-red-400" />
          </div>
          <p className={`text-lg font-medium mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>Oops! Something went wrong</p>
          <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{error}</p>
          <button
            onClick={loadProfile}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <div className={`rounded-2xl p-8 border ${isDark ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-xl' : 'bg-white border-gray-200'}`}>
        <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiUser className="w-8 h-8 text-slate-400" />
        </div>
        <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Profile not found</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0 relative">
      {/* Hidden file input for cover upload */}
      <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />

      {/* Cover Image - Premium Design */}
      <div className="relative h-48 sm:h-56 md:h-64 z-30">
        {/* Cover image container with overflow-hidden for rounded corners */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden pointer-events-none">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>
          {profile.coverImage && (
            <img src={profile.coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        </div>

        {/* Change Cover Button - Outside the overflow-hidden, clickable */}
        <button
          type="button"
          onClick={() => {
            console.log('Cover button clicked');
            coverInputRef.current?.click();
          }}
          disabled={uploadingCover}
          className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-xl text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-xl border border-white/20 text-xs sm:text-sm font-medium hover:scale-105 active:scale-95"
        >
          {uploadingCover ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> <span className="hidden sm:inline">Uploading...</span></>
          ) : (
            <><FiCamera className="w-4 h-4" /> <span className="hidden sm:inline">Change Cover</span></>
          )}
        </button>
      </div>

      {/* Profile Header - Premium Card */}
      <div className="relative px-3 sm:px-6 pb-6 z-40">
        <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-6 -mt-20 sm:-mt-24 md:-mt-28">
          {/* Avatar with Premium Ring */}
          <div className="relative group mx-auto md:mx-0 z-30">
            <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl sm:rounded-3xl border-4 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden ring-4 ring-white/10">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg">{profile.name.charAt(0)}</span>
                </div>
              )}
              {/* Hover overlay for upload */}
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm"
              >
                {uploadingAvatar ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="text-center text-white">
                    <FiCamera className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2" />
                    <span className="text-sm font-medium">Change Photo</span>
                  </div>
                )}
              </div>
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white p-2 sm:p-3 rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-200 disabled:opacity-50 hover:scale-110 active:scale-95"
            >
              {uploadingAvatar ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiCamera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
            <div className="min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl sm:text-3xl md:text-4xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none text-white w-full"
                />
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent truncate">{profile.name}</h1>
              )}
              {editing ? (
                <input
                  type="text"
                  value={formData.headline || ''}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Your headline..."
                  className="text-base sm:text-lg text-slate-400 bg-transparent border-b border-slate-600 focus:outline-none focus:border-indigo-500 w-full mt-2"
                />
              ) : (
                profile.headline && <p className="text-base sm:text-lg md:text-xl text-slate-400 mt-2 truncate">{profile.headline}</p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-5 mt-3 text-sm text-slate-500 flex-wrap">
                {profile.location && (
                  <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors"><FiMapPin className="w-4 h-4" /> {profile.location}</span>
                )}
                <span className="flex items-center gap-1.5"><FiCalendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center md:justify-end">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base font-medium hover:scale-105 active:scale-95"
                  >
                    <FiCheck className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setFormData(profile); }}
                    className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-slate-800/80 backdrop-blur border border-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700/80 transition-all duration-200 text-sm sm:text-base font-medium hover:scale-105 active:scale-95"
                  >
                    <FiX className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-200 text-sm sm:text-base font-medium hover:scale-105 active:scale-95"
                >
                  <FiEdit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Premium Design - Horizontal scroll on mobile */}
      <div className="px-3 sm:px-6 mb-8 -mx-3 sm:mx-0">
        <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 px-3 sm:px-0 scrollbar-hide snap-x snap-mandatory">
          {[
            { label: 'Followers', value: profile.followersCount, icon: FiUsers, gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20', action: () => { setFollowersModalType('followers'); setFollowersModalOpen(true); } },
            { label: 'Following', value: profile.followingCount, icon: FiUsers, gradient: 'from-emerald-500 to-green-500', shadow: 'shadow-emerald-500/20', action: () => { setFollowersModalType('following'); setFollowersModalOpen(true); } },
            { label: 'Posts', value: stats?.postsPublished || 0, icon: FiBook, gradient: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20', action: () => setActiveTab('posts') },
            { label: 'Courses', value: stats?.coursesCompleted || 0, icon: FiAward, gradient: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20', action: () => window.location.href = '/lms/my-learning' },
            { label: 'Certificates', value: stats?.certificatesEarned || 0, icon: FiStar, gradient: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/20', action: () => window.location.href = '/lms/my-learning' },
          ].map((stat, i) => (
            <button
              key={i}
              onClick={stat.action}
              className="group flex-shrink-0 w-[140px] sm:w-auto snap-start bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-700/30 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:scale-105 cursor-pointer text-left"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">{stat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs - Premium Design */}
      <div className="px-3 sm:px-6 mb-6">
        <div className="flex gap-1 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-1.5 border border-slate-700/30">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'posts'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FiEdit2 className="w-4 h-4" /> Posts
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'about'
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FiUser className="w-4 h-4" /> About
          </button>
        </div>
      </div>

      {activeTab === 'posts' ? (
        <div className="px-3 sm:px-6 pb-8">
          {/* Create Post Form - Using enhanced CreatePostForm component */}
          <div className="relative z-20">
            <CreatePostForm onPostCreated={handlePostCreated} />
          </div>

          {/* Click outside to close post menu */}
          {openPostMenu && (
            <div className="fixed inset-0 z-10" onClick={() => setOpenPostMenu(null)} />
          )}

          {/* Timeline Posts */}
          <div className="space-y-4 relative z-10">
            {timelinePosts.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-10 border border-slate-700/30 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiEdit2 className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
                <p className="text-slate-400">Share what's on your mind above!</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-slate-700/50">
                {timelinePosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 px-3 sm:px-6 pb-8">
        {/* Left Column - About & Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* About Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <FiUser className="w-4 h-4 text-white" />
              </div>
              About
            </h2>
            {editing ? (
              <textarea
                value={formData.bio || ''}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write a short bio..."
                rows={4}
                className="w-full p-4 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-base transition-all"
              />
            ) : (
              <p className="text-slate-300 leading-relaxed text-base">{profile.bio || 'No bio yet.'}</p>
            )}
          </div>

          {/* Work & Education */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <FiBriefcase className="w-4 h-4 text-white" />
              </div>
              Work
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-sm font-medium text-slate-400 mb-2">Job Title</label>
                {editing ? (
                  <input type="text" value={formData.jobTitle || ''} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-base transition-all" />
                ) : (
                  <p className="text-white font-medium">{profile.jobTitle || '-'}</p>
                )}
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-slate-400 mb-2">Company</label>
                {editing ? (
                  <input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full p-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-base transition-all" />
                ) : (
                  <p className="text-white font-medium">{profile.company || '-'}</p>
                )}
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
                {editing ? (
                  <input type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full p-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-base transition-all" />
                ) : (
                  <p className="text-white font-medium">{profile.location || '-'}</p>
                )}
              </div>
              <div className="group">
                <label className="block text-sm font-medium text-slate-400 mb-2">Website</label>
                {editing ? (
                  <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full p-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-base transition-all" />
                ) : (
                  profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors text-sm sm:text-base break-all">{profile.website}</a> : <p className="text-slate-400 text-sm sm:text-base">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Skills</h2>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(editing ? formData.skills : profile.skills)?.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs sm:text-sm font-medium">
                  {skill}
                  {editing && <button onClick={() => removeSkill(skill)} className="hover:text-red-400"><FiX className="w-3 h-3" /></button>}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Add skill..." className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-full text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  <button onClick={addSkill} className="p-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full hover:from-blue-700 hover:to-blue-600"><FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Interests</h2>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {(editing ? formData.interests : profile.interests)?.map((interest, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs sm:text-sm font-medium">
                  {interest}
                  {editing && <button onClick={() => removeInterest(interest)} className="hover:text-red-400"><FiX className="w-3 h-3" /></button>}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <input type="text" value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyPress={e => e.key === 'Enter' && addInterest()} placeholder="Add interest..." className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-full text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50" />
                  <button onClick={addInterest} className="p-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full hover:from-green-700 hover:to-green-600"><FiPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Social & Activity */}
        <div className="space-y-4 sm:space-y-6">
          {/* Social Links */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiGlobe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Social
            </h2>
            {editing ? (
              <div className="space-y-2 sm:space-y-3">
                {[
                  { key: 'twitter', icon: FiTwitter, label: 'Twitter' },
                  { key: 'linkedin', icon: FiLinkedin, label: 'LinkedIn' },
                  { key: 'github', icon: FiGithub, label: 'GitHub' },
                  { key: 'youtube', icon: FiYoutube, label: 'YouTube' },
                ].map(social => (
                  <div key={social.key} className="flex items-center gap-2">
                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                    <input
                      type="url"
                      value={(formData.socialLinks as any)?.[social.key] || ''}
                      onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, [social.key]: e.target.value } })}
                      placeholder={`${social.label} URL`}
                      className="flex-1 p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {profile.socialLinks?.twitter && <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-blue-500/20 text-blue-400 rounded-lg sm:rounded-xl hover:bg-blue-500/30 transition"><FiTwitter className="w-4 h-4 sm:w-5 sm:h-5" /></a>}
                {profile.socialLinks?.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-blue-500/20 text-blue-400 rounded-lg sm:rounded-xl hover:bg-blue-500/30 transition"><FiLinkedin className="w-4 h-4 sm:w-5 sm:h-5" /></a>}
                {profile.socialLinks?.github && <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-slate-600/50 text-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-600/70 transition"><FiGithub className="w-4 h-4 sm:w-5 sm:h-5" /></a>}
                {profile.socialLinks?.youtube && <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 bg-red-500/20 text-red-400 rounded-lg sm:rounded-xl hover:bg-red-500/30 transition"><FiYoutube className="w-4 h-4 sm:w-5 sm:h-5" /></a>}
                {!profile.socialLinks?.twitter && !profile.socialLinks?.linkedin && !profile.socialLinks?.github && <p className="text-slate-500 text-xs sm:text-sm">No social links added</p>}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Recent Activity
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {activities.slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'post_published' ? 'bg-blue-500/20 text-blue-400' :
                    activity.type === 'certificate_earned' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {activity.type === 'post_published' ? <FiBook className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                     activity.type === 'certificate_earned' ? <FiAward className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                     <FiBook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-300 truncate">{activity.title}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-slate-500 text-xs sm:text-sm">No recent activity</p>}
            </div>
          </div>

          {/* Profile Settings */}
          {editing && (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Settings</h2>
              <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic !== false}
                  onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500/50"
                />
                <span className="text-slate-300 text-sm sm:text-base">Public Profile</span>
              </label>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">Allow others to view your profile</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={followersModalOpen}
        onClose={() => setFollowersModalOpen(false)}
        userId={profile.id}
        username={profile.username}
        type={followersModalType}
        isOwnProfile={true}
      />
    </div>
  );
}

