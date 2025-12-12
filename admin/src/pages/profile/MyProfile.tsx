/**
 * My Profile Page
 * View and edit user profile with stunning design
 */

import { useState, useEffect, useRef } from 'react';
import { profileApi, mediaApi, UserProfile, ProfileStats, ActivityItem } from '../../services/api';
import {
  FiUser, FiEdit2, FiMapPin, FiBriefcase, FiCalendar, FiUsers, FiBook, FiAward,
  FiTwitter, FiLinkedin, FiGithub, FiYoutube, FiGlobe, FiCamera,
  FiCheck, FiX, FiPlus, FiActivity, FiUpload
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button onClick={loadProfile} className="text-red-700 hover:underline">Try Again</button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="p-6">Profile not found</div>;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <input type="file" ref={coverInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
        >
          {uploadingCover ? (
            <><div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div> Uploading...</>
          ) : (
            <><FiCamera className="w-4 h-4" /> Change Cover</>
          )}
        </button>
      </div>

      {/* Profile Header */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-24">
          {/* Avatar */}
          <div className="relative">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">{profile.name.charAt(0)}</span>
                </div>
              )}
            </div>
            {editing && (
              <button className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition">
                <FiCamera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {editing ? (
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="text-3xl font-bold bg-transparent border-b-2 border-indigo-500 focus:outline-none"
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              )}
              {editing ? (
                <input
                  type="text"
                  value={formData.headline || ''}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="Your headline..."
                  className="text-lg text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none focus:border-indigo-500 w-full mt-1"
                />
              ) : (
                profile.headline && <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1"><FiMapPin className="w-4 h-4" /> {profile.location}</span>
                )}
                <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                    <FiCheck className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setFormData(profile); }} className="flex items-center gap-2 px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    <FiX className="w-4 h-4" /> Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  <FiEdit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 mb-8">
        {[
          { label: 'Followers', value: profile.followersCount, icon: FiUsers, color: 'bg-blue-500' },
          { label: 'Following', value: profile.followingCount, icon: FiUsers, color: 'bg-green-500' },
          { label: 'Posts', value: stats?.postsPublished || 0, icon: FiBook, color: 'bg-purple-500' },
          { label: 'Courses', value: stats?.coursesCompleted || 0, icon: FiAward, color: 'bg-orange-500' },
          { label: 'Certificates', value: stats?.certificatesEarned || 0, icon: FiAward, color: 'bg-pink-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-8">
        {/* Left Column - About & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="w-5 h-5 text-indigo-600" /> About
            </h2>
            {editing ? (
              <textarea
                value={formData.bio || ''}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Write a short bio..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            ) : (
              <p className="text-gray-600 leading-relaxed">{profile.bio || 'No bio yet.'}</p>
            )}
          </div>

          {/* Work & Education */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-indigo-600" /> Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                {editing ? (
                  <input type="text" value={formData.jobTitle || ''} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                ) : (
                  <p className="text-gray-600">{profile.jobTitle || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                {editing ? (
                  <input type="text" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                ) : (
                  <p className="text-gray-600">{profile.company || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {editing ? (
                  <input type="text" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                ) : (
                  <p className="text-gray-600">{profile.location || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                {editing ? (
                  <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg" />
                ) : (
                  profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{profile.website}</a> : <p className="text-gray-600">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(editing ? formData.skills : profile.skills)?.map((skill, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {skill}
                  {editing && <button onClick={() => removeSkill(skill)} className="hover:text-red-600"><FiX className="w-3 h-3" /></button>}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Add skill..." className="px-3 py-1.5 border border-gray-300 rounded-full text-sm" />
                  <button onClick={addSkill} className="p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"><FiPlus className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {(editing ? formData.interests : profile.interests)?.map((interest, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {interest}
                  {editing && <button onClick={() => removeInterest(interest)} className="hover:text-red-600"><FiX className="w-3 h-3" /></button>}
                </span>
              ))}
              {editing && (
                <div className="flex items-center gap-2">
                  <input type="text" value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyPress={e => e.key === 'Enter' && addInterest()} placeholder="Add interest..." className="px-3 py-1.5 border border-gray-300 rounded-full text-sm" />
                  <button onClick={addInterest} className="p-1.5 bg-green-600 text-white rounded-full hover:bg-green-700"><FiPlus className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Social & Activity */}
        <div className="space-y-6">
          {/* Social Links */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiGlobe className="w-5 h-5 text-indigo-600" /> Social
            </h2>
            {editing ? (
              <div className="space-y-3">
                {[
                  { key: 'twitter', icon: FiTwitter, label: 'Twitter' },
                  { key: 'linkedin', icon: FiLinkedin, label: 'LinkedIn' },
                  { key: 'github', icon: FiGithub, label: 'GitHub' },
                  { key: 'youtube', icon: FiYoutube, label: 'YouTube' },
                ].map(social => (
                  <div key={social.key} className="flex items-center gap-2">
                    <social.icon className="w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={(formData.socialLinks as any)?.[social.key] || ''}
                      onChange={e => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, [social.key]: e.target.value } })}
                      placeholder={`${social.label} URL`}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {profile.socialLinks?.twitter && <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"><FiTwitter className="w-5 h-5" /></a>}
                {profile.socialLinks?.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"><FiLinkedin className="w-5 h-5" /></a>}
                {profile.socialLinks?.github && <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"><FiGithub className="w-5 h-5" /></a>}
                {profile.socialLinks?.youtube && <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"><FiYoutube className="w-5 h-5" /></a>}
                {!profile.socialLinks?.twitter && !profile.socialLinks?.linkedin && !profile.socialLinks?.github && <p className="text-gray-500 text-sm">No social links added</p>}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-indigo-600" /> Recent Activity
            </h2>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'post_published' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'certificate_earned' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.type === 'post_published' ? <FiBook className="w-4 h-4" /> :
                     activity.type === 'certificate_earned' ? <FiAward className="w-4 h-4" /> :
                     <FiBook className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-gray-500 text-sm">No recent activity</p>}
            </div>
          </div>

          {/* Profile Settings */}
          {editing && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublic !== false}
                  onChange={e => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600"
                />
                <span className="text-gray-700">Public Profile</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">Allow others to view your profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

