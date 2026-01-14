/**
 * Advertisers List - Manage advertisers
 */
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { FiX } from 'react-icons/fi';

interface Advertiser {
  id: string;
  companyName: string;
  contactEmail: string;
  contactName?: string;
  balance: number;
  status: string;
  _count?: { campaigns: number };
  createdAt: string;
}

export const AdvertisersList: React.FC = () => {
  const { token } = useAuthStore();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ companyName: '', contactEmail: '', contactName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdvertisers();
  }, [token, search]);

  const fetchAdvertisers = async () => {
    try {
      const params = new URLSearchParams({ search });
      const response = await fetch(`/api/admin/ads/advertisers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAdvertisers(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch advertisers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredit = async (id: string, amount: number) => {
    try {
      await fetch(`/api/admin/ads/advertisers/${id}/credit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, description: 'Manual credit' }),
      });
      fetchAdvertisers();
    } catch (err) {
      console.error('Failed to add credit:', err);
    }
  };

  const handleCreateAdvertiser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ads/advertisers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ companyName: '', contactEmail: '', contactName: '' });
        fetchAdvertisers();
      }
    } catch (err) {
      console.error('Failed to create advertiser:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-900 dark:text-white">Loading advertisers...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advertisers</h1>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Add Advertiser
        </button>
      </div>

      <input
        type="text"
        placeholder="Search advertisers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
      />

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Balance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Campaigns</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {advertisers.map((adv) => (
              <tr key={adv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                <td className="px-4 py-3 text-gray-900 dark:text-white">{adv.companyName}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-900 dark:text-white">{adv.contactName}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{adv.contactEmail}</div>
                </td>
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">${adv.balance.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{adv._count?.campaigns ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      adv.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-slate-300'
                    }`}
                  >
                    {adv.status}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => {
                      const amount = prompt('Enter credit amount:');
                      if (amount) handleAddCredit(adv.id, parseFloat(amount));
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    Add Credit
                  </button>
                </td>
              </tr>
            ))}
            {advertisers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                  No advertisers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Advertiser Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Advertiser</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAdvertiser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Advertiser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisersList;

