/**
 * Ad Widget Component - Self-hosted Ad Display
 * Alternative to Google AdSense scripts
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { sanitizeAdHtml } from '../../utils/sanitize';

interface AdData {
  adId: string;
  impressionId: string;
  type: 'banner' | 'text' | 'native' | 'video' | 'html';
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

interface AdWidgetProps {
  zoneId?: string;
  zoneName?: string;
  className?: string;
  fallback?: React.ReactNode;
  onImpression?: (adId: string) => void;
  onClick?: (adId: string) => void;
}

export const AdWidget: React.FC<AdWidgetProps> = ({
  zoneId,
  zoneName,
  className = '',
  fallback,
  onImpression,
  onClick,
}) => {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAd = useCallback(async () => {
    try {
      setLoading(true);
      const sessionId = sessionStorage.getItem('sessionId') || crypto.randomUUID();
      sessionStorage.setItem('sessionId', sessionId);

      const endpoint = zoneId
        ? `/api/ads/zone/${zoneId}`
        : `/api/ads/zone/name/${zoneName}`;

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

      if (!response.ok) throw new Error('Failed to fetch ad');

      const data = await response.json();
      if (data) {
        setAd(data);
        if (data.adId && onImpression) {
          onImpression(data.adId);
        }
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [zoneId, zoneName, onImpression]);

  useEffect(() => {
    if (zoneId || zoneName) {
      fetchAd();
    }
  }, [fetchAd, zoneId, zoneName]);

  const handleClick = useCallback(() => {
    if (ad?.adId && onClick) {
      onClick(ad.adId);
    }
    // The trackingUrl handles the redirect
  }, [ad, onClick]);

  if (loading) {
    return <div className={`ad-widget ad-loading ${className}`} />;
  }

  if (error || !ad) {
    return fallback ? <>{fallback}</> : null;
  }

  // Render based on ad type
  // Sanitize HTML to prevent XSS attacks
  const sanitizedHtml = useMemo(() => ad?.html ? sanitizeAdHtml(ad.html) : '', [ad?.html]);

  if (ad.html) {
    return (
      <div
        className={`ad-widget ad-html ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        onClick={handleClick}
      />
    );
  }

  if (ad.type === 'banner' && ad.imageUrl) {
    return (
      <a
        href={ad.trackingUrl}
        className={`ad-widget ad-banner ${className}`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
      >
        <img src={ad.imageUrl} alt={ad.headline || 'Advertisement'} />
      </a>
    );
  }

  if (ad.type === 'text') {
    return (
      <a
        href={ad.trackingUrl}
        className={`ad-widget ad-text ${className}`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
      >
        {ad.headline && <h4 className="ad-headline">{ad.headline}</h4>}
        {ad.description && <p className="ad-description">{ad.description}</p>}
        {ad.ctaText && <span className="ad-cta">{ad.ctaText}</span>}
      </a>
    );
  }

  if (ad.type === 'native') {
    return (
      <a
        href={ad.trackingUrl}
        className={`ad-widget ad-native ${className}`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
      >
        {ad.imageUrl && <img src={ad.imageUrl} alt="" className="ad-image" />}
        <div className="ad-content">
          {ad.headline && <h4 className="ad-headline">{ad.headline}</h4>}
          {ad.description && <p className="ad-description">{ad.description}</p>}
          {ad.ctaText && <button className="ad-cta-btn">{ad.ctaText}</button>}
        </div>
        <span className="ad-label">Sponsored</span>
      </a>
    );
  }

  return null;
};

function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

export default AdWidget;

