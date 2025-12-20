/**
 * Developers Management Page
 * Admin page for managing developer profiles
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiSearch, FiX, FiEye, FiCheckCircle,
  FiXCircle, FiSlash, FiRefreshCw, FiStar, FiBarChart2,
  FiChevronLeft, FiChevronRight, FiUser, FiShield, FiCalendar,
  FiLock, FiExternalLink
} from 'react-icons/fi';
import api from '../../services/api';
import Tooltip from '../../components/Tooltip';
import { MARKETPLACE_TOOLTIPS } from '../../config/tooltips';
import toast from 'react-hot-toast';

interface Developer {
  id: string;
  displayName: string;
  slug: string;
  headline: string;
  category: string;
  status: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  projectsCompleted: number;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    createdAt: string;
    accountLockedUntil?: string;
    lastLoginAt?: string;
    username?: string;
  };
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400',
  EDITOR: 'bg-purple-500/20 text-purple-400',
  AUTHOR: 'bg-blue-500/20 text-blue-400',
  SUBSCRIBER: 'bg-slate-500/20 text-slate-400',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  INACTIVE: 'bg-slate-500/20 text-slate-400',
  SUSPENDED: 'bg-red-500/20 text-red-400',
  REJECTED: 'bg-red-500/20 text-red-400',
};

const categoryLabels: Record<string, string> = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  FULLSTACK: 'Full-Stack',
  MOBILE: 'Mobile',
  DEVOPS: 'DevOps',
  WORDPRESS: 'WordPress',
  DESIGN: 'UI/UX Design',
  DATABASE: 'Database',
  SECURITY: 'Security',
  OTHER: 'Other',
};

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    fetchDevelopers();
  }, [filter.status, filter.category, pagination.page]);

  const fetchDevelopers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.search) params.append('search', filter.search);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const { data } = await api.get(`/marketplace/developers/admin/all?${params}`);
      setDevelopers(data.developers || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error: any) {
      console.error('Error fetching developers:', error);
      toast.error(error.response?.data?.message || 'Failed to load developers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDevelopers();
  };

  const handleAction = async (id: string, action: string, reason?: string) => {
    try {
      await api.patch(`/marketplace/developers/${id}/${action}`, { reason });
      toast.success(`Developer ${action}d successfully`);
      fetchDevelopers();
    } catch (error: any) {
      console.error(`Error ${action} developer:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} developer`);
    }
  };

  const clearFilters = () => {
    setFilter({ status: '', category: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Developer Management
          </h1>
          <p className="text-slate-400 mt-1">Manage developer profiles and applications</p>
        </div>
        <Tooltip title={MARKETPLACE_TOOLTIPS.viewStatistics.title} content={MARKETPLACE_TOOLTIPS.viewStatistics.content} position="left">
          <Link
            to="/marketplace"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all"
          >
            <FiBarChart2 size={18} />
            Dashboard
          </Link>
        </Tooltip>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search developers..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-10 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <Tooltip title={MARKETPLACE_TOOLTIPS.statusFilter.title} content={MARKETPLACE_TOOLTIPS.statusFilter.content} position="bottom">
            <select
              value={filter.status}
              onChange={(e) => { setFilter({ ...filter, status: e.target.value }); setPagination(p => ({ ...p, page: 1 })); }}
              className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Tooltip>
          <Tooltip title={MARKETPLACE_TOOLTIPS.categoryFilter.title} content={MARKETPLACE_TOOLTIPS.categoryFilter.content} position="bottom">
            <select
              value={filter.category}
              onChange={(e) => { setFilter({ ...filter, category: e.target.value }); setPagination(p => ({ ...p, page: 1 })); }}
              className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Categories</option>
              <option value="FRONTEND">Frontend</option>
              <option value="BACKEND">Backend</option>
              <option value="FULLSTACK">Full-Stack</option>
              <option value="MOBILE">Mobile</option>
              <option value="DEVOPS">DevOps</option>
              <option value="WORDPRESS">WordPress</option>
              <option value="DESIGN">UI/UX Design</option>
            </select>
          </Tooltip>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiSearch size={16} />
            Search
          </button>
          <Tooltip title={MARKETPLACE_TOOLTIPS.clearFilters.title} content={MARKETPLACE_TOOLTIPS.clearFilters.content} position="bottom">
            <button
              type="button"
              onClick={clearFilters}
              className="bg-slate-700/50 border border-slate-600/50 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600/50 transition-colors flex items-center gap-2"
            >
              <FiX size={16} />
              Clear
            </button>
          </Tooltip>
        </form>
      </div>

      {/* Developers Table */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading developers...</p>
          </div>
        ) : developers.length === 0 ? (
          <div className="p-8 text-center">
            <FiUsers className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400">No developers found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Developer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">User Account</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {developers.map(dev => {
                const isAccountLocked = dev.user.accountLockedUntil && new Date(dev.user.accountLockedUntil) > new Date();
                return (
                <tr key={dev.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={dev.user.avatar || '/images/default-avatar.png'}
                          alt={dev.displayName}
                          className="w-10 h-10 rounded-full border border-slate-600 object-cover"
                        />
                        {isAccountLocked && (
                          <div className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 rounded-full">
                            <FiLock className="text-red-400" size={12} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white flex items-center gap-2">
                          {dev.displayName}
                          {dev.isVerified && (
                            <span className="text-blue-400" title="Verified Developer">
                              <FiCheckCircle size={14} />
                            </span>
                          )}
                          {dev.isFeatured && (
                            <span className="text-amber-400" title="Featured Developer">
                              <FiStar size={14} />
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">{dev.headline || 'No headline'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-slate-500" size={12} />
                        <span className="text-sm text-white">{dev.user.name}</span>
                        <Link
                          to={`/users/${dev.user.id}`}
                          className="text-blue-400 hover:text-blue-300"
                          title="View User Profile"
                        >
                          <FiExternalLink size={12} />
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500">{dev.user.email}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${roleColors[dev.user.role] || roleColors.SUBSCRIBER}`}>
                          <FiShield className="inline mr-1" size={10} />
                          {dev.user.role}
                        </span>
                        {isAccountLocked ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400">
                            <FiLock className="inline mr-1" size={10} />
                            LOCKED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <FiCalendar size={10} />
                        Joined {new Date(dev.user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">{categoryLabels[dev.category] || dev.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${statusColors[dev.status]}`}>
                      {dev.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm">
                      <FiStar className="text-amber-400" size={14} />
                      <span className="text-white">{Number(dev.rating).toFixed(1)}</span>
                      <span className="text-slate-500">({dev.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">${dev.hourlyRate}</span>
                    <span className="text-slate-500 text-sm">/hr</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {dev.status === 'PENDING' && (
                        <>
                          <Tooltip title={MARKETPLACE_TOOLTIPS.approveDeveloper.title} content={MARKETPLACE_TOOLTIPS.approveDeveloper.content} position="top">
                            <button
                              onClick={() => handleAction(dev.id, 'approve')}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                              <FiCheckCircle size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip title={MARKETPLACE_TOOLTIPS.rejectDeveloper.title} content={MARKETPLACE_TOOLTIPS.rejectDeveloper.content} position="top">
                            <button
                              onClick={() => handleAction(dev.id, 'reject', 'Does not meet requirements')}
                              className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <FiXCircle size={16} />
                            </button>
                          </Tooltip>
                        </>
                      )}
                      {dev.status === 'ACTIVE' && (
                        <Tooltip title={MARKETPLACE_TOOLTIPS.suspendDeveloper.title} content={MARKETPLACE_TOOLTIPS.suspendDeveloper.content} position="top">
                          <button
                            onClick={() => handleAction(dev.id, 'suspend', 'Policy violation')}
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            <FiSlash size={16} />
                          </button>
                        </Tooltip>
                      )}
                      {dev.status === 'SUSPENDED' && (
                        <Tooltip title={MARKETPLACE_TOOLTIPS.reactivateDeveloper.title} content={MARKETPLACE_TOOLTIPS.reactivateDeveloper.content} position="top">
                          <button
                            onClick={() => handleAction(dev.id, 'reactivate')}
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            <FiRefreshCw size={16} />
                          </button>
                        </Tooltip>
                      )}
                      <Tooltip title={MARKETPLACE_TOOLTIPS.viewDetails.title} content={MARKETPLACE_TOOLTIPS.viewDetails.content} position="top">
                        <Link
                          to={`/marketplace/developers/${dev.id}`}
                          className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        >
                          <FiEye size={16} />
                        </Link>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page === 1}
            className="flex items-center gap-2 px-3 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronLeft size={16} />
            Previous
          </button>
          <span className="text-slate-400">
            Page <span className="text-white font-medium">{pagination.page}</span> of <span className="text-white font-medium">{pagination.pages}</span>
          </span>
          <button
            onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
            disabled={pagination.page === pagination.pages}
            className="flex items-center gap-2 px-3 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

