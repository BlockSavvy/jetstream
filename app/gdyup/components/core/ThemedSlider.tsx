'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

export interface ThemedSliderProps extends React.ComponentPropsWithoutRef<typeof Slider> {
  label?: string;
  showLabels?: boolean;
  minLabel?: string;
  maxLabel?: string;
  showValue?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

/**
 * ThemedSlider component that wraps the Shadcn UI Slider with proper GDY·UP theming
 */
export function ThemedSlider({
  value,
  onValueChange,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  label,
  showLabels = false,
  minLabel,
  maxLabel,
  showValue = false,
  valuePrefix = '',
  valueSuffix = '',
  className,
  ...props
}: ThemedSliderProps) {
  const { theme, getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  // Extract the current value for display
  const currentValue = Array.isArray(value) ? value[0] : 
                       Array.isArray(defaultValue) ? defaultValue[0] : 
                       undefined;
  
  return (
    <div className="w-full space-y-2">
      {/* Optional label and value display */}
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className={cn("text-sm font-medium", getThemedTextClasses())}>
              {label}
            </label>
          )}
          {showValue && typeof currentValue !== 'undefined' && (
            <div className={cn(
              "text-sm font-semibold px-2 py-0.5 rounded-md",
              getThemedBackgroundClasses('primary'),
              getThemedTextClasses('inverse')
            )}>
              {valuePrefix}{currentValue}{valueSuffix}
            </div>
          )}
        </div>
      )}
      
      {/* The actual slider with theme-aware classes */}
      <Slider
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        className={cn(
          "gdyup-themed-slider",
          "py-1", // Add padding for better touch target
          className
        )}
        // Apply theme-specific styles for the track and thumb
        {...props}
      />
      
      {/* Optional min/max labels */}
      {showLabels && (
        <div className="flex justify-between">
          <span className={cn("text-xs", getThemedTextClasses('muted'))}>
            {minLabel || min}
          </span>
          <span className={cn("text-xs", getThemedTextClasses('muted'))}>
            {maxLabel || max}
          </span>
        </div>
      )}
      
      {/* Include theme-specific styling for the slider */}
      <style jsx global>{`
        /* Base slider track */
        .gdyup-themed-slider [data-orientation="horizontal"] > span {
          height: 6px;
          border-radius: 3px;
          background-color: rgba(100, 100, 100, 0.3); /* Dark gray base */
        }
        
        /* Active part of the slider track */
        .gdyup-themed-slider [data-orientation="horizontal"] > span > span {
          background-color: var(--gdyup-primary);
          box-shadow: 0 0 6px rgba(var(--gdyup-primary-rgb), 0.4);
        }
        
        /* Slider thumb */
        .gdyup-themed-slider [role="slider"] {
          width: 18px;
          height: 18px;
          background-color: var(--gdyup-primary);
          border: 2px solid var(--gdyup-bg-dark);
          box-shadow: 0 0 8px rgba(var(--gdyup-primary-rgb), 0.5);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          margin-top: -6px; /* Center the thumb on the track */
        }
        
        /* Thumb hover state */
        .gdyup-themed-slider [role="slider"]:hover {
          transform: scale(1.1);
          box-shadow: 0 0 12px rgba(var(--gdyup-primary-rgb), 0.7);
        }
        
        /* Active (pressed) state */
        .gdyup-themed-slider [role="slider"]:active {
          transform: scale(1.15);
          box-shadow: 0 0 15px rgba(var(--gdyup-primary-rgb), 0.8);
        }
      `}</style>
    </div>
  );
} 