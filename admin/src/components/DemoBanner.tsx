/**
 * Demo Mode Banner
 * Displays at top of admin panel when in demo mode
 */

import { useState, useEffect } from 'react';
import { useDemoStore } from '../stores/demoStore';
import { FiClock, FiStar, FiX, FiExternalLink } from 'react-icons/fi';

export function DemoBanner() {
  const { isDemo, getRemainingTime } = useDemoStore();
  const [remaining, setRemaining] = useState(getRemainingTime());
  const [dismissed, setDismissed] = useState(false);

  // Update remaining time every minute
  useEffect(() => {
    if (!isDemo) return;

    const interval = setInterval(() => {
      setRemaining(getRemainingTime());
    }, 60000);

    return () => clearInterval(interval);
  }, [isDemo, getRemainingTime]);

  if (!isDemo || dismissed) return null;

  const isLowTime = remaining && remaining.hours < 2;

  return (
    <div className={`sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${
      isLowTime
        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-full">
          <FiStar className="w-4 h-4" />
          <span className="font-semibold">DEMO MODE</span>
        </div>

        <span className="hidden sm:inline">
          Welcome to NodePress! Explore all features freely.
        </span>

        {remaining && (
          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full">
            <FiClock className="w-3.5 h-3.5" />
            <span className="font-mono">
              {remaining.hours}h {remaining.minutes}m remaining
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => window.open('/pricing', '_blank')}
          className="flex items-center gap-1 bg-white text-indigo-700 hover:bg-indigo-50 h-7 px-3 text-xs font-semibold rounded"
        >
          <FiExternalLink className="w-3 h-3" />
          Upgrade Now
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default DemoBanner;

