/**
 * My Profile Page
 * View and edit user profile with stunning design
 */

import { useState, useEffect, useRef } from 'react';
import { profileApi, mediaApi, timelineApi, UserProfile, ProfileStats, ActivityItem, TimelinePost } from '../../services/api';
import {
  FiUser, FiEdit2, FiMapPin, FiBriefcase, FiCalendar, FiUsers, FiBook, FiAward,
  FiTwitter, FiLinkedin, FiGithub, FiYoutube, FiGlobe, FiCamera,
  FiCheck, FiX, FiPlus, FiActivity, FiHeart, FiMessageCircle, FiShare2,
  FiMoreHorizontal, FiTrash2, FiImage, FiSend
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CreatePostForm from '../../components/CreatePostForm';
import PostMediaGallery from '../../components/PostMediaGallery';

export default function MyProfile() {
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
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button onClick={loadProfile} className="text-red-400 hover:text-red-300 transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="p-4 sm:p-6 text-slate-400">Profile not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      {/* Cover Image */}
      <div className="relative h-40 sm:h-56 md:h-80 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            coverInputRef.current?.click();
          }}
          disabled={uploadingCover}
          className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10 bg-slate-800/90 hover:bg-slate-700 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg border border-slate-600/50 text-xs sm:text-sm"
        >
          {uploadingCover ? (
            <><div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> <span className="hidden sm:inline">Uploading...</span></>
          ) : (
            <><FiCamera className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Change Cover</span></>
          )}
        </button>
      </div>

      {/* Profile Header */}
      <div className="relative px-2 sm:px-6 pb-4 sm:pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-20 md:-mt-24">
          {/* Avatar */}
          <div className="relative group mx-auto md:mx-0">
            <div className="w-24 h-24 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-xl sm:rounded-2xl border-3 sm:border-4 border-slate-800 bg-slate-800 shadow-xl overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-3xl sm:text-5xl font-bold text-white">{profile.name.charAt(0)}</span>
                </div>
              )}
              {/* Hover overlay for upload */}
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                {uploadingAvatar ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="text-center text-white">
                    <FiCamera className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1" />
                    <span className="text-xs sm:text-sm font-medium">Change Photo</span>
                  </div>
                )}
              </div>
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-1.5 sm:p-2.5 rounded-full shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiCamera className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 text-center md:text-left">
            <div className="min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none text-white w-full"
                />
              ) : (
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent truncate">{profile.name}</h1>
              )}
              {editing ? (
                <input
                  type="text"
                  value={formData.headline || ''}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Your headline..."
                  className="text-sm sm:text-base md:text-lg text-slate-400 bg-transparent border-b border-slate-600 focus:outline-none focus:border-blue-500 w-full mt-1"
                />
              ) : (
                profile.headline && <p className="text-sm sm:text-base md:text-lg text-slate-400 mt-1 truncate">{profile.headline}</p>
              )}
              <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-slate-500 flex-wrap">
                {profile.location && (
                  <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {profile.location}</span>
                )}
                <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3 sm:w-4 sm:h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 justify-center md:justify-end">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition disabled:opacity-50 text-sm sm:text-base">
                    <FiCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setFormData(profile); }} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 border border-slate-600/50 text-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-700/50 transition text-sm sm:text-base">
                    <FiX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition text-sm sm:text-base">
                  <FiEdit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Edit Profile
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

      {/* Tabs */}
      <div className="flex gap-2 px-2 sm:px-6 mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'posts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <FiEdit2 className="w-4 h-4" /> Posts
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'about' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <FiUser className="w-4 h-4" /> About
        </button>
      </div>

      {activeTab === 'posts' ? (
        <div className="px-2 sm:px-6 pb-6 sm:pb-8">
          {/* Create Post Form - Using enhanced CreatePostForm component */}
          <CreatePostForm onPostCreated={handlePostCreated} />

          {/* Click outside to close post menu */}
          {openPostMenu && (
            <div className="fixed inset-0 z-10" onClick={() => setOpenPostMenu(null)} />
          )}

          {/* Timeline Posts */}
          <div className="space-y-4 relative">
            {timelinePosts.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-8 border border-slate-700/50 text-center">
                <FiEdit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">No posts yet</h3>
                <p className="text-slate-400">Share what's on your mind above!</p>
              </div>
            ) : (
              timelinePosts.map((post) => (
                <div key={post.id} className="bg-slate-800/50 backdrop-blur rounded-xl p-4 sm:p-6 border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{profile.name?.charAt(0) || 'U'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-white">{profile.name}</span>
                          <span className="text-slate-500 text-sm ml-2">{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setOpenPostMenu(openPostMenu === post.id ? null : post.id)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <FiMoreHorizontal className="w-5 h-5" />
                          </button>
                          {openPostMenu === post.id && (
                            <div className="absolute right-0 top-10 bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-1 z-20 min-w-[140px]">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-slate-600 w-full text-left touch-manipulation"
                              >
                                <FiTrash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-300 mt-2 whitespace-pre-wrap">{post.content}</p>
                      {post.media && post.media.length > 0 && (
                        <PostMediaGallery
                          media={post.media.map(m => ({
                            type: m.type,
                            url: m.url,
                            altText: m.altText,
                            thumbnail: m.thumbnail,
                          }))}
                          className="mt-3"
                        />
                      )}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700/50">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1.5 text-sm transition ${post.isLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}
                        >
                          <FiHeart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likesCount || 0}
                        </button>
                        <span className="flex items-center gap-1.5 text-sm text-slate-400">
                          <FiMessageCircle className="w-4 h-4" />
                          {post.commentsCount || 0}
                        </span>
                        <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 transition">
                          <FiShare2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 px-2 sm:px-6 pb-6 sm:pb-8">
        {/* Left Column - About & Details */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* About Section */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> About
            </h2>
            {editing ? (
              <textarea
                value={formData.bio || ''}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write a short bio..."
                rows={4}
                className="w-full p-2.5 sm:p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base"
              />
            ) : (
              <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{profile.bio || 'No bio yet.'}</p>
            )}
          </div>

          {/* Work & Education */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg sm:rounded-xl p-4 sm:p-6 border border-slate-700/50">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiBriefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> Work
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Job Title</label>
                {editing ? (
                  <input type="text" value={formData.jobTitle || ''} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base" />
                ) : (
                  <p className="text-slate-400 text-sm sm:text-base">{profile.jobTitle || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Company</label>
                {editing ? (
                  <input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base" />
                ) : (
                  <p className="text-slate-400 text-sm sm:text-base">{profile.company || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Location</label>
                {editing ? (
                  <input type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base" />
                ) : (
                  <p className="text-slate-400 text-sm sm:text-base">{profile.location || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">Website</label>
                {editing ? (
                  <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base" />
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
    </div>
  );
}

