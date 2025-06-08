'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { JetSeatVisualizerRef } from '../JetSeatVisualizer';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { UserPlus, Loader2 } from 'lucide-react';
import { ThemedIcon } from '../core/ThemedIcon';
import { FormNavigation } from './FormNavigation';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-provider';

// Import the subcomponents with updated type interfaces
import { FlightInfoForm, FlightInfoFormValues } from './FlightInfoForm';
import { JetSelectorForm, JetSelectorFormValues } from './JetSelectorForm';
import { SeatSplitForm, SeatSplitFormValues } from './SeatSplitForm';
import { OfferSummaryForm, OfferSummaryFormValues } from './OfferSummaryForm';

// Theme switcher component for live testing
function ThemeSwitcher() {
  // Hide theme switcher completely in all environments
  return null;
  
  // The code below will never execute
  const { theme, changeTheme, getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
 return (
    <div className={cn(
      "px-4 py-2 mb-4 flex items-center justify-between border-b text-sm",
      getThemedBackgroundClasses('card'),
      "border-gdyup-border"
    )}>
      <div className="flex items-center">
        <span className={cn(
          "mr-2 opacity-70",
          getThemedTextClasses()
        )}>Theme:</span>
        <span className={cn(
          "font-medium",
          getThemedTextClasses()
        )}>{theme === 'default' ? 'Default (Lime)' : theme === 'luxury' ? 'Luxury (Neon)' : 'Bitcoin (Orange)'}</span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => changeTheme('default')}
          className={cn(
            "w-6 h-6 rounded-full bg-[#DAFF0D] flex items-center justify-center",
            theme === 'default' ? 'ring-2 ring-gdyup-text ring-offset-1 ring-offset-gdyup-bg-dark' : '',
          )}
        />
        <button
          type="button"
          onClick={() => changeTheme('luxury')}
          className={cn(
            "w-6 h-6 rounded-full bg-[#DC143C] flex items-center justify-center",
            theme === 'luxury' ? 'ring-2 ring-gdyup-text ring-offset-1 ring-offset-gdyup-bg-dark' : '',
          )}
        />
        <button
          type="button"
          onClick={() => changeTheme('bitcoin')}
          className={cn(
            "w-6 h-6 rounded-full bg-[#F7931A] flex items-center justify-center",
            theme === 'bitcoin' ? 'ring-2 ring-gdyup-text ring-offset-1 ring-offset-gdyup-bg-dark' : '',
          )}
        />
      </div>
    </div>
  );
}

// Update the JetShareFormValues interface to include all fields from subforms
export interface JetShareFormValues extends 
  FlightInfoFormValues, 
  JetSelectorFormValues, 
  SeatSplitFormValues,
  Omit<OfferSummaryFormValues, 'share_ratio' | 'price_per_seat'> {
  total_cost: string | number;
  requested_amount: string | number;
  seat_split_configuration?: any;
  share_ratio?: number;
  price_per_seat?: number;
}

