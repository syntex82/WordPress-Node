/**
 * Groups Management Page - Premium Community Hub
 * LinkedIn/Discord-inspired design with modern responsive layout
 * Features: Glass-morphism, smooth animations, mobile-first UX
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiMessageSquare, FiLock, FiGlobe, FiSearch, FiCalendar, FiStar, FiTrendingUp, FiX, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { groupsApi } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuthStore } from '../stores/authStore';

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  coverImage?: string | null;
  createdAt: string;
  isMember?: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  _count: {
    members: number;
    messages?: number;
  };
}

// Gradient colors for group cards
const gradients = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-cyan-500 to-blue-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
];

const getGradient = (index: number) => gradients[index % gradients.length];

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
  }, [search, filter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const params: any = { search: search || undefined };
      if (filter === 'public') params.visibility = 'PUBLIC';
      const response = await groupsApi.getAll(params);
      let allGroups = response.data.groups || [];
      if (filter === 'my') {
        allGroups = allGroups.filter((g: Group) => g.owner.id === user?.id || g.isMember);
      }
      setGroups(allGroups);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }
    try {
      setSaving(true);
      const res = await groupsApi.create(formData);
      toast.success('Group created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', slug: '', description: '', visibility: 'PUBLIC' });
      navigate(`/groups/${res.data.id}/chat`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGroup) return;
    try {
      await groupsApi.delete(deleteGroup.id);
      toast.success('Group deleted');
      setDeleteGroup(null);
      loadGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">Community Groups</h1>
              <p className="text-indigo-100 text-sm sm:text-base md:text-lg max-w-xl">Connect, collaborate, and communicate with your community</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-white text-indigo-600 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <FiPlus className="text-lg sm:text-xl" /> Create Group
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
            {[
              { icon: FiUsers, value: groups.length, label: 'Total Groups', color: 'from-blue-400 to-indigo-500' },
              { icon: FiGlobe, value: groups.filter(g => g.visibility === 'PUBLIC').length, label: 'Public Groups', color: 'from-emerald-400 to-teal-500' },
              { icon: FiLock, value: groups.filter(g => g.visibility === 'PRIVATE').length, label: 'Private Groups', color: 'from-amber-400 to-orange-500' },
              { icon: FiTrendingUp, value: groups.reduce((sum, g) => sum + g._count.members, 0), label: 'Total Members', color: 'from-pink-400 to-rose-500' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 hover:bg-white/15 transition-all duration-300 group">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="text-lg sm:text-xl text-white" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                    <p className="text-indigo-200 text-xs sm:text-sm">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-slate-800/50 backdrop-blur-sm border border-slate-700/30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {(['all', 'my', 'public'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                  filter === f
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-800/50 text-slate-300 border border-slate-700/30 hover:bg-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                {f === 'all' ? 'All Groups' : f === 'my' ? 'My Groups' : 'Public'}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 border-4 border-slate-700 border-t-indigo-500"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 sm:h-14 sm:w-14 border-4 border-indigo-500/20"></div>
            </div>
            <p className="text-slate-400 text-sm mt-4">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-slate-800/30 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-700/30 px-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
              <FiMessageSquare className="text-3xl sm:text-4xl text-indigo-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No groups found</h3>
            <p className="text-slate-400 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">Create your first group to start building your community</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <FiPlus /> Create Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, idx) => (
              <div
                key={group.id}
                className="bg-slate-800/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
              >
                {/* Card Header with Gradient */}
                <div className={`h-28 sm:h-32 bg-gradient-to-br ${getGradient(idx)} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      {group.visibility === 'PRIVATE' ? (
                        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-1.5 border border-white/10">
                          <FiLock size={10} className="sm:w-3 sm:h-3" /> Private
                        </span>
                      ) : (
                        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-black/30 backdrop-blur-md rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-1.5 border border-white/10">
                          <FiGlobe size={10} className="sm:w-3 sm:h-3" /> Public
                        </span>
                      )}
                    </div>
                    {group.owner.id === user?.id && (
                      <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full text-amber-900 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                        <FiStar size={10} className="sm:w-3 sm:h-3" /> Owner
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2 group-hover:text-indigo-400 transition-colors truncate">{group.name}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4 min-h-[32px] sm:min-h-[40px]">{group.description || 'No description available'}</p>

                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 mb-4 sm:mb-5">
                    <span className="flex items-center gap-1.5 sm:gap-2 bg-slate-700/30 px-2.5 py-1 rounded-lg">
                      <FiUsers size={12} className="sm:w-3.5 sm:h-3.5 text-indigo-400" /> {group._count.members}
                    </span>
                    <span className="flex items-center gap-1.5 sm:gap-2 bg-slate-700/30 px-2.5 py-1 rounded-lg">
                      <FiCalendar size={12} className="sm:w-3.5 sm:h-3.5 text-purple-400" /> {formatDate(group.createdAt)}
                    </span>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 bg-slate-700/20 rounded-xl sm:rounded-2xl mb-4 sm:mb-5 border border-slate-700/30">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-lg ring-2 ring-white/10">
                      {group.owner.avatar ? <img src={group.owner.avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : group.owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-white truncate">{group.owner.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">Group Owner</p>
                    </div>
                    <FiChevronRight className="text-slate-500" size={16} />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {group.isMember || group.owner.id === user?.id ? (
                      <Link
                        to={`/groups/${group.id}/chat`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm"
                      >
                        <FiMessageSquare size={14} className="sm:w-4 sm:h-4" /> Open Chat
                      </Link>
                    ) : (
                      <Link
                        to={`/groups/${group.id}/chat`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm"
                      >
                        <FiUsers size={14} className="sm:w-4 sm:h-4" /> Join Group
                      </Link>
                    )}
                    {group.owner.id === user?.id && (
                      <>
                        <Link
                          to={`/groups/${group.id}`}
                          className="p-2.5 sm:p-3 bg-slate-700/30 text-slate-300 rounded-xl hover:bg-slate-700/50 hover:text-white transition-all duration-200 border border-slate-700/30"
                        >
                          <FiEdit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </Link>
                        <button
                          onClick={() => setDeleteGroup(group)}
                          className="p-2.5 sm:p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all duration-200 border border-red-500/20"
                        >
                          <FiTrash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden border border-slate-700/30 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="relative overflow-hidden sticky top-0 z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
              <div className="relative p-5 sm:p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Create New Group</h2>
                    <p className="text-indigo-100 mt-1 text-sm sm:text-base">Start a new community space</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-5 sm:p-6">
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Group Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-4 py-3 sm:py-3.5 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all text-sm sm:text-base"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-3 sm:px-4 py-3 sm:py-3.5 bg-slate-700/70 border border-r-0 border-slate-600/30 rounded-l-xl text-slate-400 text-xs sm:text-sm">/groups/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-4 py-3 sm:py-3.5 bg-slate-700/50 border border-slate-600/30 rounded-r-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all text-sm sm:text-base"
                      placeholder="group-slug"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 sm:py-3.5 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none transition-all resize-none text-sm sm:text-base"
                    rows={3}
                    placeholder="What's this group about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: 'PUBLIC' })}
                      className={`p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ${
                        formData.visibility === 'PUBLIC'
                          ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-600/30 hover:border-slate-500/50 bg-slate-700/30'
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center ${
                        formData.visibility === 'PUBLIC' ? 'bg-indigo-500/30' : 'bg-slate-600/50'
                      }`}>
                        <FiGlobe className={`text-xl sm:text-2xl ${formData.visibility === 'PUBLIC' ? 'text-indigo-400' : 'text-slate-400'}`} />
                      </div>
                      <p className="font-semibold text-white text-sm sm:text-base">Public</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Anyone can join</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, visibility: 'PRIVATE' })}
                      className={`p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 ${
                        formData.visibility === 'PRIVATE'
                          ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10'
                          : 'border-slate-600/30 hover:border-slate-500/50 bg-slate-700/30'
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center ${
                        formData.visibility === 'PRIVATE' ? 'bg-purple-500/30' : 'bg-slate-600/50'
                      }`}>
                        <FiLock className={`text-xl sm:text-2xl ${formData.visibility === 'PRIVATE' ? 'text-purple-400' : 'text-slate-400'}`} />
                      </div>
                      <p className="font-semibold text-white text-sm sm:text-base">Private</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Invite only</p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 sm:py-3.5 text-slate-300 bg-slate-700/50 border border-slate-600/30 rounded-xl font-medium hover:bg-slate-700 transition-all duration-200 text-sm sm:text-base active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 sm:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 transition-all duration-200 text-sm sm:text-base active:scale-95"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteGroup}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteGroup?.name}"? This will permanently delete all messages and member data.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteGroup(null)}
        variant="danger"
      />
    </div>
  );
}

