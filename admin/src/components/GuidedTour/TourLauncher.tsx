import React, { useState } from 'react';
import { FiHelpCircle, FiPlay, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { useTour, TourId, tours } from './index';

interface TourLauncherProps {
  className?: string;
}

export default function TourLauncher({ className = '' }: TourLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { startTour, hasCompletedTour, resetTours } = useTour();

  const tourList: { id: TourId; icon: string }[] = [
    { id: 'welcome', icon: '👋' },
    { id: 'content', icon: '📝' },
    { id: 'shop', icon: '🛒' },
    { id: 'lms', icon: '📚' },
    { id: 'theme', icon: '🎨' },
  ];

  const handleStartTour = (tourId: TourId) => {
    setIsOpen(false);
    startTour(tourId);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        aria-label="Help & Tours"
      >
        <FiHelpCircle size={18} />
        <span className="hidden sm:inline">Help</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Guided Tours
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Learn how to use NodePress features
              </p>
            </div>

            <div className="p-2">
              {tourList.map(({ id, icon }) => {
                const tour = tours[id];
                const completed = hasCompletedTour(id);

                return (
                  <button
                    key={id}
                    onClick={() => handleStartTour(id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-xl">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white text-sm">
                          {tour.name}
                        </span>
                        {completed && (
                          <FiCheck size={14} className="text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {tour.description}
                      </p>
                    </div>
                    <FiPlay size={14} className="text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  resetTours();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <FiRefreshCw size={12} />
                Reset All Tours
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

