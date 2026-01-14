/**
 * Ads List - Manage individual ads
 */
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { FiX } from 'react-icons/fi';

interface Ad {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  headline?: string;
  imageUrl?: string;
  impressions: number;
  clicks: number;
  campaign?: { name: string; advertiser?: { companyName: string } };
}

interface Campaign {
  id: string;
  name: string;
  advertiser: { companyName: string };
}

export const AdsList: React.FC = () => {
  const { token } = useAuthStore();
  const [ads, setAds] = useState<Ad[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    campaignId: '',
    type: 'banner',
    format: 'image',
    headline: '',
    description: '',
    destinationUrl: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchAds();
    fetchCampaigns();
  }, [token, typeFilter]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/ads/campaigns?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    }
  };

  const fetchAds = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);

      const response = await fetch(`/api/admin/ads/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAds(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ads/ads', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', campaignId: '', type: 'banner', format: 'image', headline: '', description: '', destinationUrl: '', imageUrl: '' });
        fetchAds();
      }
    } catch (err) {
      console.error('Failed to create ad:', err);
    } finally {
      setSaving(false);
    }
  };

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (loading) {
    return <div className="p-6 text-gray-900 dark:text-white">Loading ads...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ads</h1>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Create Ad
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'banner', 'text', 'native', 'video', 'html'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1 rounded-full text-sm ${
              typeFilter === type ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
            }`}
          >
            {type || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-slate-700">
            {ad.imageUrl && (
              <div className="h-32 bg-gray-100 dark:bg-slate-700">
                <img
                  src={ad.imageUrl}
                  alt={ad.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{ad.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    ad.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-slate-300'
                  }`}
                >
                  {ad.status}
                </span>
              </div>

              {ad.headline && (
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{ad.headline}</p>
              )}

              <div className="text-xs text-gray-500 dark:text-slate-400 mb-3">
                <div>{ad.campaign?.name || 'Unknown Campaign'}</div>
                <div>{ad.campaign?.advertiser?.companyName || 'Unknown Advertiser'}</div>
              </div>

              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-slate-700 pt-2">
                <span className="text-gray-500 dark:text-slate-400">
                  {ad.type} • {ad.format}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getCTR(ad.clicks || 0, ad.impressions || 0)}% CTR
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500 mt-1">
                <span>{(ad.impressions || 0).toLocaleString()} impr</span>
                <span>{(ad.clicks || 0).toLocaleString()} clicks</span>
              </div>
            </div>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-slate-400">
            No ads found
          </div>
        )}
      </div>

      {/* Create Ad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Ad</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white">
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Campaign *</label>
                <select
                  required
                  value={formData.campaignId}
                  onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                >
                  <option value="">Select campaign...</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.advertiser?.companyName || 'Unknown'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Ad Name *</label>
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
                    <option value="banner">Banner</option>
                    <option value="text">Text</option>
                    <option value="native">Native</option>
                    <option value="video">Video</option>
                    <option value="html">HTML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                  >
                    <option value="image">Image</option>
                    <option value="responsive">Responsive</option>
                    <option value="fixed">Fixed Size</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Destination URL *</label>
                <input
                  type="url"
                  required
                  value={formData.destinationUrl}
                  onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsList;

