'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { FormNavigation } from './FormNavigation';
import { ThemedIcon } from '../core/ThemedIcon';
import JetDetailsTabs from '../JetDetailsTabs';
import { motion } from 'framer-motion';
import JetSelector from '../JetSelector';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Define the form values interface
export interface JetSelectorFormValues {
  aircraft_model: string;
  total_seats: number;
  [key: string]: any; // Allow for additional fields
}

// Serializable props interface
export interface JetSelectorFormSerializableProps {
  totalSteps: number;
  currentStep: number;
  forceUpdateCounter: number;
  showInteriorImage: boolean;
  jetImagePath: string;
  jetInteriorPath: string;
  selectedTab: string;
  currentJetData: any | null;
}

// Callbacks interface
export interface JetSelectorFormCallbacks {
  onNext: () => void;
  onBack: () => void;
  setShowInteriorImage: (show: boolean) => void;
  setSelectedTab: (tab: string) => void;
}

// Combined props interface for internal component
interface InternalJetSelectorFormProps extends JetSelectorFormSerializableProps, JetSelectorFormCallbacks {
  form: UseFormReturn<JetSelectorFormValues>;
}

/**
 * Internal aircraft selection form component with callbacks
 * This is not directly exported
 */
function InternalJetSelectorForm({
  form,
  onNext,
  onBack,
  totalSteps,
  currentStep,
  forceUpdateCounter,
  currentJetData,
  setShowInteriorImage,
  showInteriorImage,
  jetImagePath,
  jetInteriorPath,
  selectedTab,
  setSelectedTab
}: InternalJetSelectorFormProps) {
  const { getThemedButtonClasses, getThemedBackgroundClasses, getThemedTextClasses } = useGdyupTheme();
  
  // Add state for local jet data
  const [localJetData, setLocalJetData] = useState<any>(currentJetData);
  
  // Update local state when prop changes
  useEffect(() => {
    if (currentJetData && (currentJetData.id || currentJetData.jetId)) {
      console.log('[JetSelectorForm] Received updated jet data:', 
        currentJetData ? {
          id: currentJetData.id || currentJetData.jetId,
          manufacturer: currentJetData.manufacturer,
          model: currentJetData.model,
          capacity: currentJetData.capacity || currentJetData.seatCapacity
        } : 'No jet data');
      setLocalJetData(currentJetData);
    }
  }, [currentJetData]);
  
  // Listen for jet selection events
  useEffect(() => {
    const handleJetChange = (event: any) => {
      console.log('[JetSelectorForm] Jet change event received:', event.detail);
      if (event.detail) {
        // Make sure event.detail has expected data
        if (!event.detail.id && event.detail.jetId) {
          // Fix missing ID
          event.detail.id = event.detail.jetId;
        }
        
        // Always update our local state
        setLocalJetData(event.detail);
        
        // Update form values
        if (event.detail.value) {
          form.setValue('aircraft_model', event.detail.value);
        }
        
        // Update seat capacity in the form
        const capacity = event.detail.seatCapacity || event.detail.capacity || 0;
        if (capacity > 0) {
          form.setValue('total_seats', capacity);
        }
      }
    };
    
    window.addEventListener('jetchange', handleJetChange);
    
    return () => {
      window.removeEventListener('jetchange', handleJetChange);
    };
  }, [form]);
  
  // Prepare jet data for display
  const displayJetData = useMemo(() => {
    if (!localJetData) return null;
    
    // Ensure the jet data has the required fields for JetDetailsTabs
    return {
      id: localJetData.id || localJetData.jetId,
      manufacturer: localJetData.manufacturer || 'Unknown',
      model: localJetData.model || 'Model',
      tail_number: localJetData.tail_number,
      capacity: localJetData.capacity || localJetData.seatCapacity,
      range_nm: localJetData.range_nm,
      cruise_speed_kts: localJetData.cruise_speed_kts,
      max_altitude: localJetData.max_altitude,
      cabin_width: localJetData.cabin_width,
      cabin_height: localJetData.cabin_height,
      cabin_length: localJetData.cabin_length,
      year: localJetData.year,
      berths: localJetData.berths,
      lavatory: localJetData.lavatory,
      galley: localJetData.galley,
      entertainment: localJetData.entertainment,
      wifi: localJetData.wifi,
      interior_type: localJetData.interior_type,
      image_url: localJetData.image_url,
      interior_image_url: localJetData.interior_image_url,
      home_base_airport: localJetData.home_base_airport
    };
  }, [localJetData]);
  
  return (
    <div className="flex flex-col min-h-[85vh]">
      <div className="flex-grow px-1 md:px-4 mb-24 overflow-y-auto aircraft-selection-container">
        <Form {...form}>
          <div className="space-y-6">
            {/* Aircraft model selection */}
            <FormField
              control={form.control}
              name="aircraft_model"
              render={({ field }) => (
                <FormItem className="jet-selector-wrapper">
                  <FormLabel className={getThemedTextClasses()}>
                    Select Aircraft
                  </FormLabel>
                  <div className={cn(
                    "rounded-lg border p-4 transition-colors",
                    getThemedBackgroundClasses('card'),
                    "border-gdyup-border"
                  )}>
                    <FormControl>
                      <JetSelector
                        value={field.value}
                        id="aircraft_model"
                        placeholder="Select an aircraft model"
                        className="w-full"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Display aircraft details if available */}
            {displayJetData && (
              <motion.div 
                className="space-y-6 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Aircraft image and tabs */}
                <div className={cn(
                  "rounded-lg border overflow-hidden transition-colors shadow-lg",
                  getThemedBackgroundClasses('card'),
                  "border-gdyup-border"
                )}>
                  {/* Aircraft image with enhanced background */}
                  <div className="p-3">
                    <div className="aspect-video relative overflow-hidden rounded shadow-inner bg-gradient-to-b from-black/70 to-black/40">
                      <motion.img
                        key={showInteriorImage ? 'interior' : 'exterior'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        src={showInteriorImage ? (displayJetData.interior_image_url || jetInteriorPath) : (displayJetData.image_url || jetImagePath)}
                        alt={form.watch('aircraft_model') || `${displayJetData.manufacturer} ${displayJetData.model}`}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          console.log(`Failed to load image: ${e.currentTarget.src}, trying fallback`);
                          // Use a fallback based on whether we're showing interior or exterior image
                          e.currentTarget.src = showInteriorImage 
                            ? '/images/jets/interior/interior1.jpg' 
                            : '/images/jets/placeholder-jet.jpg';
                        }}
                      />

                      {/* Aircraft name with improved visibility */}
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <div className={cn(
                          "flex flex-col bg-black/70 backdrop-blur-md p-3 rounded-md shadow-lg border",
                          "border-gdyup-primary/30"
                        )}>
                          <span className={cn(
                            "font-bold text-lg",
                            getThemedTextClasses()
                          )}>
                            {`${displayJetData.manufacturer} ${displayJetData.model}`}
                          </span>
                          {displayJetData.tail_number && (
                            <span className={getThemedTextClasses('muted')}>
                              Tail: {displayJetData.tail_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Implement JetDetailsTabs component */}
                  <div className="p-3">
                    <JetDetailsTabs 
                      jetData={displayJetData}
                      selectedTab={selectedTab}
                      onTabChange={(tab) => {
                        setSelectedTab(tab);
                        // Toggle between exterior/interior image based on selected tab
                        setShowInteriorImage(tab === 'interior' || tab === 'amenities');
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Simple message when no jet is selected */}
            {!displayJetData && (
              <div className={cn(
                "mt-6 p-6 rounded-lg border text-center",
                getThemedBackgroundClasses('card'),
                "border-gdyup-border",
                getThemedTextClasses()
              )}>
                <p>Please select an aircraft from above</p>
              </div>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}

// External props interface - only serializable props
export interface JetSelectorFormProps extends JetSelectorFormSerializableProps {
  form: UseFormReturn<JetSelectorFormValues>;
}

/**
 * Aircraft selection form component - this is the exported component
 * It only accepts serializable props
 */
export function JetSelectorForm(props: JetSelectorFormProps) {
  // This is the public component that clients will use
  // We manually handle callbacks here
  const handleNext = () => {
    console.log('FlightInfoForm: Next button clicked, directly triggering navigation');
    
    // Validate required fields before proceeding
    const aircraftModel = props.form.getValues('aircraft_model');
    const totalSeats = props.form.getValues('total_seats');
    
    if (!aircraftModel) {
      console.log('Validation failed: No aircraft selected');
      return;
    }
    
    if (!totalSeats || totalSeats <= 0) {
      console.log('Validation failed: Invalid total seats:', totalSeats);
      return;
    }
    
    console.log('JetSelector validation passed:', { aircraftModel, totalSeats });
    
    // Trigger form validation
    if (props.form) {
      props.form.trigger(['aircraft_model', 'total_seats']).then(isValid => {
        console.log('JetSelector form validation result:', isValid);
        if (isValid) {
          // Fire the navigation event
          document.dispatchEvent(new CustomEvent('jetselector-next'));
          
          // Try to directly access the parent form if available
          const jetShareOfferForm = document.querySelector('[data-component="JetShareOfferForm"]');
          if (jetShareOfferForm) {
            console.log('JetSelector: Found parent form, dispatching force-navigate event');
            const event = new CustomEvent('force-navigate', { 
              detail: { section: 2 } // Move to seat configuration
            });
            jetShareOfferForm.dispatchEvent(event);
          }
        } else {
          console.log('JetSelector validation failed, cannot proceed');
        }
      });
    } else {
      // No form validation available, just proceed
      document.dispatchEvent(new CustomEvent('jetselector-next'));
    }
  };
  
  const handleBack = () => {
    document.dispatchEvent(new CustomEvent('jetselector-back'));
  };
  
  const handleShowInteriorImage = (show: boolean) => {
    // Dispatch a custom event with the value
    document.dispatchEvent(new CustomEvent('jetselector-interior-toggle', { 
      detail: { show } 
    }));
  };
  
  const handleTabChange = (tab: string) => {
    // Dispatch a custom event with the value
    document.dispatchEvent(new CustomEvent('jetselector-tab-change', { 
      detail: { tab } 
    }));
  };
  
  // Pass all serializable props and locally created callbacks to internal component
  return (
    <InternalJetSelectorForm
      {...props}
      onNext={handleNext}
      onBack={handleBack}
      setShowInteriorImage={handleShowInteriorImage}
      setSelectedTab={handleTabChange}
    />
  );
} 