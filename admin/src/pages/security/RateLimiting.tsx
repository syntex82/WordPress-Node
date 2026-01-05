/**
 * Rate Limiting Management Page
 * Configure rate limits and view violations
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { securityApi } from '../../services/api';
import { useThemeClasses } from '../../contexts/SiteThemeContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlus, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

export default function RateLimiting() {
  const theme = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<{
    endpoint: string;
    windowMs: number;
    maxRequests: number;
    enabled: boolean;
    blockDuration?: number;
  }>({
    endpoint: '',
    windowMs: 60000,
    maxRequests: 100,
    enabled: true,
    blockDuration: 15,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configsRes, violationsRes] = await Promise.all([
        securityApi.getRateLimits(),
        securityApi.getRateLimitViolations(),
      ]);
      setConfigs(configsRes.data);
      setViolations(violationsRes.data);
    } catch (error) {
      toast.error('Failed to load rate limiting data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await securityApi.upsertRateLimit(formData);
      toast.success('Rate limit configuration saved');
      setShowAddModal(false);
      setFormData({
        endpoint: '',
        windowMs: 60000,
        maxRequests: 100,
        enabled: true,
        blockDuration: 15,
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to save rate limit configuration');
    }
  };

  const handleDelete = async (endpoint: string) => {
    if (!confirm(`Delete rate limit for ${endpoint}?`)) return;
    
    try {
      await securityApi.deleteRateLimit(encodeURIComponent(endpoint));
      toast.success('Rate limit configuration deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete rate limit configuration');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to=".." relative="path" className="text-blue-400 hover:text-blue-300 flex items-center gap-2 mb-4">
          <FiArrowLeft /> Back to Security
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${theme.titleGradient}`}>Rate Limiting</h1>
            <p className={`mt-2 ${theme.textMuted}`}>Configure API rate limits and view violations</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
          >
            <FiPlus /> Add Rate Limit
          </button>
        </div>
      </div>

      {/* Rate Limit Configurations */}
      <div className={`backdrop-blur rounded-xl border mb-8 ${theme.card}`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <h2 className={`text-xl font-bold ${theme.textPrimary}`}>Rate Limit Configurations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme.tableHeader}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Endpoint</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Window</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Max Requests</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Block Duration</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-6 py-8 text-center ${theme.textMuted}`}>
                    No rate limit configurations found
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.id} className={theme.tableRow}>
                    <td className={`px-6 py-4 text-sm font-medium ${theme.textPrimary}`}>{config.endpoint}</td>
                    <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>{config.windowMs / 1000}s</td>
                    <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>{config.maxRequests}</td>
                    <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>
                      {config.blockDuration ? `${config.blockDuration}m` : 'None'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(config.endpoint)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Violations */}
      <div className={`backdrop-blur rounded-xl border ${theme.card}`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${theme.textPrimary}`}>
            <FiAlertTriangle className="text-orange-400" />
            Recent Violations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme.tableHeader}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>IP Address</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Endpoint</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Requests</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Limit</th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme.textMuted}`}>Time</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${theme.textMuted}`}>
                    No violations recorded
                  </td>
                </tr>
              ) : (
                violations.map((violation) => (
                  <tr key={violation.id} className={theme.tableRow}>
                    <td className={`px-6 py-4 text-sm font-mono ${theme.textPrimary}`}>{violation.ip}</td>
                    <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>{violation.endpoint}</td>
                    <td className="px-6 py-4 text-sm text-red-400 font-semibold">{violation.requests}</td>
                    <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>{violation.limit}</td>
                    <td className={`px-6 py-4 text-sm ${theme.textMuted}`}>
                      {new Date(violation.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-2xl border p-6 max-w-md w-full ${theme.isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${theme.textPrimary}`}>Add Rate Limit Configuration</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.textSecondary}`}>
                    Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    placeholder="e.g., /api/auth/login or global"
                    className={`w-full px-3 py-2 rounded-xl ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.textSecondary}`}>
                    Time Window (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.windowMs / 1000}
                    onChange={(e) => setFormData({ ...formData, windowMs: parseInt(e.target.value) * 1000 })}
                    className={`w-full px-3 py-2 rounded-xl ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.textSecondary}`}>
                    Max Requests
                  </label>
                  <input
                    type="number"
                    value={formData.maxRequests}
                    onChange={(e) => setFormData({ ...formData, maxRequests: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.textSecondary}`}>
                    Block Duration (minutes, optional)
                  </label>
                  <input
                    type="number"
                    value={formData.blockDuration || ''}
                    onChange={(e) => setFormData({ ...formData, blockDuration: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Leave empty for no blocking"
                    className={`w-full px-3 py-2 rounded-xl ${theme.input}`}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="mr-2 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500/50"
                  />
                  <label htmlFor="enabled" className={`text-sm ${theme.textSecondary}`}>
                    Enabled
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-500 hover:to-blue-400"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 px-4 py-2 rounded-xl ${theme.isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


