/**
 * Blocked IPs Management Page
 * Block and unblock IP addresses for access control
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import { useThemeClasses } from '../../contexts/SiteThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiShield, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

export default function BlockedIPs() {
  const theme = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBlockedIps();
  }, []);

  const fetchBlockedIps = async () => {
    try {
      const response = await securityApi.getBlockedIps();
      setBlockedIps(response.data);
    } catch (error) {
      toast.error('Failed to load blocked IPs');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await securityApi.blockIp({
        ip: newIp,
        reason,
        expiresAt: expiresAt || undefined,
      });
      toast.success('IP address blocked successfully');
      setShowAddModal(false);
      setNewIp('');
      setReason('');
      setExpiresAt('');
      fetchBlockedIps();
    } catch (error) {
      toast.error('Failed to block IP address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;
    
    try {
      await securityApi.unblockIp(ip);
      toast.success('IP address unblocked successfully');
      fetchBlockedIps();
    } catch (error) {
      toast.error('Failed to unblock IP address');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-6">
        <Link to=".." relative="path" className="flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors">
          <FiArrowLeft className="mr-2" size={18} />
          Back to Security Center
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>IP Blocking</h1>
            <p className={`mt-1 ${theme.textMuted}`}>Block malicious IP addresses from accessing your site</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-colors shadow-lg shadow-blue-500/20"
          >
            <FiPlus className="mr-2" size={18} />
            Block IP
          </button>
        </div>
      </div>

      {/* Blocked IPs Table */}
      <div className={`backdrop-blur rounded-xl border overflow-hidden ${theme.card}`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Blocked IP Addresses ({blockedIps.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${theme.border}`}>
            <thead className={theme.tableHeader}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                  IP Address
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                  Reason
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                  Blocked At
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                  Expires At
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {blockedIps.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${theme.textMuted}`}>
                    No blocked IP addresses
                  </td>
                </tr>
              ) : (
                blockedIps.map((blocked) => (
                  <tr key={blocked.id} className={theme.tableRow}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiShield className="text-red-400 mr-2" size={18} />
                        <span className={`font-mono font-semibold ${theme.textPrimary}`}>{blocked.ip}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${theme.textSecondary}`}>{blocked.reason}</span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textMuted}`}>
                      {new Date(blocked.createdAt).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme.textMuted}`}>
                      {blocked.expiresAt ? new Date(blocked.expiresAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUnblockIp(blocked.ip)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-2xl border p-6 max-w-md w-full mx-4 shadow-2xl ${theme.isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Block IP Address</h3>
              <button onClick={() => setShowAddModal(false)} className={`${theme.icon} ${theme.iconHover} transition-colors`}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleBlockIp}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                  IP Address *
                </label>
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="192.168.1.1"
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme.input}`}
                  required
                />
              </div>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Suspicious activity, brute force attempts, etc."
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme.input}`}
                  rows={3}
                  required
                />
              </div>
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${theme.input}`}
                />
                <p className={`text-xs mt-1 ${theme.isDark ? 'text-slate-500' : 'text-gray-400'}`}>Leave empty for permanent block</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 border rounded-xl transition-colors ${theme.border} ${theme.textSecondary} ${theme.isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/20"
                >
                  {submitting ? 'Blocking...' : 'Block IP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

