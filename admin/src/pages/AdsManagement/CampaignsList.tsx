/**
 * Campaigns List - Manage ad campaigns
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  dailyBudget?: number;
  bidAmount: number;
  totalSpent: number;
  impressions: number;
  clicks: number;
  advertiser: { companyName: string };
  startDate?: string;
  endDate?: string;
}

export const CampaignsList: React.FC = () => {
  const { token } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [token, statusFilter]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await fetch(`/api/admin/ads/campaigns?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
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

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (loading) {
    return <div className="p-6">Loading campaigns...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
        <Link to="/ads/campaigns/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Campaign
        </Link>
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
                  <div className="text-sm text-gray-500 dark:text-slate-400">{campaign.advertiser.companyName}</div>
                </td>
                <td className="px-4 py-3 uppercase text-sm text-gray-900 dark:text-white">{campaign.type}</td>
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">${campaign.budget.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">${campaign.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{campaign.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{campaign.clicks.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{getCTR(campaign.clicks, campaign.impressions)}%</td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampaignsList;

