/**
 * Updates Page
 * System updates management with one-click updates and rollback
 */

import { useState, useEffect } from 'react';
import {
  FiDownload, FiRefreshCw, FiCheck, FiX, FiAlertTriangle,
  FiLoader, FiArrowUp, FiClock, FiRotateCcw, FiCheckCircle,
  FiAlertCircle, FiServer, FiPackage, FiDatabase, FiGitBranch
} from 'react-icons/fi';
import { updatesApi, UpdateStatus, UpdateHistoryItem } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function Updates() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [history, setHistory] = useState<UpdateHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  // Poll for progress when update is in progress
  useEffect(() => {
    if (status?.updateInProgress) {
      const interval = setInterval(fetchStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [status?.updateInProgress]);

  const fetchStatus = async () => {
    try {
      const res = await updatesApi.getStatus();
      setStatus(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchHistory = async () => {
    try {
      const res = await updatesApi.getHistory(10);
      setHistory(res.data);
    } catch { /* ignore */ }
  };

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      await updatesApi.checkForUpdates();
      await fetchStatus();
    } catch { /* ignore */ }
    setChecking(false);
  };

  const handlePrepareUpdate = async (version: string) => {
    setSelectedVersion(version);
    try {
      const res = await updatesApi.checkCompatibility(version);
      setCompatibility(res.data);
      setShowUpdateModal(true);
    } catch { /* ignore */ }
  };

  const handleApplyUpdate = async () => {
    if (!selectedVersion) return;
    setUpdating(true);
    setShowUpdateModal(false);
    try {
      await updatesApi.applyUpdate(selectedVersion);
      await fetchStatus();
      await fetchHistory();
      alert('Update completed! Please restart the server to apply changes.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed');
    }
    setUpdating(false);
  };

  const handleRollback = async (id: string) => {
    if (!confirm('Are you sure you want to rollback this update? This will restore the previous version.')) return;
    try {
      await updatesApi.rollback(id);
      await fetchHistory();
      alert('Rollback completed! Please restart the server.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rollback failed');
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'COMPLETED': return <FiCheckCircle className="text-emerald-400" />;
      case 'FAILED': return <FiAlertCircle className="text-red-400" />;
      case 'ROLLED_BACK': return <FiRotateCcw className="text-amber-400" />;
      case 'IN_PROGRESS': case 'DOWNLOADING': case 'APPLYING': case 'MIGRATING':
        return <FiLoader className="text-blue-400 animate-spin" />;
      default: return <FiClock className="text-slate-400" />;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      case 'ROLLED_BACK': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin text-violet-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <FiArrowUp size={24} />
            </div>
            System Updates
          </h1>
          <p className="text-slate-400 mt-1">Manage CMS updates and version control</p>
        </div>
        <button
          onClick={handleCheckUpdates}
          disabled={checking}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {checking ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          Check for Updates
        </button>
      </div>

      {/* Current Version Card */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-500/20 rounded-xl">
              <FiServer className="text-violet-400" size={28} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Current Version</p>
              <p className="text-2xl font-bold text-white">v{status?.currentVersion || '1.0.0'}</p>
            </div>
          </div>

          {status?.updateAvailable && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-emerald-400">New Version Available!</p>
                <p className="text-xl font-bold text-white">v{status.latestVersion}</p>
              </div>
              <button
                onClick={() => handlePrepareUpdate(status.latestVersion)}
                disabled={updating || status.updateInProgress}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {updating ? <FiLoader className="animate-spin" /> : <FiDownload />}
                Update Now
              </button>
            </div>
          )}
        </div>

        {/* Update Progress */}
        {status?.updateInProgress && status.currentProgress && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300">{status.currentProgress.message}</span>
              <span className="text-violet-400">{status.currentProgress.progress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${status.currentProgress.progress}%` }}
              />
            </div>
          </div>
        )}

        {!status?.updateAvailable && !status?.updateInProgress && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
            <FiCheckCircle className="text-emerald-400" />
            <span className="text-emerald-400">You are running the latest version</span>
          </div>
        )}
      </div>

      {/* Update History */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiGitBranch className="text-violet-400" />
            Update History
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FiPackage size={48} className="mx-auto mb-3 opacity-50" />
            <p>No update history yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">v{item.fromVersion}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-white font-medium">v{item.toVersion}</span>
                    </div>
                    {item.initiatedByUser && (
                      <p className="text-xs text-slate-500 mt-1">by {item.initiatedByUser.name}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status}
                    </span>
                    {item.errorMessage && (
                      <p className="text-xs text-red-400 mt-1 truncate max-w-xs">{item.errorMessage}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {formatDistanceToNow(new Date(item.startedAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.status === 'COMPLETED' && !item.rolledBack && (
                      <button
                        onClick={() => handleRollback(item.id)}
                        className="text-slate-400 hover:text-amber-400 transition-colors"
                        title="Rollback"
                      >
                        <FiRotateCcw size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Update Confirmation Modal */}
      {showUpdateModal && selectedVersion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Update to v{selectedVersion}</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            {compatibility?.warnings?.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <FiAlertTriangle className="text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium">Warnings</p>
                    <ul className="text-sm text-slate-400 mt-1 list-disc list-inside">
                      {compatibility.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {compatibility?.issues?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium">Compatibility Issues</p>
                    <ul className="text-sm text-slate-400 mt-1 list-disc list-inside">
                      {compatibility.issues.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm">This update will:</p>
              <ul className="text-sm text-slate-400 mt-2 space-y-1">
                <li className="flex items-center gap-2"><FiCheck className="text-emerald-400" /> Create a backup before updating</li>
                <li className="flex items-center gap-2"><FiDatabase className="text-emerald-400" /> Run database migrations</li>
                <li className="flex items-center gap-2"><FiPackage className="text-emerald-400" /> Update application files</li>
                <li className="flex items-center gap-2"><FiRotateCcw className="text-emerald-400" /> Allow rollback if needed</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyUpdate}
                disabled={!compatibility?.compatible}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FiArrowUp /> Apply Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

