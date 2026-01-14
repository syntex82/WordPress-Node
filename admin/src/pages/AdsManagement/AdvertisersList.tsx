/**
 * Advertisers List - Manage advertisers
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
  const { token } = useAuth();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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
        setAdvertisers(data.advertisers || []);
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

  if (loading) {
    return <div className="p-6">Loading advertisers...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Advertisers</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          Add Advertiser
        </button>
      </div>

      <input
        type="text"
        placeholder="Search advertisers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 border rounded-lg"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Balance</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Campaigns</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {advertisers.map((adv) => (
              <tr key={adv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{adv.companyName}</td>
                <td className="px-4 py-3">
                  <div>{adv.contactName}</div>
                  <div className="text-sm text-gray-500">{adv.contactEmail}</div>
                </td>
                <td className="px-4 py-3 font-mono">${adv.balance.toFixed(2)}</td>
                <td className="px-4 py-3">{adv._count?.campaigns ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      adv.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
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
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Add Credit
                  </button>
                </td>
              </tr>
            ))}
            {advertisers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No advertisers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvertisersList;

