/**
 * Ads List - Manage individual ads
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

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
  campaign: { name: string; advertiser: { companyName: string } };
}

export const AdsList: React.FC = () => {
  const { token } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchAds();
  }, [token, typeFilter]);

  const fetchAds = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      
      const response = await fetch(`/api/admin/ads/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAds(data.ads || []);
      }
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  if (loading) {
    return <div className="p-6">Loading ads...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ads</h1>
        <button className="btn btn-primary">Create Ad</button>
      </div>

      <div className="flex gap-2">
        {['', 'banner', 'text', 'native', 'video', 'html'].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1 rounded-full text-sm ${
              typeFilter === type ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            {type || 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-lg shadow overflow-hidden">
            {ad.imageUrl && (
              <div className="h-32 bg-gray-100">
                <img
                  src={ad.imageUrl}
                  alt={ad.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{ad.name}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    ad.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {ad.status}
                </span>
              </div>
              
              {ad.headline && (
                <p className="text-sm text-gray-600 mb-2">{ad.headline}</p>
              )}
              
              <div className="text-xs text-gray-500 mb-3">
                <div>{ad.campaign.name}</div>
                <div>{ad.campaign.advertiser.companyName}</div>
              </div>
              
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-500">
                  {ad.type} • {ad.format}
                </span>
                <span className="font-medium">
                  {getCTR(ad.clicks, ad.impressions)}% CTR
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{ad.impressions.toLocaleString()} impr</span>
                <span>{ad.clicks.toLocaleString()} clicks</span>
              </div>
            </div>
          </div>
        ))}
        
        {ads.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No ads found
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsList;

