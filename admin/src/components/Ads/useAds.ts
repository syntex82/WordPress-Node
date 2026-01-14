/**
 * useAds Hook - Programmatic ad loading
 */
import { useState, useCallback, useEffect } from 'react';

interface AdData {
  adId: string;
  impressionId: string;
  type: string;
  format?: string;
  headline?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  html?: string;
  ctaText?: string;
  targetUrl: string;
  trackingUrl: string;
  isFallback?: boolean;
}

interface UseAdsOptions {
  autoLoad?: boolean;
  refreshInterval?: number; // in seconds
}

interface UseAdsReturn {
  ad: AdData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  trackClick: () => void;
}

export function useAds(
  zoneIdOrName: string,
  options: UseAdsOptions = {}
): UseAdsReturn {
  const { autoLoad = true, refreshInterval } = options;
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAd = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);

      // Determine if it's an ID or name
      const isId = zoneIdOrName.match(/^[a-z0-9]{20,}$/i);
      const endpoint = isId
        ? `/api/ads/zone/${zoneIdOrName}`
        : `/api/ads/zone/name/${zoneIdOrName}`;

      const params = new URLSearchParams({
        path: window.location.pathname,
        device: getDeviceType(),
      });

      const response = await fetch(`${endpoint}?${params}`, {
        headers: {
          'x-session-id': sessionId,
          'x-visitor-id': localStorage.getItem('visitorId') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ad');
      }

      const data = await response.json();
      setAd(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAd(null);
    } finally {
      setLoading(false);
    }
  }, [zoneIdOrName]);

  const trackClick = useCallback(() => {
    if (ad?.trackingUrl) {
      // Open in new tab while tracking
      window.open(ad.trackingUrl, '_blank', 'noopener,noreferrer');
    }
  }, [ad]);

  useEffect(() => {
    if (autoLoad && zoneIdOrName) {
      fetchAd();
    }
  }, [autoLoad, zoneIdOrName, fetchAd]);

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchAd, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchAd]);

  return {
    ad,
    loading,
    error,
    refresh: fetchAd,
    trackClick,
  };
}

function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

export default useAds;

