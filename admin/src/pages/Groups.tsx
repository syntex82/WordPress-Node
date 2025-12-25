/**
 * Groups Management Page - Professional Community Hub
 * Modern design with group discovery, management, and quick access to chat
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiMessageSquare, FiLock, FiGlobe, FiSearch, FiCalendar, FiStar, FiTrendingUp, FiX } from 'react-icons/fi';
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
    <div className="min-h-screen bg-slate-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Community Groups</h1>
              <p className="text-indigo-100 text-sm sm:text-base md:text-lg">Connect, collaborate, and communicate with your community</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm sm:text-base">
              <FiPlus className="text-lg sm:text-xl" /> Create Group
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><FiUsers className="text-lg sm:text-xl" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{groups.length}</p>
                  <p className="text-indigo-200 text-xs sm:text-sm">Total Groups</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><FiGlobe className="text-lg sm:text-xl" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{groups.filter(g => g.visibility === 'PUBLIC').length}</p>
                  <p className="text-indigo-200 text-xs sm:text-sm">Public Groups</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><FiLock className="text-lg sm:text-xl" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{groups.filter(g => g.visibility === 'PRIVATE').length}</p>
                  <p className="text-indigo-200 text-xs sm:text-sm">Private Groups</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><FiTrendingUp className="text-lg sm:text-xl" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{groups.reduce((sum, g) => sum + g._count.members, 0)}</p>
                  <p className="text-indigo-200 text-xs sm:text-sm">Total Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters & Search */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm sm:text-base" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {(['all', 'my', 'public'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50'}`}>
                {f === 'all' ? 'All Groups' : f === 'my' ? 'My Groups' : 'Public'}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex justify-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-slate-700 border-t-indigo-500"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 sm:py-20 bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl border border-slate-700/50 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FiMessageSquare className="text-2xl sm:text-3xl text-indigo-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No groups found</h3>
            <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">Create your first group to start building your community</p>
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 text-sm sm:text-base">
              <FiPlus /> Create Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, idx) => (
              <div key={group.id} className="bg-slate-800/50 backdrop-blur rounded-xl sm:rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all duration-300 overflow-hidden group">
                {/* Card Header with Gradient */}
                <div className={`h-24 sm:h-28 bg-gradient-to-br ${getGradient(idx)} relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      {group.visibility === 'PRIVATE' ? (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-1">
                          <FiLock size={10} className="sm:w-3 sm:h-3" /> Private
                        </span>
                      ) : (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs font-medium flex items-center gap-1">
                          <FiGlobe size={10} className="sm:w-3 sm:h-3" /> Public
                        </span>
                      )}
                    </div>
                    {group.owner.id === user?.id && (
                      <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-yellow-400/90 rounded-full text-yellow-900 text-[10px] sm:text-xs font-medium flex items-center gap-1">
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
                    <span className="flex items-center gap-1 sm:gap-1.5"><FiUsers size={12} className="sm:w-3.5 sm:h-3.5" /> {group._count.members} members</span>
                    <span className="flex items-center gap-1 sm:gap-1.5"><FiCalendar size={12} className="sm:w-3.5 sm:h-3.5" /> {formatDate(group.createdAt)}</span>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-700/30 rounded-lg sm:rounded-xl mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                      {group.owner.avatar ? <img src={group.owner.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : group.owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate">{group.owner.name}</p>
                      <p className="text-[10px] sm:text-xs text-slate-500">Group Owner</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/groups/${group.id}/chat`} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-indigo-700 transition-colors text-xs sm:text-sm">
                      <FiMessageSquare size={14} className="sm:w-4 sm:h-4" /> Open Chat
                    </Link>
                    {group.owner.id === user?.id && (
                      <>
                        <Link to={`/groups/${group.id}`} className="p-2 sm:p-2.5 bg-slate-700/50 text-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-600/50 transition-colors">
                          <FiEdit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </Link>
                        <button onClick={() => setDeleteGroup(group)} className="p-2 sm:p-2.5 bg-red-500/20 text-red-400 rounded-lg sm:rounded-xl hover:bg-red-500/30 transition-colors">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-700/50 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-6 text-white sticky top-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold">Create New Group</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"><FiX size={18} className="sm:w-5 sm:h-5" /></button>
              </div>
              <p className="text-indigo-100 mt-1 text-sm sm:text-base">Start a new community space</p>
            </div>
            <form onSubmit={handleCreate} className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">Group Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm sm:text-base" placeholder="Enter group name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-2.5 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border border-r-0 border-slate-600/50 rounded-l-lg sm:rounded-l-xl text-slate-400 text-xs sm:text-sm">/groups/</span>
                    <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/50 border border-slate-600/50 rounded-r-lg sm:rounded-r-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm sm:text-base" placeholder="group-slug" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-sm sm:text-base" rows={3} placeholder="What's this group about?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">Visibility</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, visibility: 'PUBLIC' })}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${formData.visibility === 'PUBLIC' ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-600/50 hover:border-slate-500'}`}>
                      <FiGlobe className={`mx-auto text-xl sm:text-2xl mb-1.5 sm:mb-2 ${formData.visibility === 'PUBLIC' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <p className="font-medium text-white text-sm sm:text-base">Public</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">Anyone can join</p>
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, visibility: 'PRIVATE' })}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${formData.visibility === 'PRIVATE' ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-600/50 hover:border-slate-500'}`}>
                      <FiLock className={`mx-auto text-xl sm:text-2xl mb-1.5 sm:mb-2 ${formData.visibility === 'PRIVATE' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <p className="font-medium text-white text-sm sm:text-base">Private</p>
                      <p className="text-[10px] sm:text-xs text-slate-400">Invite only</p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 sm:mt-8 flex gap-2 sm:gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl font-medium hover:bg-slate-600/50 transition-colors text-sm sm:text-base">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm sm:text-base">
                  {saving ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteGroup} title="Delete Group" message={`Are you sure you want to delete "${deleteGroup?.name}"? This will permanently delete all messages and member data.`}
        confirmText="Delete" onConfirm={handleDelete} onCancel={() => setDeleteGroup(null)} variant="danger" />
    </div>
  );
}

