/**
 * Backups Page
 * Admin interface for managing system backups
 */

import { useState, useEffect } from 'react';
import {
  FiDatabase, FiDownload, FiTrash2, FiPlus, FiRefreshCw, FiCheck,
  FiX, FiClock, FiLoader, FiHardDrive, FiImage, FiPackage, FiLayout,
  FiAlertCircle, FiCheckCircle, FiArchive, FiRotateCcw
} from 'react-icons/fi';
import { backupsApi, Backup } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useThemeClasses } from '../contexts/SiteThemeContext';

export default function Backups() {
  const theme = useThemeClasses();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [restoreOptions, setRestoreOptions] = useState({
    restoreDatabase: true,
    restoreMedia: true,
    restoreThemes: true,
    restorePlugins: true,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'FULL',
    includesDatabase: true,
    includesMedia: true,
    includesThemes: true,
    includesPlugins: true,
  });

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, [page]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await backupsApi.getAll({ page, limit: 10 });
      setBackups(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await backupsApi.getStats();
      setStats(res.data);
    } catch { /* ignore */ }
  };

  const handleQuickBackup = async () => {
    setCreating(true);
    try {
      await backupsApi.quickBackup();
      fetchBackups();
      fetchStats();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDatabaseBackup = async () => {
    setCreating(true);
    try {
      await backupsApi.databaseBackup();
      fetchBackups();
      fetchStats();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleCreateBackup = async () => {
    if (!formData.name.trim()) return;
    setCreating(true);
    try {
      await backupsApi.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', type: 'FULL', includesDatabase: true, includesMedia: true, includesThemes: true, includesPlugins: true });
      fetchBackups();
      fetchStats();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;
    try {
      await backupsApi.delete(id);
      fetchBackups();
      fetchStats();
    } catch { /* ignore */ }
  };

  const openRestoreModal = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreOptions({
      restoreDatabase: backup.includesDatabase,
      restoreMedia: backup.includesMedia,
      restoreThemes: backup.includesThemes,
      restorePlugins: backup.includesPlugins,
    });
    setShowRestoreModal(true);
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    setRestoring(true);
    try {
      await backupsApi.restore(selectedBackup.id, restoreOptions);
      alert('Backup restored successfully! You may need to refresh the page to see changes.');
      setShowRestoreModal(false);
      setSelectedBackup(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore backup');
    }
    setRestoring(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <FiCheckCircle className="text-emerald-400" />;
      case 'FAILED': return <FiAlertCircle className="text-red-400" />;
      case 'IN_PROGRESS': return <FiLoader className="text-blue-400 animate-spin" />;
      default: return <FiClock className="text-amber-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return theme.isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700';
      case 'FAILED': return theme.isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700';
      case 'IN_PROGRESS': return theme.isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700';
      default: return theme.isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DATABASE': return <FiDatabase className="text-blue-400" />;
      case 'MEDIA': return <FiImage className="text-purple-400" />;
      case 'THEMES': return <FiLayout className="text-pink-400" />;
      case 'PLUGINS': return <FiPackage className="text-amber-400" />;
      default: return <FiArchive className="text-violet-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${theme.textPrimary} flex items-center gap-3`}>
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white">
              <FiHardDrive size={24} />
            </div>
            Backups
          </h1>
          <p className={`${theme.textMuted} mt-1`}>Manage system backups and restore points</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDatabaseBackup}
            disabled={creating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FiDatabase size={16} />
            Database Only
          </button>
          <button
            onClick={handleQuickBackup}
            disabled={creating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {creating ? <FiLoader className="animate-spin" size={16} /> : <FiRefreshCw size={16} />}
            Quick Backup
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiPlus size={16} />
            Custom Backup
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Backups', value: stats.total, icon: FiArchive, color: 'violet' },
            { label: 'Completed', value: stats.completed, icon: FiCheckCircle, color: 'emerald' },
            { label: 'Failed', value: stats.failed, icon: FiAlertCircle, color: 'red' },
            { label: 'In Progress', value: stats.inProgress, icon: FiLoader, color: 'blue' },
            { label: 'Total Size', value: formatFileSize(stats.totalSize), icon: FiHardDrive, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className={`${theme.bgCard} rounded-xl p-4 ${theme.border} border`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-500/20`}>
                  <stat.icon className={`text-${stat.color}-400`} size={20} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme.textPrimary}`}>{stat.value}</p>
                  <p className={`text-sm ${theme.textMuted}`}>{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backups Table */}
      <div className={`${theme.bgCard} rounded-xl ${theme.border} border overflow-hidden`}>
        <div className={`px-6 py-4 ${theme.border} border-b flex items-center justify-between`}>
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>Backup History</h2>
          <button onClick={fetchBackups} className={`${theme.textMuted} hover:${theme.textPrimary} transition-colors`}>
            <FiRefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <FiLoader className="animate-spin text-violet-400 mx-auto" size={32} />
          </div>
        ) : backups.length === 0 ? (
          <div className={`p-8 text-center ${theme.textMuted}`}>
            <FiArchive size={48} className="mx-auto mb-3 opacity-50" />
            <p>No backups yet. Create your first backup!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className={theme.tableHeader}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.textMuted} uppercase`}>Backup</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.textMuted} uppercase`}>Type</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.textMuted} uppercase`}>Status</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.textMuted} uppercase`}>Size</th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${theme.textMuted} uppercase`}>Created</th>
                <th className={`px-6 py-3 text-right text-xs font-medium ${theme.textMuted} uppercase`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.border}`}>
              {backups.map((backup) => (
                <tr key={backup.id} className={theme.tableRow}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(backup.type)}
                      <div>
                        <p className={`font-medium ${theme.textPrimary}`}>{backup.name}</p>
                        {backup.description && <p className={`text-sm ${theme.textMuted}`}>{backup.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 ${theme.bgTertiary} ${theme.textSecondary} rounded text-xs`}>{backup.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${getStatusColor(backup.status)}`}>
                      {getStatusIcon(backup.status)}
                      {backup.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${theme.textSecondary}`}>{formatFileSize(backup.fileSize)}</td>
                  <td className={`px-6 py-4 ${theme.textMuted} text-sm`}>
                    {formatDistanceToNow(new Date(backup.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {backup.status === 'COMPLETED' && backup.filePath && (
                        <>
                          <button
                            onClick={() => openRestoreModal(backup)}
                            className={`p-2 ${theme.textMuted} hover:text-violet-400 transition-colors`}
                            title="Restore"
                          >
                            <FiRotateCcw size={16} />
                          </button>
                          <a
                            href={backupsApi.getDownloadUrl(backup.id)}
                            className={`p-2 ${theme.textMuted} hover:text-emerald-400 transition-colors`}
                            title="Download"
                          >
                            <FiDownload size={16} />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(backup.id)}
                        className={`p-2 ${theme.textMuted} hover:text-red-400 transition-colors`}
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`px-6 py-4 border-t ${theme.border} flex items-center justify-center gap-2`}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-violet-600 text-white' : `${theme.bgTertiary} ${theme.textSecondary} hover:opacity-80`}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className={theme.overlay + " fixed inset-0 flex items-center justify-center z-50"}>
          <div className={`${theme.modal} rounded-xl w-full max-w-lg p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Create Custom Backup</h3>
              <button onClick={() => setShowCreateModal(false)} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Backup Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 ${theme.input} rounded-lg`}
                  placeholder="My Backup"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2 ${theme.input} rounded-lg`}
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>Include in Backup</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'includesDatabase', label: 'Database', icon: FiDatabase },
                    { key: 'includesMedia', label: 'Media Files', icon: FiImage },
                    { key: 'includesThemes', label: 'Themes', icon: FiLayout },
                    { key: 'includesPlugins', label: 'Plugins', icon: FiPackage },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData[item.key as keyof typeof formData]
                          ? `bg-violet-500/20 border-violet-500/50 ${theme.textPrimary}`
                          : `${theme.bgTertiary} ${theme.border} ${theme.textMuted}`
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                        className="sr-only"
                      />
                      <item.icon size={18} />
                      <span>{item.label}</span>
                      {formData[item.key as keyof typeof formData] && <FiCheck className="ml-auto text-violet-400" />}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className={theme.buttonSecondary + " px-4 py-2 rounded-lg"}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={!formData.name.trim() || creating}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {creating ? <FiLoader className="animate-spin" size={16} /> : <FiPlus size={16} />}
                Create Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Backup Modal */}
      {showRestoreModal && selectedBackup && (
        <div className={theme.overlay + " fixed inset-0 flex items-center justify-center z-50"}>
          <div className={`${theme.modal} rounded-xl w-full max-w-lg p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${theme.textPrimary} flex items-center gap-2`}>
                <FiRotateCcw className="text-violet-400" />
                Restore Backup
              </h3>
              <button onClick={() => { setShowRestoreModal(false); setSelectedBackup(null); }} className={`${theme.textMuted} hover:${theme.textPrimary}`}>
                <FiX size={20} />
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-amber-400 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-medium">Warning</p>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>
                    Restoring a backup will overwrite existing data. This action cannot be undone.
                    Make sure you have a current backup before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className={`${theme.textSecondary} mb-2`}>Restoring from:</p>
              <div className={`${theme.bgTertiary} rounded-lg p-3`}>
                <p className={`${theme.textPrimary} font-medium`}>{selectedBackup.name}</p>
                <p className={`text-sm ${theme.textMuted}`}>
                  Created {formatDistanceToNow(new Date(selectedBackup.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>Select what to restore:</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'restoreDatabase', label: 'Database', icon: FiDatabase, available: selectedBackup.includesDatabase },
                  { key: 'restoreMedia', label: 'Media Files', icon: FiImage, available: selectedBackup.includesMedia },
                  { key: 'restoreThemes', label: 'Themes', icon: FiLayout, available: selectedBackup.includesThemes },
                  { key: 'restorePlugins', label: 'Plugins', icon: FiPackage, available: selectedBackup.includesPlugins },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      !item.available
                        ? `${theme.bgSecondary} ${theme.border} ${theme.textSubtle} cursor-not-allowed`
                        : restoreOptions[item.key as keyof typeof restoreOptions]
                          ? `bg-violet-500/20 border-violet-500/50 ${theme.textPrimary}`
                          : `${theme.bgTertiary} ${theme.border} ${theme.textMuted}`
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.available && restoreOptions[item.key as keyof typeof restoreOptions]}
                      disabled={!item.available}
                      onChange={(e) => setRestoreOptions({ ...restoreOptions, [item.key]: e.target.checked })}
                      className="sr-only"
                    />
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    {item.available && restoreOptions[item.key as keyof typeof restoreOptions] && (
                      <FiCheck className="ml-auto text-violet-400" />
                    )}
                    {!item.available && <span className={`ml-auto text-xs ${theme.textSubtle}`}>N/A</span>}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowRestoreModal(false); setSelectedBackup(null); }}
                className={theme.buttonSecondary + " px-4 py-2 rounded-lg"}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring || (!restoreOptions.restoreDatabase && !restoreOptions.restoreMedia && !restoreOptions.restoreThemes && !restoreOptions.restorePlugins)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {restoring ? <FiLoader className="animate-spin" size={16} /> : <FiRotateCcw size={16} />}
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

