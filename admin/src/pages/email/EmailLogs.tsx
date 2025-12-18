/**
 * Email Logs Page
 * View email history and delivery status
 */

import { useEffect, useState } from 'react';
import { emailApi } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiMail, FiCheck, FiX, FiClock, FiAlertCircle, FiEye, FiRefreshCw, FiFilter } from 'react-icons/fi';

interface EmailLog {
  id: string;
  toEmail: string;
  toName?: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  createdAt: string;
  sentAt?: string;
  failedAt?: string;
  errorMessage?: string;
  template?: { name: string; type: string };
  recipient?: { name: string; email: string };
}

interface Stats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  successRate: string;
}

export default function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', toEmail: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      const response = await emailApi.getLogs({
        page,
        limit: 20,
        status: filters.status || undefined,
        toEmail: filters.toEmail || undefined,
      });
      setLogs(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await emailApi.getLogStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return <FiCheck className="text-green-500" />;
      case 'FAILED':
      case 'BOUNCED':
        return <FiX className="text-red-500" />;
      case 'PENDING':
        return <FiClock className="text-yellow-500" />;
      default:
        return <FiAlertCircle className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SENT: 'bg-green-500/20 text-green-400',
      DELIVERED: 'bg-green-500/20 text-green-400',
      FAILED: 'bg-red-500/20 text-red-400',
      BOUNCED: 'bg-red-500/20 text-red-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Email Logs</h1>
          <p className="text-slate-400">Track sent emails and delivery status</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors">
            <FiFilter /> Filters
          </button>
          <button onClick={() => { fetchLogs(); fetchStats(); }} className="flex items-center gap-2 px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-colors">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Total Sent" value={stats.total} color="indigo" />
          <StatCard label="Delivered" value={stats.sent + stats.delivered} color="green" />
          <StatCard label="Failed" value={stats.failed} color="red" />
          <StatCard label="Pending" value={stats.pending} color="yellow" />
          <StatCard label="Success Rate" value={`${stats.successRate}%`} color="blue" />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Status</label>
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">All</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Recipient Email</label>
              <input type="text" value={filters.toEmail} onChange={(e) => { setFilters({ ...filters, toEmail: e.target.value }); setPage(1); }} className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Search by email..." />
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/30 border-b border-slate-700/50">
            <tr>
              <th className="text-left p-4 font-medium text-slate-400">Status</th>
              <th className="text-left p-4 font-medium text-slate-400">Recipient</th>
              <th className="text-left p-4 font-medium text-slate-400">Subject</th>
              <th className="text-left p-4 font-medium text-slate-400">Template</th>
              <th className="text-left p-4 font-medium text-slate-400">Date</th>
              <th className="text-left p-4 font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(log.status)}`}>
                    {getStatusIcon(log.status)} {log.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm font-medium text-white">{log.toName || log.toEmail}</div>
                  {log.toName && <div className="text-xs text-slate-500">{log.toEmail}</div>}
                </td>
                <td className="p-4 text-sm max-w-xs truncate text-slate-300">{log.subject}</td>
                <td className="p-4 text-sm text-slate-400">{log.template?.name || '-'}</td>
                <td className="p-4 text-sm text-slate-400">{formatDate(log.createdAt)}</td>
                <td className="p-4">
                  <button onClick={() => setSelectedLog(log)} className="p-1 text-slate-400 hover:text-blue-400 transition-colors" title="View Details">
                    <FiEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <FiMail className="mx-auto text-4xl text-slate-600 mb-4" />
            <p className="text-slate-400">No email logs found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 transition-colors">Previous</button>
          <span className="px-4 py-2 text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 transition-colors">Next</button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/50 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">Email Details</h2>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-colors"><FiX /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(selectedLog.status)}`}>
                  {selectedLog.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">To</span>
                <span className="text-white">{selectedLog.toEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subject</span>
                <span className="text-right max-w-xs truncate text-white">{selectedLog.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Template</span>
                <span className="text-white">{selectedLog.template?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-white">{formatDate(selectedLog.createdAt)}</span>
              </div>
              {selectedLog.sentAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Sent</span>
                  <span className="text-white">{formatDate(selectedLog.sentAt)}</span>
                </div>
              )}
              {selectedLog.errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-sm text-red-400"><strong>Error:</strong> {selectedLog.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

