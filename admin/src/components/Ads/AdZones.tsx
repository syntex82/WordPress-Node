/**
 * AdZones Component - Load multiple ads for different zones
 */
import React, { useEffect, useState } from 'react';
import { AdWidget } from './AdWidget';

interface AdZonesProps {
  zones: string[];
  className?: string;
  renderZone?: (zoneName: string, adWidget: React.ReactNode) => React.ReactNode;
}

interface ZoneAds {
  [zoneName: string]: {
    adId: string;
    impressionId: string;
    type: string;
    headline?: string;
    description?: string;
    imageUrl?: string;
    html?: string;
    ctaText?: string;
    trackingUrl: string;
  } | null;
}

export const AdZones: React.FC<AdZonesProps> = ({ zones, className, renderZone }) => {
  const [zoneAds, setZoneAds] = useState<ZoneAds>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllZones = async () => {
      try {
        const sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID();
        sessionStorage.setItem('sessionId', sessionId);

        const params = new URLSearchParams({
          names: zones.join(','),
          path: window.location.pathname,
          device: getDeviceType(),
        });

        const response = await fetch(`/api/ads/zones?${params}`, {
          headers: {
            'x-session-id': sessionId,
            'x-visitor-id': localStorage.getItem('visitorId') || '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setZoneAds(data);
        }
      } catch (err) {
        console.error('Failed to fetch zone ads:', err);
      } finally {
        setLoading(false);
      }
    };

    if (zones.length > 0) {
      fetchAllZones();
    }
  }, [zones]);

  if (loading) {
    return null;
  }

  return (
    <>
      {zones.map((zoneName) => {
        const adWidget = (
          <AdWidget
            key={zoneName}
            zoneName={zoneName}
            className={className}
          />
        );

        if (renderZone) {
          return renderZone(zoneName, adWidget);
        }

        return adWidget;
      })}
    </>
  );
};

function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

export default AdZones;

