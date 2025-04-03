'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plane, DollarSign, ArrowRight, Loader2, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addHours } from 'date-fns';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/components/auth-provider';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import AircraftModelSelector from './AircraftModelSelector';
import JetSeatVisualizer, { SplitConfiguration } from './JetSeatVisualizer';
import type { JetSeatVisualizerRef } from './JetSeatVisualizer';

// Define form schema with zod
const formSchema = z.object({
  flight_date: z.date({
    required_error: "Flight date and time is required",
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
  total_seats: z.number().int().min(1, {
    message: "Total seats must be at least 1",
  }),
  available_seats: z.number().int().min(1, {
    message: "Available seats must be at least 1",
  }),
  total_flight_cost: z.union([
    z.string().min(1, { message: "Total flight cost is required" }),
    z.number().int().positive({
      message: "Total flight cost must be a positive integer",
    })
  ]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
  requested_share_amount: z.union([
    z.string().min(1, { message: "Requested share amount is required" }),
    z.number().int().positive({
      message: "Requested share amount must be a positive integer",
    })
  ]).transform(val => typeof val === 'string' ? parseInt(val) || 0 : val),
  seat_split_configuration: z.any().optional()
});

// Additional validation to ensure requested amount <= total cost
const enhancedFormSchema = formSchema.refine(
  (data) => {
    // Convert to numbers for comparison
    const requestedAmount = Number(data.requested_share_amount);
    const totalCost = Number(data.total_flight_cost);
    return !isNaN(requestedAmount) && !isNaN(totalCost) && requestedAmount <= totalCost;
  },
  {
    message: "Requested share amount cannot exceed total flight cost",
    path: ["requested_share_amount"],
  }
);

// Add these autocomplete city/airport constants
const POPULAR_AIRPORTS = [
  "New York (JFK)",
  "Los Angeles (LAX)",
  "Miami (MIA)",
  "Chicago (ORD)",
  "San Francisco (SFO)",
  "Denver (DEN)",
  "Las Vegas (LAS)",
  "Dallas (DFW)",
  "Boston (BOS)",
  "Seattle (SEA)",
  "Atlanta (ATL)",
  "Houston (IAH)",
  "London (LHR)",
  "Paris (CDG)",
  "Tokyo (HND)",
  "Dubai (DXB)",
  "Hong Kong (HKG)",
  "Sydney (SYD)",
  "Singapore (SIN)",
  "Toronto (YYZ)"
];

const POPULAR_AIRCRAFT = [
  "Gulfstream G650",
  "Bombardier Global 7500",
  "Dassault Falcon 8X",
  "Cessna Citation Longitude",
  "Embraer Phenom 300",
  "Pilatus PC-24",
  "Beechcraft King Air 350i",
  "Bombardier Challenger 350",
  "Bombardier Challenger 650",
  "Dassault Falcon 2000LXS",
  "Gulfstream G280",
  "Gulfstream G550"
];

// Add a new interface for aircraft models
interface AircraftModel {
  id: string;
  manufacturer: string;
  model: string;
  display_name: string;
  seat_capacity: number;
  range_nm?: number;
  cruise_speed_kts?: number;
  image_url?: string;
  description?: string;
}

// Add interface for Airport type
interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
}

// First update the component interface to include editOfferId
interface JetShareOfferFormProps {
  airportsList?: Airport[];
  editOfferId?: string | null;
}

// Then update the component signature
export default function JetShareOfferForm({ airportsList = [] as Airport[], editOfferId = null }: JetShareOfferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, loading: authLoading } = useAuth();
  
  // Add state to control autocomplete visibility
  const [departureResults, setDepartureResults] = useState<string[]>([]);
  const [arrivalResults, setArrivalResults] = useState<string[]>([]);
  const [showDepartureResults, setShowDepartureResults] = useState(false);
  const [showArrivalResults, setShowArrivalResults] = useState(false);

  // Add a state to track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Add state for seat visualizer
  const [showSeatVisualizer, setShowSeatVisualizer] = useState(false);
  const [splitConfiguration, setSplitConfiguration] = useState<SplitConfiguration | null>(null);
  const [selectedJetId, setSelectedJetId] = useState<string>('default-jet');
  // Add state for the share ratio (percentage)
  const [shareRatio, setShareRatio] = useState<number>(50);
  
  // Add ref for the visualizer component
  const visualizerRef = useRef<JetSeatVisualizerRef>(null);

  // Check for authentication on load
  useEffect(() => {
    // Wait for auth to complete loading
    if (authLoading) {
      return;
    }
    
    // Auth has loaded, update state
    setIsAuthenticating(false);
    
    // If no authenticated user, redirect to login
    if (!user) {
      console.log('JetShareOfferForm: No authenticated user, redirecting to login');
      toast.error('Please sign in to create a flight share offer');
      
      // Encode the current URL to return after login
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
    } else {
      console.log('JetShareOfferForm: User authenticated, can proceed', user.id);
      
      // Private browsing session handling - enable direct form submission without session validation
      // This bypasses the session check in private browsing scenarios or when cookies are blocked
      
      // Add some state to track if we're working with private browsing or limited cookie scenarios
      // This will allow us to continue anyway if we have a user object but no proper session
      
      let privateMode = false;
      try {
        // Try to detect private browsing mode by testing localStorage access (not 100% reliable)
        localStorage.setItem('__test_private_mode', '1');
        localStorage.removeItem('__test_private_mode');
        
        // If we suspect private browsing due to limited cookies, set a flag
        if (!document.cookie) {
          console.log('JetShareOfferForm: Limited or no cookies available - possible private browsing');
          privateMode = true;
        }
      } catch (e) {
        console.log('JetShareOfferForm: Storage access failed - likely private browsing');
        privateMode = true;
      }
      
      if (privateMode) {
        console.log('JetShareOfferForm: Operating in private browsing compatibility mode');
        // In private mode, we'll rely solely on the user object from auth context
        // No additional session validation to avoid redirect loops
        return;
      }
      
      // Only perform session validation in normal browsing mode where it's expected to work
      const checkSession = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.access_token) {
            console.log('JetShareOfferForm: No valid session token found, trying to refresh...');
            
            // Try to refresh the session before showing an error
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session?.access_token) {
              console.log('JetShareOfferForm: Session refreshed successfully');
              return; // Session refresh worked, no need to redirect
            }
            
            // Only show error after refresh attempt fails
            console.error('JetShareOfferForm: No valid session token found after refresh attempt');
            toast.error('Your session needs to be refreshed. Redirecting to login...', {
              duration: 3000,
              action: {
                label: 'Cancel',
                onClick: () => {
                  console.log('JetShareOfferForm: User canceled redirect - continuing in limited mode');
                  // User chose to continue anyway - we'll try to work with what we have
                }
              }
            });
            
            // Delay the redirect slightly to allow the user to see the toast and potentially cancel
            // This also increases chances of the refresh working in the background
            setTimeout(() => {
              router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
            }, 3000);
          } else {
            console.log('JetShareOfferForm: Valid session token found');
          }
        } catch (err) {
          console.error('Error checking session:', err);
        }
      };
      
      checkSession();
    }
  }, [user, authLoading, router, supabase.auth]);
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof enhancedFormSchema>>({
    resolver: zodResolver(enhancedFormSchema),
    defaultValues: {
      flight_date: addHours(new Date(), 24), // Default to tomorrow
      departure_location: "",
      arrival_location: "",
      aircraft_model: "",
      total_seats: 8, // Default for a typical private jet
      available_seats: 4, // Default to half the seats
      total_flight_cost: 25000, // Default value
      requested_share_amount: 12500, // Default to 50
      seat_split_configuration: null // Default to null
    },
  });
  
  // Watch values for validation
  const totalSeats = form.watch('total_seats');
  const availableSeats = form.watch('available_seats');

  // Validate values when form changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Handle changes to total seats
      if (name === 'total_seats') {
        const total = value.total_seats as number;
        const available = value.available_seats as number;
        if (available > total) {
          form.setValue('available_seats', Math.floor(total / 2));
        }
      }
      
      // Handle changes to requested_share_amount
      if (name === 'requested_share_amount') {
        const amount = value.requested_share_amount as number;
        const totalCost = value.total_flight_cost as number;
        
        // Ensure the requested amount doesn't exceed the total cost
        if (amount > totalCost && totalCost > 0) {
          form.setValue('requested_share_amount', totalCost);
        }
      }
      
      // Handle changes to total_flight_cost
      if (name === 'total_flight_cost') {
        const totalCost = value.total_flight_cost as number;
        const amount = value.requested_share_amount as number;
        
        // Ensure the requested amount doesn't exceed the total cost
        if (amount > totalCost && totalCost > 0) {
          form.setValue('requested_share_amount', totalCost);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Watch total flight cost to calculate the share amount
  const totalFlightCost = form.watch('total_flight_cost');
  const requestedShareAmount = form.watch('requested_share_amount');
  const aircraftModel = form.watch('aircraft_model');
  
  // Calculate share percentage safely
  const sharePercentage = (totalFlightCost && requestedShareAmount && totalFlightCost > 0) 
    ? Math.min(99, Math.max(1, Math.round((Number(requestedShareAmount) / Number(totalFlightCost) * 100))))
    : 50;
  
  // Update share amount when total cost or percentage changes
  const updateShareAmount = (percentage: number) => {
    if (!totalFlightCost || isNaN(Number(totalFlightCost)) || Number(totalFlightCost) <= 0) {
      return;
    }
    
    // Ensure percentage is between 1-99
    const boundedPercentage = Math.max(1, Math.min(99, percentage));
    
    const newAmount = Math.round(Number(totalFlightCost) * (boundedPercentage / 100));
    form.setValue('requested_share_amount', newAmount > 0 ? newAmount : 1);
    
    // Update the state
    setShareRatio(boundedPercentage);
    
    // Also update the visualizer if it exists
    if (visualizerRef.current) {
      visualizerRef.current.updateRatio(boundedPercentage);
    }
    
    console.log(`Updated share amount to ${newAmount} (${boundedPercentage}%)`);
  };
  
  // Add a new useEffect to fetch offer details when in edit mode
  useEffect(() => {
    if (!editOfferId) return;
    
    // Set edit mode flag
    setIsEditMode(true);
    
    const fetchOfferDetails = async () => {
      try {
        // Show loading state
        setIsSubmitting(true);
        
        const response = await fetch(`/api/jetshare/offer?id=${editOfferId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch offer details');
        }
        
        const data = await response.json();
        
        if (!data.offer) {
          throw new Error('Offer not found');
        }
        
        const offer = data.offer;
        
        // Populate form with offer details
        form.reset({
          flight_date: new Date(offer.flight_date),
          departure_location: offer.departure_location,
          arrival_location: offer.arrival_location,
          aircraft_model: offer.aircraft_model || '',
          total_seats: offer.total_seats,
          available_seats: offer.available_seats,
          total_flight_cost: offer.total_flight_cost,
          requested_share_amount: offer.requested_share_amount,
          seat_split_configuration: offer.split_configuration || null
        });
        
        // Set the split configuration if it exists
        if (offer.split_configuration) {
          setSplitConfiguration(offer.split_configuration);
        }
        
        // Generate a pseudo jet id based on the model
        if (offer.aircraft_model) {
          const pseudoJetId = offer.aircraft_model.toLowerCase().replace(/\s+/g, '-');
          setSelectedJetId(pseudoJetId);
        }
        
        toast.success('Offer details loaded successfully');
      } catch (error) {
        console.error('Error fetching offer details:', error);
        toast.error('Failed to load offer details. Please try again.');
        
        // Redirect back to listings if we can't load the offer
        setTimeout(() => {
          router.push('/jetshare/listings');
        }, 2000);
      } finally {
        setIsSubmitting(false);
      }
    };
    
    fetchOfferDetails();
  }, [editOfferId, router, form]);
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof enhancedFormSchema>) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if user is logged in
      if (!user) {
        toast.error('You must be logged in to create an offer');
        return;
      }
      
      // Collect the form data
      const formData = {
        ...values,
        user_id: user.id,
        status: 'open',
        created_at: new Date().toISOString(),
        split_configuration: splitConfiguration
      };
      
      // Endpoint and method depend on whether we're editing or creating
      const endpoint = editOfferId 
        ? `/api/jetshare/updateOffer?id=${editOfferId}` 
        : '/api/jetshare/createOffer';
      
      const method = editOfferId ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save offer');
      }
      
      const data = await response.json();
      
      // Show success message
      toast.success(
        editOfferId
          ? `JetShare offer updated successfully`
          : `JetShare offer created successfully`
      );
      
      // Redirect to the appropriate page
      if (editOfferId) {
        router.push(`/jetshare/offer/${editOfferId}`);
      } else if (data.offer && data.offer.id) {
        router.push(`/jetshare/offer/${data.offer.id}`);
      } else {
        router.push('/jetshare/dashboard?tab=offers');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save offer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add autocomplete handler functions
  const handleDepartureSearch = (value: string) => {
    form.setValue("departure_location", value);
    // Filter airports based on input
    if (value.length > 1) {
      let filtered = [];
      
      // Check if we have airports from API to use
      if (airportsList && airportsList.length > 0) {
        filtered = airportsList.filter(
          airport => {
            const searchLower = value.toLowerCase();
            return (
              airport.code.toLowerCase().includes(searchLower) || 
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower)
            );
          }
        ).map(airport => `${airport.city} (${airport.code})`);
      } else {
        // Fallback to POPULAR_AIRPORTS
        filtered = POPULAR_AIRPORTS.filter(
          airport => airport.toLowerCase().includes(value.toLowerCase())
        );
      }
      
      // Limit results to 10 for better UX
      filtered = filtered.slice(0, 10);
      
      setDepartureResults(filtered);
      setShowDepartureResults(filtered.length > 0);
    } else {
      setDepartureResults([]);
      setShowDepartureResults(false);
    }
  };
  
  const handleArrivalSearch = (value: string) => {
    form.setValue("arrival_location", value);
    // Filter airports based on input
    if (value.length > 1) {
      let filtered = [];
      
      // Check if we have airports from API to use
      if (airportsList && airportsList.length > 0) {
        filtered = airportsList.filter(
          airport => {
            const searchLower = value.toLowerCase();
            return (
              airport.code.toLowerCase().includes(searchLower) || 
              airport.city.toLowerCase().includes(searchLower) ||
              airport.name.toLowerCase().includes(searchLower)
            );
          }
        ).map(airport => `${airport.city} (${airport.code})`);
      } else {
        // Fallback to POPULAR_AIRPORTS
        filtered = POPULAR_AIRPORTS.filter(
          airport => airport.toLowerCase().includes(value.toLowerCase())
        );
      }
      
      // Limit results to 10 for better UX
      filtered = filtered.slice(0, 10);
      
      setArrivalResults(filtered);
      setShowArrivalResults(filtered.length > 0);
    } else {
      setArrivalResults([]);
      setShowArrivalResults(false);
    }
  };
  
  // Function to select from autocomplete results
  const selectDepartureLocation = (location: string) => {
    form.setValue("departure_location", location);
    setShowDepartureResults(false);
  };
  
  const selectArrivalLocation = (location: string) => {
    form.setValue("arrival_location", location);
    setShowArrivalResults(false);
  };
  
  // Add a notification when aircraft model changes
  const notifyModelChange = (model: string, seats: number) => {
    toast.success(
      <div className="flex flex-col">
        <span className="font-medium">{model} selected</span>
        <span className="text-xs">Aircraft has {seats} seats</span>
      </div>,
      { duration: 2000 }
    );
  };

  // Effect to handle seat split when model changes
  useEffect(() => {
    if (aircraftModel) {
      // Generate a pseudo jet id based on the model
      const pseudoJetId = aircraftModel.toLowerCase().replace(/\s+/g, '-');
      setSelectedJetId(pseudoJetId);
      
      // If we're showing the visualizer, reset it to ensure it reflects the new aircraft
      if (showSeatVisualizer && visualizerRef.current) {
        // Add loading notification
        toast.info("Loading aircraft configuration...", { id: "loading-jet-config" });
        
        // Close and reopen to trigger a fresh fetch of the layout
        visualizerRef.current.closeVisualizer();
        
        // Small delay to ensure state updates before reopening
        setTimeout(() => {
          if (visualizerRef.current) {
            visualizerRef.current.openVisualizer();
            
            // Update the visualizer with current ratio
            visualizerRef.current.updateRatio(shareRatio);
            
            // Remove loading notification
            toast.dismiss("loading-jet-config");
          }
        }, 500);
      }
    }
  }, [aircraftModel, showSeatVisualizer, shareRatio]);

  // Handle showing the seat visualizer
  const toggleSeatVisualizer = () => {
    const newVisibility = !showSeatVisualizer;
    setShowSeatVisualizer(newVisibility);
    
    // If showing the visualizer, ensure it's correctly initialized
    if (newVisibility && visualizerRef.current) {
      // Short delay to ensure state updates first
      setTimeout(() => {
        if (visualizerRef.current) {
          // Update the visualizer with current ratio
          visualizerRef.current.updateRatio(shareRatio);
          
          // Also notify the user about the seats configuration
          const totalSeats = form.watch('total_seats');
          if (totalSeats > 0) {
            toast.info(
              <div className="flex flex-col">
                <span className="font-medium">Seat Configuration Ready</span>
                <span className="text-xs">{totalSeats} seats available to configure</span>
              </div>,
              { duration: 3000 }
            );
          }
        }
      }, 300);
    }
  };
  
  // Listen for share percentage changes from the form
  useEffect(() => {
    if (sharePercentage !== shareRatio) {
      setShareRatio(sharePercentage);
      
      // Also update the visualizer if it exists
      if (visualizerRef.current) {
        visualizerRef.current.updateRatio(sharePercentage);
      }
    }
  }, [sharePercentage, shareRatio]);

  // Add debug logging
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[JetShareOfferForm] ${message}`, data || '');
    }
  };

  // Sync visualizer layout info with form
  const syncLayoutWithForm = () => {
    if (visualizerRef.current) {
      try {
        const layoutInfo = visualizerRef.current.getLayoutInfo();
        debugLog('Got layout info', layoutInfo);
        
        // Update total seats if different
        const currentTotalSeats = form.getValues('total_seats');
        if (layoutInfo.totalSeats !== currentTotalSeats) {
          debugLog(`Updating total seats: ${currentTotalSeats} -> ${layoutInfo.totalSeats}`);
          form.setValue('total_seats', layoutInfo.totalSeats);
          
          // Adjust available seats proportionally
          const currentAvailable = form.getValues('available_seats');
          const newAvailable = Math.min(
            layoutInfo.totalSeats,
            Math.round((currentAvailable / currentTotalSeats) * layoutInfo.totalSeats) || Math.floor(layoutInfo.totalSeats / 2)
          );
          debugLog(`Updating available seats: ${currentAvailable} -> ${newAvailable}`);
          form.setValue('available_seats', newAvailable);
          
          // Update the share ratio
          const ratio = shareRatio || 50;
          updateShareAmount(ratio);
          
          toast.info(
            <div className="flex flex-col">
              <span className="font-medium">Layout Updated</span>
              <span className="text-xs">{layoutInfo.totalSeats} seats available ({layoutInfo.rows} rows × {layoutInfo.seatsPerRow} per row)</span>
            </div>,
            { duration: 3000 }
          );
        }
      } catch (error) {
        console.error('Error getting layout info:', error);
      }
    }
  };

  // Add a check for layout info when visualizer is shown
  useEffect(() => {
    if (showSeatVisualizer && visualizerRef.current) {
      // Delay to ensure visualizer is fully loaded
      const timer = setTimeout(() => {
        syncLayoutWithForm();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [showSeatVisualizer]);
  
  // Function to handle seat split configuration changes
  const handleSplitConfigurationChange = (config: SplitConfiguration) => {
    console.log('Visualizer sent new configuration:', config);
    
    setSplitConfiguration(config);
    form.setValue('seat_split_configuration', config);
    
    // Sync layout info whenever the configuration changes
    syncLayoutWithForm();
    
    // Update the share ratio in the form if different
    if (config.splitPercentage !== shareRatio) {
      console.log(`Updating share ratio from ${shareRatio} to ${config.splitPercentage}`);
      setShareRatio(config.splitPercentage);
      updateShareAmount(config.splitPercentage);
    }
  };
  
  // Show loading state while authentication is in progress
  if (isAuthenticating || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Verifying authentication...</p>
      </div>
    );
  }
  
  // Show error state if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 mb-6 rounded-full bg-red-100 text-red-500">
          <UserPlus className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
          You need to be signed in to create a flight share offer. Please sign in or create an account to continue.
        </p>
        <Button
          onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
          className="mb-4"
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/jetshare')}
        >
          Return to JetShare Home
        </Button>
      </div>
    );
  }
  
  // Continue with the normal form render if authenticated
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        {/* Flight Date and Time */}
        <FormField
          control={form.control}
          name="flight_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel htmlFor="flight_date">Flight Date & Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      id="flight_date"
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal w-full md:w-auto",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the date of your flight (future dates only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departure Location with Autocomplete */}
          <FormField
            control={form.control}
            name="departure_location"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel htmlFor="departure_location">Departure Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="departure_location"
                      placeholder="City or airport"
                      className="pl-10"
                      {...field}
                      onChange={(e) => handleDepartureSearch(e.target.value)}
                      onFocus={() => setShowDepartureResults(departureResults.length > 0)}
                      onBlur={() => {
                        // Delay hiding to allow for selection
                        setTimeout(() => setShowDepartureResults(false), 200);
                      }}
                    />
                  </div>
                </FormControl>
                {showDepartureResults && departureResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 mt-1 rounded-md border shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {departureResults.map((location, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onMouseDown={() => selectDepartureLocation(location)}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <FormDescription>
                  Enter the city or airport name for departure
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Arrival Location with Autocomplete */}
          <FormField
            control={form.control}
            name="arrival_location"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel htmlFor="arrival_location">Arrival Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="arrival_location"
                      placeholder="City or airport"
                      className="pl-10"
                      {...field}
                      onChange={(e) => handleArrivalSearch(e.target.value)}
                      onFocus={() => setShowArrivalResults(arrivalResults.length > 0)}
                      onBlur={() => {
                        // Delay hiding to allow for selection
                        setTimeout(() => setShowArrivalResults(false), 200);
                      }}
                    />
                  </div>
                </FormControl>
                {showArrivalResults && arrivalResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white dark:bg-gray-800 mt-1 rounded-md border shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {arrivalResults.map((location, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          onMouseDown={() => selectArrivalLocation(location)}
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <FormDescription>
                  Enter the city or airport name for arrival
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Aircraft Details Section */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Aircraft Details</h2>
          
          {/* Aircraft Model */}
          <FormField
            control={form.control}
            name="aircraft_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="aircraft_model">Aircraft Model</FormLabel>
                <FormControl>
                  <AircraftModelSelector
                    id="aircraft_model"
                    value={field.value}
                    onChange={(value, seatCapacity) => {
                      field.onChange(value);
                      // Update total seats if seat capacity is provided
                      if (seatCapacity) {
                        form.setValue('total_seats', seatCapacity);
                        form.setValue('available_seats', Math.floor(seatCapacity / 2));
                        
                        // Notify the user about the selected model
                        notifyModelChange(value, seatCapacity);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Total Seats and Available Seats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="total_seats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="total_seats">Total Seats</FormLabel>
                  <FormControl>
                    <Input
                      id="total_seats"
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(value);
                        
                        // Update available seats to not exceed total
                        const currentAvailable = form.getValues('available_seats');
                        if (currentAvailable > value) {
                          form.setValue('available_seats', value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="available_seats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="available_seats">Available Seats</FormLabel>
                  <FormControl>
                    <Input
                      id="available_seats"
                      type="number"
                      min={1}
                      max={totalSeats || 999}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Seat Configuration Section */}
        <div className="space-y-4 mb-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Seat Split Configuration</h2>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={toggleSeatVisualizer}
            >
              {showSeatVisualizer ? 'Hide Visualizer' : 'Configure Seats'}
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define how you want to split the seats for sharing. This helps travelers understand exactly which seats they're booking.
          </p>
          
          {/* Seat Split Ratio Slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <FormLabel htmlFor="share-ratio" className="text-sm font-medium">
                Share Ratio
              </FormLabel>
              <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full text-sm font-medium">
                {shareRatio}% / {100 - shareRatio}%
              </div>
            </div>
            
            <div className="flex justify-between mb-2">
              <div className="bg-blue-100 dark:bg-blue-900 h-2 rounded-l-full" style={{ width: `${shareRatio}%` }}></div>
              <div className="bg-amber-100 dark:bg-amber-900 h-2 rounded-r-full" style={{ width: `${100 - shareRatio}%` }}></div>
            </div>
            
            <Slider 
              id="share-ratio"
              defaultValue={[50]} 
              max={99} 
              min={1} 
              step={1} 
              value={[shareRatio]}
              onValueChange={(values) => {
                console.log(`Slider changed to ${values[0]}%`);
                updateShareAmount(values[0]);
              }}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>You: 1%</span>
              <span>50/50</span>
              <span>You: 99%</span>
            </div>
          </div>
          
          {splitConfiguration && !showSeatVisualizer && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p>Split: <span className="font-medium">{splitConfiguration.splitOrientation === 'horizontal' ? 'Front/Back' : 'Left/Right'}</span></p>
              <p>Ratio: <span className="font-medium">{splitConfiguration.splitRatio}</span></p>
              <p>
                Allocated seats: <span className="font-medium">
                  {splitConfiguration.splitOrientation === 'horizontal' 
                    ? `${splitConfiguration.allocatedSeats.front?.length || 0} front, ${splitConfiguration.allocatedSeats.back?.length || 0} back` 
                    : `${splitConfiguration.allocatedSeats.left?.length || 0} left, ${splitConfiguration.allocatedSeats.right?.length || 0} right`}
                </span>
              </p>
            </div>
          )}
          
          {showSeatVisualizer && (
            <div className="mt-4">
              <JetSeatVisualizer 
                ref={visualizerRef}
                jetId={selectedJetId}
                onChange={handleSplitConfigurationChange}
                initialSplit={splitConfiguration || undefined}
                totalSeats={totalSeats}
                seatRatio={shareRatio}
                onRatioChange={(ratio) => updateShareAmount(ratio)}
              />
            </div>
          )}
        </div>
        
        {/* Cost details section */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Cost Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="total_flight_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="total_flight_cost">Total Flight Cost ($)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="total_flight_cost"
                        type="number"
                        min={1}
                        className="pl-10"
                        {...field}
                        onChange={(e) => {
                          field.onChange(parseInt(e.target.value) || 0);
                          
                          // Update share amount to maintain percentage
                          if (e.target.value) {
                            updateShareAmount(shareRatio);
                          }
                        }}
                      />
                    </div>
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
                  <FormLabel htmlFor="requested_share_amount">Requested Share Amount ($)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="requested_share_amount"
                        type="number"
                        min={1}
                        max={totalFlightCost || 999999999}
                        className="pl-10"
                        {...field}
                        onChange={(e) => {
                          const requestedAmount = parseInt(e.target.value) || 0;
                          field.onChange(requestedAmount);
                          
                          // Update share ratio if total cost is available
                          if (totalFlightCost > 0) {
                            const newRatio = Math.min(99, Math.max(1, Math.round((requestedAmount / totalFlightCost) * 100)));
                            setShareRatio(newRatio);
                            
                            // Also update visualizer
                            if (visualizerRef.current) {
                              visualizerRef.current.updateRatio(newRatio);
                            }
                          }
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/jetshare/dashboard?tab=offers')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isAuthenticating}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editOfferId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{editOfferId ? 'Update Offer' : 'Create Offer'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 