'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, ArrowRight, Plane, MapPin, Calendar, Users, DollarSign, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import JetSeatVisualizer, { JetSeatVisualizerRef, SeatConfiguration } from '../components/JetSeatVisualizer';
import { format } from 'date-fns';

// Form schema
const offerFormSchema = z.object({
  departure_location: z.string().min(1, 'Departure location is required'),
  arrival_location: z.string().min(1, 'Arrival location is required'),
  flight_date: z.string().min(1, 'Flight date is required'),
  departure_time: z.string().optional(),
  aircraft_model: z.string().min(1, 'Aircraft model is required'),
  jet_id: z.string().min(1, 'Jet selection is required'),
  total_seats: z.number().min(1, 'Total seats must be at least 1'),
  available_seats: z.number().min(1, 'Available seats must be at least 1'),
  total_flight_cost: z.number().min(1, 'Total flight cost is required'),
  requested_share_amount: z.number().min(1, 'Share amount is required'),
  seat_split_configuration: z.any().optional(),
  additional_info: z.string().optional()
});

type FormData = z.infer<typeof offerFormSchema>;

interface JetOption {
  id: string;
  manufacturer: string;
  model: string;
  capacity: number;
}

const FORM_STEPS = [
  { id: 0, title: 'Route & Date', icon: MapPin },
  { id: 1, title: 'Aircraft', icon: Plane },
  { id: 2, title: 'Seat Split', icon: Users },
  { id: 3, title: 'Pricing', icon: DollarSign },
  { id: 4, title: 'Review', icon: Check }
];

