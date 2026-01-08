import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck, FiSkipForward } from 'react-icons/fi';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route?: string; // Navigate to this route before showing step
  action?: 'click' | 'hover' | 'focus'; // Action to highlight
  highlightPadding?: number;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

interface GuidedTourProps {
  tour: TourConfig;
  isOpen: boolean;
  onClose: () => void;
  startStep?: number;
}

export default function GuidedTour({ tour, isOpen, onClose, startStep = 0 }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(startStep);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const step = tour.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tour.steps.length - 1;
  const progress = ((currentStep + 1) / tour.steps.length) * 100;

  // Find and position tooltip relative to target element
  const updatePosition = useCallback(() => {
    if (!step) return;

    if (step.placement === 'center') {
      setTargetRect(null);
      return;
    }

    const target = document.querySelector(step.target);
    if (target) {
      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      
      // Scroll element into view if needed
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Handle route changes for steps
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.route && location.pathname !== step.route) {
      setIsTransitioning(true);
      navigate(step.route);
      
      // Wait for navigation and DOM update
      setTimeout(() => {
        updatePosition();
        setIsTransitioning(false);
        step.onEnter?.();
      }, 500);
    } else {
      updatePosition();
      step.onEnter?.();
    }

    return () => {
      step.onExit?.();
    };
  }, [isOpen, step, location.pathname, navigate, updatePosition]);

  // Update position on resize/scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => updatePosition();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isOpen, updatePosition]);

  const handleNext = () => {
    if (isLastStep) {
      tour.onComplete?.();
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    tour.onSkip?.();
    onClose();
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSkip();
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrev();
    }
  }, [handleNext, handlePrev, handleSkip]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !step) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect || step.placement === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = step.highlightPadding || 8;
    const tooltipWidth = 360;
    const tooltipHeight = 200;
    const margin = 16;

    let top = 0;
    let left = 0;

    switch (step.placement || 'bottom') {
      case 'top':
        top = targetRect.top - tooltipHeight - margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - margin;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + margin;
        break;
    }

    // Keep tooltip in viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));

    return { position: 'fixed', top, left, width: tooltipWidth };
  };

  // Get highlight overlay style
  const getHighlightStyle = (): React.CSSProperties | null => {
    if (!targetRect || step.placement === 'center') return null;

    const padding = step.highlightPadding || 8;
    return {
      position: 'fixed',
      top: targetRect.top - padding,
      left: targetRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
      borderRadius: 8,
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
      pointerEvents: 'none' as const,
      zIndex: 9998,
    };
  };

  const highlightStyle = getHighlightStyle();

  return createPortal(
    <div className="guided-tour-overlay" style={{ position: 'fixed', inset: 0, zIndex: 9997 }}>
      {/* Backdrop */}
      {!targetRect && (
        <div
          className="absolute inset-0 bg-black/75 transition-opacity"
          onClick={handleSkip}
        />
      )}

      {/* Highlight box */}
      {highlightStyle && <div style={highlightStyle} />}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[9999] transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Step {currentStep + 1} of {tour.steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close tour"
          >
            <FiX size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <FiSkipForward size={14} />
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiChevronLeft size={16} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {isLastStep ? (
                <>
                  <FiCheck size={16} />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <FiChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

