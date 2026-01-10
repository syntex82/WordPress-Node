/**
 * Demo Analytics Dashboard
 * Comprehensive admin page for demo user management and analytics
 */

import { useEffect, useState, useCallback } from 'react';
import { useThemeClasses } from '../../contexts/SiteThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FiUsers, FiActivity, FiClock, FiTrendingUp, FiMail, FiDownload,
  FiRefreshCw, FiSearch, FiFilter, FiChevronDown, FiChevronUp,
  FiMoreVertical, FiUserPlus, FiUserMinus, FiKey, FiCalendar,
  FiEye, FiCheck, FiX, FiAlertCircle, FiBarChart2, FiTrash2
} from 'react-icons/fi';
import {
  demoAnalyticsApi,
  DemoUserDetail,
  DemoMetrics,
  DemoSession,
  DemoListFilters,
  MarketingList,
} from '../../services/api';

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  converted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  terminated: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Engagement score colors
const getEngagementColor = (score: number): string => {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
};

export default function DemoAnalytics() {
  const theme = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DemoMetrics | null>(null);
  const [users, setUsers] = useState<DemoUserDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [marketingLists, setMarketingLists] = useState<MarketingList[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<DemoSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<DemoListFilters>({
    status: 'all',
    segment: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsRes, usersRes, listsRes] = await Promise.all([
        demoAnalyticsApi.getMetrics(),
        demoAnalyticsApi.getUsers({ ...filters, page }),
        demoAnalyticsApi.getMarketingLists(),
      ]);
      setMetrics(metricsRes.data);
      setUsers(usersRes.data.users);
      setTotal(usersRes.data.total);
      setTotalPages(usersRes.data.totalPages);
      setMarketingLists(listsRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load demo analytics');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(f => ({ ...f, search: e.target.value }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof DemoListFilters, value: any) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const handleSort = (field: DemoListFilters['sortBy']) => {
    setFilters(f => ({
      ...f,
      sortBy: field,
      sortOrder: f.sortBy === field && f.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleExpandUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    setSessionsLoading(true);
    try {
      const res = await demoAnalyticsApi.getUserSessions(userId);
      setUserSessions(res.data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Continued in next part...
  const handleExtendDemo = async (userId: string, hours: number = 24) => {
    try {
      await demoAnalyticsApi.extendDemo(userId, hours);
      toast.success(`Demo extended by ${hours} hours`);
      fetchData();
    } catch {
      toast.error('Failed to extend demo');
    }
  };

  const handleResetAccess = async (userId: string) => {
    try {
      const res = await demoAnalyticsApi.resetAccess(userId);
      toast.success('Access token reset');
      navigator.clipboard.writeText(res.data.newToken);
      toast.success('New token copied to clipboard');
    } catch {
      toast.error('Failed to reset access');
    }
  };

  const handleAddToList = async (userId: string) => {
    try {
      await demoAnalyticsApi.addToMailingList(userId);
      toast.success('Added to mailing list');
      fetchData();
    } catch {
      toast.error('Failed to add to list');
    }
  };

  const handleRemoveFromList = async (userId: string) => {
    try {
      await demoAnalyticsApi.removeFromMailingList(userId);
      toast.success('Removed from mailing list');
      fetchData();
    } catch {
      toast.error('Failed to remove from list');
    }
  };

  const handleBulkAddToList = async () => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }
    try {
      const res = await demoAnalyticsApi.bulkAddToMailingList(Array.from(selectedUsers));
      toast.success(`Added ${res.data.added} users to mailing list`);
      setSelectedUsers(new Set());
      fetchData();
    } catch {
      toast.error('Failed to add users to list');
    }
  };

  const handleExport = async () => {
    try {
      const res = await demoAnalyticsApi.exportUsers({
        status: filters.status,
        segment: filters.segment,
      });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'demo-users.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this demo user? This action cannot be undone.')) {
      return;
    }
    try {
      await demoAnalyticsApi.deleteUser(userId);
      toast.success('Demo user deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.size} demo user(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await demoAnalyticsApi.bulkDeleteUsers(Array.from(selectedUsers));
      toast.success(`Deleted ${res.data.deleted} users`);
      setSelectedUsers(new Set());
      fetchData();
    } catch {
      toast.error('Failed to delete users');
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !metrics) return <LoadingSpinner />;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Demo Analytics</h1>
          <p className={`mt-1 ${theme.textMuted}`}>Track demo performance and manage users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${theme.border} ${theme.textSecondary} hover:bg-slate-700/50`}
          >
            <FiDownload size={18} />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className={`p-2 rounded-lg border transition-colors ${theme.border} ${theme.icon} ${theme.iconHover}`}
          >
            <FiRefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard icon={<FiUsers />} label="Total Demos" value={metrics.totalDemos} color="blue" />
          <MetricCard icon={<FiActivity />} label="Active" value={metrics.activeDemos} color="green" />
          <MetricCard icon={<FiClock />} label="Expired" value={metrics.expiredDemos} color="red" />
          <MetricCard icon={<FiTrendingUp />} label="Conversions" value={metrics.conversions} color="purple" />
          <MetricCard icon={<FiBarChart2 />} label="Conv. Rate" value={`${metrics.conversionRate}%`} color="emerald" />
          <MetricCard icon={<FiMail />} label="Inquiries" value={metrics.inquiries} color="amber" />
        </div>
      )}

      {/* Funnel */}
      {metrics && (
        <div className={`backdrop-blur rounded-xl border p-6 mb-6 ${theme.card}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>Conversion Funnel</h3>
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <FunnelStep label="Demos Started" value={metrics.totalDemos} />
            <FunnelArrow />
            <FunnelStep label="Upgrade Views" value={metrics.pageViews} />
            <FunnelArrow />
            <FunnelStep label="CTA Clicks" value={metrics.ctaClicks} />
            <FunnelArrow />
            <FunnelStep label="Inquiries" value={metrics.inquiries} />
            <FunnelArrow />
            <FunnelStep label="Converted" value={metrics.conversions} highlight />
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className={`backdrop-blur rounded-xl border p-4 mb-6 ${theme.card}`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
              <input
                type="text"
                placeholder="Search by email, name, or company..."
                value={filters.search}
                onChange={handleSearch}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${theme.border} ${theme.textSecondary}`}
          >
            <FiFilter size={18} />
            Filters
            {showFilters ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          {selectedUsers.size > 0 && (
            <>
              <button
                onClick={handleBulkAddToList}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <FiUserPlus size={18} />
                Add {selectedUsers.size} to List
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <FiTrash2 size={18} />
                Delete {selectedUsers.size}
              </button>
            </>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={`px-3 py-2 rounded-lg border ${theme.select}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={filters.segment}
              onChange={(e) => handleFilterChange('segment', e.target.value)}
              className={`px-3 py-2 rounded-lg border ${theme.select}`}
            >
              <option value="all">All Segments</option>
              <option value="high_engagement">High Engagement</option>
              <option value="low_engagement">Low Engagement</option>
              <option value="upgrade_requested">Upgrade Requested</option>
            </select>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
        <table className="min-w-full">
          <thead className={theme.tableHeader}>
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={selectAllUsers}
                  className="rounded border-slate-600"
                />
              </th>
              <SortableHeader field="createdAt" label="User" current={filters.sortBy} order={filters.sortOrder} onSort={handleSort} />
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Status</th>
              <SortableHeader field="engagementScore" label="Engagement" current={filters.sortBy} order={filters.sortOrder} onSort={handleSort} />
              <SortableHeader field="sessionCount" label="Sessions" current={filters.sortBy} order={filters.sortOrder} onSort={handleSort} />
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Time Spent</th>
              <SortableHeader field="lastAccessedAt" label="Last Active" current={filters.sortBy} order={filters.sortOrder} onSort={handleSort} />
              <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Mailing</th>
              <th className={`px-4 py-3 text-right text-xs font-medium uppercase ${theme.textMuted}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${theme.border}`}>
            {users.map((user) => (
              <>
                <tr key={user.id} className={`${theme.tableRow} ${expandedUser === user.id ? 'bg-slate-800/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className={`font-medium ${theme.textPrimary}`}>{user.name || 'Unknown'}</p>
                      <p className={`text-sm ${theme.textMuted}`}>{user.email}</p>
                      {user.company && <p className={`text-xs ${theme.textMuted}`}>{user.company}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[user.status] || STATUS_COLORS.expired}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${user.engagementScore >= 70 ? 'bg-emerald-500' : user.engagementScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${user.engagementScore}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getEngagementColor(user.engagementScore)}`}>
                        {user.engagementScore}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${theme.textSecondary}`}>{user.sessionCount}</td>
                  <td className={`px-4 py-3 ${theme.textSecondary}`}>{formatDuration(user.totalTimeSpent)}</td>
                  <td className={`px-4 py-3 ${theme.textMuted}`}>{formatDate(user.lastAccessedAt)}</td>
                  <td className="px-4 py-3">
                    {user.isOnMailingList ? (
                      <span className="text-emerald-400"><FiCheck /></span>
                    ) : (
                      <span className="text-slate-500"><FiX /></span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleExpandUser(user.id)}
                        className={`p-1.5 rounded-lg transition-colors ${theme.iconHover}`}
                        title="View details"
                      >
                        <FiEye size={16} />
                      </button>
                      <UserActionsMenu
                        user={user}
                        onExtend={() => handleExtendDemo(user.id)}
                        onResetAccess={() => handleResetAccess(user.id)}
                        onAddToList={() => handleAddToList(user.id)}
                        onRemoveFromList={() => handleRemoveFromList(user.id)}
                        onDelete={() => handleDeleteUser(user.id)}
                      />
                    </div>
                  </td>
                </tr>
                {expandedUser === user.id && (
                  <tr key={`${user.id}-expanded`}>
                    <td colSpan={9} className="px-4 py-4 bg-slate-800/30">
                      <UserDetailPanel
                        user={user}
                        sessions={userSessions}
                        loading={sessionsLoading}
                        formatDuration={formatDuration}
                        formatDate={formatDate}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${theme.border}`}>
            <p className={theme.textMuted}>
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-lg border transition-colors ${theme.border} ${page === 1 ? 'opacity-50 cursor-not-allowed' : theme.iconHover}`}
              >
                Previous
              </button>
              <span className={theme.textSecondary}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-lg border transition-colors ${theme.border} ${page === totalPages ? 'opacity-50 cursor-not-allowed' : theme.iconHover}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Marketing Lists Summary */}
      {marketingLists.length > 0 && (
        <div className={`backdrop-blur rounded-xl border p-6 mt-6 ${theme.card}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme.textPrimary}`}>Marketing Lists</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketingLists.map((list) => (
              <div key={list.id} className={`p-4 rounded-lg border ${theme.border} ${theme.isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${theme.textPrimary}`}>{list.name}</h4>
                  <span className={`text-sm ${theme.textMuted}`}>{list.subscriberCount} subscribers</span>
                </div>
                {list.description && <p className={`text-sm ${theme.textMuted}`}>{list.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const theme = useThemeClasses();
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-red-500/20 text-red-400',
    purple: 'bg-purple-500/20 text-purple-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };
  return (
    <div className={`backdrop-blur rounded-xl border p-4 ${theme.card}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className={`text-xs ${theme.textMuted}`}>{label}</p>
          <p className={`text-xl font-bold ${theme.textPrimary}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const theme = useThemeClasses();
  return (
    <div className={`text-center px-4 py-3 rounded-lg ${highlight ? 'bg-purple-500/20 border border-purple-500/30' : ''}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-purple-400' : theme.textPrimary}`}>{value}</p>
      <p className={`text-xs ${theme.textMuted}`}>{label}</p>
    </div>
  );
}

function FunnelArrow() {
  return <span className="text-slate-500 text-xl">→</span>;
}

function SortableHeader({ field, label, current, order, onSort }: {
  field: DemoListFilters['sortBy'];
  label: string;
  current?: DemoListFilters['sortBy'];
  order?: 'asc' | 'desc';
  onSort: (field: DemoListFilters['sortBy']) => void;
}) {
  const theme = useThemeClasses();
  const isActive = current === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3 text-left text-xs font-medium uppercase cursor-pointer hover:text-blue-400 transition-colors ${isActive ? 'text-blue-400' : theme.textMuted}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (order === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />)}
      </div>
    </th>
  );
}

function UserActionsMenu({ user, onExtend, onResetAccess, onAddToList, onRemoveFromList, onDelete }: {
  user: DemoUserDetail;
  onExtend: () => void;
  onResetAccess: () => void;
  onAddToList: () => void;
  onRemoveFromList: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const theme = useThemeClasses();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-1.5 rounded-lg transition-colors ${theme.iconHover}`}
      >
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-xl z-20 ${theme.card} ${theme.border}`}>
            <button
              onClick={() => { onExtend(); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors ${theme.textSecondary}`}
            >
              <FiCalendar size={16} />
              Extend 24 hours
            </button>
            <button
              onClick={() => { onResetAccess(); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors ${theme.textSecondary}`}
            >
              <FiKey size={16} />
              Reset Access Token
            </button>
            {user.isOnMailingList ? (
              <button
                onClick={() => { onRemoveFromList(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <FiUserMinus size={16} />
                Remove from List
              </button>
            ) : (
              <button
                onClick={() => { onAddToList(); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <FiUserPlus size={16} />
                Add to Mailing List
              </button>
            )}
            <div className={`border-t ${theme.border} my-1`} />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <FiTrash2 size={16} />
              Delete Demo
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function UserDetailPanel({ user, sessions, loading, formatDuration, formatDate }: {
  user: DemoUserDetail;
  sessions: DemoSession[];
  loading: boolean;
  formatDuration: (m: number) => string;
  formatDate: (d: string | null) => string;
}) {
  const theme = useThemeClasses();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Info */}
      <div>
        <h4 className={`font-semibold mb-3 ${theme.textPrimary}`}>User Details</h4>
        <div className="space-y-2">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Name" value={user.name || '-'} />
          <InfoRow label="Company" value={user.company || '-'} />
          <InfoRow label="Phone" value={user.phone || '-'} />
          <InfoRow label="Created" value={formatDate(user.createdAt)} />
          <InfoRow label="Expires" value={formatDate(user.expiresAt)} />
          <InfoRow label="Upgrade Requested" value={user.upgradeRequested ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Feature Usage */}
      <div>
        <h4 className={`font-semibold mb-3 ${theme.textPrimary}`}>Top Features Used</h4>
        {user.topFeatures.length === 0 ? (
          <p className={theme.textMuted}>No feature usage recorded</p>
        ) : (
          <div className="space-y-2">
            {user.topFeatures.map((f) => (
              <div key={f.feature} className="flex items-center justify-between">
                <span className={theme.textSecondary}>{f.feature}</span>
                <span className={`text-sm ${theme.textMuted}`}>{f.count} uses</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions */}
      <div>
        <h4 className={`font-semibold mb-3 ${theme.textPrimary}`}>Recent Sessions</h4>
        {loading ? (
          <p className={theme.textMuted}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className={theme.textMuted}>No sessions recorded</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className={`p-2 rounded-lg ${theme.isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${theme.textSecondary}`}>
                    {new Date(s.startedAt).toLocaleDateString()}
                  </span>
                  <span className={`text-xs ${theme.textMuted}`}>
                    {s.duration ? formatDuration(Math.round(s.duration / 60)) : 'Active'}
                  </span>
                </div>
                <div className={`text-xs ${theme.textMuted}`}>
                  {s.pagesViewed} pages • {s.actionsCount} actions
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useThemeClasses();
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${theme.textMuted}`}>{label}</span>
      <span className={`text-sm ${theme.textSecondary}`}>{value}</span>
    </div>
  );
}
