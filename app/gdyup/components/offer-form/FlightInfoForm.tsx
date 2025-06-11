'use client';

import React from 'react';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { FormNavigation } from './FormNavigation';
import { ThemedIcon } from '../core/ThemedIcon';
import { RiFlightTakeoffLine } from 'react-icons/ri';
import { EliteDateTimePicker } from '../EliteDateTimePicker';
import LocationAutocomplete from '../LocationAutocomplete';
import { Button } from '@/components/ui/button';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Define the form values interface
export interface FlightInfoFormValues {
  departure_time: Date;
  departure_location: string;
  arrival_location: string;
  [key: string]: any; // Allow for additional fields
}

// Serializable props interface
export interface FlightInfoFormSerializableProps {
  totalSteps: number;
  currentStep: number;
  airports?: any[];
}

// Callbacks interface
export interface FlightInfoFormCallbacks {
  onNext: () => void;
}

// Combined props interface for internal component
interface InternalFlightInfoFormProps extends FlightInfoFormSerializableProps, FlightInfoFormCallbacks {
  form: UseFormReturn<FlightInfoFormValues>;
}

/**
 * Internal flight information form component with callbacks
 * This is not directly exported
 */
function InternalFlightInfoForm({
  form,
  airports = [],
  onNext,
  totalSteps,
  currentStep
}: InternalFlightInfoFormProps) {
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  return (
    <div className="flex flex-col min-h-[85vh]">
      <div className="flex-grow px-1 md:px-4 mb-24">
        <Form {...form}>
          <div className="space-y-6">
            {/* Departure Date/Time */}
            <FormField
              control={form.control}
              name="departure_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={getThemedTextClasses()}>
                    Departure Date & Time
                  </FormLabel>
                  <EliteDateTimePicker
                    date={field.value}
                    setDate={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Departure & Arrival Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Location */}
              <FormField
                control={form.control}
                name="departure_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={getThemedTextClasses()}>
                      Departure Airport
                    </FormLabel>
                    <FormControl>
                      <LocationAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name="departure_location"
                        placeholder="Enter departure location"
                        airports={airports}
                        variant="departure"
                        label=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Arrival Location */}
              <FormField
                control={form.control}
                name="arrival_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={getThemedTextClasses()}>
                      Arrival Airport
                    </FormLabel>
                    <FormControl>
                      <LocationAutocomplete
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name="arrival_location"
                        placeholder="Enter arrival location"
                        airports={airports}
                        variant="arrival"
                        label=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Flight route visualization */}
            {(form.watch('departure_location') || form.watch('arrival_location')) && (
              <div className={cn(
                "relative p-4 rounded-lg border mt-6 transition-colors",
                getThemedBackgroundClasses('card'),
                "border-gdyup-border"
              )}>
                <div className="flex items-center justify-center">
                  <div className={getThemedTextClasses()}>
                    {form.watch('departure_location') || 'Departure'}
                  </div>
                  
                  <div className="mx-4 flex-1 flex items-center justify-center">
                    <div className={cn(
                      "h-0.5 flex-1 relative",
                      getThemedBackgroundClasses('primary')
                    )}>
                      <RiFlightTakeoffLine className={cn(
                        "absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 text-lg",
                        getThemedTextClasses()
                      )} />
                    </div>
                  </div>
                  
                  <div className={getThemedTextClasses()}>
                    {form.watch('arrival_location') || 'Arrival'}
                  </div>
                </div>
                
                <div className="mt-3 text-center">
                  <span className={getThemedTextClasses()}>
                    {form.watch('departure_time') 
                      ? format(form.watch('departure_time'), "EEEE, MMMM d, yyyy 'at' h:mm a") 
                      : 'Select departure date and time'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}

// External props interface - only serializable props
export interface FlightInfoFormProps extends FlightInfoFormSerializableProps {
  form: UseFormReturn<FlightInfoFormValues>;
}

/**
 * Flight information form component - this is the exported component
 * It only accepts serializable props
 */
export function FlightInfoForm(props: FlightInfoFormProps) {
  // This is the public component that clients will use
  // We manually handle callbacks here
  const handleNext = () => {
    console.log('FlightInfoForm: Next button clicked, directly triggering navigation');
    // Don't rely on event, use direct call
    if (props.form) {
      props.form.trigger(); // Still trigger validation but don't wait for result
    }
    
    // We fire both the event for compatibility and attempt to navigate directly
    document.dispatchEvent(new CustomEvent('flightinfo-next'));
    
    // Try to directly access the parent form if available
    const jetShareOfferForm = document.querySelector('[data-component="JetShareOfferForm"]');
    if (jetShareOfferForm) {
      console.log('FlightInfoForm: Found parent form, dispatching force-navigate event');
      const event = new CustomEvent('force-navigate', { 
        detail: { section: 1 } 
      });
      jetShareOfferForm.dispatchEvent(event);
    }
  };
  
  // Pass all serializable props and locally created callbacks to internal component
  return (
    <InternalFlightInfoForm
      {...props}
      onNext={handleNext}
    />
  );
} 