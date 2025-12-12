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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Community Groups</h1>
              <p className="text-indigo-100 text-lg">Connect, collaborate, and communicate with your community</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <FiPlus className="text-xl" /> Create Group
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg"><FiUsers className="text-xl" /></div>
                <div>
                  <p className="text-2xl font-bold">{groups.length}</p>
                  <p className="text-indigo-200 text-sm">Total Groups</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg"><FiGlobe className="text-xl" /></div>
                <div>
                  <p className="text-2xl font-bold">{groups.filter(g => g.visibility === 'PUBLIC').length}</p>
                  <p className="text-indigo-200 text-sm">Public Groups</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg"><FiLock className="text-xl" /></div>
                <div>
                  <p className="text-2xl font-bold">{groups.filter(g => g.visibility === 'PRIVATE').length}</p>
                  <p className="text-indigo-200 text-sm">Private Groups</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg"><FiTrendingUp className="text-xl" /></div>
                <div>
                  <p className="text-2xl font-bold">{groups.reduce((sum, g) => sum + g._count.members, 0)}</p>
                  <p className="text-indigo-200 text-sm">Total Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search groups by name or description..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-0 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="flex gap-2">
            {(['all', 'my', 'public'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-3 rounded-xl font-medium transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {f === 'all' ? 'All Groups' : f === 'my' ? 'My Groups' : 'Public'}
              </button>
            ))}
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="text-3xl text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-500 mb-6">Create your first group to start building your community</p>
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
              <FiPlus /> Create Group
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, idx) => (
              <div key={group.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Card Header with Gradient */}
                <div className={`h-28 bg-gradient-to-br ${getGradient(idx)} relative`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      {group.visibility === 'PRIVATE' ? (
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
                          <FiLock size={12} /> Private
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
                          <FiGlobe size={12} /> Public
                        </span>
                      )}
                    </div>
                    {group.owner.id === user?.id && (
                      <span className="px-2.5 py-1 bg-yellow-400/90 rounded-full text-yellow-900 text-xs font-medium flex items-center gap-1">
                        <FiStar size={12} /> Owner
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{group.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">{group.description || 'No description available'}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-5">
                    <span className="flex items-center gap-1.5"><FiUsers size={14} /> {group._count.members} members</span>
                    <span className="flex items-center gap-1.5"><FiCalendar size={14} /> {formatDate(group.createdAt)}</span>
                  </div>

                  {/* Owner Info */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {group.owner.avatar ? <img src={group.owner.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : group.owner.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{group.owner.name}</p>
                      <p className="text-xs text-gray-500">Group Owner</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link to={`/groups/${group.id}/chat`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                      <FiMessageSquare size={16} /> Open Chat
                    </Link>
                    {group.owner.id === user?.id && (
                      <>
                        <Link to={`/groups/${group.id}`} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                          <FiEdit2 size={18} />
                        </Link>
                        <button onClick={() => setDeleteGroup(group)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                          <FiTrash2 size={18} />
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create New Group</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><FiX size={20} /></button>
              </div>
              <p className="text-indigo-100 mt-1">Start a new community space</p>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="Enter group name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm">/groups/</span>
                    <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" placeholder="group-slug" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none" rows={3} placeholder="What's this group about?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData({ ...formData, visibility: 'PUBLIC' })}
                      className={`p-4 rounded-xl border-2 transition-all ${formData.visibility === 'PUBLIC' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <FiGlobe className={`mx-auto text-2xl mb-2 ${formData.visibility === 'PUBLIC' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className="font-medium text-gray-900">Public</p>
                      <p className="text-xs text-gray-500">Anyone can join</p>
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, visibility: 'PRIVATE' })}
                      className={`p-4 rounded-xl border-2 transition-all ${formData.visibility === 'PRIVATE' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <FiLock className={`mx-auto text-2xl mb-2 ${formData.visibility === 'PRIVATE' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <p className="font-medium text-gray-900">Private</p>
                      <p className="text-xs text-gray-500">Invite only</p>
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
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

