import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import GuidedTour, { TourConfig } from './GuidedTour';
import { tours, TourId } from './tours';

interface TourState {
  activeTour: TourConfig | null;
  isOpen: boolean;
  completedTours: TourId[];
}

interface TourContextValue extends TourState {
  startTour: (tourId: TourId) => void;
  endTour: () => void;
  skipTour: () => void;
  hasCompletedTour: (tourId: TourId) => boolean;
  resetTours: () => void;
  shouldShowDemoTour: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

const STORAGE_KEY = 'nodepress_completed_tours';

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TourState>({
    activeTour: null,
    isOpen: false,
    completedTours: [],
  });

  // Load completed tours from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState((prev) => ({
          ...prev,
          completedTours: JSON.parse(stored),
        }));
      }
    } catch (e) {
      console.error('Failed to load tour state:', e);
    }
  }, []);

  // Save completed tours to localStorage
  const saveCompletedTours = useCallback((completed: TourId[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch (e) {
      console.error('Failed to save tour state:', e);
    }
  }, []);

  const startTour = useCallback((tourId: TourId) => {
    const tour = tours[tourId];
    if (tour) {
      setState((prev) => ({
        ...prev,
        activeTour: tour,
        isOpen: true,
      }));
    }
  }, []);

  const endTour = useCallback(() => {
    setState((prev) => {
      if (prev.activeTour) {
        const tourId = prev.activeTour.id as TourId;
        const newCompleted = prev.completedTours.includes(tourId)
          ? prev.completedTours
          : [...prev.completedTours, tourId];
        saveCompletedTours(newCompleted);
        return {
          ...prev,
          activeTour: null,
          isOpen: false,
          completedTours: newCompleted,
        };
      }
      return { ...prev, activeTour: null, isOpen: false };
    });
  }, [saveCompletedTours]);

  const skipTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activeTour: null,
      isOpen: false,
    }));
  }, []);

  const hasCompletedTour = useCallback(
    (tourId: TourId) => state.completedTours.includes(tourId),
    [state.completedTours]
  );

  const resetTours = useCallback(() => {
    setState((prev) => ({ ...prev, completedTours: [] }));
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Check if we should show demo tour (demo mode + first visit)
  const isDemoMode = typeof window !== 'undefined' && 
    (window as any).__DEMO_MODE__ === true;
  const shouldShowDemoTour = isDemoMode && !hasCompletedTour('demo');

  // Auto-start demo tour on first visit in demo mode
  useEffect(() => {
    if (shouldShowDemoTour && !state.isOpen) {
      // Delay to let the page load
      const timer = setTimeout(() => {
        startTour('demo');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowDemoTour, state.isOpen, startTour]);

  return (
    <TourContext.Provider
      value={{
        ...state,
        startTour,
        endTour,
        skipTour,
        hasCompletedTour,
        resetTours,
        shouldShowDemoTour,
      }}
    >
      {children}
      {state.activeTour && (
        <GuidedTour
          tour={state.activeTour}
          isOpen={state.isOpen}
          onClose={endTour}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}

// Hook for adding tour triggers to components
export function useTourTrigger(tourId: TourId) {
  const { startTour, hasCompletedTour } = useTour();
  
  return {
    startTour: () => startTour(tourId),
    hasCompleted: hasCompletedTour(tourId),
  };
}

