/**
 * Public Profile Page
 * View another user's profile with follow functionality
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileApi, UserProfile, ProfileStats, ActivityItem } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  FiMapPin, FiCalendar, FiUsers, FiBook, FiAward, FiExternalLink,
  FiTwitter, FiLinkedin, FiGithub, FiYoutube, FiActivity, FiUserPlus, FiUserCheck
} from 'react-icons/fi';

export default function PublicProfile() {
  const { identifier } = useParams<{ identifier: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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
      setActivities(activityRes.data.activities);

      // Check if following
      if (currentUser) {
        try {
          const followRes = await profileApi.getFollowingStatus(identifier!);
          setIsFollowing(followRes.data.isFollowing);
        } catch {}
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">This profile doesn't exist or is private.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        {profile.coverImage && (
          <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Header */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-20 md:-mt-24">
          {/* Avatar */}
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-5xl font-bold text-white">{profile.name.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                {profile.role === 'ADMIN' && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Admin</span>
                )}
              </div>
              {profile.headline && <p className="text-lg text-gray-600 mt-1">{profile.headline}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1"><FiMapPin className="w-4 h-4" /> {profile.location}</span>
                )}
                {profile.company && (
                  <span className="flex items-center gap-1">@ {profile.company}</span>
                )}
                <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {isOwnProfile ? (
                <Link to="/profile" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                  Edit Profile
                </Link>
              ) : currentUser && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition disabled:opacity-50 ${
                    isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isFollowing ? <><FiUserCheck className="w-4 h-4" /> Following</> : <><FiUserPlus className="w-4 h-4" /> Follow</>}
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
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {profile.bio && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {profile.posts && profile.posts.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiBook className="w-5 h-5 text-indigo-600" /> Recent Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.posts.map(post => (
                  <a key={post.id} href={`/post/${post.slug}`} className="group block p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition">
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Courses */}
          {profile.instructedCourses && profile.instructedCourses.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiAward className="w-5 h-5 text-indigo-600" /> Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.instructedCourses.map(course => (
                  <a key={course.id} href={`/courses/${course.slug}`} className="group flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition">
                    <div className="w-20 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition">{course.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-1">{course.shortDescription}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Social Links */}
          {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect</h2>
              <div className="flex flex-wrap gap-3">
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-100 text-blue-500 rounded-lg hover:bg-blue-200 transition"><FiTwitter className="w-5 h-5" /></a>
                )}
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"><FiLinkedin className="w-5 h-5" /></a>
                )}
                {profile.socialLinks.github && (
                  <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"><FiGithub className="w-5 h-5" /></a>
                )}
                {profile.socialLinks.youtube && (
                  <a href={profile.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"><FiYoutube className="w-5 h-5" /></a>
                )}
              </div>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-indigo-600 hover:underline">
                  <FiExternalLink className="w-4 h-4" /> {profile.website}
                </a>
              )}
            </div>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Badges</h2>
              <div className="grid grid-cols-3 gap-3">
                {profile.badges.map(({ badge }, i) => (
                  <div key={i} className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg" title={badge.description}>
                    <span className="text-2xl">{badge.icon || '🏆'}</span>
                    <span className="text-xs font-medium text-gray-700 mt-1 text-center">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-indigo-600" /> Activity
            </h2>
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'post_published' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'certificate_earned' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {activity.type === 'post_published' ? <FiBook className="w-4 h-4" /> : <FiAward className="w-4 h-4" />}
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
        </div>
      </div>
    </div>
  );
}

