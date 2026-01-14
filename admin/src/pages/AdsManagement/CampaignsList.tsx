/**
 * Campaigns List - Manage ad campaigns
 */
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { FiX } from 'react-icons/fi';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  dailyBudget?: number;
  bidAmount: number;
  spent: number;
  impressions: number;
  clicks: number;
  advertiser: { companyName: string };
  startDate?: string;
  endDate?: string;
}

interface Advertiser {
  id: string;
  companyName: string;
}

export const CampaignsList: React.FC = () => {
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    advertiserId: '',
    type: 'cpc',
    budget: 100,
    dailyBudget: 10,
    bidAmount: 0.5,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchAdvertisers();
  }, [token, statusFilter]);

  const fetchAdvertisers = async () => {
    try {
      const response = await fetch('/api/admin/ads/advertisers?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAdvertisers(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch advertisers:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const response = await fetch(`/api/admin/ads/campaigns?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await fetch(`/api/admin/ads/campaigns/${id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ads/campaigns', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', advertiserId: '', type: 'cpc', budget: 100, dailyBudget: 10, bidAmount: 0.5 });
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setSaving(false);
    }
  };

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (loading) {
    return <div className="p-6 text-gray-900 dark:text-white">Loading campaigns...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Campaign
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'active', 'paused', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-x-auto border border-gray-200 dark:border-slate-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Campaign</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Budget</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Spent</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Impr.</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Clicks</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">CTR</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">{campaign.advertiser?.companyName || 'Unknown'}</div>
                </td>
                <td className="px-4 py-3 uppercase text-sm text-gray-900 dark:text-white">{campaign.type}</td>
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">${campaign.budget.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">${(campaign.spent || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{(campaign.impressions || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{(campaign.clicks || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{getCTR(campaign.clicks || 0, campaign.impressions || 0)}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      campaign.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : campaign.status === 'paused'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-slate-300'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(campaign.id, campaign.status)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    {campaign.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">No campaigns found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Campaign</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Advertiser *</label>
                <select
                  required
                  value={formData.advertiserId}
                  onChange={(e) => setFormData({ ...formData, advertiserId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                >
                  <option value="">Select advertiser...</option>
                  {advertisers.map((adv) => (
                    <option key={adv.id} value={adv.id}>{adv.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  >
                    <option value="cpc">CPC (Cost Per Click)</option>
                    <option value="cpm">CPM (Cost Per 1000 Impressions)</option>
                    <option value="cpa">CPA (Cost Per Action)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bid Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.bidAmount}
                    onChange={(e) => setFormData({ ...formData, bidAmount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Daily Budget ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.dailyBudget}
                    onChange={(e) => setFormData({ ...formData, dailyBudget: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsList;

