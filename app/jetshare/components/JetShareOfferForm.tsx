'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plane, DollarSign, ArrowRight, Loader2, Users, UserPlus, ChevronRight, ChevronLeft, Users2, Armchair, Sofa, Bath, Info, ListChecks, CheckCircle, Utensils, Crown, Tv, Wifi, Smartphone, Map } from 'lucide-react';
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
import { format, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
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
import JetSelector from './JetSelector';
import JetSeatVisualizer, { SeatConfiguration } from './JetSeatVisualizer';
import type { JetSeatVisualizerRef } from './JetSeatVisualizer';
import { FormDateTimePicker } from "@/components/ui/form-date-time-picker";
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TimePickerDemo from "@/components/ui/time-picker-demo";

// Define form schema with zod
const formSchema = z.object({
  departure_time: z.date({
    required_error: "Departure date and time is required",
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
  // Add jet_id field
  jet_id: z.string().optional(),
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

// Add this helper function after imports
const handleJetApiError = (jetId: string) => {
  console.log(`Using fallback layout for jetId: ${jetId}`);
  // Return a default seat layout when API call fails
  return {
    rows: 4,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 12
  };
};

// Add this helper function for API retries
const withRetry = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Retry attempt ${retries + 1}/${maxRetries} failed:`, lastError.message);
      retries++;
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Add these helper functions right after imports and existing helper functions
const getJetImage = (jetId: string, model: string): string => {
  // Try model-specific path first
  const modelPath = model.toLowerCase().replace(/\s+/g, '-');
  return `/images/jets/${modelPath}.jpg`;
};

// Helper function for interior images
const getJetInteriorImage = (jetId: string, model: string): string => {
  // Try model-specific interior path first
  const modelPath = model.toLowerCase().replace(/\s+/g, '-');
  return `/images/jets/interior/${modelPath}-interior.jpg`;
};

// Add this helper function to calculate optimal seat layout
const calculateOptimalLayout = (totalSeats: number): { rows: number, seatsPerRow: number } => {
  // Define standard layouts for common seat configurations
  const standardLayouts: Record<number, { rows: number, seatsPerRow: number }> = {
    4: { rows: 2, seatsPerRow: 2 },  // Small jets
    6: { rows: 2, seatsPerRow: 3 },
    8: { rows: 2, seatsPerRow: 4 },  // Common executive layout
    9: { rows: 3, seatsPerRow: 3 },
    10: { rows: 3, seatsPerRow: 4 }, // G280 style (2+1+1) x 3
    12: { rows: 3, seatsPerRow: 4 }, // Standard midsize layout
    14: { rows: 4, seatsPerRow: 4 }, // Large midsize
    16: { rows: 4, seatsPerRow: 4 }, // Super midsize 
    19: { rows: 5, seatsPerRow: 4 }, // Large cabin jets
    22: { rows: 6, seatsPerRow: 4 }, // Ultra long range
    24: { rows: 6, seatsPerRow: 4 }  // VIP airliners
  };

  // Use standard layout if available
  if (standardLayouts[totalSeats]) {
    return standardLayouts[totalSeats];
  }

  // Otherwise calculate dynamically
  // Try to keep a more rectangular layout with the majority of seats along the width
  if (totalSeats <= 4) {
    return { rows: 2, seatsPerRow: Math.ceil(totalSeats / 2) };
  } else if (totalSeats <= 12) {
    return { rows: 3, seatsPerRow: Math.ceil(totalSeats / 3) };
  } else if (totalSeats <= 16) {
    return { rows: 4, seatsPerRow: Math.ceil(totalSeats / 4) };
  } else {
    // For larger configurations, try to keep width reasonable
    return { rows: Math.ceil(totalSeats / 4), seatsPerRow: 4 };
  }
};

// Move the helper function after the interface definition, adding this change:
// Define a compatibility interface for the old split configuration format
interface OldSplitConfiguration {
  jetId: string;
  splitOrientation: 'horizontal' | 'vertical';
  splitRatio: string;
  splitPercentage: number;
  allocatedSeats: {
    front?: string[];
    back?: string[];
    left?: string[];
    right?: string[];
  };
}

// Add this helper function after the interface definition
const getTotalAllocatedSeats = (config: OldSplitConfiguration | null): number => {
  if (!config || !config.allocatedSeats) return 0;
  
  const frontSeats = config.allocatedSeats.front?.length || 0;
  const backSeats = config.allocatedSeats.back?.length || 0;
  const leftSeats = config.allocatedSeats.left?.length || 0;
  const rightSeats = config.allocatedSeats.right?.length || 0;
  
  return frontSeats + backSeats + leftSeats + rightSeats;
};

// Then update the component signature
export default function JetShareOfferForm({ airportsList = [] as Airport[], editOfferId = null }: JetShareOfferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, loading: authLoading } = useAuth();
  
  // Add state for section navigation
  const [activeSection, setActiveSection] = useState(0);
  const swiperRef = useRef<any>(null);
  const sections = ["Flight Details", "Aircraft Selection", "Seat Configuration", "Cost Details"];
  const totalSections = sections.length;
  
  // Add state to disable swipe during slider interaction
  const [isSliderActive, setIsSliderActive] = useState(false);
  
  // Add state to track if Swiper is fully initialized
  const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);
  
  // Debug function to log navigation issues
  const debugNavigation = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Navigation] ${message}`, data || '');
    }
  };
  
  // Function to navigate between sections - Update to forcefully navigate with Swiper
  const goToSection = (index: number) => {
    if (index >= 0 && index < totalSections) {
      setActiveSection(index);
      if (swiperRef.current) {
        swiperRef.current.slideTo(index);
      }
    }
  };
  
  // Function to go to next section - ensure it works even if swiperRef isn't ready
  const goToNextSection = () => {
    if (activeSection < totalSections - 1) {
      const nextIndex = activeSection + 1;
      debugNavigation(`Attempting to navigate to next section: ${nextIndex}`);
      
      // Update state first
      setActiveSection(nextIndex);
      
      // Then navigate using the swiper if available
      if (swiperRef.current) {
        try {
          swiperRef.current.slideTo(nextIndex);
          debugNavigation(`Swiper navigated to: ${nextIndex}`);
        } catch (err) {
          console.error('Error navigating with swiper:', err);
          // Fallback - force a re-render to show the correct section
          setActiveSection(nextIndex);
        }
      } else {
        debugNavigation('Swiper ref not available, using state-only navigation');
      }
    }
  };
  
  // Function to go to previous section - ensure it works even if swiperRef isn't ready
  const goToPrevSection = () => {
    if (activeSection > 0) {
      const prevIndex = activeSection - 1;
      debugNavigation(`Attempting to navigate to previous section: ${prevIndex}`);
      
      // Update state first
      setActiveSection(prevIndex);
      
      // Then navigate using the swiper if available
      if (swiperRef.current) {
        try {
          swiperRef.current.slideTo(prevIndex);
          debugNavigation(`Swiper navigated to: ${prevIndex}`);
        } catch (err) {
          console.error('Error navigating with swiper:', err);
          // Fallback - force a re-render to show the correct section
          setActiveSection(prevIndex);
        }
      } else {
        debugNavigation('Swiper ref not available, using state-only navigation');
      }
    }
  };
  
  // Add detection for mobile screens
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Add state to control autocomplete visibility
  const [departureResults, setDepartureResults] = useState<string[]>([]);
  const [arrivalResults, setArrivalResults] = useState<string[]>([]);
  const [showDepartureResults, setShowDepartureResults] = useState(false);
  const [showArrivalResults, setShowArrivalResults] = useState(false);

  // Add a state to track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Add state for seat visualizer
  const [showSeatVisualizer, setShowSeatVisualizer] = useState(true);
  const [splitConfiguration, setSplitConfiguration] = useState<OldSplitConfiguration | null>(null);
  const [selectedJetId, setSelectedJetId] = useState<string>('default');
  // Add state for the share ratio (percentage)
  const [shareRatio, setShareRatio] = useState<number>(50);
  
  // Add ref for the visualizer component
  const visualizerRef = useRef<JetSeatVisualizerRef>(null);

  // Add jet image paths state
  const [jetImagePath, setJetImagePath] = useState<string>('/images/jets/gulfstream-g550.jpg');
  const [jetInteriorPath, setJetInteriorPath] = useState<string>('/images/jets/interior/interior1.jpg');
  const [showInteriorImage, setShowInteriorImage] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("specs");
  
  // Debug logging for image states
  useEffect(() => {
    console.log("JetShareOfferForm: Image state initialized", {
      jetImagePath,
      jetInteriorPath,
      showInteriorImage,
      selectedTab
    });
  }, [jetImagePath, jetInteriorPath, showInteriorImage, selectedTab]);
  
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
      departure_time: addHours(new Date(), 24), // Default to tomorrow
      departure_location: "",
      arrival_location: "",
      aircraft_model: "",
      jet_id: "", // Add default for jet_id
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
  const updateShareAmount = useCallback((percentage: number) => {
    if (!totalFlightCost || isNaN(Number(totalFlightCost)) || Number(totalFlightCost) <= 0) {
      return;
    }
    
    // Ensure percentage is between 1-99
    const boundedPercentage = Math.max(1, Math.min(99, percentage));
    
    const newAmount = Math.round(Number(totalFlightCost) * (boundedPercentage / 100));
    form.setValue('requested_share_amount', newAmount > 0 ? newAmount : 1, {
      shouldValidate: true,
      shouldDirty: true,
    });
    
    // Update the state only if it's different
    if (shareRatio !== boundedPercentage) {
      setShareRatio(boundedPercentage);
      console.log(`Updated share amount to ${newAmount} (${boundedPercentage}%)`);
    }
  }, [totalFlightCost, form, shareRatio]);
  
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
          departure_time: offer.departure_time ? new Date(offer.departure_time) : new Date(offer.flight_date),
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
          setSplitConfiguration(offer.split_configuration as OldSplitConfiguration);
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
    debugNavigation('Form submission started', values);
    
    try {
      // Check if user is logged in
      if (!user) {
        toast.error('You must be logged in to create an offer');
        return;
      }
      
      // Extract date part from departure_time for flight_date compatibility
      const departureDate = new Date(values.departure_time);
      debugNavigation('Extracted departure date', departureDate);
      
      // Collect the form data
      const formData = {
        ...values,
        // Add flight_date for backward compatibility
        flight_date: departureDate.toISOString().split('T')[0],
        user_id: user.id,
        status: 'open',
        created_at: new Date().toISOString(),
        split_configuration: splitConfiguration
      };
      
      debugNavigation('Form data prepared for submission', formData);
      
      // Endpoint and method depend on whether we're editing or creating
      const endpoint = editOfferId 
        ? `/api/jetshare/updateOffer?id=${editOfferId}` 
        : '/api/jetshare/createOffer';
      
      const method = editOfferId ? 'PUT' : 'POST';
      
      debugNavigation(`Submitting to endpoint: ${endpoint} with method: ${method}`);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        debugNavigation('API error response', errorData);
        throw new Error(errorData.message || `Failed to save offer - ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      debugNavigation('API success response', data);
      
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
      
      // Create a diagnostic error message for debugging
      let diagnosticInfo = '';
      try {
        diagnosticInfo = JSON.stringify({
          user: user ? { id: user.id } : 'No user',
          formState: form.formState.isValid ? 'Valid' : 'Invalid',
          activeSection,
          isSwiperInitialized,
          splitConfig: splitConfiguration ? 'Present' : 'Missing'
        });
      } catch (e) {
        diagnosticInfo = 'Error creating diagnostic info';
      }
      
      debugNavigation('Form submission error diagnostics', diagnosticInfo);
      
      // Show error toast with more helpful information
      toast.error(
        <div>
          <p className="font-medium">{error instanceof Error ? error.message : 'Failed to save offer'}</p>
          <p className="text-xs mt-1 opacity-80">Please try again or contact support if the issue persists.</p>
        </div>,
        { duration: 5000 }
      );
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
  const notifyModelChange = (model: string, seats: number, jetId?: string) => {
    form.setValue('aircraft_model', model, { shouldValidate: true });
    
    // Only update seats if we have a valid number
    if (!isNaN(seats) && seats > 0) {
      form.setValue('total_seats', seats, { shouldValidate: true });
      
      // Automatically adjust available seats
      const currentAvailable = form.getValues('available_seats');
      if (currentAvailable > seats) {
        form.setValue('available_seats', Math.floor(seats / 2), { shouldValidate: true });
      }
    }
    
    // Set the jet_id if provided
    if (jetId) {
      console.log(`Setting jet_id to ${jetId}`);
      form.setValue('jet_id', jetId, { shouldValidate: true });
      
      // If we have a valid jet ID, update the selectedJetId state for visualizer
      setSelectedJetId(jetId);
    }
  };

  // Update the form to only collect what's needed on each step and improve styling
  useEffect(() => {
    const handleJetChange = (event: any) => {
      const { value, seatCapacity, jetId, image_url } = event.detail;
      console.log('JetSelector change event received:', { value, seatCapacity, jetId, image_url });
      
      // Update form with selected aircraft model
      form.setValue('aircraft_model', value);
      
      // Update jet_id if provided
      if (jetId) {
        form.setValue('jet_id', jetId);
        setSelectedJetId(jetId);
        
        // If image_url is provided directly, use it
        if (image_url) {
          console.log('Setting exterior image path from API:', image_url);
          setJetImagePath(image_url);
        } else {
          console.log('No image_url provided, fetching from database for jet_id:', jetId);
          
          // Fetch jet details from database to get image
          fetch(`/api/jetshare/getJet?jet_id=${jetId}`)
            .then(response => response.json())
            .then(data => {
              if (data.jet && data.jet.image_url) {
                console.log('Found jet image in database:', data.jet.image_url);
                setJetImagePath(data.jet.image_url);
              } else {
                // Fallback to model-based path if no image in database
                const modelForPath = value.toLowerCase().replace(/\s+/g, '-');
                console.log(`No image in DB, using fallback: /images/jets/${modelForPath}.jpg`);
                setJetImagePath(`/images/jets/${modelForPath}.jpg`);
              }
            })
            .catch(err => {
              console.error('Error fetching jet details:', err);
              // Fallback on error
              const modelForPath = value.toLowerCase().replace(/\s+/g, '-');
              setJetImagePath(`/images/jets/${modelForPath}.jpg`);
            });
        }
        
        // Fetch seat information and layout from our dedicated API
        console.log('Fetching seat information for jet_id:', jetId);
        fetch(`/api/jetshare/getJetSeats?jet_id=${jetId}`)
          .then(response => response.json())
          .then((data: any) => {
            if (data.success) {
              console.log('Fetched seat data:', data);
              
              // Update form with accurate seat count
              form.setValue('total_seats', data.seats);
              
              // Update available seats to 50% by default
              form.setValue('available_seats', Math.floor(data.seats / 2));
              
              // Store the optimal layout with skip positions
              if (data.layout) {
                // Extract skip positions from the layout or use empty array if not provided
                const skipPositions = data.layout.seatMap?.skipPositions || [];
                
                console.log(`Setting optimal layout: ${data.layout.rows} rows × ${data.layout.seatsPerRow} columns for ${data.seats} seats, skipping positions:`, skipPositions);
                
                // Use a correctly typed object to set the state
                setOptimalLayout({
                  rows: data.layout.rows,
                  seatsPerRow: data.layout.seatsPerRow,
                  totalSeats: data.seats,
                  skipPositions: skipPositions
                });
              }
              
              // Show user feedback
              toast.success(
                <div className="flex flex-col">
                  <span className="font-medium">{value} selected</span>
                  <span className="text-xs">Total capacity: {data.seats} seats</span>
                </div>
              );
            } else {
              // Fallback to seatCapacity from event
              const validSeatCapacity = typeof seatCapacity === 'number' && seatCapacity > 0 
                ? seatCapacity 
                : 10;
              
              form.setValue('total_seats', validSeatCapacity);
              form.setValue('available_seats', Math.floor(validSeatCapacity / 2));
              
              // Calculate optimal layout with empty skipPositions
              const layoutInfo = calculateOptimalLayout(validSeatCapacity);
              setOptimalLayout({ 
                rows: layoutInfo.rows, 
                seatsPerRow: layoutInfo.seatsPerRow, 
                totalSeats: validSeatCapacity,
                skipPositions: [] 
              });
              
              console.log(`Using fallback layout: ${layoutInfo.rows} rows × ${layoutInfo.seatsPerRow} columns for ${validSeatCapacity} seats`);
              
              // Show user feedback
              toast.success(
                <div className="flex flex-col">
                  <span className="font-medium">{value} selected</span>
                  <span className="text-xs">Total capacity: {validSeatCapacity} seats</span>
                </div>
              );
            }
            
            // Set up seat visualization if available
            if (showSeatVisualizer && visualizerRef.current) {
              // Add loading notification
              toast.info("Loading aircraft configuration...", { id: "loading-jet-config" });
              
              // Reset and prepare visualizer
              visualizerRef.current.closeVisualizer();
              setSplitConfiguration(null);
              
              // Small delay to ensure state updates before reopening
              setTimeout(() => {
                if (visualizerRef.current) {
                  try {
                    visualizerRef.current.openVisualizer();
                    
                    // Force synchronization with the form's total seats value
                    const currentTotalSeats = form.getValues('total_seats');
                    
                    // Notify about seat configuration being ready
                    toast.success(`Seat layout ready - ${currentTotalSeats} total seats available`);
                  } catch (error) {
                    console.error("Failed to initialize visualizer:", error);
                    toast.error("Could not load seat configuration. Using default settings.");
                  } finally {
                    toast.dismiss("loading-jet-config");
                  }
                }
              }, 800);
            }
          })
          .catch((err: Error) => {
            console.error('Error fetching jet seat data:', err);
            
            // Fallback to seatCapacity from event
            const validSeatCapacity = typeof seatCapacity === 'number' && seatCapacity > 0 
              ? seatCapacity 
              : 10;
            
            form.setValue('total_seats', validSeatCapacity);
            form.setValue('available_seats', Math.floor(validSeatCapacity / 2));
            
            // Calculate optimal layout with empty skipPositions
            const layoutInfo = calculateOptimalLayout(validSeatCapacity);
            setOptimalLayout({ 
              rows: layoutInfo.rows, 
              seatsPerRow: layoutInfo.seatsPerRow, 
              totalSeats: validSeatCapacity,
              skipPositions: [] 
            });
          });
        
        // Fetch interior image from jet_interiors table
        console.log('Fetching interior image for jet_id:', jetId);
        fetch(`/api/jetshare/getJetInterior?jet_id=${jetId}`)
          .then(response => response.json())
          .then(data => {
            if (data.interior && data.interior.interior_image_url) {
              console.log('Found interior image in database:', data.interior.interior_image_url);
              setJetInteriorPath(data.interior.interior_image_url);
            } else {
              // Fallback to generic interior image
              console.log('No interior image found in DB, using fallback');
              setJetInteriorPath(`/images/jets/interior/interior1.jpg`);
            }
          })
          .catch(err => {
            console.error('Error fetching jet interior:', err);
            // Use fallback on error
            setJetInteriorPath('/images/jets/interior/interior1.jpg');
          });
      } else {
        // No jet_id - use fallback values
        const validSeatCapacity = typeof seatCapacity === 'number' && seatCapacity > 0 
          ? seatCapacity 
          : 10;
          
        form.setValue('total_seats', validSeatCapacity);
        form.setValue('available_seats', Math.floor(validSeatCapacity / 2));
        
        // Calculate optimal layout with empty skipPositions
        const layoutInfo = calculateOptimalLayout(validSeatCapacity);
        setOptimalLayout({ 
          rows: layoutInfo.rows, 
          seatsPerRow: layoutInfo.seatsPerRow, 
          totalSeats: validSeatCapacity,
          skipPositions: [] 
        });
      }
    };
    
    // Add and remove event listeners
    window.addEventListener('jetchange', handleJetChange);
    return () => window.removeEventListener('jetchange', handleJetChange);
  }, [form, showSeatVisualizer]);
  
  // Update the useEffect for watching total_seats changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      // Handle changes to total seats
      if (name === 'total_seats' && showSeatVisualizer && visualizerRef.current) {
        const newTotalSeats = value.total_seats as number;
        
        if (newTotalSeats > 0) {
          // Calculate optimal layout for this seat count
          const { rows, seatsPerRow } = calculateOptimalLayout(newTotalSeats);
          console.log(`Total seats changed: Calculated optimal layout: ${rows} rows × ${seatsPerRow} columns for ${newTotalSeats} seats`);
          
          // Update the optimal layout state
          setOptimalLayout({ rows, seatsPerRow, totalSeats: newTotalSeats });
          
          // Small delay to ensure state updates
          setTimeout(() => {
            if (visualizerRef.current) {
              // Reset the visualizer with the new total seats
              visualizerRef.current.closeVisualizer();
              
              // Reset any existing split configuration
              setSplitConfiguration(null);
              
              // Small delay to ensure state updates
              setTimeout(() => {
                if (visualizerRef.current) {
                  visualizerRef.current.openVisualizer();
                  toast.info(
                    <div className="flex flex-col">
                      <span className="font-medium">Seat Configuration Updated</span>
                      <span className="text-xs">{newTotalSeats} seats available to configure</span>
                    </div>,
                    { duration: 2000 }
                  );
                }
              }, 300);
            }
          }, 100);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, showSeatVisualizer]);
  
  // Add state for optimal layout storage
  const [optimalLayout, setOptimalLayout] = useState<{
    rows: number, 
    seatsPerRow: number, 
    totalSeats: number,
    skipPositions?: number[][]
  } | null>(null);
  
  // Handle showing the seat visualizer
  const toggleSeatVisualizer = () => {
    const newVisibility = !showSeatVisualizer;
    setShowSeatVisualizer(newVisibility);
    
    // If showing the visualizer, ensure it's correctly initialized
    if (newVisibility && visualizerRef.current) {
      // Get the current total seats from the form
      const currentTotalSeats = form.getValues('total_seats');
      
      // Reset the visualizer if needed
      if (currentTotalSeats > 0 && visualizerRef.current) {
        // Short delay to ensure state updates first
        setTimeout(() => {
          if (visualizerRef.current) {
            // Also notify the user about the seats configuration
            toast.info(
              <div className="flex flex-col">
                <span className="font-medium">Seat Configuration Ready</span>
                <span className="text-xs">{currentTotalSeats} seats available to configure</span>
              </div>,
              { duration: 3000 }
            );
          }
        }, 300);
      }
    }
  };
  
  // Listen for share percentage changes from the form
  useEffect(() => {
    if (sharePercentage !== shareRatio) {
      setShareRatio(sharePercentage);
    }
  }, [sharePercentage, shareRatio]);

  // Sync visualizer layout info with form
  const syncLayoutWithForm = () => {
    const formValues = form.getValues();
    const jet_id = formValues.jet_id || selectedJetId || 'default';
    
    const configuration: SeatConfiguration = {
      jet_id, // Update to use jet_id
      selectedSeats: [],
      totalSeats: formValues.total_seats,
      totalSelected: 0,
      selectionPercentage: 0
    };
    
    if (visualizerRef.current) {
      visualizerRef.current.selectSeats([]);
    }
    
    return configuration;
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
  
  // Function to convert from SeatConfiguration to OldSplitConfiguration
  const convertToOldFormat = (seatConfig: SeatConfiguration): OldSplitConfiguration => {
    const horizontal = seatConfig.selectedSeats.length > 0;
    // Determine if seats are selected from the front or back
    const frontSeats = seatConfig.selectedSeats.filter(seat => 
      seat.startsWith('A') || seat.startsWith('B')
    );
    const backSeats = seatConfig.selectedSeats.filter(seat => 
      !frontSeats.includes(seat)
    );
    
    return {
      jetId: seatConfig.jet_id, // Update to use seatConfig.jet_id
      splitOrientation: horizontal ? 'horizontal' : 'vertical',
      splitRatio: `${seatConfig.selectionPercentage}/${100 - seatConfig.selectionPercentage}`,
      splitPercentage: seatConfig.selectionPercentage,
      allocatedSeats: {
        front: frontSeats,
        back: backSeats
      }
    };
  };

  // Function to convert from OldSplitConfiguration to SeatConfiguration
  const convertToNewFormat = (oldConfig: OldSplitConfiguration): SeatConfiguration => {
    // Combine allocated seats from front, back, left, right
    const allSeats = [
      ...(oldConfig.allocatedSeats.front || []),
      ...(oldConfig.allocatedSeats.back || []),
      ...(oldConfig.allocatedSeats.left || []),
      ...(oldConfig.allocatedSeats.right || [])
    ];
    
    return {
      jet_id: oldConfig.jetId, // Use oldConfig.jetId as jet_id
      selectedSeats: allSeats,
      totalSeats: form.getValues('total_seats'),
      totalSelected: allSeats.length,
      selectionPercentage: oldConfig.splitPercentage || 50
    };
  };

  // Add a fix for JetSeatVisualizer to handle API errors
  const handleSplitConfigurationChange = (config: SeatConfiguration) => {
    console.log('Visualizer sent new configuration:', config);
    
    // Convert the new format to the old format for backward compatibility
    const oldFormatConfig = convertToOldFormat(config);
    
    setSplitConfiguration(oldFormatConfig);
    form.setValue('seat_split_configuration', oldFormatConfig);
    
    // Update the share ratio based on the seat selection percentage
    const newRatio = config.selectionPercentage > 0 ? config.selectionPercentage : shareRatio;
    
    if (newRatio !== shareRatio) {
      console.log(`Updating share ratio from ${shareRatio} to ${newRatio}`);
      setShareRatio(newRatio);
      
      // Update the form's requested share amount based on the new ratio
      updateShareAmount(newRatio);
      
      // Update the slider UI to reflect the new ratio
      const slider = document.getElementById('share-ratio');
      if (slider) {
        // Attempt to programmatically update the slider
        try {
          const event = new Event('input', { bubbles: true });
          Object.defineProperty(event, 'target', { value: slider });
          slider.dispatchEvent(event);
        } catch (error) {
          console.error('Error updating slider:', error);
        }
      }
    }
  };
  
  // Function to update seat selection based on ratio
  const updateSeatSelectionByRatio = (ratio: number) => {
    if (!visualizerRef.current || !totalSeats) return;

    // Get layout info from visualizer
    const layoutInfo = visualizerRef.current.getLayoutInfo();
    if (!layoutInfo || !layoutInfo.totalSeats) return;

    // Calculate how many seats should be selected based on ratio
    const totalSeatsCount = layoutInfo.totalSeats;
    const targetSeatCount = Math.max(0, Math.min(
      totalSeatsCount, 
      Math.round((ratio / 100) * totalSeatsCount)
    ));

    // Get all possible seat IDs
    const allSeatIds: string[] = [];
    for (let row = 0; row < layoutInfo.rows; row++) {
      for (let col = 0; col < layoutInfo.seatsPerRow; col++) {
        const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
        allSeatIds.push(`${rowLetter}${col + 1}`);
      }
    }

    // Take the first N seats (could be improved to select specific sections)
    const seatsToSelect = allSeatIds.slice(0, targetSeatCount);
    
    // Update the visualizer
    visualizerRef.current.selectSeats(seatsToSelect);
    
    // Log what happened
    console.log(`Updated selection to ${seatsToSelect.length} seats based on ratio ${ratio}%`);
  };
  
  // Fix the seat visualization initialization by adding initial configuration
  const initialSeatConfig: SeatConfiguration = {
    jet_id: selectedJetId,
    selectedSeats: [],
    totalSeats: form.getValues('total_seats'),
    totalSelected: 0,
    selectionPercentage: shareRatio
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative bg-gray-900 dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden dark">
        {/* Current Section Label with path-style heading */}
        <div className="px-4 pt-3 pb-2 sticky top-0 z-10 bg-gray-800 text-white border-b border-gray-700">
          <div className="flex items-center text-sm text-gray-400">
            <span className="text-amber-500 font-medium">Create Offer</span>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-600" />
            <span className="font-medium text-white">{sections[activeSection]}</span>
        </div>
        </div>
        
        {/* Swipeable Sections */}
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          spaceBetween={0}
          slidesPerView={1}
          onSlideChange={(swiper) => {
            debugNavigation(`Slide changed to: ${swiper.activeIndex}`);
            setActiveSection(swiper.activeIndex);
          }}
          onSwiper={(swiper) => {
            debugNavigation("Swiper initialized", swiper);
            swiperRef.current = swiper;
            setIsSwiperInitialized(true);
          }}
          threshold={10}
          resistance={true}
          resistanceRatio={0.85}
          keyboard={{ enabled: true }}
          className="mb-16"
          allowTouchMove={!isSliderActive}
          touchStartPreventDefault={false}
          touchReleaseOnEdges={true}
          preventInteractionOnTransition={isSliderActive}
          noSwipingClass="no-swiper-interaction"
          watchOverflow={true}
          simulateTouch={true}
          style={{ height: 'calc(100vh - 180px)' }}
        >
          {/* Section 1: Flight Details */}
          <SwiperSlide className="h-full">
            <div className="p-4 space-y-4 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              {/* Enhanced Departure Date and Time with better visuals */}
              <div className="mb-6 p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Plane className="w-5 h-5 mr-2 text-blue-400" />
                  Flight Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="departure_time"
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-white">Departure Date & Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal h-14 bg-gray-900/70 hover:bg-gray-800 border-gray-700 text-white w-full",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                {field.value ? (
                                  format(field.value, "PPP 'at' p")
                                ) : (
                                  <span>Select departure date & time</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date() || date > new Date(2100, 0, 1)
                              }
                              initialFocus
                            />
                            <div className="p-3 border-t border-border">
                              <TimePickerDemo
                                date={field.value}
                                onChange={(newDate) => {
                                  const updatedDate = new Date(field.value);
                                  updatedDate.setHours(newDate.getHours());
                                  updatedDate.setMinutes(newDate.getMinutes());
                                  field.onChange(updatedDate);
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="departure_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Departure Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Los Angeles (LAX)" 
                            {...field}
                            className="bg-gray-900/70 border-gray-700 text-white h-14" 
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
                        <FormLabel className="text-white">Arrival Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. New York (JFK)" 
                            {...field}
                            className="bg-gray-900/70 border-gray-700 text-white h-14" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Route Visualization - Fixed and Enhanced */}
              {form.watch('departure_location') && form.watch('arrival_location') && (
                <div className="relative h-28 my-6 overflow-hidden bg-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-inner">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-500 via-amber-500 to-amber-500 relative">
                      <div className="absolute -top-2 left-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-gray-800 shadow-lg shadow-blue-500/50 animate-pulse"></div>
                      <div className="absolute -top-2 right-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-gray-800 shadow-lg shadow-amber-500/50 animate-pulse"></div>
                      
                      {/* Animated plane along the route */}
                      <div className="absolute -top-3 left-1/3 transform -translate-x-1/2 animate-pulse">
                        <Plane className="h-6 w-6 text-white transform rotate-45" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute left-0 top-1/3 transform -translate-y-1/2 text-sm text-blue-300 ml-4 font-medium">
                    {form.watch('departure_location') && typeof form.watch('departure_location') === 'string' 
                      ? form.watch('departure_location').split(' ')[0] 
                      : ''}
                  </div>
                  
                  <div className="absolute right-0 top-1/3 transform -translate-y-1/2 text-sm text-amber-300 mr-4 font-medium">
                    {form.watch('arrival_location') && typeof form.watch('arrival_location') === 'string'
                      ? form.watch('arrival_location').split(' ')[0]
                      : ''}
                  </div>

                  {/* City visualization */}
                  <div className="absolute bottom-0 left-0 w-1/3 h-10">
                    <div className="absolute bottom-0 left-4 w-2 h-4 bg-blue-500/40 rounded-t-sm"></div>
                    <div className="absolute bottom-0 left-8 w-2 h-6 bg-blue-500/60 rounded-t-sm"></div>
                    <div className="absolute bottom-0 left-12 w-2 h-8 bg-blue-500/80 rounded-t-sm"></div>
                    <div className="absolute bottom-0 left-16 w-2 h-5 bg-blue-500/50 rounded-t-sm"></div>
                  </div>

                  <div className="absolute bottom-0 right-0 w-1/3 h-10">
                    <div className="absolute bottom-0 right-4 w-2 h-5 bg-amber-500/40 rounded-t-sm"></div>
                    <div className="absolute bottom-0 right-8 w-2 h-7 bg-amber-500/60 rounded-t-sm"></div>
                    <div className="absolute bottom-0 right-12 w-2 h-9 bg-amber-500/80 rounded-t-sm"></div>
                    <div className="absolute bottom-0 right-16 w-2 h-6 bg-amber-500/50 rounded-t-sm"></div>
                  </div>
                </div>
              )}
            </div>
          </SwiperSlide>

          {/* Section 2: Aircraft Selection - Now before seat configuration */}
          <SwiperSlide className="h-full">
            <div className="p-4 space-y-4 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              {/* Aircraft Model - Enhanced */}
              <div className="mb-6 p-4 bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2 text-amber-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><path d="M22 7H2"></path><path d="M7 12h7"></path><path d="M7 9h4"></path><path d="M7 15h4"></path></svg>
                  Aircraft Selection
                </h2>

                {/* Aircraft model selector */}
                <FormField
                  control={form.control}
                  name="aircraft_model"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel className="text-white">
                        <span>Aircraft</span>
                        {(() => {
                          const jetId = form.getValues('jet_id');
                          return jetId && typeof jetId === 'string' && jetId.length > 0 ? (
                            <Badge className="ml-2 bg-blue-500/30 border border-blue-500/40 text-blue-200">
                              ID: {jetId.substring(0, 8)}
                            </Badge>
                          ) : null;
                        })()}
                      </FormLabel>
                      <FormControl>
                        <JetSelector
                          value={field.value}
                          className="w-full aircraft-model-field"
                        />
                      </FormControl>
                      <FormMessage />
                      {/* Hide any custom input that might appear but shouldn't */}
                      <style jsx global>{`
                        .aircraft-model-field + input {
                          display: none !important;
                        }
                      `}</style>
                    </FormItem>
                  )}
                />

                {/* Display selected jet information more prominently with detailed specs */}
                {Boolean(form.getValues('aircraft_model') || form.getValues('jet_id')) && (
                  <div className="bg-gray-900/90 rounded-lg overflow-hidden border border-gray-700/50">
                    {/* Large jet image at top */}
                    <div className="relative w-full h-56 bg-gray-900 border-b border-gray-700/80 overflow-hidden">
                      {/* Simple image switcher - no fancy carousel */}
                      {!showInteriorImage ? (
                        /* Exterior image - shown when specs tab is active */
                        <div className="w-full h-full">
                          <img 
                            src={jetImagePath || "/images/jets/gulfstream-g550.jpg"}
                            alt={form.getValues('aircraft_model') || "Jet exterior"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Error loading exterior image:", e.currentTarget.src);
                              e.currentTarget.src = "/images/jets/gulfstream-g550.jpg";
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-black/50 text-white border-gray-600 backdrop-blur-sm">
                              Exterior
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        /* Interior image - shown when interior or amenities tab is active */
                        <div className="w-full h-full">
                          <img 
                            src={jetInteriorPath || "/images/jets/interior/interior1.jpg"}
                            alt={`${form.getValues('aircraft_model') || "Jet"} Interior`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error("Error loading interior image:", e.currentTarget.src);
                              e.currentTarget.src = "/images/jets/interior/interior1.jpg";
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-black/50 text-white border-gray-600 backdrop-blur-sm">
                              Interior
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
                      
                      {/* Aircraft name overlay with badge */}
                      <div className="absolute bottom-0 left-0 p-4 flex flex-col">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-2xl text-white">{form.getValues('aircraft_model')}</h3>
                          <Badge className="bg-amber-500/90 text-amber-50 border-0">
                            {form.getValues('jet_id')?.substring(0, 6) || 'N867JS'}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-blue-900/50 border-blue-500/50 text-blue-100 font-semibold">
                            <span className="text-lg mr-1.5">{form.getValues('total_seats') || 10}</span> seats
                          </Badge>
                          {form.getValues('jet_id') && (
                            <Badge variant="outline" className="ml-2 bg-blue-900/50 border-blue-500/50 text-blue-100">
                              <span className="text-sm">ID: {form.getValues('jet_id')?.substring(0, 6)}</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Jet details with tabs for different categories of information */}
                    <div className="p-0">
                      <Tabs defaultValue="specs" className="w-full" value={selectedTab} onValueChange={(value) => {
                        // Set the selected tab
                        setSelectedTab(value);
                        
                        // Change the displayed image based on the selected tab
                        if (value === "interior" || value === "amenities") {
                          setShowInteriorImage(true);
                        } else {
                          setShowInteriorImage(false);
                        }
                        
                        console.log(`Tab changed to ${value}, showInteriorImage: ${value === "interior" || value === "amenities"}`);
                      }}>
                        <TabsList className="w-full grid grid-cols-3 bg-gray-800/90 border-b border-gray-700/50 rounded-none h-12">
                          <TabsTrigger value="specs" className="data-[state=active]:bg-gray-700/60 rounded-none">Specifications</TabsTrigger>
                          <TabsTrigger value="amenities" className="data-[state=active]:bg-gray-700/60 rounded-none">Amenities</TabsTrigger>
                          <TabsTrigger value="interior" className="data-[state=active]:bg-gray-700/60 rounded-none">Interior</TabsTrigger>
                        </TabsList>
                        
                        {/* Specifications Tab - Enhanced for better luxury feel */}
                        <TabsContent value="specs" className="p-4 bg-gray-800/30">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Range</span>
                              <span className="text-base font-bold text-white">3,600 nm</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Cruise Speed</span>
                              <span className="text-base font-bold text-white">459 kts</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Max Altitude</span>
                              <span className="text-base font-bold text-white">45,000 ft</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Cabin Width</span>
                              <span className="text-base font-bold text-white">7.3 ft</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Cabin Height</span>
                              <span className="text-base font-bold text-white">6.3 ft</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Cabin Length</span>
                              <span className="text-base font-bold text-white">25.8 ft</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Year</span>
                              <span className="text-base font-bold text-white">2020</span>
                            </div>
                            <div className="flex flex-col space-y-1 border-l-2 border-blue-500/30 pl-3">
                              <span className="text-xs text-blue-300 font-medium uppercase tracking-wider">Registration</span>
                              <span className="text-base font-bold text-white">N867JS</span>
                            </div>
                          </div>
                        </TabsContent>
                        
                        {/* Amenities Tab - Redesigned to match specifications format */}
                        <TabsContent value="amenities" className="p-4 bg-gray-800/30">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                  <path d="M9 10V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"></path>
                                  <rect x="5" y="14" width="14" height="8" rx="1"></rect>
                                  <path d="M8 18h.01"></path>
                                  <path d="M16 18h.01"></path>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Wi-Fi</span>
                                <span className="text-xs text-gray-400">High-speed satellite</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                  <path d="M21 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"></path>
                                  <path d="M6 9h12"></path>
                                  <path d="M12 9v12"></path>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Catering</span>
                                <span className="text-xs text-gray-400">Premium service</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                  <path d="M4 4h16v12H4z"></path>
                                  <path d="M4 12h16"></path>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Entertainment</span>
                                <span className="text-xs text-gray-400">HD displays</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Power Outlets</span>
                                <span className="text-xs text-gray-400">At every seat</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                  <path d="M4 11a9 9 0 0 1 9 9"></path>
                                  <path d="M4 4a16 16 0 0 1 16 16"></path>
                                  <circle cx="5" cy="19" r="1"></circle>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Satellite Phone</span>
                                <span className="text-xs text-gray-400">Global connectivity</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                  <rect x="4" y="4" width="16" height="16" rx="1"></rect>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">Climate Control</span>
                                <span className="text-xs text-gray-400">Individual settings</span>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        {/* Interior Tab - Streamlined version with no amenities section */}
                        <TabsContent value="interior" className="p-0 bg-gradient-to-b from-gray-800/70 to-gray-900/90">
                          <div className="p-3">
                            {/* Sleek Header with Interior Type */}
                            <div className="flex justify-between items-center mb-3 bg-gray-800/60 rounded-lg p-2 border border-gray-700/30">
                              <div className="flex items-center">
                                <Crown className="w-4 h-4 text-amber-400 mr-2" />
                                <p className="font-medium text-white">Executive Interior</p>
                              </div>
                              <Badge variant="outline" className="bg-blue-900/20 text-blue-300 border-blue-900/30">
                                Premium
                              </Badge>
                            </div>
                            
                            {/* Ultra-Compact Interior Features Grid - 3×2 */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {/* Row 1 */}
                              <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                                <Users2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                <p className="text-base font-semibold text-white">{form.getValues('total_seats') || 10}</p>
                                <p className="text-[10px] text-gray-400">Seats</p>
                              </div>
                              
                              <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                                <Bath className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                <p className="text-base font-semibold text-white">Private</p>
                                <p className="text-[10px] text-gray-400">Lavatory</p>
                              </div>
                              
                              <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                                <Utensils className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                                <p className="text-base font-semibold text-white">Full</p>
                                <p className="text-[10px] text-gray-400">Galley</p>
                              </div>
                              
                              {/* Row 2 */}
                              <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                                <Tv className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                <p className="text-base font-semibold text-white">HD</p>
                                <p className="text-[10px] text-gray-400">Displays</p>
                              </div>
                              
                              <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                                <Armchair className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                <p className="text-base font-semibold text-white">Luxury</p>
                                <p className="text-[10px] text-gray-400">Seating</p>
                              </div>
                              
                              <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                                <Wifi className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                                <p className="text-base font-semibold text-white">High</p>
                                <p className="text-[10px] text-gray-400">Speed WiFi</p>
                              </div>
                            </div>
                            
                            {/* Interior Info Card - Integrated */}
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                              <div className="flex items-start mb-2">
                                <Info className="w-4 h-4 text-blue-400 mr-2 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-white mb-1">Premium Interior Package</p>
                                  <p className="text-xs text-gray-300 leading-relaxed">Enhanced comfort with spacious cabin layout. Designed for maximum productivity and relaxation during flight with high-end finishes and advanced cabin controls.</p>
                                </div>
                              </div>
                              
                              {/* Cabin Dimensions */}
                              <div className="flex justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700/30">
                                <span>Height: <span className="text-white">6.3 ft</span></span>
                                <span>Width: <span className="text-white">7.3 ft</span></span>
                                <span>Length: <span className="text-white">25.8 ft</span></span>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      {/* Hidden form fields to store seat data */}
                      <input 
                        type="hidden" 
                        name="total_seats" 
                        id="total_seats_hidden" 
                        value={form.getValues('total_seats')} 
                      />
                      <input 
                        type="hidden" 
                        name="available_seats" 
                        id="available_seats_hidden" 
                        value={form.getValues('available_seats')} 
                      />
                    </div>
                  </div>
                )}
                
                {/* Slim route visualization at bottom */}
                <div className="mt-4 h-12 relative bg-gray-800/40 rounded-lg border border-gray-700/40 overflow-hidden">
                  {form.watch('departure_location') && form.watch('arrival_location') && (
                    <>
                      {/* Route line */}
                      <div className="absolute inset-0 flex items-center justify-center px-8">
                        <div className="w-full h-[1px] bg-gradient-to-r from-blue-500 to-amber-500 relative">
                          {/* Animated plane along the route */}
                          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 animate-pulse">
                            <Plane className="h-4 w-4 text-white transform rotate-45" />
                          </div>
                          
                          {/* Departure dot */}
                          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-blue-500 border border-gray-900 shadow-lg"></div>
                          
                          {/* Arrival dot */}
                          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-500 border border-gray-900 shadow-lg"></div>
                        </div>
                      </div>
                      
                      {/* City labels */}
                      <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none">
                        <div className="text-xs font-medium text-blue-400">
                          {form.watch('departure_location') && typeof form.watch('departure_location') === 'string' 
                            ? form.watch('departure_location').split(' ')[0] 
                            : ''}
                        </div>
                        <div className="text-xs font-medium text-amber-400">
                          {form.watch('arrival_location') && typeof form.watch('arrival_location') === 'string'
                            ? form.watch('arrival_location').split(' ')[0]
                            : ''}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* Section 3: Seat Configuration - with updated references to ensure correct seat count */}
          <SwiperSlide className="h-full">
            <div className="p-3 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              {/* Replace form fields with jet info display */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-700/50 mb-3">
                {/* Remove the header with Seat Configuration text */}
                
                {/* Jet info display instead of editable fields - remove tail number entirely */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-b from-gray-900/90 to-gray-900/70 rounded-lg p-2 border border-gray-700/50 overflow-hidden relative">
                    {/* Subtle premium accent */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-amber-500"></div>
                    
                    <div className="pl-2">
                      <div className="text-xs text-blue-300/90 uppercase tracking-wider font-medium">Aircraft</div>
                      <div className="mt-0.5">
                        <div className="flex items-center">
                          <Plane className="w-3.5 h-3.5 text-amber-400 transform -rotate-45 mr-1.5" />
                          <span className="text-sm font-semibold text-white">{form.getValues('aircraft_model') || 'No aircraft selected'}</span>
                        </div>
                        
                        {/* Removed tail number */}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-b from-gray-900/90 to-gray-900/70 rounded-lg p-2 border border-gray-700/50 relative overflow-hidden">
                    {/* Premium accent for luxury feel */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                    
                    <div className="pl-2">
                      <div className="text-xs text-blue-300/90 uppercase tracking-wider font-medium">Capacity</div>
                      <div className="flex items-center mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mr-2">
                          <Users2 className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <span className="text-base font-semibold text-white">{form.getValues('total_seats') || 0}</span>
                        <span className="text-xs text-gray-400 ml-1">seats</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Compact summary cards showing split allocation - moved up to replace seat preview */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-900/20">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Your seats</span>
                    <span className="text-blue-400 font-medium">{shareRatio}%</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-300">
                    {Math.round((shareRatio / 100) * form.getValues('total_seats'))}
                    <span className="text-xs text-gray-400 ml-1">seats</span>
                  </div>
                </div>
                
                <div className="bg-amber-900/20 rounded-lg p-2 border border-amber-900/20">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Partner's seats</span>
                    <span className="text-amber-400 font-medium">{100 - shareRatio}%</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-300">
                    {form.getValues('total_seats') - Math.round((shareRatio / 100) * form.getValues('total_seats'))}
                    <span className="text-xs text-gray-400 ml-1">seats</span>
                  </div>
                </div>
              </div>
              
              {/* Streamlined seat visualizer with integrated slider and controls to reduce vertical space */}
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl border border-gray-700/50 mb-3">
                <div className="p-2 bg-gray-800/80 border-b border-gray-700/50 flex items-center">
                  {/* Seat legend in header where "Select Seat Allocation" was */}
                  <div className="flex items-center justify-around text-xs">
                    <div className="flex items-center mr-3">
                      <div className="w-4 h-4 rounded-sm bg-blue-600 border border-blue-400 mr-1.5 opacity-80"></div>
                      <span className="text-blue-300 font-medium">Selected</span>
                    </div>
                    <div className="flex items-center mr-3">
                      <div className="w-4 h-4 rounded-sm bg-gray-700 border border-gray-600 mr-1.5 opacity-80"></div>
                      <span className="text-gray-300 font-medium">Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-sm bg-gray-800 border border-gray-700 mr-1.5 opacity-50"></div>
                      <span className="text-gray-400 font-medium">Unavailable</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-1">
                  <JetSeatVisualizer 
                    ref={visualizerRef}
                    jet_id={selectedJetId}
                    totalSeats={form.getValues('total_seats')}
                    onChange={handleSplitConfigurationChange}
                    initialSelection={initialSeatConfig}
                    readOnly={false}
                    className="mb-1"
                    onError={(err) => {
                      console.error('Visualizer error:', err);
                      setShowSeatVisualizer(false);
                    }}
                    showControls={false} // Hide default controls for cleaner UI
                    showLegend={false} // Hide the built-in legend since we have our own in the header
                    showSummary={false} // Hide the top-right selection summary
                    customLayout={optimalLayout ? {
                      rows: optimalLayout.rows,
                      seatsPerRow: optimalLayout.seatsPerRow,
                      layoutType: 'custom',
                      totalSeats: optimalLayout.totalSeats,
                      seatMap: {
                        skipPositions: optimalLayout.skipPositions || []
                      }
                    } : undefined}
                    forceExactLayout={true} // Force the visualizer to use exactly the seats we specify
                  />
                </div>
                
                {/* Selection status display - fixed to ensure visibility and not covered by visualizer */}
                <div className="p-2 border-t border-gray-700/50 bg-gray-800/80 flex justify-between items-center text-xs text-gray-400">
                  <div>
                    <span className="text-blue-300 font-medium">
                      {(() => {
                        const frontSeats = splitConfiguration?.allocatedSeats?.front?.length ?? 0;
                        const backSeats = splitConfiguration?.allocatedSeats?.back?.length ?? 0;
                        return frontSeats + backSeats;
                      })()}
                    </span> of {form.getValues('total_seats')} selected
                  </div>
                  <div className="text-xs">
                    <span className="text-blue-300 font-medium">{shareRatio}%</span> selected
                  </div>
                </div>
              </div>
              
              {/* Slider moved below visualization - optimized for space efficiency */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-1">
                  <FormLabel htmlFor="share-ratio" className="flex items-center text-xs font-medium text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-1">
                      <path d="M8 3H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h1" />
                      <path d="M16 3h1a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-1" />
                      <path d="M12 2v20" />
                    </svg>
                    Share Ratio
                  </FormLabel>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-semibold shadow-md text-white">
                    {shareRatio}% / {100 - shareRatio}%
                  </div>
                </div>
                
                {/* Premium visualization bar */}
                <div className="h-2 rounded-full bg-gray-700 p-0.5 border border-gray-600 shadow-inner mb-1.5 relative overflow-hidden">
                  <div className="flex h-full rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-l-full transition-all duration-300 ease-out shadow-md"
                      style={{ width: `${shareRatio}%` }}
                    />
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-r-full transition-all duration-300 ease-out shadow-md"
                      style={{ width: `${100 - shareRatio}%` }}
                    />
                  </div>
                  
                  {/* Split indicator line */}
                  <div 
                    className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-white dark:bg-gray-200 shadow-lg z-10 transition-all duration-300 ease-out"
                    style={{ left: `calc(${shareRatio}% - 1px)` }}
                  />
                </div>
                
                <Slider 
                  id="share-ratio"
                  defaultValue={[50]} 
                  max={99} 
                  min={1} 
                  step={1} 
                  value={[shareRatio]}
                  onValueChange={(values) => {
                    const newRatio = values[0];
                    console.log(`Slider changed to ${newRatio}%`);
                    updateShareAmount(newRatio);
                    
                    // Also update available_seats when ratio changes
                    const totalSeatsVal = form.getValues('total_seats');
                    const newAvailableSeats = Math.max(1, Math.round((newRatio / 100) * totalSeatsVal));
                    form.setValue('available_seats', newAvailableSeats, { shouldValidate: true });
                    
                    if (visualizerRef.current && showSeatVisualizer) {
                      updateSeatSelectionByRatio(newRatio);
                    }
                  }}
                  onValueCommit={() => {
                    setIsSliderActive(false);
                  }}
                  className="mt-1"
                  onMouseDown={() => setIsSliderActive(true)}
                  onMouseUp={() => setIsSliderActive(false)}
                  onTouchStart={() => setIsSliderActive(true)}
                  onTouchEnd={() => setIsSliderActive(false)}
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1 font-medium">
                  <span>You pay more</span>
                  <span>50/50</span>
                  <span>They pay more</span>
                </div>
                
                {/* Quick action buttons at bottom - Integrated into the same card */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/50 text-gray-300 border-gray-700 h-7 text-xs"
                    onClick={() => {
                      if (visualizerRef.current) {
                        visualizerRef.current.selectSeats([]);
                        
                        // Reset available seats to 0 when clearing
                        form.setValue('available_seats', 0, { shouldValidate: true });
                      }
                    }}
                  >
                    Clear Selection
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-gray-800/50 text-gray-300 border-gray-700 h-7 text-xs"
                    onClick={() => {
                      // Reset to default 50/50 split
                      setShareRatio(50);
                      updateShareAmount(50);
                      
                      // Update available seats to 50% of total
                      const totalSeatsVal = form.getValues('total_seats');
                      form.setValue('available_seats', Math.floor(totalSeatsVal / 2), { shouldValidate: true });
                      
                      if (visualizerRef.current) {
                        updateSeatSelectionByRatio(50);
                      }
                    }}
                  >
                    Reset to 50/50
                  </Button>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* Section 4: Cost Details with enhanced styling */}
          <SwiperSlide className="h-full">
            <div className="p-4 space-y-4 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              {/* Add form validation status at the top of the final page */}
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-700/50 mb-3">
                <div className="flex flex-col space-y-2">
                  <h3 className="font-medium text-white flex items-center">
                    <ListChecks className="h-4 w-4 mr-2 text-amber-500" />
                    Submission Checklist
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-1 text-sm mt-1">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-4 h-4 rounded-full mr-2 flex items-center justify-center",
                        form.getValues('departure_location') && form.getValues('arrival_location')
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}>
                        {form.getValues('departure_location') && form.getValues('arrival_location')
                          ? <CheckCircle className="w-3 h-3" />
                          : <Info className="w-3 h-3" />
                        }
                      </div>
                      <span className={form.getValues('departure_location') && form.getValues('arrival_location')
                          ? "text-green-300"
                          : "text-gray-400"
                      }>
                        Flight route is complete
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={cn(
                        "w-4 h-4 rounded-full mr-2 flex items-center justify-center",
                        form.getValues('aircraft_model')
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}>
                        {form.getValues('aircraft_model')
                          ? <CheckCircle className="w-3 h-3" />
                          : <Info className="w-3 h-3" />
                        }
                      </div>
                      <span className={form.getValues('aircraft_model')
                          ? "text-green-300"
                          : "text-gray-400"
                      }>
                        Aircraft is selected
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={cn(
                        "w-4 h-4 rounded-full mr-2 flex items-center justify-center",
                        getTotalAllocatedSeats(splitConfiguration) > 0
                          ? "bg-green-500/20 text-green-500"
                          : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {getTotalAllocatedSeats(splitConfiguration) > 0
                          ? <CheckCircle className="w-3 h-3" />
                          : <Info className="w-3 h-3" />
                        }
                      </div>
                      <span className={getTotalAllocatedSeats(splitConfiguration) > 0
                          ? "text-green-300"
                          : "text-yellow-300"
                      }>
                        Seat configuration is set
                        {getTotalAllocatedSeats(splitConfiguration) === 0 && " (optional)"}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={cn(
                        "w-4 h-4 rounded-full mr-2 flex items-center justify-center",
                        totalFlightCost > 0 && requestedShareAmount > 0
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}>
                        {totalFlightCost > 0 && requestedShareAmount > 0
                          ? <CheckCircle className="w-3 h-3" />
                          : <Info className="w-3 h-3" />
                        }
                      </div>
                      <span className={totalFlightCost > 0 && requestedShareAmount > 0
                          ? "text-green-300"
                          : "text-gray-400"
                      }>
                        Cost details are complete
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Total Flight Cost with enhanced styling */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-700/50">
                  <FormField
                    control={form.control}
                    name="total_flight_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="total_flight_cost" className="flex items-center text-gray-200 mb-2">
                          <DollarSign className="h-5 w-5 mr-2 text-amber-500" />
                          <span className="font-medium">Total Flight Cost ($)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="total_flight_cost"
                              type="number"
                              min={1}
                              className="pl-3 min-h-[44px] bg-gray-700/70 border-gray-600 focus:ring-amber-500 focus:border-amber-500 rounded-lg text-white"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                                
                                if (e.target.value) {
                                  updateShareAmount(shareRatio);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 mt-2" />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Requested Share Amount with enhanced styling */}
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-700/50">
                  <FormField
                    control={form.control}
                    name="requested_share_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="requested_share_amount" className="flex items-center text-gray-200 mb-2">
                          <DollarSign className="h-5 w-5 mr-2 text-amber-500" />
                          <span className="font-medium">Requested Share Amount ($)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="requested_share_amount"
                              type="number"
                              min={1}
                              max={totalFlightCost || 999999999}
                              className="pl-3 min-h-[44px] bg-gray-700/70 border-gray-600 focus:ring-amber-500 focus:border-amber-500 rounded-lg text-white"
                              {...field}
                              onChange={(e) => {
                                const requestedAmount = parseInt(e.target.value) || 0;
                                field.onChange(requestedAmount);
                                
                                if (totalFlightCost > 0) {
                                  const newRatio = Math.min(99, Math.max(1, Math.round((requestedAmount / totalFlightCost) * 100)));
                                  setShareRatio(newRatio);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 mt-2" />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Enhanced Summary with visual representation */}
                <div className="mt-6 overflow-hidden rounded-xl bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 shadow-xl">
                  <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-3">
                    <h3 className="font-bold text-base">Flight Share Offer Summary</h3>
                  </div>
                  <div className="bg-gray-800/80 px-4 py-3 space-y-3 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Flight Date:</span>
                      <span className="font-medium text-white text-sm">{form.getValues('departure_time') ? format(form.getValues('departure_time'), "MMM d, yyyy h:mm a") : "Not set"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Route:</span>
                      <span className="font-medium text-white text-sm">{form.getValues('departure_location') || "Not set"} → {form.getValues('arrival_location') || "Not set"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Aircraft:</span>
                      <span className="font-medium text-white text-sm">{form.getValues('aircraft_model') || "Not set"}</span>
                    </div>
                    
                    {/* Visual share ratio indicator */}
                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Share Ratio:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-700 overflow-hidden flex">
                            <div className="bg-blue-600 h-full" style={{ width: `${shareRatio}%` }}></div>
                            <div className="bg-amber-500 h-full" style={{ width: `${100 - shareRatio}%` }}></div>
                          </div>
                          <span className="font-medium text-white text-sm">{shareRatio}% / {100 - shareRatio}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cost breakdown with enhanced styling */}
                    <div className="mt-4 bg-gray-900/50 rounded-lg p-3 border border-gray-800/80">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-300 text-sm">Total Flight Cost:</span>
                        <span className="font-bold text-white">${totalFlightCost || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-400 text-sm">You Pay:</span>
                        <span className="font-bold text-blue-300">${totalFlightCost ? totalFlightCost - requestedShareAmount : 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-amber-400 text-sm">Sharer Pays:</span>
                        <span className="font-bold text-amber-300">${requestedShareAmount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add a new final submission review section */}
                <div className="mt-6 overflow-hidden rounded-xl bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 shadow-xl">
                  <div className="bg-gradient-to-r from-green-900 to-green-800 text-white px-4 py-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <h3 className="font-bold text-base">Ready to Submit</h3>
                  </div>
                  <div className="bg-gray-800/80 px-4 py-3 shadow-inner">
                    <p className="text-gray-300 text-sm mb-3">
                      Your JetShare offer is ready to submit. Once published, it will appear in the marketplace
                      where other members can see it and request to join your flight.
                    </p>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Seat Configuration:</span>
                        <Badge className="bg-blue-900/50 text-blue-200 border-blue-800/50">
                          {splitConfiguration 
                            ? `${getTotalAllocatedSeats(splitConfiguration)} seats selected` 
                            : 'Default configuration'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Available to Book:</span>
                        <Badge className="bg-amber-900/50 text-amber-200 border-amber-800/50">
                          {form.getValues('available_seats')} seats
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Offer Status:</span>
                        <Badge className="bg-green-900/50 text-green-200 border-green-800/50">
                          Open
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-5 bg-blue-900/20 rounded-lg p-3 border border-blue-900/30">
                      <p className="text-blue-300 text-xs">
                        Click the Submit button below to publish your offer to the JetShare marketplace.
                        You can always edit or cancel your offer from your dashboard later.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
        
        {/* Move navigation indicators to the bottom of the form */}
        {/* Sticky Navigation Footer with integrated section indicators */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between shadow-lg z-20">
          {activeSection > 0 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => goToPrevSection()}
              className="min-h-[44px] px-4 border-gray-600 text-white text-sm font-medium hover:bg-gray-700"
              aria-label="Go back to previous section"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/jetshare/dashboard?tab=offers')}
              className="min-h-[44px] px-4 border-gray-600 text-white text-sm font-medium hover:bg-gray-700"
              disabled={isSubmitting}
              aria-label="Cancel and go back to dashboard"
            >
              Cancel
            </Button>
          )}
          
          {/* Section indicators in the middle of the footer */}
          <div className="flex items-center justify-center gap-1">
            {sections.map((section, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSection(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  activeSection === index 
                    ? "bg-amber-500" 
                    : "bg-gray-600"
                )}
                aria-label={`Go to ${section}`}
              />
            ))}
          </div>
          
          {activeSection < totalSections - 1 ? (
            <Button 
              type="button" 
              onClick={() => goToNextSection()}
              className="min-h-[44px] px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm"
              aria-label={`Continue to ${sections[activeSection + 1]}`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              type="button" 
              disabled={isSubmitting || isAuthenticating}
              className="min-h-[44px] px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm"
              aria-label="Review and submit offer"
              onClick={() => {
                // Validate form before submitting
                form.trigger().then(isValid => {
                  if (isValid) {
                    // Show confirmation modal
                    if (window.confirm('Are you ready to submit your JetShare offer?')) {
                      form.handleSubmit(onSubmit)();
                    }
                  } else {
                    // Show validation errors
                    toast.error('Please fix form errors before submitting');
                  }
                });
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  {editOfferId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{editOfferId ? 'Update Offer' : 'Submit Offer'}</>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
} 