/**
 * Marketplace Admin Page
 * Manage theme marketplace submissions, approvals, and featured themes
 */

import { useState, useEffect } from 'react';
import {
  FiPackage, FiCheck, FiX, FiStar, FiTrash2, FiLoader, FiSearch,
  FiEye, FiDownload, FiClock, FiUser, FiExternalLink,
  FiAlertCircle, FiAward, FiTrendingUp, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { marketplaceApi, MarketplaceTheme } from '../services/api';

type TabType = 'pending' | 'approved' | 'all';

export default function MarketplaceAdmin() {
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, featured: 0, totalDownloads: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<MarketplaceTheme | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch themes based on tab
  const fetchThemes = async () => {
    setLoading(true);
    try {
      const statusMap: Record<TabType, string | undefined> = {
        pending: 'pending',
        approved: 'approved',
        all: undefined,
      };
      const response = await marketplaceApi.getAdminThemes({
        status: statusMap[activeTab],
        search: searchTerm || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setThemes(response.data.themes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
      toast.error('Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await marketplaceApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchThemes();
    fetchStats();
  }, [activeTab, pagination.page]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pagination.page === 1) {
        fetchThemes();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleApprove = async (theme: MarketplaceTheme) => {
    setActionLoading(theme.id);
    try {
      await marketplaceApi.approveTheme(theme.id);
      toast.success(`${theme.name} approved successfully!`);
      fetchThemes();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve theme');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTheme || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setActionLoading(selectedTheme.id);
    try {
      await marketplaceApi.rejectTheme(selectedTheme.id, rejectReason);
      toast.success(`${selectedTheme.name} rejected`);
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedTheme(null);
      fetchThemes();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject theme');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (theme: MarketplaceTheme) => {
    setActionLoading(theme.id);
    try {
      await marketplaceApi.setFeatured(theme.id, !theme.isFeatured);
      toast.success(theme.isFeatured ? 'Removed from featured' : 'Added to featured');
      fetchThemes();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update featured status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (theme: MarketplaceTheme) => {
    if (!confirm(`Are you sure you want to delete "${theme.name}"? This cannot be undone.`)) return;
    setActionLoading(theme.id);
    try {
      await marketplaceApi.deleteTheme(theme.id);
      toast.success(`${theme.name} deleted`);
      fetchThemes();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete theme');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      suspended: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return styles[status] || styles.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'pending', label: 'Pending Review', icon: <FiClock />, count: stats.pending },
    { key: 'approved', label: 'Approved', icon: <FiCheck />, count: stats.approved },
    { key: 'all', label: 'All Themes', icon: <FiPackage />, count: stats.total },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <FiPackage className="text-violet-400" />
            Marketplace Manager
          </h1>
          <p className="text-slate-400 mt-1">Manage theme submissions and approvals</p>
        </div>
        <button
          onClick={() => { fetchThemes(); fetchStats(); }}
          className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg"><FiPackage className="text-violet-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg"><FiClock className="text-amber-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg"><FiCheck className="text-emerald-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-xs text-slate-400">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg"><FiAward className="text-amber-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.featured}</p>
              <p className="text-xs text-slate-400">Featured</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg"><FiTrendingUp className="text-blue-400" size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalDownloads.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Downloads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-violet-400" size={32} />
          <span className="ml-3 text-slate-400">Loading themes...</span>
        </div>
      )}

      {/* Themes Table */}
      {!loading && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Theme</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Author</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Stats</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Submitted</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {themes.map((theme) => (
                <tr key={theme.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={theme.thumbnailUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=100&h=75&fit=crop'}
                        alt={theme.name}
                        className="w-16 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          {theme.name}
                          {theme.isFeatured && <FiAward className="text-amber-400" size={14} />}
                        </p>
                        <p className="text-xs text-slate-500">v{theme.version}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300">{theme.author}</p>
                    {theme.submittedBy && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <FiUser size={10} /> {theme.submittedBy.name}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-lg capitalize">
                      {theme.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 border text-xs rounded-lg capitalize ${getStatusBadge(theme.status)}`}>
                      {theme.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><FiDownload size={12} /> {theme.downloads}</span>
                      <span className="flex items-center gap-1"><FiStar size={12} /> {theme.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {formatDate(theme.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedTheme(theme); setShowDetailModal(true); }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      {theme.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(theme)}
                            disabled={actionLoading === theme.id}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === theme.id ? <FiLoader className="animate-spin" size={16} /> : <FiCheck size={16} />}
                          </button>
                          <button
                            onClick={() => { setSelectedTheme(theme); setShowRejectModal(true); }}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <FiX size={16} />
                          </button>
                        </>
                      )}
                      {theme.status === 'approved' && (
                        <button
                          onClick={() => handleToggleFeatured(theme)}
                          disabled={actionLoading === theme.id}
                          className={`p-2 rounded-lg transition-colors ${
                            theme.isFeatured
                              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/20'
                              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-700'
                          }`}
                          title={theme.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                        >
                          <FiStar size={16} className={theme.isFeatured ? 'fill-current' : ''} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(theme)}
                        disabled={actionLoading === theme.id}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty State */}
          {themes.length === 0 && (
            <div className="text-center py-16">
              <FiPackage className="mx-auto text-slate-600" size={48} />
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">No themes found</h3>
              <p className="text-slate-400">
                {activeTab === 'pending' ? 'No themes are waiting for review' : 'No themes match your criteria'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-slate-400 px-4">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTheme && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-md">
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FiAlertCircle className="text-red-400" />
                Reject Theme
              </h3>
            </div>
            <div className="p-6">
              <p className="text-slate-300 mb-4">
                You are about to reject <strong>{selectedTheme.name}</strong>. Please provide a reason:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
              />
            </div>
            <div className="p-6 border-t border-slate-700/50 flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelectedTheme(null); }}
                className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === selectedTheme.id || !rejectReason.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === selectedTheme.id ? <FiLoader className="animate-spin" size={16} /> : <FiX size={16} />}
                Reject Theme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTheme && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FiPackage className="text-violet-400" />
                Theme Details
              </h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedTheme(null); }} className="text-slate-400 hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Thumbnail */}
              <img
                src={selectedTheme.thumbnailUrl || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop'}
                alt={selectedTheme.name}
                className="w-full h-48 object-cover rounded-xl"
              />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Name</label>
                  <p className="text-white font-medium">{selectedTheme.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Version</label>
                  <p className="text-white">{selectedTheme.version}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Author</label>
                  <p className="text-white">{selectedTheme.author}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Category</label>
                  <p className="text-white capitalize">{selectedTheme.category}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Status</label>
                  <span className={`px-2 py-1 border text-xs rounded-lg capitalize ${getStatusBadge(selectedTheme.status)}`}>
                    {selectedTheme.status}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Price</label>
                  <p className="text-white">{selectedTheme.price > 0 ? `$${selectedTheme.price}` : 'Free'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-slate-500 uppercase">Description</label>
                <p className="text-slate-300 mt-1">{selectedTheme.description || 'No description provided'}</p>
              </div>

              {/* Features & Tags */}
              {selectedTheme.features && selectedTheme.features.length > 0 && (
                <div>
                  <label className="text-xs text-slate-500 uppercase">Features</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedTheme.features.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-lg">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 p-4 bg-slate-700/30 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedTheme.downloads}</p>
                  <p className="text-xs text-slate-400">Downloads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedTheme.rating.toFixed(1)}</p>
                  <p className="text-xs text-slate-400">Rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedTheme.ratingCount}</p>
                  <p className="text-xs text-slate-400">Reviews</p>
                </div>
              </div>

              {/* Links */}
              <div className="flex gap-3">
                {selectedTheme.demoUrl && (
                  <a
                    href={selectedTheme.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 flex items-center gap-2"
                  >
                    <FiExternalLink size={16} /> Demo
                  </a>
                )}
                {selectedTheme.repositoryUrl && (
                  <a
                    href={selectedTheme.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 flex items-center gap-2"
                  >
                    <FiExternalLink size={16} /> Repository
                  </a>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700/50 flex justify-end gap-3">
              {selectedTheme.status === 'pending' && (
                <>
                  <button
                    onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                    className="px-6 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all flex items-center gap-2"
                  >
                    <FiX size={16} /> Reject
                  </button>
                  <button
                    onClick={() => { handleApprove(selectedTheme); setShowDetailModal(false); }}
                    disabled={actionLoading === selectedTheme.id}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-medium hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <FiCheck size={16} /> Approve Theme
                  </button>
                </>
              )}
              {selectedTheme.status !== 'pending' && (
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

