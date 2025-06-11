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
      "fixed left-0 right-0 w-full z-[100]",
      // iOS-style button positioning with proper safe area handling
      "bottom-0 pb-[calc(80px+env(safe-area-inset-bottom,0px))]",
      "bg-black/95 backdrop-blur-xl border-t border-gdyup-border/50",
      "px-4 pt-4 pb-4",
      className
    )}>
      <div className="max-w-screen-md mx-auto">
        {/* iOS-style form navigation */}
        <div className="flex items-center justify-between gap-4">
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
            variant="outline"
            className={cn(
              "flex-1 max-w-[140px] h-12 rounded-xl font-semibold",
              "border-2 border-gdyup-border bg-transparent text-gdyup-text",
              "hover:bg-gdyup-text/10 transition-all duration-200",
              isFirstStep ? "opacity-30 cursor-not-allowed" : "opacity-100",
              "flex items-center justify-center gap-2"
            )}
          >
            <ThemedIcon icon={ChevronLeft} size={20} className="mr-1" />
            {backLabel}
          </Button>
          
          {/* Elite step indicators */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  index === currentStep 
                    ? "w-8 h-2 bg-gdyup-primary shadow-sm" 
                    : index < currentStep
                    ? "w-2 h-2 bg-gdyup-primary/60"
                    : "w-2 h-2 bg-gdyup-border"
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
                "flex-1 max-w-[140px] h-12 rounded-xl font-semibold",
                "bg-gdyup-primary text-gdyup-button-text border-0",
                "hover:brightness-110 active:scale-95 transition-all duration-200",
                "shadow-lg shadow-gdyup-primary/25",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "",
                "flex items-center justify-center gap-2"
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
                "flex-1 max-w-[140px] h-12 rounded-xl font-semibold",
                "bg-gdyup-primary text-gdyup-button-text border-0",
                "hover:brightness-110 active:scale-95 transition-all duration-200",
                "shadow-lg shadow-gdyup-primary/25",
                "flex items-center justify-center gap-2"
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