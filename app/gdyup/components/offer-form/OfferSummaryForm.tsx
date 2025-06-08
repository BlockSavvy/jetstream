'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FormNavigation } from './FormNavigation';
import { Input } from '@/components/ui/input';
import { DollarSign, Loader2, CheckCircle, InfoIcon, Zap, MessageCircle } from 'lucide-react';
import { ThemedIcon } from '../core/ThemedIcon';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Helper function for currency formatting
const formatCurrency = (amount: number | string) => {
  if (amount === undefined || amount === null) return '$0';
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Math.max(0, numericAmount));
};

// Helper function to safely parse a value to number
const safeParseFloat = (value: string | number | undefined): number => {
  if (typeof value === 'number') return Math.max(0, value);
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
};

// Calculate fair share amount based on seat distribution
const calculateFairShareAmount = (totalCost: number, yourSeats: number, partnerSeats: number, totalSeats: number): number => {
  if (totalSeats <= 0 || partnerSeats <= 0) return 0;
  // Calculate the per-seat cost
  const costPerSeat = totalCost / totalSeats;
  // Calculate partner's fair share
  return costPerSeat * partnerSeats;
};

// Calculate minimum and maximum reasonable partner share amounts
const calculateShareBounds = (totalCost: number, partnerSeats: number, totalSeats: number): { min: number, max: number, recommended: number } => {
  if (totalSeats <= 0 || partnerSeats <= 0 || totalCost <= 0) {
    return { min: 0, max: 0, recommended: 0 };
  }
  
  // Minimum: 50% of fair share
  const fairShare = calculateFairShareAmount(totalCost, totalSeats - partnerSeats, partnerSeats, totalSeats);
  const min = Math.max(0, fairShare * 0.5);
  
  // Maximum: 150% of fair share, but never more than totalCost
  const max = Math.min(totalCost, fairShare * 1.5);
  
  // Recommended: Exactly fair share
  const recommended = fairShare;
  
  return { min, max, recommended };
};

// Define the form values interface
export interface OfferSummaryFormValues {
  total_cost: string | number;
  requested_amount: string | number;
  total_seats: number;
  available_seats: number;
  departure_location: string;
  arrival_location: string;
  departure_time: Date;
  aircraft_model: string;
  aircraft_id: string;
  share_ratio: number;
  price_per_seat: number;
  // Payment metadata
  payment_method?: string;
  payment_currency?: string;
  // Nostr integration
  broadcast_to_nostr: boolean;
  nostr_flight_tag?: string;
  // Analytics and tracking
  user_id?: string;
  flight_id?: string;
  // Include other fields as needed
  [key: string]: any; // Allow for additional fields
}

// Serializable props interface
export interface OfferSummaryFormSerializableProps {
  totalSteps: number;
  currentStep: number;
  isSubmitting: boolean;
  isEditMode: boolean;
  editModeMessage?: string;
}

// Callbacks interface
export interface OfferSummaryFormCallbacks {
  onBack: () => void;
  onSubmit: () => void;
}

// Combined props interface for internal component
interface InternalOfferSummaryFormProps extends OfferSummaryFormSerializableProps, OfferSummaryFormCallbacks {
  form: UseFormReturn<OfferSummaryFormValues>; // Properly typed form object
}

/**
 * Internal offer summary form component with callbacks
 * This is not directly exported
 */
