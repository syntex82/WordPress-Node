/**
 * Onboarding Tooltip Component
 * A guided tooltip that appears near target elements to walk users through a process
 * Uses CSS animations instead of framer-motion for reduced bundle size
 */

import { useEffect, useState, useRef } from 'react';
import { FiX, FiArrowRight, FiCheck, FiSkipForward } from 'react-icons/fi';
import { OnboardingStep } from '../contexts/ThemeCustomizationContext';

interface OnboardingTooltipProps {
  step: OnboardingStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete?: () => void;
}

export default function OnboardingTooltip({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onSkip,
  onComplete,
}: OnboardingTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 50);

    if (!step.targetSelector) {
      // Center the tooltip if no target
      setPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 175,
      });
      return;
    }

    const targetElement = document.querySelector(step.targetSelector);
    if (!targetElement) {
      // Fallback to center
      setPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 175,
      });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 350;
    const tooltipHeight = 200;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
      default:
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Ensure tooltip stays within viewport
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding;
    }

    setPosition({ top, left });

    // Highlight the target element
    targetElement.classList.add('onboarding-highlight');
    return () => {
      targetElement.classList.remove('onboarding-highlight');
    };
  }, [step]);

  const isLastStep = step.id === 'complete';
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[9999] w-[350px] bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ top: position.top, left: position.left }}
    >
      {/* Progress bar */}
      <div className="h-1 bg-slate-700 rounded-t-xl overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{step.title}</h3>
          <button
            onClick={onSkip}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Skip tour"
          >
            <FiX size={18} />
          </button>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4">{step.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <FiSkipForward size={14} />
              Skip
            </button>

            <button
              onClick={isLastStep && onComplete ? onComplete : onNext}
              className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              {isLastStep ? (
                <>
                  <FiCheck size={14} />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <FiArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

