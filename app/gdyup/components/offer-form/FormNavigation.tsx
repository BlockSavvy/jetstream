'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { ThemedIcon } from '../core/ThemedIcon';

// Serializable props interface
export interface FormNavigationSerializableProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  backLabel?: string;
  submitLabel?: string;
  className?: string;
}

// Callback props interface
export interface FormNavigationCallbacks {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
}

// Full props interface that combines serializable props and callbacks
export interface FormNavigationProps extends FormNavigationSerializableProps, FormNavigationCallbacks {}

/**
 * Reusable form navigation component for multi-step forms
 */
export function FormNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isFirstStep = false,
  isLastStep = false,
  isSubmitting = false,
  nextLabel = 'Next',
  backLabel = 'Back',
  submitLabel = 'Submit',
  className
}: FormNavigationProps) {
  const { getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  // Helper function to trigger haptic feedback
  const triggerHaptic = (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'LIGHT') => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Haptics } = (window as any).Capacitor?.Plugins || {};
      if (Haptics) {
        Haptics.impact({ style });
      }
    }
  };
  
  return (
    <div className={cn(
      "fixed left-0 right-0 w-full px-4 py-2 bg-black/90 backdrop-blur-md border-t border-gdyup-border z-[100]",
      // Position above mobile nav bar (mobile nav is about 80px high with safe area)
      "bottom-20 md:bottom-4",
      className
    )}>
      <div className="max-w-screen-md mx-auto">
        {/* Navigation buttons with step indicators between them */}
        <div className="flex justify-between items-center">
          {/* Back button - disabled if it's the first step */}
          <Button
            type="button"
            onClick={() => {
              if (!isFirstStep) {
                triggerHaptic('LIGHT');
                onBack?.();
              }
            }}
            disabled={isFirstStep}
            className={cn(
              "w-32 md:w-36 h-11 rounded-md font-medium text-contrast-light",
              isFirstStep ? "opacity-50 cursor-not-allowed" : "",
              getThemedButtonClasses()
            )}
          >
            <ThemedIcon icon={ChevronLeft} size={20} className="mr-1" />
            {backLabel}
          </Button>
          
          {/* Step indicators */}
          <div className="flex justify-center">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 mx-1 rounded-full",
                  index === currentStep 
                    ? getThemedBackgroundClasses('primary')
                    : "bg-gray-600"
                )}
              />
            ))}
          </div>
          
          {/* Next/Submit button */}
          {isLastStep ? (
            <Button
              type="button"
              onClick={() => {
                console.log('Submit button clicked');
                triggerHaptic('MEDIUM'); // Stronger haptic for important action
                onSubmit?.();
              }}
              disabled={isSubmitting}
              className={cn(
                "w-32 md:w-36 h-11 rounded-md font-medium text-contrast-light",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "",
                getThemedButtonClasses()
              )}
            >
              {isSubmitting ? (
                <>
                  <ThemedIcon icon={Loader2} size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {submitLabel}
                  <ThemedIcon icon={ArrowRight} size={20} className="ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                console.log('Next button clicked');
                triggerHaptic('LIGHT');
                onNext?.();
              }}
              className={cn(
                "w-32 md:w-36 h-11 rounded-md font-medium text-contrast-light",
                getThemedButtonClasses()
              )}
            >
              {nextLabel}
              <ThemedIcon icon={ChevronRight} size={20} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 