export default function ListPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [jets, setJets] = useState<JetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [jetsLoading, setJetsLoading] = useState(true);
  const [shareRatio, setShareRatio] = useState(50);
  const [splitConfiguration, setSplitConfiguration] = useState<string[]>([]);
  const visualizerRef = useRef<JetSeatVisualizerRef>(null);
  
  const { getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      departure_location: '',
      arrival_location: '',
      flight_date: '',
      departure_time: '',
      aircraft_model: '',
      jet_id: '',
      total_seats: 8,
      available_seats: 4,
      total_flight_cost: 25000,
      requested_share_amount: 12500,
      additional_info: ''
    }
  });

  // Fetch available jets
  useEffect(() => {
    const fetchJets = async () => {
      try {
        // First try the jets API endpoint
        let response = await fetch('/api/jets');
        
        if (!response.ok) {
          // Fallback to jetshare getJets endpoint
          response = await fetch('/api/jetshare/getJets');
        }
        
        if (response.ok) {
          const data = await response.json();
          if (data.jets) {
            setJets(data.jets);
          } else if (Array.isArray(data)) {
            setJets(data);
          }
        } else {
          // Use mock data as last resort
          setJets([
            { id: 'gulfstream-g650', manufacturer: 'Gulfstream', model: 'G650', capacity: 12 },
            { id: 'bombardier-global-7500', manufacturer: 'Bombardier', model: 'Global 7500', capacity: 14 },
            { id: 'cessna-citation-x', manufacturer: 'Cessna', model: 'Citation X', capacity: 8 },
            { id: 'embraer-phenom-300', manufacturer: 'Embraer', model: 'Phenom 300', capacity: 6 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching jets:', error);
        // Use mock data on error
        setJets([
          { id: 'gulfstream-g650', manufacturer: 'Gulfstream', model: 'G650', capacity: 12 },
          { id: 'bombardier-global-7500', manufacturer: 'Bombardier', model: 'Global 7500', capacity: 14 },
          { id: 'cessna-citation-x', manufacturer: 'Cessna', model: 'Citation X', capacity: 8 },
          { id: 'embraer-phenom-300', manufacturer: 'Embraer', model: 'Phenom 300', capacity: 6 }
        ]);
      } finally {
        setJetsLoading(false);
      }
    };

    fetchJets();
  }, []);

  // Update share amount when ratio changes
  const updateShareAmount = useCallback((ratio: number) => {
    const totalCost = form.getValues('total_flight_cost') || 0;
    const shareAmount = Math.round((ratio / 100) * totalCost);
    form.setValue('requested_share_amount', shareAmount);
    setShareRatio(ratio);
  }, [form]);

  // Handle seat configuration changes
  const handleSeatConfigurationChange = useCallback((selectedSeats: string[]) => {
    setSplitConfiguration(selectedSeats);
    
    const totalSeats = form.getValues('total_seats') || 0;
    const yourSeats = selectedSeats.length;
    const partnerSeats = totalSeats - yourSeats;
    
    form.setValue('available_seats', partnerSeats);
    
    // Update share ratio based on seat selection
    const newRatio = totalSeats > 0 ? Math.round((yourSeats / totalSeats) * 100) : 50;
    updateShareAmount(newRatio);
  }, [form, updateShareAmount]);

  // Handle aircraft selection
  const handleAircraftSelect = (jet: JetOption) => {
    form.setValue('jet_id', jet.id);
    form.setValue('aircraft_model', `${jet.manufacturer} ${jet.model}`);
    form.setValue('total_seats', jet.capacity);
    form.setValue('available_seats', Math.floor(jet.capacity / 2));
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const offerData = {
        ...data,
        seat_split_configuration: splitConfiguration,
        user_id: user?.id
      };

      const response = await fetch('/api/jetshare/createOffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('✈️ Flight listing created successfully!');
        router.push(`/gdyup/offer/${result.offer_id}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create offer');
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      toast.error(`Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Route & Date
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className={cn("text-2xl font-bold mb-2", getThemedTextClasses())}>
                Flight Route & Schedule
              </h2>
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                Where are you flying and when?
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="departure_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Airport</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., LAX, JFK, LHR"
                        className="input-elite"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arrival_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Arrival Airport</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., LAX, JFK, LHR"
                        className="input-elite"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="flight_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flight Date</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="input-elite"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departure_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="time"
                          className="input-elite"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </motion.div>
        );

      case 1: // Aircraft Selection
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className={cn("text-2xl font-bold mb-2", getThemedTextClasses())}>
                Select Your Aircraft
              </h2>
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                Choose the jet you're flying
              </p>
            </div>

            {jetsLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className={getThemedTextClasses('muted')}>Loading aircraft...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {jets.map((jet) => (
                  <motion.button
                    key={jet.id}
                    type="button"
                    onClick={() => handleAircraftSelect(jet)}
                    className={cn(
                      "elite-card p-4 text-left transition-all",
                      form.getValues('jet_id') === jet.id
                        ? "border-gdyup-primary bg-gdyup-primary/10"
                        : "border-gdyup-border hover:border-gdyup-border-light"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={cn("font-semibold", getThemedTextClasses())}>
                          {jet.manufacturer} {jet.model}
                        </h3>
                        <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                          {jet.capacity} seats total
                        </p>
                      </div>
                      {form.getValues('jet_id') === jet.id && (
                        <Check size={20} className="text-gdyup-primary" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        );

      case 2: // Seat Split Configuration
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className={cn("text-2xl font-bold mb-2", getThemedTextClasses())}>
                Configure Seat Split
              </h2>
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                Select which seats you'll offer to share
              </p>
            </div>

            {/* Seat Split Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="elite-card p-4 border-blue-500/30 bg-blue-500/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {Math.round((shareRatio / 100) * (form.getValues('total_seats') || 8))}
                  </div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                    Your Seats ({shareRatio}%)
                  </div>
                </div>
              </div>
              
              <div className="elite-card p-4 border-amber-500/30 bg-amber-500/10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400 mb-1">
                    {(form.getValues('total_seats') || 8) - Math.round((shareRatio / 100) * (form.getValues('total_seats') || 8))}
                  </div>
                  <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                    Partner Seats ({100 - shareRatio}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Seat Visualizer */}
            <div className="elite-card p-4">
              <div className="min-h-[300px]">
                <JetSeatVisualizer
                  ref={visualizerRef}
                  jet_id={form.getValues('jet_id') || 'default'}
                  totalSeats={form.getValues('total_seats')}
                  onChange={handleSeatConfigurationChange}
                  showControls={false}
                  showLegend={true}
                  showSummary={false}
                  seatConfig={{}}
                  className="seat-visualizer-enhanced"
                />
              </div>
            </div>

            {/* Slider Controls */}
            <div className="elite-card p-4">
              <div className="flex justify-between items-center mb-3">
                <span className={cn("text-sm font-medium", getThemedTextClasses())}>
                  Split Ratio: {shareRatio}% / {100 - shareRatio}%
                </span>
                <span className={cn("text-sm", getThemedTextClasses('muted'))}>
                  {Math.round((shareRatio / 100) * (form.getValues('total_seats') || 8))}/{form.getValues('total_seats')} seats
                </span>
              </div>
              
              <Slider
                value={[shareRatio]}
                onValueChange={(values) => updateShareAmount(values[0])}
                max={90}
                min={10}
                step={5}
                className="mb-4"
              />
              
              <div className="flex justify-between text-xs text-gdyup-text-subtle">
                <span>You pay more</span>
                <span>50/50</span>
                <span>They pay more</span>
              </div>
            </div>
          </motion.div>
        );

      case 3: // Pricing
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className={cn("text-2xl font-bold mb-2", getThemedTextClasses())}>
                Flight Costs & Pricing
              </h2>
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                Set your total flight cost and share amount
              </p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="total_flight_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Flight Cost (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="25000"
                        className="input-elite"
                        onChange={(e) => {
                          field.onChange(Number(e.target.value));
                          updateShareAmount(shareRatio);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requested_share_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requested Share Amount (USD)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="input-elite"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost Breakdown */}
              <div className="elite-card p-4 bg-gdyup-bg-elevated">
                <h3 className={cn("font-semibold mb-3", getThemedTextClasses())}>Cost Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Your portion:</span>
                    <span className={getThemedTextClasses()}>${(form.getValues('total_flight_cost') || 0) - (form.getValues('requested_share_amount') || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Partner pays:</span>
                    <span className={getThemedTextClasses()}>${form.getValues('requested_share_amount') || 0}</span>
                  </div>
                  <div className="border-t border-gdyup-border pt-2 flex justify-between font-semibold">
                    <span className={getThemedTextClasses()}>Total:</span>
                    <span className={getThemedTextClasses()}>${form.getValues('total_flight_cost') || 0}</span>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="additional_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any additional details about the flight..."
                        className="input-elite min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>
        );

      case 4: // Review
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className={cn("text-2xl font-bold mb-2", getThemedTextClasses())}>
                Review Your Listing
              </h2>
              <p className={cn("text-sm", getThemedTextClasses('muted'))}>
                Confirm all details before publishing
              </p>
            </div>

            <div className="space-y-4">
              <div className="elite-card p-4">
                <h3 className={cn("font-semibold mb-3", getThemedTextClasses())}>Flight Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Route:</span>
                    <span className={getThemedTextClasses()}>{form.getValues('departure_location')} → {form.getValues('arrival_location')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Date:</span>
                    <span className={getThemedTextClasses()}>
                      {form.getValues('flight_date') ? format(new Date(form.getValues('flight_date')), 'PPP') : 'Not set'}
                      {form.getValues('departure_time') && ` at ${form.getValues('departure_time')}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Aircraft:</span>
                    <span className={getThemedTextClasses()}>{form.getValues('aircraft_model')}</span>
                  </div>
                </div>
              </div>

              <div className="elite-card p-4">
                <h3 className={cn("font-semibold mb-3", getThemedTextClasses())}>Seat Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Total seats:</span>
                    <span className={getThemedTextClasses()}>{form.getValues('total_seats')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Your seats:</span>
                    <span className={getThemedTextClasses()}>{splitConfiguration.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Available seats:</span>
                    <span className={getThemedTextClasses()}>{form.getValues('available_seats')}</span>
                  </div>
                </div>
              </div>

              <div className="elite-card p-4">
                <h3 className={cn("font-semibold mb-3", getThemedTextClasses())}>Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Total flight cost:</span>
                    <span className={getThemedTextClasses()}>${form.getValues('total_flight_cost')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={getThemedTextClasses('muted')}>Partner pays:</span>
                    <span className={getThemedTextClasses()}>${form.getValues('requested_share_amount')}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className={getThemedTextClasses()}>You pay:</span>
                    <span className={getThemedTextClasses()}>${(form.getValues('total_flight_cost') || 0) - (form.getValues('requested_share_amount') || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gdyup-bg-dark px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={cn("text-3xl font-bold mb-2", getThemedTextClasses())}>
            List Your Flight
          </h1>
          <p className={cn("text-lg", getThemedTextClasses('muted'))}>
            Share empty seats and recover flight costs
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {FORM_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                    isActive 
                      ? "bg-gdyup-primary text-gdyup-button-text shadow-lg" 
                      : isCompleted
                        ? "bg-gdyup-primary/30 text-gdyup-primary"
                        : "bg-gdyup-bg-elevated text-gdyup-text-subtle"
                  )}>
                    <Icon size={16} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-center",
                    isActive 
                      ? getThemedTextClasses() 
                      : getThemedTextClasses('muted')
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gdyup-bg-elevated rounded-full h-2">
            <motion.div
              className="bg-gdyup-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn(
                  "btn-secondary-elite",
                  currentStep === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>

              {currentStep < FORM_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary-elite"
                >
                  Next
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-elite"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-gdyup-button-text border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles size={16} className="mr-2" />
                      Create Listing
                    </div>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 