function InternalOfferSummaryForm({
  form,
  onBack,
  onSubmit,
  totalSteps,
  currentStep,
  isSubmitting,
  isEditMode,
  editModeMessage
}: InternalOfferSummaryFormProps) {
  const { 
    getThemedTextClasses, 
    getThemedBackgroundClasses,
    getThemedButtonClasses
  } = useGdyupTheme();
  
  // Local states for UI interaction
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [showNostrOptions, setShowNostrOptions] = useState(false);
  const [showPaymentTooltip, setShowPaymentTooltip] = useState(false);
  
  // References to prevent infinite update loops
  const initialCalculationDone = useRef(false);
  
  // Calculate derived values for the summary
  const totalCost = safeParseFloat(form.watch('total_cost'));
  const yourSeats = form.watch('total_seats') - form.watch('available_seats');
  const totalSeats = form.watch('total_seats');
  const partnerSeats = form.watch('available_seats');
  const yourCostPercentage = totalSeats > 0 ? (yourSeats / totalSeats) * 100 : 0;
  const requestedAmount = safeParseFloat(form.watch('requested_amount'));
  
  // Calculate fair share amounts
  const fairShare = calculateFairShareAmount(totalCost, yourSeats, partnerSeats, totalSeats);
  const { min: minPartnerShare, max: maxPartnerShare, recommended: recommendedPartnerShare } = 
    calculateShareBounds(totalCost, partnerSeats, totalSeats);
  
  // Calculate derived costs
  const yourCostShare = totalCost - requestedAmount; // What you'll actually pay
  const partnerCostPerSeat = partnerSeats > 0 ? requestedAmount / partnerSeats : 0;
  const yourCostPerSeat = yourSeats > 0 ? yourCostShare / yourSeats : 0;
  
  // Calculate request percentage relative to fair share
  const requestPercentage = fairShare > 0 
    ? Math.round((requestedAmount / fairShare) * 100) 
    : 100;
  
  // Calculate if the request is fair, too high, or too low
  const isPriceFair = Math.abs(requestedAmount - fairShare) < (fairShare * 0.1); // Within 10% of fair
  const isPriceTooHigh = requestedAmount > fairShare * 1.2; // More than 20% above fair
  const isPriceTooLow = requestedAmount < fairShare * 0.8 && requestedAmount > 0; // More than 20% below fair
  
  // Initialize form with fair share amount if needed
  useEffect(() => {
    // Only run this once when the component mounts and totalCost is available
    if (!initialCalculationDone.current && totalCost > 0 && fairShare > 0) {
      // Set requested amount to the fair share amount initially
      form.setValue('requested_amount', Math.round(fairShare), { shouldValidate: true });
      
      // Set broadcast_to_nostr default to true if not already set
      if (form.getValues('broadcast_to_nostr') === undefined) {
        form.setValue('broadcast_to_nostr', true);
      }
      
      initialCalculationDone.current = true;
      
      // Share form data with AI Concierge for context-aware suggestions
      const formData = {
        total_cost: totalCost,
        departure_location: form.watch('departure_location'),
        arrival_location: form.watch('arrival_location'),
        departure_time: form.watch('departure_time'),
        aircraft_model: form.watch('aircraft_model'),
        total_seats: totalSeats,
        available_seats: partnerSeats,
        yourSeats: yourSeats,
        fairShareAmount: fairShare,
        requestedAmount: Math.round(fairShare)
      };
      
      // Broadcast data for AI Concierge to use
      document.dispatchEvent(new CustomEvent('gdyup-form-data', {
        detail: formData
      }));
    }
  }, [form, fairShare, totalCost, totalSeats, partnerSeats, yourSeats]);
  
  // Handler for requested amount slider
  const handleRequestedAmountSliderChange = (values: number[]) => {
    const amount = values[0];
    form.setValue('requested_amount', amount, { shouldValidate: true });
    setIsSliderActive(true);
  };
  
  // Handler for when slider interaction ends
  const handleSliderCommit = () => {
    setIsSliderActive(false);
  };
  
  // Calculate slider min/max values with safeguards
  const sliderMin = Math.max(0, Math.floor(minPartnerShare / 100) * 100);
  const sliderMax = Math.ceil(maxPartnerShare / 100) * 100;
  const sliderStep = Math.max(1, Math.round((sliderMax - sliderMin) / 100));
  
  return (
    <div className="flex flex-col min-h-[85vh]">
      <div className="flex-grow px-1 md:px-4 mb-24">
        <Form {...form}>
          <div className="space-y-6">
            {/* Edit mode notification */}
            {isEditMode && editModeMessage && (
              <div className={cn(
                "p-4 rounded-lg border-l-4 border-gdyup-primary text-sm mb-6",
                getThemedBackgroundClasses('card'),
                "border border-gdyup-border",
                getThemedTextClasses()
              )}>
                <div className="flex items-center">
                  <ThemedIcon icon={Loader2} size={20} className="mr-2 opacity-70" />
                  <span>{editModeMessage}</span>
                </div>
              </div>
            )}
            
            {/* Cost inputs */}
            <div className={cn(
              "p-5 rounded-lg border space-y-5",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border"
            )}>
              <h3 className={cn(
                "text-lg font-semibold mb-2",
                getThemedTextClasses()
              )}>
                Cost Configuration
              </h3>
              
              {/* Total flight cost */}
              <FormField
                control={form.control}
                name="total_cost"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel className={getThemedTextClasses()}>
                      <ThemedIcon icon={DollarSign} size={16} className="mr-1 opacity-70" />
                      Total Flight Cost (USD)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className={cn(
                          "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                          getThemedTextClasses()
                        )}>
                          $
                        </div>
                        <Input
                          placeholder="Enter total flight cost"
                          type="number"
                          className={cn(
                            "pl-8",
                            "bg-black/20 text-gdyup-text border-gdyup-border",
                            getThemedTextClasses()
                          )}
                          min={0}
                          {...restField}
                          value={value || ''}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            onChange(newValue);
                            
                            // When total cost changes, recalculate the fair request amount
                            if (newValue && !isSliderActive) {
                              const newCost = safeParseFloat(newValue);
                              const fair = calculateFairShareAmount(
                                newCost, 
                                yourSeats, 
                                partnerSeats, 
                                totalSeats
                              );
                              form.setValue('requested_amount', Math.round(fair), { shouldValidate: true });
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className={getThemedTextClasses('muted')}>
                      The total cost of the jet charter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Partner Share Amount with Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel className={getThemedTextClasses()}>
                    <ThemedIcon icon={DollarSign} size={16} className="mr-1 opacity-70" />
                    Partner Share Amount
                  </FormLabel>
                  
                  <div className="flex items-center space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => form.setValue('requested_amount', Math.round(fairShare), { shouldValidate: true })}
                          >
                            <CheckCircle size={16} className={cn(isPriceFair ? "text-green-500" : "text-gray-500")} />
                            <span className="sr-only">Set fair price</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Set to fair share ({formatCurrency(fairShare)})</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            <InfoIcon size={16} className="text-gdyup-text-subtle" />
                            <span className="sr-only">Pricing information</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Based on seat distribution, partner fair share is {formatCurrency(fairShare)}</p>
                          <p className="mt-1 text-xs">Range: {formatCurrency(minPartnerShare)} - {formatCurrency(maxPartnerShare)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="requested_amount"
                  render={({ field: { onChange, value, ...restField } }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-3">
                          {/* Input field */}
                          <div className="relative">
                            <div className={cn(
                              "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",
                              getThemedTextClasses()
                            )}>
                              $
                            </div>
                            <Input
                              placeholder="Enter amount to request"
                              type="number"
                              min={0}
                              max={totalCost}
                              className={cn(
                                "pl-8",
                                "bg-black/20 text-gdyup-text border-gdyup-border",
                                getThemedTextClasses()
                              )}
                              {...restField}
                              value={value || ''}
                              onChange={(e) => {
                                onChange(Math.max(0, Number(e.target.value)));
                              }}
                            />
                          </div>
                          
                          {/* Price fairness indicator */}
                          <div className="px-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className={getThemedTextClasses('muted')}>
                                {requestPercentage > 0 ? `${requestPercentage}% of fair share` : 'No charge'}
                              </span>
                              {isPriceTooLow && (
                                <span className="text-yellow-500">Below fair price</span>
                              )}
                              {isPriceFair && (
                                <span className="text-green-500">Fair price</span>
                              )}
                              {isPriceTooHigh && (
                                <span className="text-orange-500">Above fair price</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Slider */}
                          {totalCost > 0 && partnerSeats > 0 && (
                            <div className="px-1 py-2">
                              <Slider
                                min={sliderMin}
                                max={sliderMax}
                                step={sliderStep}
                                value={[Number(value) || 0]}
                                onValueChange={handleRequestedAmountSliderChange}
                                onValueCommit={handleSliderCommit}
                                className={cn(
                                  "my-4",
                                  "[&>span]:h-[6px] [&>span]:bg-gray-700 [&>.range]:bg-gdyup-primary [&>[role=slider]]:bg-gdyup-primary [&>[role=slider]]:h-5 [&>[role=slider]]:w-5 [&>[role=slider]]:shadow-md"
                                )}
                                aria-label="Partner share amount"
                              />
                              
                              <div className="flex justify-between text-xs">
                                <span className={getThemedTextClasses('muted')}>Min: {formatCurrency(sliderMin)}</span>
                                <span className={getThemedTextClasses('muted')}>Fair: {formatCurrency(fairShare)}</span>
                                <span className={getThemedTextClasses('muted')}>Max: {formatCurrency(sliderMax)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className={getThemedTextClasses('muted')}>
                        Amount you want to receive from your flight partner(s)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Nostr broadcast option */}
              <FormField
                control={form.control}
                name="broadcast_to_nostr"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setShowNostrOptions(!!checked);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={cn("flex items-center cursor-pointer", getThemedTextClasses())}>
                        <Zap size={16} className="mr-2 text-gdyup-primary" />
                        Broadcast offer to GDY·UP Nostr flight channel
                      </FormLabel>
                      <FormDescription className={getThemedTextClasses('muted')}>
                        Makes your offer visible in community channels and enables Nostr payments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Nostr specific options - only shown when broadcast is enabled */}
              {showNostrOptions && (
                <div className={cn(
                  "pl-8 border-l-2 ml-1.5 mt-2", 
                  "border-gdyup-primary/30"
                )}>
                  <FormField
                    control={form.control}
                    name="nostr_flight_tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={getThemedTextClasses()}>
                          <MessageCircle size={14} className="mr-1 opacity-70" />
                          Flight Tag (optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="#aviation, #gdyup, or custom tag"
                            className={cn(
                              "bg-black/20 text-gdyup-text border-gdyup-border",
                              getThemedTextClasses()
                            )}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription className={getThemedTextClasses('muted')}>
                          Add a tag to help others discover your flight offer
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            {/* Offer summary */}
            <div className={cn(
              "p-5 rounded-lg border",
              getThemedBackgroundClasses('card'),
              "border-gdyup-border shadow-md"
            )}>
              <h3 className={cn(
                "text-lg font-semibold mb-4 border-b pb-2",
                getThemedTextClasses(),
                "border-gdyup-border/50"
              )}>
                Offer Summary
              </h3>
              
              <div className="space-y-4">
                {/* Flight details section */}
                <div className={cn(
                  "rounded-md p-3 bg-black/20 border border-gdyup-border/30"
                )}>
                  <h4 className={cn(
                    "text-sm font-medium mb-2 flex items-center",
                    getThemedTextClasses('muted')
                  )}>
                    FLIGHT DETAILS
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Route:</span>
                      <span className={cn("font-medium", getThemedTextClasses())}>
                        {form.watch('departure_location')} → {form.watch('arrival_location')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Departure:</span>
                      <span className={getThemedTextClasses()}>
                        {form.watch('departure_time') 
                          ? format(form.watch('departure_time'), "MMM d, yyyy 'at' h:mm a") 
                          : 'Not specified'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Aircraft:</span>
                      <span className={getThemedTextClasses()}>
                        {form.watch('aircraft_model') || 'Not selected'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Seats:</span>
                      <span className={getThemedTextClasses()}>
                        {yourSeats} for you, {partnerSeats} for partner ({totalSeats} total)
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Cost breakdown section */}
                <div className={cn(
                  "rounded-md p-3 bg-black/20 border border-gdyup-border/30"
                )}>
                  <h4 className={cn(
                    "text-sm font-medium mb-2 flex items-center",
                    getThemedTextClasses('muted')
                  )}>
                    COST BREAKDOWN
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Total Charter Cost:</span>
                      <span className={cn("font-medium", getThemedTextClasses())}>
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Your Share ({Math.round(yourCostPercentage)}%):</span>
                      <span className={getThemedTextClasses()}>
                        {formatCurrency(yourCostShare)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Partner Share ({Math.round(100 - yourCostPercentage)}%):</span>
                      <span className={cn(
                        "font-medium", 
                        requestedAmount === fairShare 
                          ? "text-green-500" 
                          : requestedAmount > fairShare 
                            ? "text-orange-500" 
                            : getThemedTextClasses())}>
                        {formatCurrency(requestedAmount)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Per-seat cost comparison */}
                <div className={cn(
                  "rounded-md p-3 bg-black/20 border border-gdyup-border/30"
                )}>
                  <h4 className={cn(
                    "text-sm font-medium mb-2 flex items-center",
                    getThemedTextClasses('muted')
                  )}>
                    PER-SEAT PRICING
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Your Cost Per Seat:</span>
                      <span className={getThemedTextClasses()}>
                        {formatCurrency(yourCostPerSeat)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={getThemedTextClasses('muted')}>Partner Cost Per Seat:</span>
                      <span className={cn(
                        formatCurrency(partnerCostPerSeat) !== formatCurrency(yourCostPerSeat) 
                          ? (partnerCostPerSeat > yourCostPerSeat * 1.2 
                              ? "text-orange-500 font-medium" 
                              : "text-gdyup-primary font-medium")
                          : getThemedTextClasses()
                      )}>
                        {formatCurrency(partnerCostPerSeat)}
                      </span>
                    </div>
                    
                    {/* Per-seat price difference */}
                    {yourSeats > 0 && partnerSeats > 0 && partnerCostPerSeat !== yourCostPerSeat && (
                      <div className="flex justify-between text-xs mt-1">
                        <span className={getThemedTextClasses('muted')}>Difference:</span>
                        <span className={
                          partnerCostPerSeat > yourCostPerSeat 
                            ? "text-orange-500" 
                            : "text-green-500"
                        }>
                          {partnerCostPerSeat > yourCostPerSeat ? '+' : '-'}
                          {formatCurrency(Math.abs(partnerCostPerSeat - yourCostPerSeat))}
                          {' '}
                          ({Math.round(Math.abs((partnerCostPerSeat / yourCostPerSeat) - 1) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bottom line - what you'll pay */}
                <div className={cn(
                  "mt-4 p-4 rounded-md", 
                  getThemedBackgroundClasses('primary'),
                  "flex items-center justify-between"
                )}>
                  <span className={cn("font-semibold", getThemedTextClasses('inverse'))}>
                    Offer Price:
                  </span>
                  <span className={cn("text-lg font-bold", getThemedTextClasses('inverse'))}>
                    {formatCurrency(totalCost - requestedAmount)}
                  </span>
                </div>
                
                {/* Payment metadata - hidden field that will be passed to the form */}
                <input 
                  type="hidden" 
                  name="payment_metadata" 
                  value={JSON.stringify({
                    totalCost,
                    yourShare: yourCostShare,
                    partnerShare: requestedAmount,
                    currency: 'USD',
                    yourSeats,
                    partnerSeats,
                    aircraft_id: form.watch('aircraft_id'),
                    flight_id: form.watch('flight_id'),
                    user_id: form.watch('user_id'),
                    nostr: form.watch('broadcast_to_nostr'),
                    nostr_flight_tag: form.watch('nostr_flight_tag')
                  })}
                />
              </div>
            </div>
            
            {/* AI Concierge integration */}
            <div className="mt-2 text-center">
              <button 
                type="button"
                className={cn(
                  "text-sm text-gdyup-primary underline underline-offset-2 flex items-center mx-auto",
                  "opacity-80 hover:opacity-100 transition-opacity"
                )}
                onClick={() => {
                  // Gather current form data for context
                  const formData = {
                    route: `${form.watch('departure_location')} to ${form.watch('arrival_location')}`,
                    aircraft: form.watch('aircraft_model'),
                    totalCost,
                    seats: { 
                      total: totalSeats, 
                      yours: yourSeats, 
                      partner: partnerSeats 
                    },
                    currentPrice: { 
                      total: requestedAmount, 
                      perSeat: partnerCostPerSeat,
                      fairShare,
                      deviation: requestedAmount > 0 && fairShare > 0 
                        ? (requestedAmount / fairShare - 1) * 100 
                        : 0
                    }
                  };
                  
                  // Broadcast form data for provider to capture
                  document.dispatchEvent(new CustomEvent('gdyup-form-data', {
                    detail: formData
                  }));
                  
                  // Trigger direct AI concierge request
                  const event = new CustomEvent('gdyup-ai-concierge-request', {
                    detail: {
                      topic: 'offer-pricing-advice',
                      context: formData
                    }
                  });
                  document.dispatchEvent(event);
                }}
              >
                <InfoIcon size={14} className="mr-1" />
                Ask Concierge for pricing suggestions
              </button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

// External props interface - only serializable props
export interface OfferSummaryFormProps extends OfferSummaryFormSerializableProps {
  form: UseFormReturn<OfferSummaryFormValues>;
}

/**
 * Offer summary form component - this is the exported component
 * It only accepts serializable props
 */
export function OfferSummaryForm(props: OfferSummaryFormProps) {
  // This is the public component that clients will use
  // We manually handle callbacks here
  const handleBack = () => {
    document.dispatchEvent(new CustomEvent('offersummary-back'));
  };
  
  const handleSubmit = () => {
    // First validate all form fields
    props.form.trigger().then((isValid: boolean) => {
      if (isValid) {
        // Prepare the offer data including payment metadata
        const formValues = props.form.getValues();
        
        // Create the payment metadata that will be used by BTC Pay Server
        const paymentMetadata = {
          totalCost: safeParseFloat(formValues.total_cost),
          yourShare: safeParseFloat(formValues.total_cost) - safeParseFloat(formValues.requested_amount),
          partnerShare: safeParseFloat(formValues.requested_amount),
          currency: 'USD',
          yourSeats: formValues.total_seats - formValues.available_seats,
          partnerSeats: formValues.available_seats,
          aircraft_id: formValues.aircraft_id,
          flight_id: formValues.flight_id,
          user_id: formValues.user_id,
          nostr: formValues.broadcast_to_nostr,
          nostr_flight_tag: formValues.nostr_flight_tag
        };
        
        // Dispatch event with payment metadata included
        const submitted = document.dispatchEvent(new CustomEvent('offersummary-submit', {
          detail: { paymentMetadata }
        }));
        
        if (submitted) {
          console.log('Offer summary validation passed, submitting form with metadata:', paymentMetadata);
        }
      } else {
        console.error('Offer summary validation failed');
      }
    });
  };
  
  // Pass all serializable props and locally created callbacks to internal component
  return (
    <InternalOfferSummaryForm
      {...props}
      onBack={handleBack}
      onSubmit={handleSubmit}
    />
  );
} 