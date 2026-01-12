/**
 * Licensing Admin Page
 * View and manage sold licenses, revenue stats
 */

import { useState, useEffect } from 'react';
import { FiKey, FiDollarSign, FiUsers, FiRefreshCw, FiCopy, FiCheck, FiX } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface License {
  id: string;
  licenseKey: string;
  tier: string;
  email: string;
  customerName?: string;
  companyName?: string;
  status: string;
  activatedDomains: string[];
  maxActivations: number;
  expiresAt: string;
  createdAt: string;
}

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  revenue: number;
  byTier: Record<string, number>;
}

export default function Licensing() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [licensesRes, statsRes] = await Promise.all([
        api.get('/api/licensing/admin/licenses'),
        api.get('/api/licensing/admin/stats'),
      ]);
      setLicenses(licensesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load licensing data');
    } finally {
      setLoading(false);
    }
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const revokeLicense = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this license?')) return;
    try {
      await api.post(`/api/licensing/admin/licenses/${id}/revoke`);
      toast.success('License revoked');
      fetchData();
    } catch {
      toast.error('Failed to revoke license');
    }
  };

  const filteredLicenses = licenses.filter(l => {
    if (filter === 'active') return l.status === 'ACTIVE';
    if (filter === 'expired') return l.status === 'EXPIRED' || l.status === 'REVOKED';
    return true;
  });

  const tierColors: Record<string, string> = {
    PERSONAL: 'bg-blue-500',
    PROFESSIONAL: 'bg-purple-500',
    BUSINESS: 'bg-orange-500',
    ENTERPRISE: 'bg-green-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">License Management</h1>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FiKey className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Licenses</p>
              <p className="text-2xl font-bold text-white">{stats?.totalLicenses || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active Licenses</p>
              <p className="text-2xl font-bold text-white">{stats?.activeLicenses || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${stats?.revenue || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FiUsers className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">By Tier</p>
              <div className="flex gap-2 text-xs mt-1">
                {stats?.byTier && Object.entries(stats.byTier).map(([tier, count]) => (
                  <span key={tier} className={`px-2 py-0.5 rounded ${tierColors[tier]} text-white`}>
                    {tier.slice(0, 3)}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'expired'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Licenses Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-slate-300">License Key</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Tier</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Customer</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Status</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Activations</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Expires</th>
              <th className="px-4 py-3 text-left text-sm text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredLicenses.map(license => (
              <tr key={license.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-blue-400 font-mono">
                      {license.licenseKey.slice(0, 20)}...
                    </code>
                    <button
                      onClick={() => copyKey(license.licenseKey, license.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedId === license.id ? <FiCheck className="text-green-400" /> : <FiCopy />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs text-white ${tierColors[license.tier]}`}>
                    {license.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white text-sm">{license.customerName || license.email}</p>
                    {license.companyName && (
                      <p className="text-slate-400 text-xs">{license.companyName}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    license.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                    license.status === 'EXPIRED' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {license.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">
                  {license.activatedDomains?.length || 0} / {license.maxActivations === -1 ? '∞' : license.maxActivations}
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">
                  {new Date(license.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {license.status === 'ACTIVE' && (
                    <button
                      onClick={() => revokeLicense(license.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Revoke"
                    >
                      <FiX />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLicenses.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No licenses found
          </div>
        )}
      </div>
    </div>
  );
}

