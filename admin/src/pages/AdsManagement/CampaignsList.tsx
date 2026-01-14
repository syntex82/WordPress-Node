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
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link to="/ads/campaigns/new" className="btn btn-primary">
          Create Campaign
        </Link>
      </div>

      <div className="flex gap-2">
        {['', 'active', 'paused', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Campaign</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Budget</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Spent</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Impr.</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Clicks</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">CTR</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{campaign.name}</div>
                  <div className="text-sm text-gray-500">{campaign.advertiser.companyName}</div>
                </td>
                <td className="px-4 py-3 uppercase text-sm">{campaign.type}</td>
                <td className="px-4 py-3 font-mono">${campaign.budget.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">${campaign.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3">{campaign.impressions.toLocaleString()}</td>
                <td className="px-4 py-3">{campaign.clicks.toLocaleString()}</td>
                <td className="px-4 py-3">{getCTR(campaign.clicks, campaign.impressions)}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      campaign.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(campaign.id, campaign.status)}
                    className="text-blue-600 hover:underline text-sm"
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

