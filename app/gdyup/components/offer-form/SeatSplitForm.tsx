'use client';

import React, { RefObject, useRef, useEffect, useCallback, useState } from 'react';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { FormNavigation } from './FormNavigation';
import { ThemedIcon } from '../core/ThemedIcon';
import { Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import JetSeatVisualizer, { JetSeatVisualizerRef } from '../JetSeatVisualizer';
import dynamic from 'next/dynamic';

import {
  Form,
  FormMessage,
} from '@/components/ui/form';

// Define the form values interface
export interface SeatSplitFormValues {
  total_seats: number;
  available_seats: number;
  [key: string]: any; // Allow for additional fields
}

// Serializable props interface
export interface SeatSplitFormSerializableProps {
  totalSteps: number;
  currentStep: number;
  shareRatio: number;
  selectedJetId: string;
}

// Callbacks interface
export interface SeatSplitFormCallbacks {
  onNext: () => void;
  onBack: () => void;
  setShareRatio: (ratio: number) => void;
  handleSplitConfigurationChange: (selectedSeats: string[]) => void;
  handleResetTo5050: () => void;
  handleClearSelection: () => void;
}

// Combined props interface for internal component
interface InternalSeatSplitFormProps extends SeatSplitFormSerializableProps, SeatSplitFormCallbacks {
  form: UseFormReturn<SeatSplitFormValues>;
  visualizerRef: RefObject<JetSeatVisualizerRef>;
}

/**
 * Internal seat configuration form component with callbacks
 * This is not directly exported
 */
function InternalSeatSplitForm({
  form,
  onNext,
  onBack,
  totalSteps,
  currentStep,
  shareRatio,
  setShareRatio,
  selectedJetId,
  handleSplitConfigurationChange,
  handleResetTo5050,
  handleClearSelection,
  visualizerRef
}: InternalSeatSplitFormProps) {
  const { getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();
  
  // Add local state to prevent infinite updates
  const [localShareRatio, setLocalShareRatio] = useState<number>(shareRatio);
  
  // Use refs for tracking update states to prevent loops
  const isUpdatingFromSlider = useRef<boolean>(false);
  const isUpdatingFromVisualizer = useRef<boolean>(false);
  const isMounted = useRef<boolean>(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate derived values for UI
  const totalSeats = form.watch('total_seats') || 0;
  console.log(`[SeatSplitForm] RENDER: totalSeats=${totalSeats}, selectedJetId=${selectedJetId}, shareRatio=${shareRatio}, localShareRatio=${localShareRatio}`);
  const yourSeats = Math.round((localShareRatio / 100) * totalSeats);
  const partnerSeats = totalSeats - yourSeats;

  // Create empty seatConfig object for the visualizer
  const seatConfig = {};
  
  // Cleanup function for timeouts
  const clearUpdateTimeout = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  };
  
  // Sync local ratio with prop when prop changes externally (but not during our own updates)
  useEffect(() => {
    if (!isUpdatingFromSlider.current && Math.abs(localShareRatio - shareRatio) > 0.01) {
      console.log(`[SeatSplitForm] Syncing localShareRatio with prop: ${shareRatio}`);
      setLocalShareRatio(shareRatio);
    }
  }, [shareRatio, localShareRatio]);
  
  // Handle slider value change with improved debouncing
  const handleSliderChange = useCallback((values: number[]) => {
    const newRatio = values[0];
    
    // Set flag to prevent update loops
    isUpdatingFromSlider.current = true;
    
    // Clear any pending updates
    clearUpdateTimeout();
    
    // Update local state first
    setLocalShareRatio(newRatio);
    
    // Update available seats in the form
    const totalSeats = form.getValues('total_seats') || 0;
    const yourSeats = Math.round(totalSeats * (newRatio / 100));
    const partnerSeats = totalSeats - yourSeats;
    
    form.setValue('available_seats', partnerSeats, { shouldValidate: true });
    
    // Don't update parent or visualizer yet - wait for the slider interaction to complete
  }, [form, clearUpdateTimeout]);
  
  // Handle slider complete - when user releases the slider
  const handleSliderComplete = useCallback(() => {
    if (!isMounted.current) return;
    
    // Clear any pending updates
    clearUpdateTimeout();
    
    // Better scheduling to avoid race conditions between UI and state updates
    updateTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      // Now update the visualizer with new seat count
      const updatedYourSeats = Math.round((localShareRatio / 100) * totalSeats);
      
      // Only if the visualizer exists and we're not already updating from it
      if (visualizerRef.current && !isUpdatingFromVisualizer.current) {
        // Set flag to prevent re-entrance
        isUpdatingFromSlider.current = true;
        
        // First update form values
        const partnerSeats = totalSeats - updatedYourSeats;
        form.setValue('available_seats', partnerSeats, { shouldValidate: true });
        
        // Then update the visualizer with exact seat count
        visualizerRef.current.selectSeatsByCount(updatedYourSeats);
        
        // Finally, update the parent component
        setShareRatio(localShareRatio);
      }
      
      // Reset update flags after a brief delay to allow React to settle
      setTimeout(() => {
        isUpdatingFromSlider.current = false;
      }, 100);
    }, 100); // Longer timeout for better stability
  }, [localShareRatio, totalSeats, visualizerRef, form, setShareRatio, clearUpdateTimeout]);
  
  // Wrap handleSplitConfigurationChange to prevent update loops with better synchronization
  const handleVisualizerChange = useCallback((selectedSeats: string[]) => {
    // Skip updates from visualizer while slider is changing
    if (isUpdatingFromSlider.current) {
      return;
    }
    
    // Set flag to prevent react update loops
    isUpdatingFromVisualizer.current = true;
    
    // Clear any pending updates
    clearUpdateTimeout();
    
    // Calculate new ratio based on selected seats
    const newRatio = totalSeats > 0 ? (selectedSeats.length / totalSeats) * 100 : 0;
    
    // Update local state immediately
    setLocalShareRatio(newRatio);
    
    // Update form values
    const partnerSeats = totalSeats - selectedSeats.length;
    form.setValue('available_seats', partnerSeats, { shouldValidate: true });
    
    // Notify parent with debounce and extra safeguards
    updateTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      handleSplitConfigurationChange(selectedSeats);
      
      // Update ratio for consistency between visualizer and slider
      setShareRatio(newRatio);
      
      // Reset update flag after allowing React to process the update
      setTimeout(() => {
        isUpdatingFromVisualizer.current = false;
      }, 100);
    }, 100);
  }, [handleSplitConfigurationChange, totalSeats, form, clearUpdateTimeout, setShareRatio]);

  // Initialize with 50/50 split when entering this screen
  useEffect(() => {
    if (!visualizerRef.current || totalSeats <= 0) return;
    
    // Skip if already initialized or update is in progress
    if (isUpdatingFromSlider.current || isUpdatingFromVisualizer.current) return;
    
    // One-time initialization with timeout to ensure visualizer is ready
    const initTimer = setTimeout(() => {
      // Safety check that we're still mounted
      if (!isMounted.current) return;
      
      // Skip if visualizer no longer exists
      if (!visualizerRef.current) return;
      
      console.log('[SeatSplitForm] Initializing 50/50 split');
      
      // Set flags to prevent loops
      isUpdatingFromVisualizer.current = true;
      
      // Calculate seats for 50/50 split - give extra seat to owner for odd counts
      const yourSeats = Math.ceil(totalSeats / 2);
      const partnerSeats = totalSeats - yourSeats;
      
      // Update form values
      form.setValue('available_seats', partnerSeats, { shouldValidate: true });
      
      // Set the shareRatio state to exactly 50%
      setLocalShareRatio(50);
      
      // Update the visualizer
      visualizerRef.current.selectSeatsByCount(yourSeats);
      
      // Reset flag and notify parent after update
      setTimeout(() => {
        isUpdatingFromVisualizer.current = false;
        setShareRatio(50);
      }, 100);
    }, 300);
    
    return () => clearTimeout(initTimer);
  }, [totalSeats, visualizerRef, form, setShareRatio]);

  // Add a proper handler for the clear selection button
  const handleClearSelectionClick = useCallback(() => {
    // Set flags to prevent update loops
    isUpdatingFromSlider.current = true;
    
    // Clear any pending updates
    clearUpdateTimeout();
    
    console.log('[SeatSplitForm] Clearing all selections - setting to 0%');
    
    // Update local state to 0%
    setLocalShareRatio(0);
    
    // Update form values - all seats available to partner
    form.setValue('available_seats', totalSeats, { shouldValidate: true });
    
    // Update the visualizer to clear all selections
    if (visualizerRef.current) {
      visualizerRef.current.clearSelection();
    }
    
    // Notify parent with debounce
    updateTimeoutRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      
      console.log('[SeatSplitForm] Notifying parent of cleared selection (0%)');
      handleClearSelection(); // Call the parent handler
      setShareRatio(0);
      
      // Reset update flags after allowing React to process
      setTimeout(() => {
        isUpdatingFromSlider.current = false;
      }, 50);
    }, 50);
  }, [form, totalSeats, visualizerRef, handleClearSelection, setShareRatio, clearUpdateTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      clearUpdateTimeout();
      isUpdatingFromSlider.current = false;
      isUpdatingFromVisualizer.current = false;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[85vh]">
      <div className="flex-grow px-1 md:px-4 mb-24">
        <Form {...form}>
          <div className="space-y-6">
            {/* Enhanced seats summary section - streamlined */}
            <div className={cn(
              "px-4 py-6 rounded-lg border",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border shadow-md"
            )}>
              <p className={cn(
                "text-center font-medium mb-4",
                getThemedTextClasses()
              )}>Configure how many seats to keep for yourself</p>
              
              {/* Enhanced circles with tighter design */}
              <div className="gdyup-split-display max-w-sm mx-auto">
                {/* Your seats */}
                <div className="flex flex-col items-center">
                  <div className="gdyup-split-circle gdyup-split-your w-16 h-16 text-xl">
                    {yourSeats}
                  </div>
                  <div className="gdyup-split-label mt-2 text-center">
                    <div className={cn(
                      "font-medium mb-0.5",
                      getThemedTextClasses()
                    )}>
                      Your Seats
                    </div>
                    <span className={cn(
                      "text-sm",
                      getThemedTextClasses('muted')
                    )}>
                      {Math.round(localShareRatio)}%
                    </span>
                  </div>
                </div>
                
                {/* Partner seats */}
                <div className="flex flex-col items-center">
                  <div className="gdyup-split-circle gdyup-split-partner w-16 h-16 text-xl">
                    {partnerSeats}
                  </div>
                  <div className="gdyup-split-label mt-2 text-center">
                    <div className={cn(
                      "font-medium mb-0.5",
                      getThemedTextClasses()
                    )}>
                      Partner Seats
                    </div>
                    <span className={cn(
                      "text-sm",
                      getThemedTextClasses('muted')
                    )}>
                      {Math.round(100 - localShareRatio)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Seat Visualizer - maximized and more prominent */}
            <div className={cn(
              "p-4 rounded-lg border",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border shadow-md"
            )}>
              {/* Simplified header - removed redundant info */}
              <h2 className={cn(
                "font-medium text-center mb-4",
                getThemedTextClasses()
              )}>
                Select Your Seats
              </h2>
              
              {/* Expanded height for better seat visibility */}
              <div className="min-h-[250px] rounded-lg overflow-hidden relative">
                <JetSeatVisualizer
                  ref={visualizerRef}
                  jet_id={selectedJetId || 'default'}
                  totalSeats={totalSeats}
                  onChange={handleVisualizerChange}
                  showControls={false}
                  showLegend={false} // Hide redundant legend
                  showSummary={false} // Hide redundant summary
                  seatConfig={seatConfig}
                  className="seat-visualizer-enhanced"
                />
              </div>
              
              {/* Enhanced legend below seat map */}
              <div className="flex justify-center space-x-8 mt-4">
                <div className="flex items-center">
                  <div className="jet-seat-visualizer-legend-dot selected"></div>
                  <span className={getThemedTextClasses()}>Your Seats</span>
                </div>
                <div className="flex items-center">
                  <div className="jet-seat-visualizer-legend-dot available"></div>
                  <span className={getThemedTextClasses()}>Available</span>
                </div>
              </div>
            </div>
            
            {/* Improved slider section */}
            <div className={cn(
              "p-4 rounded-lg border",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border shadow-md"
            )}>
              <div className="flex justify-between items-center mb-3">
                <div className={getThemedTextClasses('secondary')}>
                  <span className="font-medium">Adjust Split:</span> {Math.round(localShareRatio)}% / {Math.round(100 - localShareRatio)}%
                </div>
                <div className={cn(
                  "px-3 py-1 text-sm font-semibold rounded-lg border",
                  getThemedBackgroundClasses('primary'),
                  getThemedTextClasses('inverse'),
                  "border-gdyup-primary/30"
                )}>
                  {yourSeats}/{totalSeats} seats
                </div>
              </div>
              
              {/* Enhanced slider with better thumb and track */}
              <Slider
                defaultValue={[50]} 
                min={0}
                max={100}
                step={1}
                value={[localShareRatio]}
                onValueChange={handleSliderChange}
                onValueCommit={handleSliderComplete}
                className={cn(
                  "my-4 py-1",
                  "[&>span]:h-[6px] [&>span]:bg-gray-700 [&>.range]:bg-gdyup-primary [&>[role=slider]]:bg-gdyup-primary [&>[role=slider]]:h-5 [&>[role=slider]]:w-5 [&>[role=slider]]:shadow-md"
                )}
                aria-label="Seat allocation percentage"
              />
              
              {/* Action buttons in more prominent position */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button
                  type="button"
                  onClick={handleResetTo5050}
                  className={cn(
                    "h-12 rounded-md font-medium",
                    getThemedButtonClasses()
                  )}
                >
                  Reset to 50/50
                </Button>
                
                <Button
                  type="button"
                  onClick={handleClearSelectionClick}
                  className={getThemedButtonClasses('secondary')}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

// External props interface - only serializable props
export interface SeatSplitFormProps extends SeatSplitFormSerializableProps {
  form: UseFormReturn<SeatSplitFormValues>;
  visualizerRef?: RefObject<JetSeatVisualizerRef>;
}

/**
 * Seat configuration form component - this is the exported component
 * It only accepts serializable props
 */
export function SeatSplitForm(props: SeatSplitFormProps) {
  // This is the public component that clients will use
  // We can create a visualizer ref if none was provided
  const localVisualizerRef = useRef<JetSeatVisualizerRef>(null);
  const effectiveVisualizerRef = props.visualizerRef || localVisualizerRef;
  
  // We manually handle callbacks here
  const handleNext = () => {
    props.form.trigger().then((isValid: boolean) => {
      if (isValid && document.dispatchEvent(new CustomEvent('seatsplit-next'))) {
        console.log('Seat split validation passed, proceeding to next step');
      }
    });
  };
  
  const handleBack = () => {
    document.dispatchEvent(new CustomEvent('seatsplit-back'));
  };
  
  const handleSetShareRatio = (ratio: number) => {
    // Dispatch a custom event with the value
    document.dispatchEvent(new CustomEvent('seatsplit-ratio-change', { 
      detail: { ratio } 
    }));
  };
  
  const handleSplitConfig = (selectedSeats: string[]) => {
    // Dispatch a custom event with the selected seats
    document.dispatchEvent(new CustomEvent('seatsplit-config-change', { 
      detail: { selectedSeats } 
    }));
  };
  
  const handleReset = () => {
    document.dispatchEvent(new CustomEvent('seatsplit-reset'));
  };
  
  const handleClear = () => {
    document.dispatchEvent(new CustomEvent('seatsplit-clear'));
  };
  
  // Pass all serializable props and locally created callbacks to internal component
  return (
    <InternalSeatSplitForm
      {...props}
      visualizerRef={effectiveVisualizerRef}
      onNext={handleNext}
      onBack={handleBack}
      setShareRatio={handleSetShareRatio}
      handleSplitConfigurationChange={handleSplitConfig}
      handleResetTo5050={handleReset}
      handleClearSelection={handleClear}
    />
  );
} 