// Validation schema for the form
const jetShareOfferSchema = z.object({
  // Flight details
  departure_time: z.date({
    required_error: "Departure date/time is required",
  }),
  departure_location: z.string().min(2, {
    message: "Departure location must be at least 2 characters",
  }),
  arrival_location: z.string().min(2, {
    message: "Arrival location must be at least 2 characters",
  }),
  aircraft_model: z.string().min(2, {
    message: "Aircraft model is required",
  }),
  // Seat configuration
  total_seats: z.number().min(1, {
    message: "At least 1 seat is required",
  }).default(8),
  available_seats: z.number().min(1, {
    message: "At least 1 seat must be available",
  }).default(4),
  // Cost details
  total_cost: z.union([
    z.string().min(1, { message: "Total cost is required" }),
    z.number().int().positive({
      message: "Total cost must be a positive integer",
    })
  ]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
  requested_amount: z.union([
    z.string().min(1, { message: "Requested share amount is required" }),
    z.number().int().positive({
      message: "Requested share amount must be a positive integer",
    })
  ]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
  seat_split_configuration: z.any().optional()
});

// Additional validation to ensure requested amount <= total cost
const enhancedFormSchema = jetShareOfferSchema.refine(
  (data) => {
    // Convert to numbers for comparison
    const requestedAmount = Number(data.requested_amount);
    const totalCost = Number(data.total_cost);
    return !isNaN(requestedAmount) && !isNaN(totalCost) && requestedAmount <= totalCost;
  },
  {
    message: "Requested share amount cannot exceed total flight cost",
    path: ["requested_amount"],
  }
);

// Define the types
type JetShareOfferFormValues = z.infer<typeof enhancedFormSchema>;

interface JetShareOfferProps {
  offerId?: string;
  initialData?: any;
  airports?: any[];
}

export default function JetShareOfferForm({ offerId, initialData, airports = [] }: JetShareOfferProps) {
  const { theme, getThemedTextClasses, getThemedBackgroundClasses, getThemedButtonClasses } = useGdyupTheme();
  const router = useRouter();
  const visualizerRef = useRef<JetSeatVisualizerRef>(null);
  
  // State management
  const [currentSection, setCurrentSection] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedJetData, setSelectedJetData] = useState<any>(null);
  const [splitConfiguration, setSplitConfiguration] = useState<string[]>([]);
  const [shareRatio, setShareRatio] = useState(50); // Default to 50/50
  const [authComplete, setAuthComplete] = useState(false);
  const [showInteriorImage, setShowInteriorImage] = useState(false);
  const [selectedTab, setSelectedTab] = useState('specs');
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const [loadedAirports, setLoadedAirports] = useState<any[]>(airports);
  
  // Initialize the form
  const form = useForm<JetShareFormValues>({
    resolver: zodResolver(enhancedFormSchema),
    defaultValues: {
      total_seats: 8,
      available_seats: 4,
      total_cost: 0,
      requested_amount: 0,
    }
  });
  
  // Track if we're in edit mode
  const isEditMode = !!offerId;
  
  // Total number of sections in the form
  const totalSections = 4;
  
  // Navigation handlers
  const goToNextSection = useCallback(() => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  }, [currentSection, totalSections]);
  
  const goToPrevSection = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  }, [currentSection]);
  
  // Handle split configuration changes from the seat visualizer
  const handleSplitConfigurationChange = useCallback((selectedSeats: string[]) => {
    setSplitConfiguration(selectedSeats);
    
    // Update available seats in the form
    const totalSeats = form.getValues('total_seats') || 0;
    const yourSeats = selectedSeats.length;
    const partnerSeats = totalSeats - yourSeats;
    
    form.setValue('available_seats', partnerSeats, { shouldValidate: true });
    
    // Update the share ratio
    const newRatio = (yourSeats / totalSeats) * 100;
    setShareRatio(newRatio);
  }, [form, setShareRatio]);
  
  // Reset to 50/50 split
  const handleResetTo5050 = useCallback(() => {
    const totalSeats = form.getValues('total_seats') || 0;
    const yourSeats = Math.ceil(totalSeats / 2);
    const partnerSeats = totalSeats - yourSeats;
    
    form.setValue('available_seats', partnerSeats, { shouldValidate: true });
    setShareRatio(50);
    
    // Update the visualizer
    if (visualizerRef.current?.selectSeatsByCount) {
      visualizerRef.current.selectSeatsByCount(yourSeats);
    }
  }, [form, visualizerRef]);
  
  // Clear seat selection
  const handleClearSelection = useCallback(() => {
    const totalSeats = form.getValues('total_seats') || 0;
    
    form.setValue('available_seats', totalSeats, { shouldValidate: true });
    setShareRatio(0);
    
    // Update the visualizer
    if (visualizerRef.current?.selectSeatsByCount) {
      visualizerRef.current.selectSeatsByCount(0);
    }
  }, [form, visualizerRef]);
  
  // Submit the form
  const onSubmit = useCallback(async () => {
    try {
      setIsCreating(true);
      
      // Validate form
      await form.trigger();
      if (!form.formState.isValid) {
        setIsCreating(false);
        return;
      }
      
      const formValues = form.getValues();
      
      console.log('Submitting form with values:', formValues);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      toast({
        title: "Offer Created Successfully!",
        description: "Your flight share offer has been created. You'll be redirected to the dashboard.",
        variant: "default",
      });
      
      // Delay redirect to allow user to see toast
      setTimeout(() => {
        // Redirect after successful submission
        router.push('/gdyup/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsCreating(false);
      
      // Show error toast
      toast({
        title: "Error Creating Offer",
        description: "There was a problem creating your offer. Please try again.",
        variant: "destructive",
      });
    }
  }, [form, router]);
  
  // Setup event listeners for form navigation
  useEffect(() => {
    // Flight Info Form events
    const handleFlightInfoNext = () => {
      console.log('FlightInfo Next event received');
      goToNextSection();
    };
    document.addEventListener('flightinfo-next', handleFlightInfoNext);
    
    // Emergency force-navigate event
    const handleForceNavigate = (event: any) => {
      console.log('Force navigate event received', event.detail);
      if (event.detail && typeof event.detail.section === 'number') {
        console.log(`Forcing navigation to section ${event.detail.section}`);
        setCurrentSection(event.detail.section);
      }
    };
    
    const formElement = document.querySelector('[data-component="JetShareOfferForm"]');
    if (formElement) {
      formElement.addEventListener('force-navigate', handleForceNavigate);
    }
    
    // Jet Selector Form events
    const handleJetSelectorNext = () => {
      console.log('JetSelector Next event received');
      goToNextSection();
    };
    const handleJetSelectorBack = () => {
      console.log('JetSelector Back event received');
      goToPrevSection();
    };
    const handleJetSelectorInteriorToggle = (event: any) => {
      console.log('JetSelector Interior Toggle event received', event.detail);
      if (event.detail && typeof event.detail.show === 'boolean') {
        setShowInteriorImage(event.detail.show);
      }
    };
    const handleJetSelectorTabChange = (event: any) => {
      console.log('JetSelector Tab Change event received', event.detail);
      if (event.detail && event.detail.tab) {
        setSelectedTab(event.detail.tab);
      }
    };
    
    document.addEventListener('jetselector-next', handleJetSelectorNext);
    document.addEventListener('jetselector-back', handleJetSelectorBack);
    document.addEventListener('jetselector-interior-toggle', handleJetSelectorInteriorToggle);
    document.addEventListener('jetselector-tab-change', handleJetSelectorTabChange);
    
    // Seat Split Form events
    const handleSeatSplitNext = () => {
      console.log('SeatSplit Next event received');
      goToNextSection();
    };
    const handleSeatSplitBack = () => {
      console.log('SeatSplit Back event received');
      goToPrevSection();
    };
    const handleSeatSplitRatioChange = (event: any) => {
      console.log('SeatSplit Ratio Change event received', event.detail);
      if (event.detail && typeof event.detail.ratio === 'number') {
        setShareRatio(event.detail.ratio);
      }
    };
    const handleSeatSplitConfigChange = (event: any) => {
      console.log('SeatSplit Config Change event received', event.detail);
      if (event.detail && Array.isArray(event.detail.selectedSeats)) {
        handleSplitConfigurationChange(event.detail.selectedSeats);
      }
    };
    const handleSeatSplitReset = () => {
      console.log('SeatSplit Reset event received');
      handleResetTo5050();
    };
    const handleSeatSplitClear = () => {
      console.log('SeatSplit Clear event received');
      handleClearSelection();
    };
    
    document.addEventListener('seatsplit-next', handleSeatSplitNext);
    document.addEventListener('seatsplit-back', handleSeatSplitBack);
    document.addEventListener('seatsplit-ratio-change', handleSeatSplitRatioChange);
    document.addEventListener('seatsplit-config-change', handleSeatSplitConfigChange);
    document.addEventListener('seatsplit-reset', handleSeatSplitReset);
    document.addEventListener('seatsplit-clear', handleSeatSplitClear);
    
    // Offer Summary Form events
    const handleOfferSummaryBack = () => {
      console.log('OfferSummary Back event received');
      goToPrevSection();
    };
    const handleOfferSummarySubmit = () => {
      console.log('OfferSummary Submit event received');
      onSubmit();
    };
    
    document.addEventListener('offersummary-back', handleOfferSummaryBack);
    document.addEventListener('offersummary-submit', handleOfferSummarySubmit);
    
    // Cleanup function to remove all event listeners
    return () => {
      document.removeEventListener('flightinfo-next', handleFlightInfoNext);
      
      const formElement = document.querySelector('[data-component="JetShareOfferForm"]');
      if (formElement) {
        formElement.removeEventListener('force-navigate', handleForceNavigate);
      }
      
      document.removeEventListener('jetselector-next', handleJetSelectorNext);
      document.removeEventListener('jetselector-back', handleJetSelectorBack);
      document.removeEventListener('jetselector-interior-toggle', handleJetSelectorInteriorToggle);
      document.removeEventListener('jetselector-tab-change', handleJetSelectorTabChange);
      
      document.removeEventListener('seatsplit-next', handleSeatSplitNext);
      document.removeEventListener('seatsplit-back', handleSeatSplitBack);
      document.removeEventListener('seatsplit-ratio-change', handleSeatSplitRatioChange);
      document.removeEventListener('seatsplit-config-change', handleSeatSplitConfigChange);
      document.removeEventListener('seatsplit-reset', handleSeatSplitReset);
      document.removeEventListener('seatsplit-clear', handleSeatSplitClear);
      
      document.removeEventListener('offersummary-back', handleOfferSummaryBack);
      document.removeEventListener('offersummary-submit', handleOfferSummarySubmit);
    };
  }, [
    goToNextSection,
    goToPrevSection,
    setShowInteriorImage,
    setSelectedTab,
    setShareRatio,
    handleSplitConfigurationChange,
    handleResetTo5050,
    handleClearSelection,
    onSubmit
  ]);
  
  // Real authentication check using the auth provider
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        console.log('User authenticated:', user.id);
        setAuthComplete(true);
      } else {
        console.log('No user found, authentication required');
        setAuthComplete(false);
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        setTimeout(() => {
          window.location.href = `/gdyup/auth/login?returnUrl=${returnUrl}`;
        }, 2000);
      }
    }
  }, [user, authLoading]);
  
  // Function to fetch airports using the new API client
  const loadAirports = useCallback(async () => {
    try {
      if (loadedAirports.length > 0) return; // Don't fetch if we already have airports
      
      console.log('[JetShareOfferForm] Loading airports with API client...');
      
      // Use the new API client with automatic fallback
      const { apiClient } = await import('../../utils/api-client');
      const airportsData = await apiClient.getAirportsWithFallback();
      
      console.log(`[JetShareOfferForm] Loaded ${airportsData.length} airports`);
      setLoadedAirports(airportsData);
    } catch (error) {
      console.error('[JetShareOfferForm] Error loading airports:', error);
      
      // If we have airports from props, use those as final fallback
      if (airports && airports.length > 0) {
        console.log(`[JetShareOfferForm] Using ${airports.length} airports from props`);
        setLoadedAirports(airports);
      }
    }
  }, [loadedAirports.length, airports]);

  useEffect(() => {
    loadAirports();
  }, [loadAirports]);
  
  // Load data when editing an existing offer
  useEffect(() => {
    if (isEditMode && initialData) {
      // Populate form with initial data
      Object.entries(initialData).forEach(([key, value]) => {
        if (key === 'departure_time' && value) {
          form.setValue(key as any, new Date(value as string));
        } else {
          (form.setValue as any)(key, value);
        }
      });
      
      // Update the seat ratio based on available seats
      const totalSeats = initialData.total_seats || 8;
      const availableSeats = initialData.available_seats || 4;
      const yourSeats = totalSeats - availableSeats;
      const newRatio = (yourSeats / totalSeats) * 100;
      setShareRatio(newRatio);
      
      // Force update to refresh selectors
      setForceUpdateCounter(prev => prev + 1);
    }
  }, [isEditMode, initialData, form]);
  
  // Update selectedJetData when aircraft_model changes - THIS IS THE CRITICAL FIX
  useEffect(() => {
    const selectedModel = form.watch('aircraft_model');
    const currentJetId = form.watch('jet_id');
    
    console.log(`[aircraft_model change] Model: "${selectedModel}", Current jet_id: ${currentJetId || 'none'}`);
    
    // CRITICAL FIX: Only create mock data if:
    // 1. We have a model name entered
    // 2. We DON'T have a jet_id set (meaning it wasn't selected from dropdown)
    // 3. We don't already have jet data with a matching ID
    if (selectedModel && !currentJetId && !selectedJetData?.jetId) {
      // This effect is only used for mock data creation when a user
      // manually types a model name rather than selecting from the dropdown
      
      console.log(`Creating mock jet data for manually entered model: ${selectedModel}`);
      
      // This mock data is only used if no real jet is selected from the dropdown
      // The real jet data will override this in the jetchange event handler
      setSelectedJetData({
        value: selectedModel,
        model: selectedModel.split(' ').slice(1).join(' '), // Remove manufacturer
        manufacturer: selectedModel.split(' ')[0], // First word is manufacturer
      });
    }
  }, [form.watch('aircraft_model'), form.watch('jet_id'), selectedJetData?.jetId]);
  
  // Event handler for jet change events coming from both selectors
  useEffect(() => {
    const handleJetChange = (event: any) => {
      console.log('[JetChange Event] Received event:', event.detail);
      
      // Destructure all relevant fields from the event
      const { 
        value, 
        jetId,
        id,
        seatCapacity, 
        capacity,
        manufacturer, 
        model,
        tail_number,
        range_nm,
        cruise_speed_kts,
        max_altitude,
        cabin_width,
        cabin_height,
        cabin_length,
        year,
        image_url,
        interior_image_url,
        berths,
        lavatory,
        galley,
        wifi,
        entertainment,
        interior_type,
        has_custom_layout,
        custom_layout,
        home_base_airport
      } = event.detail as any;
      
      // Extract the actual ID, handle potentially different property names
      const actualJetId = jetId || id;
      
      // Determine if we should use a custom layout based on seat count
      const actualCapacity = capacity || seatCapacity || 0;
      const shouldUseCustomLayout = actualCapacity && 
        (actualCapacity > 12 || has_custom_layout);
      
      // CRITICAL CHANGE: Always trust the API's seatCapacity value when available
      // This ensures we use the real jet capacity from the database
      const effectiveCapacity = actualCapacity || selectedJetData?.seatCapacity || 8;
      
      console.log(`[JetChange Event] Using effective capacity: ${effectiveCapacity} (from API: ${capacity || seatCapacity})`);
      
      // Set the selected jet data in the form
      if (actualJetId) {
        // CRITICAL: Set jet_id FIRST before any other fields to prevent mock data generation
        console.log('[JetChange Event] Setting jet_id to:', actualJetId);
        form.setValue('jet_id', actualJetId);
        
        console.log('[JetChange Event] Setting jet data with complete data from API:', event.detail);
        
        // Ensure we have a comprehensive jet data object with all fields
        const completeJetData = {
          ...event.detail,
          // Normalize field names to ensure consistency
          id: actualJetId,
          jetId: actualJetId,
          manufacturer: manufacturer || 'Unknown',
          model: model || 'Model',
          capacity: effectiveCapacity,
          seatCapacity: effectiveCapacity,
          tail_number: tail_number || 'N/A',
          shouldUseCustomLayout,
          // Ensure boolean fields are actually booleans
          berths: !!berths,
          lavatory: !!lavatory,
          galley: !!galley,
          wifi: !!wifi
        };
        
        // Update the state with the complete data
        setSelectedJetData(completeJetData);
        
        // Update the form values with the selected jet
        form.setValue('aircraft_model', value || `${manufacturer || 'Unknown'} ${model || 'Model'}`);
        
        // Update total seats with the capacity from the API
        console.log('[JetChange Event] Setting total_seats to effective capacity:', effectiveCapacity);
        form.setValue('total_seats', effectiveCapacity);
        
        // Ensure the custom_layout is properly saved if available
        if (custom_layout) {
          form.setValue('custom_layout', custom_layout);
        }
      }
    };

    // Add the event listener
    window.addEventListener('jetchange', handleJetChange);
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('jetchange', handleJetChange);
    };
  }, [form, selectedJetData]);
  
  // Render aircraft image paths
  const jetImagePath = '/images/jets/gulfstream/G650.jpg';
  const jetInteriorPath = '/images/jets/interior/interior1.jpg';
  
  // Render section based on current section index
  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <FlightInfoForm
            form={form as unknown as UseFormReturn<FlightInfoFormValues>}
            airports={loadedAirports}
            totalSteps={totalSections}
            currentStep={currentSection}
          />
        );
      case 1:
        return (
          <JetSelectorForm
            form={form as unknown as UseFormReturn<JetSelectorFormValues>}
            totalSteps={totalSections}
            currentStep={currentSection}
            forceUpdateCounter={forceUpdateCounter}
            currentJetData={selectedJetData}
            showInteriorImage={showInteriorImage}
            jetImagePath={jetImagePath}
            jetInteriorPath={jetInteriorPath}
            selectedTab={selectedTab}
          />
        );
      case 2:
        return (
          <SeatSplitForm
            form={form as unknown as UseFormReturn<SeatSplitFormValues>}
            totalSteps={totalSections}
            currentStep={currentSection}
            shareRatio={shareRatio}
            selectedJetId={selectedJetData?.id || 'default'}
            visualizerRef={visualizerRef}
          />
        );
      case 3:
        return (
          <OfferSummaryForm
            form={form as unknown as UseFormReturn<OfferSummaryFormValues>}
            totalSteps={totalSections}
            currentStep={currentSection}
            isSubmitting={isCreating}
            isEditMode={isEditMode}
            editModeMessage={isEditMode ? "You are editing an existing offer. Changes will be saved when you submit." : undefined}
          />
        );
      default:
        return null;
    }
  };
  
  // If not authenticated, show authentication UI
  if (!authComplete) {
    if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <ThemedIcon 
            icon={Loader2} 
            size={48} 
            className="animate-spin mb-4" 
          />
          <h2 className={cn(
            "text-xl font-semibold mb-2 text-center",
            getThemedTextClasses()
          )}>
            Verifying your account...
          </h2>
          <p className={cn(
            "text-center max-w-md mx-auto opacity-70",
            getThemedTextClasses()
          )}>
            Please wait while we check your authentication status
          </p>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <ThemedIcon 
            icon={UserPlus} 
            size={48} 
            className="mb-4" 
          />
          <h2 className={cn(
            "text-xl font-semibold mb-2 text-center",
            getThemedTextClasses()
          )}>
            Authentication Required
          </h2>
          <p className={cn(
            "text-center max-w-md mx-auto opacity-70 mb-6",
            getThemedTextClasses()
          )}>
            You need to be logged in to create flight listings. You'll be redirected to login shortly.
          </p>
          <button
            onClick={() => {
              const returnUrl = encodeURIComponent(window.location.pathname);
              window.location.href = `/gdyup/auth/login?returnUrl=${returnUrl}`;
            }}
            className={cn(
              "px-6 py-3 rounded-lg font-medium transition-colors",
              getThemedButtonClasses('primary')
            )}
          >
            Login Now
          </button>
        </div>
      );
    }
  }
  
  return (
    <div className="flex-1 max-w-screen-md mx-auto" data-component="JetShareOfferForm">
      {/* Dev theme switcher */}
      <ThemeSwitcher />
      
      {/* Main form section */}
      <div className="pb-32">
        {renderCurrentSection()}
      </div>
      
      {/* Main form navigation */}
      <FormNavigation 
        currentStep={currentSection}
        totalSteps={totalSections}
        isFirstStep={currentSection === 0}
        isLastStep={currentSection === totalSections - 1}
        isSubmitting={isCreating}
        nextLabel={currentSection === totalSections - 1 ? 'Create Offer' : 'Next'}
        backLabel="Back"
        submitLabel={isEditMode ? "Update Offer" : "Create Offer"}
        onNext={() => {
          console.log('Main navigation: Next button clicked directly');
          goToNextSection();
        }}
        onBack={() => {
          console.log('Main navigation: Back button clicked directly');
          goToPrevSection();
        }}
        onSubmit={() => {
          console.log('Main navigation: Submit button clicked directly');
          onSubmit();
        }}
      />
    </div>
  );
} 