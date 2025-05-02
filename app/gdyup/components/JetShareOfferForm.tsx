'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plane, DollarSign, ArrowRight, Loader2, Users, UserPlus, ChevronRight, ChevronLeft, Users2, Armchair, Sofa, Bath, Info, ListChecks, CheckCircle, Utensils, Crown, Tv, Wifi, Smartphone, Map, MonitorPlay, Bed, ThermometerSun } from 'lucide-react';
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
import LocationAutocomplete from './LocationAutocomplete';
import AirportMap from './AirportMap'; // Add import for AirportMap
import EnhancedAirportMap from './EnhancedAirportMap'; // Add the new import
import { PiArmchair } from 'react-icons/pi';
import Image from 'next/image';
import { debounce } from 'lodash';

// Import GDYUP form styles
import '../components/gdyup-forms.css';

// Add helper function needed by useMemo
const generateSeatId = (row: number, col: number): string => {
  const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
  return `${rowLetter}${col + 1}`;
};

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

// Add these type declarations right after the imports but before the component code

// Define JetShare offer status types
export type JetShareOfferStatus = 'open' | 'accepted' | 'completed';

// Define JetShare payment method types
export type JetSharePaymentMethod = 'fiat' | 'crypto';

// Define JetShare payment status types
export type JetSharePaymentStatus = 'pending' | 'completed' | 'failed';

// Add interface for jet data
interface JetData {
  [key: string]: {
    id: string;
    manufacturer?: string;
    model?: string;
    tail_number?: string;
    year?: number;
    range_nm?: number;
    cruise_speed_kts?: number;
    max_altitude?: number;
    cabin_width?: number;
    cabin_height?: number;
    cabin_length?: number;
    image_url?: string;
    interior_image_url?: string;
    has_wifi?: boolean;
    has_power_outlets?: boolean;
    has_entertainment?: boolean;
    has_catering?: boolean;
    has_satellite_phone?: boolean;
    has_climate_control?: boolean;
  };
}

// Declare global window object extension
declare global {
  interface Window {
    __JETSTREAM_JET_DATA__?: JetData;
  }
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
  // Handle the case where no model is provided
  if (!model) return '/images/jets/default-jet.jpg';
  
  // Use the manufacturer/model format format instead of dash-separated
  const modelParts = model.split(' ');
  const manufacturer = modelParts[0].toLowerCase();
  const modelName = modelParts.slice(1).join(' ');
  
  return `/images/jets/${manufacturer}/${modelName}.jpg`;
};

// Helper function for interior images
const getJetInteriorImage = (jetId: string, model: string): string => {
  // If no model, use default
  if (!model) return '/images/jets/interior/interior1.jpg';
  
  // For interiors, use a generic interior image as fallback
  return '/images/jets/interior/interior1.jpg';
};

// Add this helper function to calculate optimal seat layout
const calculateOptimalLayout = (totalSeats: number): { rows: number, seatsPerRow: number } => {
  // Define standard layouts for common seat configurations
  const standardLayouts: Record<number, { rows: number, seatsPerRow: number }> = {
    4: { rows: 2, seatsPerRow: 2 },  // Small jets
    6: { rows: 2, seatsPerRow: 3 },
    8: { rows: 2, seatsPerRow: 4 },  // Common executive layout
    9: { rows: 3, seatsPerRow: 3 },
    10: { rows: 5, seatsPerRow: 2 }, // 5x2 layout for 10-passenger jets
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

// Define a simple interface for jet data at the top of the file
interface JetDetails {
  id: string;
  manufacturer?: string;
  model?: string;
  tail_number?: string;
  year?: number;
  range_nm?: number;
  cruise_speed_kts?: number;
  max_altitude?: number;
  cabin_width?: number;
  cabin_height?: number;
  cabin_length?: number;
  image_url?: string;
  interior_image_url?: string;
  capacity?: number;
  owner_id?: string;
  // Interior specific fields
  berths?: boolean;
  lavatory?: boolean;
  galley?: boolean;
  entertainment?: string;
  wifi?: boolean;
}

// Define image formatters before the component that uses them
const formatJetImageUrl = (manufacturer?: string, model?: string): string => {
  try {
    if (!manufacturer || !model) return '/images/jets/default-jet.jpg';
    const manufacturerName = manufacturer.toLowerCase();
    return `/images/jets/${manufacturerName}/${model}.jpg`;
  } catch (e) {
    console.error('Error formatting jet image URL:', e);
    return '/images/jets/default-jet.jpg';
  }
};

const formatJetInteriorImageUrl = (manufacturer?: string, model?: string): string => {
  try {
    if (!manufacturer || !model) return '/images/jets/interior/default-interior.jpg';
    return `/images/jets/interior/${model.toLowerCase().replace(/\s+/g, '-')}-interior.jpg`;
  } catch (e) {
    console.error('Error formatting jet interior image URL:', e);
    return '/images/jets/interior/default-interior.jpg';
  }
};

// Add this helper function after other utility functions (around line 390)
// Add this before the component definition:
const extractAirportCode = (locationString: string): string | null => {
  if (!locationString) return null;
  
  // Try to match a pattern like "City (CODE)" or "City, State (CODE)"
  const match = locationString.match(/\(([A-Z]{3,4})\)$/);
  if (match && match[1]) {
    return match[1];
  }
  
  // If no match found, return null
  return null;
};

// --- Start of the component definition ---
export default function JetShareOfferForm({ airportsList = [] as Airport[], editOfferId = null }: JetShareOfferFormProps) {
  // --- Top Level State and Refs ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Define early
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { user, loading: authLoading } = useAuth(); // Define early
  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);
  const [currentJetData, setCurrentJetData] = useState<JetDetails | null>(null);
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  const previousJetIdRef = useRef<string>('');
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
  const [activeSection, setActiveSection] = useState(0);
  const swiperRef = useRef<any>(null);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [isSwiperInitialized, setIsSwiperInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [departureResults, setDepartureResults] = useState<string[]>([]);
  const [arrivalResults, setArrivalResults] = useState<string[]>([]);
  const [showDepartureResults, setShowDepartureResults] = useState(false);
  const [showArrivalResults, setShowArrivalResults] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSeatVisualizer, setShowSeatVisualizer] = useState(true);
  const [splitConfiguration, setSplitConfiguration] = useState<OldSplitConfiguration | null>(null);
  const [selectedJetId, setSelectedJetId] = useState<string>('default');
  // Initialize shareRatio state to 50
  const [shareRatio, setShareRatio] = useState<number>(50);
  const [optimalLayout, setOptimalLayout] = useState<{ 
    rows: number; 
    seatsPerRow: number; 
    totalSeats?: number;
    skipPositions?: number[][];
  } | null>(null);
  const [initialSeatConfig, setInitialSeatConfig] = useState<string[]>([]);
  const visualizerRef = useRef<JetSeatVisualizerRef>(null);
  const [jetImagePath, setJetImagePath] = useState<string>('/images/jets/default-jet.jpg');
  const [jetInteriorPath, setJetInteriorPath] = useState<string>('/images/jets/interior/default-interior.jpg');
  const [showInteriorImage, setShowInteriorImage] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("specs");
  const isUpdatingRef = useRef(false);
  // Add temporary state for selected seats from visualizer
  const [visualizerSelectedSeats, setVisualizerSelectedSeats] = useState<string[]>([]);
  // Ref to track initial mount for the visualizer effect
  const isVisualizerEffectInitialMount = useRef(true);

  // --- Watched Values & Constants ---
  const totalFlightCost = form.watch('total_flight_cost');
  const requestedShareAmount = form.watch('requested_share_amount');
  const totalSeats = form.watch('total_seats'); // Watch total_seats
  const sections = ["Flight Details", "Aircraft Selection", "Seat Configuration", "Cost Details"];
  const totalSections = sections.length;
  const prevTotalSeatsRef = useRef<number | undefined>(form.getValues('total_seats')); // Ref to track previous value

  // --- Callbacks & Memos (Order by dependency) ---
  const forceUpdate = useCallback(() => { setForceUpdateCounter(prev => prev + 1); }, []);
  
  // Define fetchJetData early as it's used in useEffect
  const fetchJetData = useCallback(async (jetId: string) => {
      // ... (implementation as before)
  }, [currentJetData, form, forceUpdate, setJetImagePath, setJetInteriorPath]); // Pass stable setters

  const updateShareAmount = useCallback((percentage: number) => {
    const totalCost = form.getValues('total_flight_cost') || 0;
    if (totalCost > 0) {
        const newShareAmount = Math.round(totalCost - (totalCost * (percentage / 100)));
        // Ensure share amount doesn't exceed total cost (shouldn't happen with percentage 1-99)
        const validatedShareAmount = Math.min(totalCost, Math.max(0, newShareAmount));
        console.log(`[FORM updateShareAmount] Percentage: ${percentage}%, Total Cost: ${totalCost}, Calculated Share Amount: ${validatedShareAmount}`);
        form.setValue('requested_share_amount', validatedShareAmount, { shouldValidate: true });
    } else {
        console.log('[FORM updateShareAmount] Total cost is 0 or invalid, skipping share amount update.');
        form.setValue('requested_share_amount', 0, { shouldValidate: true }); // Reset if total cost is 0
    }
  }, [form]); // Removed shareRatio dependency, now uses passed percentage

  // Define helper function outside useMemo
  const getPotentialSeatIds = useCallback((count: number): string[] => {
    if (count <= 0) return [];
    const { rows, seatsPerRow } = calculateOptimalLayout(count);
    const ids: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < seatsPerRow; c++) {
        if (ids.length >= count) break;
        ids.push(generateSeatId(r, c));
      }
      if (ids.length >= count) break;
    }
    return ids.slice(0, count);
  }, [calculateOptimalLayout]); // Depends on calculateOptimalLayout

  // Modify handleSplitConfigurationChange to ONLY set temporary state
  const handleSplitConfigurationChange = useCallback((selectedSeatsFromVisualizer: string[]) => {
    console.log('[FORM handleSplitConfigChange - TEMP SET] Triggered with selected seats:', selectedSeatsFromVisualizer);
    setVisualizerSelectedSeats(selectedSeatsFromVisualizer);
  }, []); // No dependencies needed as it only calls a setter

  // Add useEffect to process the temporary state
  useEffect(() => {
    // Prevent running on initial mount
    if (isVisualizerEffectInitialMount.current) {
      isVisualizerEffectInitialMount.current = false;
      console.log('[FORM useEffect - visualizerSelectedSeats] Skipping initial mount.');
      return;
    }

    // Only process if visualizerSelectedSeats has actually changed (use ref to compare)
    // This avoids running logic unnecessarily if the parent component re-renders
    // but the visualizer state hasn't actually changed from its perspective.
    
    console.log('[FORM useEffect - visualizerSelectedSeats] Processing selected seats:', visualizerSelectedSeats);
    if (!visualizerSelectedSeats) return; // Guard clause

    // REMOVE setTimeout wrapper
    // const timerId = setTimeout(() => {
    console.log('[FORM useEffect - visualizerSelectedSeats] Running update...');
      
    const totalSeatsAvailable = form.getValues('total_seats');
    console.log(`[FORM useEffect] totalSeatsAvailable: ${totalSeatsAvailable}, visualizerSelectedSeats.length: ${visualizerSelectedSeats.length}`);
    if (!totalSeatsAvailable || totalSeatsAvailable <= 0) {
      console.warn('[FORM useEffect] Total seats not available or invalid.');
      return;
    }

    const totalSelected = visualizerSelectedSeats.length;

    // Calculate new ratio based *only* on the selected seats count
    const newRatio = totalSelected > 0
      ? Math.max(1, Math.min(99, Math.ceil((totalSelected / totalSeatsAvailable) * 100)))
      : 0; // Can be 0 if cleared

    console.log(`[FORM useEffect] Calculated newRatio: ${newRatio}%`);

    // Calculate the new requested share amount directly
    const currentTotalCost = form.getValues('total_flight_cost') || 0;
    let newRequestedShareAmount = 0;
    if (currentTotalCost > 0) {
      // Partner pays based on the ratio of seats they get (100 - newRatio)
      // Or equivalently, user pays newRatio percent, partner pays the rest
      const userPaysAmount = Math.round(currentTotalCost * (newRatio / 100));
      newRequestedShareAmount = Math.max(0, currentTotalCost - userPaysAmount); 
    } else {
      newRequestedShareAmount = 0;
    }
    console.log(`[FORM useEffect] Calculated newRequestedShareAmount: ${newRequestedShareAmount}`);

    // Re-calculate partnerSeats here
    const partnerSeats = totalSeatsAvailable - totalSelected;

    // Update form values together
    form.setValue('available_seats', partnerSeats, { shouldValidate: false }); // Defer validation
    form.setValue('requested_share_amount', newRequestedShareAmount, { shouldValidate: false }); // Defer validation
    console.log(`[FORM useEffect] Updated form values - available_seats: ${partnerSeats}, requested_share_amount: ${newRequestedShareAmount}`);

    // Now trigger validation if needed (optional, depends on desired UX)
    // form.trigger(['available_seats', 'requested_share_amount']);

    // Update the shareRatio state ONLY if it changed
    setShareRatio(prevRatio => {
        if (newRatio !== prevRatio) {
            console.log(`[FORM useEffect] Updating shareRatio state from ${prevRatio} to: ${newRatio}`);
            // REMOVE updateShareAmount call from here
            // updateShareAmount(newRatio);
            // console.log(`[FORM useEffect] Called updateShareAmount with new ratio: ${newRatio}`);
            return newRatio;
        }
        return prevRatio; // No change
    });

    // Update the splitConfiguration state for submission data
    const updatedConfig: OldSplitConfiguration = {
      jetId: selectedJetId,
      splitOrientation: 'horizontal', // Assuming horizontal for now
      splitRatio: `${newRatio}:${100 - newRatio}`,
      splitPercentage: newRatio,
      allocatedSeats: {
        front: visualizerSelectedSeats // Store the actual selected seats
      }
    };
    setSplitConfiguration(updatedConfig);
    console.log('[FORM useEffect] Updated splitConfiguration state.');
    // }, 0); // REMOVE setTimeout wrapper

    // REMOVE Cleanup for the timeout
    // return () => clearTimeout(timerId);

  }, [visualizerSelectedSeats, form, selectedJetId, setSplitConfiguration, updateShareAmount]); // Dependencies for the effect

  const handleSliderChange = useCallback((values: number[]) => {
    const newRatio = values[0];
    console.log(`[FORM handleSliderChange] Slider value changing to: ${newRatio}%`);
    // Directly update shareRatio state. The useMemo effect will handle seat calculation.
    setShareRatio(newRatio);
  }, [setShareRatio]); // Only depends on setShareRatio

  const handleSliderCommit = useCallback((values: number[]) => {
    const newRatio = values[0];
    console.log(`[FORM handleSliderCommit] Slider commit value: ${newRatio}%`);
    setIsSliderActive(false);
    // Update the share amount based on the final slider ratio
    updateShareAmount(newRatio);
    // No need to call updateSeatsByRatio anymore
  }, [setIsSliderActive, updateShareAmount]); // Removed updateSeatsByRatio

  const handleResetTo5050 = useCallback(() => {
    console.log('[FORM handleResetTo5050] Resetting ratio to 50%'); // Log call
    const totalSeats = form.getValues('total_seats') || 0;
    const targetCount = Math.round(totalSeats * 0.50);
    if (visualizerRef.current?.selectSeatsByCount) {
      visualizerRef.current.selectSeatsByCount(targetCount);
    }
    // updateShareAmount(50); // This will be handled by the visualizer's onChange -> useEffect
  }, [form, visualizerRef]); // Removed setShareRatio, updateShareAmount

  const handleClearSelection = useCallback(() => {
    console.log('[FORM handleClearSelection] Clearing selection'); // Log call
    if (visualizerRef.current) {
        visualizerRef.current.clearSelection(); // Ask visualizer to clear its internal state
    }
    // Set ratio to 0 or 1 depending on desired minimum share
    setShareRatio(0); // Set ratio to 0, indicating no seats selected
    form.setValue('available_seats', 0, { shouldValidate: true });
    updateShareAmount(0); // Update cost based on 0% ratio
    setSplitConfiguration(prev => prev ? { ...prev, splitPercentage: 0, allocatedSeats: { front: [] } } : null);
  }, [form, visualizerRef, setShareRatio, updateShareAmount, setSplitConfiguration]);

  // --- Derived State (Calculated Seats based on Ratio) ---
  // REMOVE this useMemo hook as selection is now driven by visualizer interaction
  /*
  const controlledSelectedSeats = useMemo(() => {
      const totalSeatsValue = form.getValues('total_seats');
      const currentRatio = shareRatio; // Capture current ratio for logging
      console.log(`[useMemo controlledSelectedSeats] START - Ratio: ${currentRatio}%, Form Total Seats: ${totalSeatsValue}`);

      // Use the form value directly as the source of truth for total seats
      const actualTotalSeats = totalSeatsValue || 0;

      if (actualTotalSeats <= 0) {
          console.log('[useMemo controlledSelectedSeats] Calculation skipped: Invalid total seats from form.');
          return [];
      }
      
      // Call the helper function defined outside
      const potentialSeatIds = getPotentialSeatIds(actualTotalSeats);
      console.log(`[useMemo controlledSelectedSeats] Generated Potential Seat IDs (Count: ${potentialSeatIds.length}):`, potentialSeatIds);

      // Calculate the number of seats to select based on the *current* shareRatio state
      // Use Math.round for correct rounding
      const seatsToSelectCount = Math.round((currentRatio / 100) * actualTotalSeats);
      // Ensure count is within bounds [0, actualTotalSeats]
      const validatedSeatsToSelectCount = Math.max(0, Math.min(actualTotalSeats, seatsToSelectCount));
      console.log(`[useMemo controlledSelectedSeats] Target Count: ${seatsToSelectCount} (Raw), ${validatedSeatsToSelectCount} (Validated) using actualTotalSeats: ${actualTotalSeats}`);

      // Get the actual seat IDs to select by slicing the potential list
      const calculatedSeats = potentialSeatIds.slice(0, validatedSeatsToSelectCount);

      console.log(`[useMemo controlledSelectedSeats] END - Ratio: ${currentRatio}%, Total Seats (from form): ${actualTotalSeats}, Calculated Seats:`, calculatedSeats);
      return calculatedSeats;

  }, [shareRatio, form.watch('total_seats'), forceUpdateCounter, getPotentialSeatIds]); // Use getPotentialSeatIds from component scope
  */

  // --- Regular Functions (can be defined before useEffects if needed) ---
  const debugNavigation = useCallback((message: string, data?: any) => { /* ... */ }, []); 
  const goToSection = useCallback((index: number) => { /* ... */ }, [totalSections, swiperRef, setActiveSection]);
  const goToNextSection = useCallback(() => {
    console.log('[GoToNext] Clicked. Current section:', activeSection, 'Total sections:', totalSections);
    if (activeSection < totalSections - 1) {
      const nextIndex = activeSection + 1;
      debugNavigation(`Attempting to navigate to next section: ${nextIndex}`);
      
      // Update state first
      setActiveSection(nextIndex);
      console.log('[GoToNext] Updated activeSection state to:', nextIndex);
      
      // Then navigate using the swiper if available
      if (swiperRef.current) {
        try {
          console.log('[GoToNext] Calling swiperRef.current.slideTo(', nextIndex, ')');
          swiperRef.current.slideTo(nextIndex);
          console.log('[GoToNext] swiperRef.current.slideTo() called successfully.');
          debugNavigation(`Swiper navigated to: ${nextIndex}`);
        } catch (err) {
          console.error('[GoToNext] Error navigating with swiper:', err);
          // Fallback - force a re-render to show the correct section
          // setActiveSection(nextIndex); // Already set above
        }
      } else {
        console.warn('[GoToNext] Swiper ref not available!');
        debugNavigation('Swiper ref not available, using state-only navigation');
      }
    } else {
      console.log('[GoToNext] Already on the last section or condition not met.');
    }
  }, [activeSection, totalSections, setActiveSection, swiperRef, debugNavigation]);
  const goToPrevSection = useCallback(() => {
    console.log('[GoToPrev] Clicked. Current section:', activeSection);
    if (activeSection > 0) {
      const prevIndex = activeSection - 1;
      debugNavigation(`Attempting to navigate to previous section: ${prevIndex}`);
      
      // Update state first
      setActiveSection(prevIndex);
      console.log('[GoToPrev] Updated activeSection state to:', prevIndex);
      
      // Then navigate using the swiper if available
      if (swiperRef.current) {
        try {
          console.log('[GoToPrev] Calling swiperRef.current.slideTo(', prevIndex, ')');
          swiperRef.current.slideTo(prevIndex);
           console.log('[GoToPrev] swiperRef.current.slideTo() called successfully.');
          debugNavigation(`Swiper navigated to: ${prevIndex}`);
        } catch (err) {
          console.error('[GoToPrev] Error navigating with swiper:', err);
        }
      } else {
        console.warn('[GoToPrev] Swiper ref not available!');
        debugNavigation('Swiper ref not available, using state-only navigation');
      }
    } else {
      console.log('[GoToPrev] Already on the first section.');
    }
  }, [activeSection, setActiveSection, swiperRef, debugNavigation]);
  const handleDepartureSearch = useCallback((value: string) => { /* ... */ }, [form, airportsList, setDepartureResults, setShowDepartureResults]);
  const handleArrivalSearch = useCallback((value: string) => { /* ... */ }, [form, airportsList, setArrivalResults, setShowArrivalResults]);
  const selectDepartureLocation = useCallback((location: string) => { /* ... */ }, [form, setShowDepartureResults]);
  const selectArrivalLocation = useCallback((location: string) => { /* ... */ }, [form, setShowArrivalResults]);
  const notifyModelChange = useCallback((model: string, seats: number, jetId?: string) => { /* ... */ }, [form, setSelectedJetId]); 
  const isValidUUID = useCallback((uuid: string): boolean => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid); // Ensure boolean is explicitly returned
  }, []); 
  const onSubmit = useCallback(async (values: z.infer<typeof enhancedFormSchema>) => { 
    // *** ADD DISTINCT LOG AT START ***
    console.log("------ onSubmit FUNCTION CALLED ------");
    // *** END LOG ***

    // This function is called by react-hook-form's handleSubmit
    // after validation passes (triggered by the button's onClick)
    // *** ADD LOGGING HERE ***
    console.log("onSubmit invoked. Form is valid.");
    console.log("Validated form values:", values);
    // *** END LOGGING ***

    debugNavigation('onSubmit invoked with validated values:', values);
    if (!user) {
      // This check might be redundant if auth is handled earlier, but good practice
      toast.error('Authentication error. Please sign in again.');
      return;
    }

    // Prevent multiple submissions (already handled in onClick, but double-check here)
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Prepare data for API submission (same as before)
      const offerPayload = {
        user_id: user.id,
        flight_date: values.departure_time.toISOString(),
        departure_time: values.departure_time.toISOString(), 
        departure_location: values.departure_location,
        arrival_location: values.arrival_location,
        aircraft_model: values.aircraft_model || null,
        jet_id: values.jet_id || null, 
        total_seats: values.total_seats,
        available_seats: values.available_seats,
        total_flight_cost: values.total_flight_cost,
        requested_share_amount: values.requested_share_amount,
        split_configuration: splitConfiguration || null, 
        status: 'open',
        // Add the image URL to ensure it's stored in the database
        image_url: jetImagePath || null
      };

      // *** ADD LOGGING FOR JET_ID ***
      console.log(`Submitting offer payload with jet_id: ${offerPayload.jet_id}`, offerPayload);
      console.log(`Including image path: ${offerPayload.image_url}`);

      const endpoint = editOfferId ? `/api/jetshare/updateOffer/${editOfferId}` : '/api/jetshare/createOffer';
      const method = editOfferId ? 'PUT' : 'POST';

      // *** ADD DISTINCT LOG ***
      console.log("------ EXECUTING FETCH TO API ENDPOINT ------", method, endpoint);
      // *** END LOG ***

      let response;
      try {
        response = await fetch(endpoint, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(offerPayload),
        });
        console.log(`Fetch response received: Status ${response.status} ${response.statusText}`);
      } catch (fetchError) {
        console.error("Network error during fetch operation:", fetchError);
        throw new Error(`Network error: ${(fetchError as Error).message}`);
      }

      if (!response.ok) {
        let errorData;
        console.error(`API responded with error status: ${response.status} ${response.statusText}`);
        
        try { 
          errorData = await response.json();
          console.error('API Error Response Detail:', errorData);
        } catch (parseError) { 
          console.error('Could not parse error response as JSON:', parseError);
          errorData = { message: response.statusText || 'Unknown error' };
        }
        
        throw new Error(errorData.message || `API Error (${response.status}): Failed to submit offer`);
      }

      let result;
      try {
        result = await response.json();
        console.log('API Success Response:', result);
      } catch (parseError) {
        console.error('Could not parse success response as JSON:', parseError);
        throw new Error('Received success status but could not parse response');
      }

      console.log('Form submission successful, showing success toast');
      toast.success(editOfferId ? 'Offer updated successfully!' : 'Offer created successfully!');
      
      // *** CORRECT REDIRECT ON SUCCESS ***
      console.log("Redirecting to dashboard with offers tab...");
      router.push('/gdyup/dashboard?tab=offers'); 
      console.log("Router.push executed");

    } catch (error) {
      console.error("Submission error in onSubmit:", error);
      toast.error(`Error: ${(error as Error).message}`);
      // Keep the user on the form to fix potential issues
    } finally {
      // Ensure isSubmitting is reset even if redirect happens
      console.log("Setting isSubmitting to false");
      setIsSubmitting(false);
      console.log("------ onSubmit FUNCTION COMPLETED ------");
    }
  }, [user, splitConfiguration, editOfferId, router, debugNavigation, setIsSubmitting, isSubmitting, toast, jetImagePath]); // Ensure all dependencies are listed

  // --- Effect Hooks ---
  useEffect(() => { /* fetchJetData subscription */ 
    const jetId = form.getValues('jet_id');
    if (jetId && jetId !== 'default' && jetId !== previousJetIdRef.current) {
      previousJetIdRef.current = jetId;
      fetchJetData(jetId);
    }
    const subscription = form.watch((values, { name }) => {
      if (name === 'jet_id' && values.jet_id && values.jet_id !== 'default' && values.jet_id !== previousJetIdRef.current) {
        previousJetIdRef.current = values.jet_id;
        fetchJetData(values.jet_id);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [form, fetchJetData, previousJetIdRef]);

  // *** ADD NEW EFFECT FOR 50/50 RESET ON SEAT CHANGE ***
  useEffect(() => {
    const currentTotalSeats = form.getValues('total_seats');

    // --- More Robust Initial Mount / Change Check ---
    const previousTotalSeats = prevTotalSeatsRef.current;
    // Use a flag to track if this is the very first time we have a valid seat count
    const isInitialValidLoad = previousTotalSeats === undefined && typeof currentTotalSeats === 'number' && currentTotalSeats > 0;
    const hasValidNumber = typeof currentTotalSeats === 'number' && !isNaN(currentTotalSeats) && currentTotalSeats > 0;
    const hasChanged = hasValidNumber && currentTotalSeats !== previousTotalSeats;

    console.log(`[useEffect totalSeats Check] Prev: ${previousTotalSeats}, Current: ${currentTotalSeats}, IsInitialValid: ${isInitialValidLoad}, HasValidNum: ${hasValidNumber}, HasChanged: ${hasChanged}`);

    // Condition 1: Set initial 50% visual selection ONCE when seats become valid
    if (isInitialValidLoad) {
        const initialTargetCount = Math.round(currentTotalSeats * 0.50);
        console.log(`[useEffect totalSeats] Initial valid seats detected (${currentTotalSeats}). Setting state and visual selection to 50% (${initialTargetCount} seats).`);
        // Explicitly set ratio state and trigger cost update for initial load
        setShareRatio(50); 
        updateShareAmount(50);
        // Call visualizer (use slightly longer delay just in case)
        const initialSetTimer = setTimeout(() => {
            if (visualizerRef.current?.selectSeatsByCount) {
                 visualizerRef.current.selectSeatsByCount(initialTargetCount);
                 console.log(`[useEffect totalSeats - Timeout] Initial visual selection set.`);
            } else {
                 console.warn('[useEffect totalSeats - Timeout] Visualizer ref not ready for initial set.');
            }
        }, 150); // Increased delay slightly
        // Cleanup for this specific timeout
        // We return cleanup inside the condition so it only applies if the timeout was set
        return () => clearTimeout(initialSetTimer);
    } 
    // Condition 2: Reset to 50% on SUBSEQUENT changes (and ensure it was valid before)
    else if (hasChanged && previousTotalSeats !== undefined) { 
      console.log(`[useEffect totalSeats changed] Seats changed from ${previousTotalSeats} to ${currentTotalSeats}. Resetting state and visual selection to 50/50.`);
      setShareRatio(50);
      updateShareAmount(50);
      // Call visualizer to reflect the reset
       const resetTimer = setTimeout(() => {
          const targetCount = Math.round(currentTotalSeats * 0.50);
          if (visualizerRef.current?.selectSeatsByCount) {
               visualizerRef.current.selectSeatsByCount(targetCount);
               console.log(`[useEffect totalSeats - Timeout] Visual selection reset.`);
          } else {
               console.warn('[useEffect totalSeats - Timeout] Visualizer ref not ready for reset call.');
          }
      }, 150); // Increased delay slightly
       // Cleanup for this specific timeout
       return () => clearTimeout(resetTimer);
    }

    // Always update the ref if the current value is valid and different from previous
    // No timeout needed for ref update
    if (hasValidNumber && previousTotalSeats !== currentTotalSeats) {
       prevTotalSeatsRef.current = currentTotalSeats;
       console.log(`[useEffect totalSeats Check] Updated ref to ${currentTotalSeats}.`);
    }

    // No general cleanup needed unless a timeout was started in the conditions above
    return undefined;

  // Depend on the watched totalSeats value and the stable updateShareAmount function
  }, [totalSeats, updateShareAmount, prevTotalSeatsRef, visualizerRef]); // Added visualizerRef dependency
  // *** END NEW EFFECT ***

  useEffect(() => { /* checkMobile */ }, []);
  useEffect(() => { /* Debug logging for image states */ }, [jetImagePath, jetInteriorPath, showInteriorImage, selectedTab]);
  useEffect(() => { /* Auth check */
    console.log('[Auth Effect Check] Running - authLoading:', authLoading, 'User:', !!user);
    if (authLoading) {
      console.log('[Auth Effect Check] Still loading, setting isAuthenticating=true');
      setIsAuthenticating(true);
      return;
    }
    console.log('[Auth Effect Check] Auth loaded, setting isAuthenticating=false');
    setIsAuthenticating(false);

    if (!user) {
      console.log('[Auth Effect Check] No user after loading, redirecting...');
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.replace(`/auth/login?returnUrl=${returnUrl}`);
    } else {
      console.log('[Auth Effect Check] User found:', user.id);
    }
  }, [user, authLoading, router]);
  useEffect(() => { /* Form value validation */ }, [form]);
  useEffect(() => { /* Fetch offer details */ }, [editOfferId, router, form, setIsEditMode, setIsSubmitting, setSplitConfiguration, setSelectedJetId, toast]); // Add dependencies
  useEffect(() => { /* handleJetChange listener */
    console.log('[JetChangeListener Effect] Running: Adding listener.');
    const handleJetChange = (event: any) => {
      const detail = event.detail || {};
      // Define effectiveJetId once using the detail from the event
      const effectiveJetId = detail.jetId || detail.id;

      console.log('[JetShareForm Listener] Received jetchange event. Detail:', detail);
      console.log(`[JetShareForm Listener] Effective Jet ID identified: ${effectiveJetId}`);

      // Guard clause - ensure we have an ID
      if (!effectiveJetId) { 
        console.warn('[JetShareForm Listener] Invalid detail - No Effective ID received.'); 
        return; 
      }

      // Get other potential properties from detail
      const value = detail.value; 
      const seatCapacity = detail.seatCapacity;

      console.log('[...] Processing detail with effectiveJetId:', { value, seatCapacity, jetId: effectiveJetId });

      // --- Handler logic using detail and effectiveJetId ---
      form.setValue('aircraft_model', value || `${detail.manufacturer || 'Unknown'} ${detail.model || 'Model'}`);
      form.setValue('jet_id', effectiveJetId);
      console.log(`[JetShareForm Listener] Form jet_id state after setValue: ${form.getValues('jet_id')}`);
      setSelectedJetId(effectiveJetId); // Use the defined effectiveJetId
      
      // Create newJetDetails using detail and effectiveJetId
      const newJetDetails: JetDetails = {
        id: effectiveJetId, // Use the defined effectiveJetId
        manufacturer: detail.manufacturer,
        model: detail.model,
        tail_number: detail.tail_number,
        capacity: typeof seatCapacity === 'string' ? parseInt(seatCapacity) : (typeof seatCapacity === 'number' ? seatCapacity : 0), // Safer parsing
        range_nm: detail.range_nm ? (typeof detail.range_nm === 'string' ? parseInt(detail.range_nm) : detail.range_nm) : undefined,
        cruise_speed_kts: detail.cruise_speed_kts ? (typeof detail.cruise_speed_kts === 'string' ? parseInt(detail.cruise_speed_kts) : detail.cruise_speed_kts) : undefined,
        max_altitude: detail.max_altitude ? (typeof detail.max_altitude === 'string' ? parseInt(detail.max_altitude) : detail.max_altitude) : undefined,
        cabin_width: detail.cabin_width ? (typeof detail.cabin_width === 'string' ? parseFloat(detail.cabin_width) : detail.cabin_width) : undefined,
        cabin_height: detail.cabin_height ? (typeof detail.cabin_height === 'string' ? parseFloat(detail.cabin_height) : detail.cabin_height) : undefined,
        cabin_length: detail.cabin_length ? (typeof detail.cabin_length === 'string' ? parseFloat(detail.cabin_length) : detail.cabin_length) : undefined,
        year: detail.year ? (typeof detail.year === 'string' ? parseInt(String(detail.year)) : detail.year) : undefined,
        image_url: detail.image_url,
        interior_image_url: detail.interior_image_url,
        owner_id: detail.owner_id,
        berths: detail.berths !== undefined ? detail.berths : undefined,
        lavatory: detail.lavatory !== undefined ? detail.lavatory : undefined,
        galley: detail.galley !== undefined ? detail.galley : undefined,
        entertainment: detail.entertainment || undefined,
        wifi: detail.wifi !== undefined ? detail.wifi : undefined,
      };
      setCurrentJetData(newJetDetails); // Update state
      
      // Seat count update logic
      if (seatCapacity !== undefined && seatCapacity !== null) {
         const seats = typeof seatCapacity === 'string' ? parseInt(seatCapacity) : seatCapacity;
         if (!isNaN(seats) && seats > 0) {
           console.log(`[JetShareForm Listener] Setting total_seats to ${seats}`);
           form.setValue('total_seats', seats, { shouldValidate: true });
           // Check available seats AFTER total seats is set
           const currentAvailable = form.getValues('available_seats'); 
           if (currentAvailable === undefined || currentAvailable > seats || currentAvailable < 0) { // Also check for < 0
             const defaultAvailable = Math.floor(seats / 2); // Reset to 50% if invalid
             console.log(`[JetShareForm Listener] Resetting available_seats to ${defaultAvailable}`);
             form.setValue('available_seats', defaultAvailable, { shouldValidate: true });
           }
         }
      }
      
      // Image path logic
      if (newJetDetails.image_url) { setJetImagePath(newJetDetails.image_url); } else { setJetImagePath('/images/jets/default-jet.jpg'); }
      if (newJetDetails.interior_image_url) { setJetInteriorPath(newJetDetails.interior_image_url); } else { setJetInteriorPath('/images/jets/interior/default-interior.jpg'); }
      
      // console.log("[...] Skipping fetchJetData for now."); // Keep skipping if intended
      
      console.log('[...] State update calls done. aircraft_model=', form.getValues('aircraft_model'), 'jet_id=', form.getValues('jet_id'));
      console.log('[...] State updated: newJetDetails object =', JSON.stringify(newJetDetails, null, 2));
      
      forceUpdate(); 
      console.log('[...] forceUpdate() called.');

      // Set image visibility based on current tab
      setShowInteriorImage(selectedTab === "interior" || selectedTab === "amenities");
      console.log(`[...] Updated showInteriorImage based on current tab (${selectedTab}): ${showInteriorImage}`);
    };

    window.addEventListener('jetchange', handleJetChange as EventListener);
    return () => {
      console.log('[JetChangeListener Effect] Cleanup: Removing listener.');
      window.removeEventListener('jetchange', handleJetChange as EventListener);
    };
  // *** REMOVE currentJetData FROM DEPENDENCIES ***
  }, [form, fetchJetData, setJetImagePath, setJetInteriorPath, setSelectedJetId, isValidUUID, forceUpdate, selectedTab]); // Re-added full dependency array

  // --- CONDITIONAL RETURNS --- 
  if (isAuthenticating || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Verifying authentication...</p>
      </div>
    );
  }
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
  // --- MAIN RETURN --- 
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="gdyup-form relative bg-gray-900 dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden dark">
        {/* Current Section Label with path-style heading */}
        <div className="px-4 pt-3 pb-2 sticky top-0 z-10 bg-gray-800/80 backdrop-blur-md text-white border-b border-gray-700/60">
          <div className="flex items-center text-sm text-gray-400">
            <span className="text-[#DAFF0D] font-medium">Create Offer</span>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-600" />
            <span className="font-medium text-white">{sections[activeSection]}</span>
          </div>
        </div>
        
        {/* Swipeable Sections - Using direct children for less nesting */}
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
          className="gdyup-swiper mb-16"
          allowTouchMove={!isSliderActive}
          touchStartPreventDefault={false}
          touchReleaseOnEdges={true}
          preventInteractionOnTransition={isSliderActive}
          noSwipingClass="no-swiper-interaction"
          watchOverflow={true}
          simulateTouch={true}
          style={{ height: 'calc(100vh - 180px)' }}
        >
          {/* Section 1: Flight Details - Simplified container structure */}
          <SwiperSlide className="h-full">
            <div className="gdyup-section p-3 space-y-3 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              <div className="form-section">
                <div className="form-section-header">
                  <Plane className="gdyup-icon w-5 h-5 text-[#DAFF0D]" />
                  <h2 className="form-section-title">Flight Details</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
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
                                  "pl-3 text-left font-normal h-10 w-full", // Reduced height further
                                  "bg-gray-900/80 hover:bg-gray-800 border-gray-700/80 text-white",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                                {field.value ? (
                                  format(field.value, "MMM d, yyyy 'at' h:mm a")
                                ) : (
                                  <span>Select date & time</span>
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
                            <div className="p-2 border-t border-gray-700/50">
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
                        <FormLabel className="text-white">Departure</FormLabel>
                        <FormControl>
                          <LocationAutocomplete
                            {...field}
                            placeholder="Enter departure location"
                            airports={airportsList}
                            className="bg-gray-900/70"
                            variant="departure"
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
                        <FormLabel className="text-white">Arrival</FormLabel>
                        <FormControl>
                          <LocationAutocomplete
                            {...field}
                            placeholder="Enter arrival location"
                            airports={airportsList}
                            className="bg-gray-900/70"
                            variant="arrival"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Optimized Route Visualization */}
              {(() => {
                const departureLocationValue = form.watch('departure_location');
                const arrivalLocationValue = form.watch('arrival_location');
                const shouldShowMap = departureLocationValue && arrivalLocationValue;
                
                return shouldShowMap ? (
                  <div className="enhanced-map-container mt-3 mb-2">
                    <EnhancedAirportMap
                      departure={departureLocationValue}
                      arrival={arrivalLocationValue}
                      className="w-full enhanced-map"
                    />
                  </div>
                ) : null;
              })()}
            </div>
          </SwiperSlide>

          {/* Section 2: Aircraft Selection - Simplified container structure */}
          <SwiperSlide className="h-full">
            <div className="gdyup-section p-3 space-y-3 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              <div className="form-section">
                <div className="form-section-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gdyup-icon w-5 h-5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <path d="M22 7H2"></path>
                    <path d="M7 12h7"></path>
                    <path d="M7 9h4"></path>
                    <path d="M7 15h4"></path>
                  </svg>
                  <h2 className="form-section-title">Aircraft Selection</h2>
                </div>

                {/* Aircraft model selector - Simplified wrapper */}
                <FormField
                  control={form.control}
                  name="aircraft_model"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <FormLabel className="text-white sr-only">
                        <span>Aircraft</span>
                      </FormLabel>
                      <FormControl>
                        <JetSelector
                          value={field.value}
                          className="w-full aircraft-model-field"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Jet Details - Flattened structure */}
                {(() => {
                  const modelVal = form.getValues('aircraft_model');
                  const idVal = form.getValues('jet_id');
                  return modelVal || idVal ? (
                    <div className="jet-details">
                      {/* Jet image */}
                      <div className="jet-main-image-container relative w-full h-40 bg-gray-900 border-b border-gray-700/80 overflow-hidden">
                        {!showInteriorImage ? (
                          <img
                            src={jetImagePath}
                            alt={form.getValues('aircraft_model') || "Aircraft"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/jets/default-jet.jpg";
                            }}
                          />
                        ) : (
                          <img
                            src={jetInteriorPath}
                            alt={`${form.getValues('aircraft_model') || "Aircraft"} Interior`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/jets/interior/default-interior.jpg";
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80"></div>
                        <div className="absolute bottom-0 left-0 p-3 flex flex-col">
                          <h3 className="font-bold text-xl text-white">{currentJetData?.manufacturer || ''} {currentJetData?.model || form.getValues('aircraft_model') || 'Not selected'}</h3>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="bg-blue-900/50 border-blue-500/50 text-blue-100 text-xs font-semibold">
                              <span className="text-sm mr-1">{currentJetData?.capacity || form.getValues('total_seats') || 10}</span> seats
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Tabs for jet info - Keeping all content while improving mobile layout */}
                      <Tabs defaultValue="specs" className="jet-info-tabs" value={selectedTab} onValueChange={(value) => { 
                        setSelectedTab(value); 
                        setShowInteriorImage(value === "interior" || value === "amenities");
                      }}>
                        <TabsList className="jet-tabs-list w-full grid grid-cols-3 bg-gray-800/90 border-b border-gray-700/50 rounded-none h-10">
                          <TabsTrigger value="specs" className="data-[state=active]:bg-gray-700/60 rounded-none text-sm">Specifications</TabsTrigger>
                          <TabsTrigger value="interior" className="data-[state=active]:bg-gray-700/60 rounded-none text-sm">Interior</TabsTrigger>
                          <TabsTrigger value="amenities" className="data-[state=active]:bg-gray-700/60 rounded-none text-sm">Amenities</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="specs" className="p-3 bg-gray-800/30">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                            <div className="flex flex-col border-l-2 border-blue-500/30 pl-2"><span className="text-xs text-blue-300 uppercase">Range</span><span className="font-medium text-white">{currentJetData?.range_nm ? `${currentJetData.range_nm} nm` : '4,500 nm'}</span></div>
                            <div className="flex flex-col border-l-2 border-blue-500/30 pl-2"><span className="text-xs text-blue-300 uppercase">Speed</span><span className="font-medium text-white">{currentJetData?.cruise_speed_kts ? `${currentJetData.cruise_speed_kts} kts` : '480 kts'}</span></div>
                            <div className="flex flex-col border-l-2 border-blue-500/30 pl-2"><span className="text-xs text-blue-300 uppercase">Altitude</span><span className="font-medium text-white">{currentJetData?.max_altitude ? `${currentJetData.max_altitude} ft` : '45,000 ft'}</span></div>
                            <div className="flex flex-col border-l-2 border-blue-500/30 pl-2"><span className="text-xs text-blue-300 uppercase">Capacity</span><span className="font-medium text-white">{currentJetData?.capacity || form.getValues('total_seats')} passengers</span></div>
                            <div className="flex flex-col border-l-2 border-blue-500/30 pl-2"><span className="text-xs text-blue-300 uppercase">Year</span><span className="font-medium text-white">{currentJetData?.year || 'N/A'}</span></div>
                            <div className="flex flex-col border-l-2 border-blue-500/30 pl-2"><span className="text-xs text-blue-300 uppercase">Tail Number</span><span className="font-medium text-white">{currentJetData?.tail_number || 'N/A'}</span></div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="interior" className="p-3 bg-gray-800/30">
                          <div className="space-y-3">
                            <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/40">
                              <h4 className="text-sm font-medium text-white mb-1">Interior Details</h4>
                              <p className="text-xs text-gray-300">{currentJetData?.entertainment || "Standard luxury interior with premium finishes."}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-800/70 rounded-lg p-2 border border-gray-700/40">
                                <h5 className="text-xs font-medium text-blue-300 uppercase">Cabin Length</h5>
                                <p className="text-sm font-medium text-white">{currentJetData?.cabin_length ? `${currentJetData.cabin_length} ft` : 'Standard'}</p>
                              </div>
                              <div className="bg-gray-800/70 rounded-lg p-2 border border-gray-700/40">
                                <h5 className="text-xs font-medium text-blue-300 uppercase">Cabin Width</h5>
                                <p className="text-sm font-medium text-white">{currentJetData?.cabin_width ? `${currentJetData.cabin_width} ft` : 'Standard'}</p>
                              </div>
                              <div className="bg-gray-800/70 rounded-lg p-2 border border-gray-700/40">
                                <h5 className="text-xs font-medium text-blue-300 uppercase">Cabin Height</h5>
                                <p className="text-sm font-medium text-white">{currentJetData?.cabin_height ? `${currentJetData.cabin_height} ft` : 'Standard'}</p>
                              </div>
                              <div className="bg-gray-800/70 rounded-lg p-2 border border-gray-700/40">
                                <h5 className="text-xs font-medium text-blue-300 uppercase">Berths</h5>
                                <p className="text-sm font-medium text-white">{currentJetData?.berths ? 'Available' : 'Not Available'}</p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="amenities" className="p-3 bg-gray-800/30">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                              <Wifi className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-medium text-white">{currentJetData?.wifi ? "WiFi" : "No WiFi"}</p>
                            </div>
                            <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                              <Utensils className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-medium text-white">{currentJetData?.galley ? "Catering" : "No Catering"}</p>
                            </div>
                            <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                              <Bath className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-medium text-white">{currentJetData?.lavatory ? "Lavatory" : "No Lavatory"}</p>
                            </div>
                            <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                              <MonitorPlay className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-medium text-white">{currentJetData?.entertainment ? "Entertainment" : "No Entertainment"}</p>
                            </div>
                            <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                              <Bed className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-medium text-white">{currentJetData?.berths ? "Sleeping Berths" : "No Berths"}</p>
                            </div>
                            <div className="bg-gray-800/70 rounded-lg py-2 px-1 border border-gray-700/40 text-center">
                              <ThermometerSun className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                              <p className="text-xs font-medium text-white">Climate Control</p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      {/* Hidden form fields */}
                      <>
                        <input type="hidden" name="total_seats" id="total_seats_hidden" value={form.getValues('total_seats')} />
                        <input type="hidden" name="available_seats" id="available_seats_hidden" value={form.getValues('available_seats')} />
                      </>
                    </div>
                  ) : null;
                })()}

                {/* Simplified route visualization for aircraft screen */}
                {(() => {
                  const departure = form.watch('departure_location');
                  const arrival = form.watch('arrival_location');
                  const departureCode = departure ? extractAirportCode(departure) : null;
                  const arrivalCode = arrival ? extractAirportCode(arrival) : null;
                  
                  return departure && arrival ? (
                    <div className="route-map-mini mt-2 relative bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden shadow-inner p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                          <div className="text-sm text-blue-100 font-medium truncate max-w-[120px]">
                            {departureCode || 'DEP'}
                          </div>
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center px-2">
                          <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500 via-[#DAFF0D] to-amber-500 relative route-line">
                            <Plane className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-[#DAFF0D] rotate-45 plane-icon" />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <div className="text-sm text-amber-100 font-medium truncate max-w-[120px]">
                            {arrivalCode || 'ARR'}
                          </div>
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          </SwiperSlide>

          {/* Section 3: Seat Configuration - Simplified container structure */}
          <SwiperSlide className="h-full">
            <div className="gdyup-section p-3 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              <div className="form-section">
                <div className="form-section-header">
                  <Users className="gdyup-icon w-5 h-5" />
                  <h2 className="form-section-title">Seat Configuration</h2>
                </div>
                
                {/* Jet seat visualizer section - Better structure for mobile */}
                {showSeatVisualizer && (
                  <div className="seat-configuration">
                    <p className="text-gray-300 text-sm mb-2">Select seats or use the slider to adjust the split ratio.</p>
                    
                    {/* Split ratio slider */}
                    <div className="seat-slider-container mb-3">
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-gray-300 text-xs">You: <span className="text-white font-bold">{shareRatio}%</span></span>
                        <span className="text-gray-300 text-xs">Guest: <span className="text-white font-bold">{100 - shareRatio}%</span></span>
                      </div>
                      
                      <Slider
                        defaultValue={[50]}
                        max={99}
                        min={1}
                        step={1}
                        onValueChange={(values) => {
                          // Update share ratio state
                          handleSliderChange(values);
                          
                          // Update visualizer based on slider value
                          if (visualizerRef.current?.selectSeatsByCount) {
                            const totalSeats = form.getValues('total_seats') || 0;
                            const seatCount = Math.round((values[0] / 100) * totalSeats);
                            visualizerRef.current.selectSeatsByCount(seatCount);
                          }
                        }}
                        onValueCommit={handleSliderCommit}
                        value={[shareRatio]}
                        onMouseDown={() => setIsSliderActive(true)}
                        onMouseUp={() => setIsSliderActive(false)}
                        className="my-3"
                      />
                      
                      <div className="flex justify-center mt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            // Reset to 50/50
                            const totalSeats = form.getValues('total_seats') || 0;
                            const targetCount = Math.round(totalSeats * 0.5);
                            setShareRatio(50);
                            
                            // Update seat visualizer
                            if (visualizerRef.current?.selectSeatsByCount) {
                              visualizerRef.current.selectSeatsByCount(targetCount);
                            }
                            
                            // Update form values
                            form.setValue('available_seats', totalSeats - targetCount, { shouldValidate: true });
                            updateShareAmount(50);
                          }}
                          className="text-white bg-gray-800 hover:bg-gray-700 border-gray-700 text-sm"
                        >
                          Reset to 50/50
                        </Button>
                      </div>
                    </div>
                    
                    {/* Seat Visualizer with legend */}
                    <div className="visualizer-container bg-gray-900/60 rounded-lg border border-gray-800 p-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <PiArmchair className="w-4 h-4 text-[#DAFF0D] mr-1" />
                          <span className="text-white text-sm font-medium">Your Seats: {shareRatio}%</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="bg-blue-900/20 text-blue-300 border-blue-800/30 text-xs"
                        >
                          {form.getValues('total_seats') || 0} Seats
                        </Badge>
                      </div>
                      
                      <JetSeatVisualizer
                        ref={visualizerRef}
                        totalSeats={form.getValues('total_seats') || 0}
                        onChange={(selectedSeats) => {
                          handleSplitConfigurationChange(selectedSeats);
                        }}
                        initialSelection={{
                          jet_id: selectedJetId,
                          selectedSeats: initialSeatConfig,
                          totalSeats: form.getValues('total_seats') || 0,
                          totalSelected: initialSeatConfig.length,
                          selectionPercentage: shareRatio
                        }}
                        jet_id={selectedJetId}
                        showLegend={false}
                        seatConfig={{}}
                        showControls={false}
                        className="mb-1"
                      />
                      
                      <div className="flex justify-between items-center mt-2 px-1 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-[#DAFF0D]"></div>
                          <span className="text-gray-300">Your seats</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded bg-gray-700"></div>
                          <span className="text-gray-300">Guest's seats</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="info-box bg-blue-900/20 rounded-lg p-2 border border-blue-900/30 mt-2">
                  <div className="flex items-center">
                    <Info className="w-4 h-4 text-blue-400 mr-1 shrink-0" />
                    <p className="text-xs text-gray-300">
                      Seats you select will be reserved for you. Remaining seats will be available 
                      for your guest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>

          {/* Section 4: Cost Details - Simplified container structure */}
          <SwiperSlide className="h-full">
            <div className="gdyup-section p-4 space-y-4 h-full overflow-y-auto pb-16 bg-gradient-to-b from-gray-900 to-gray-950">
              {/* Add form validation status at the top of the final page */}
              <div className="form-section">
                <div className="form-section-header">
                  <ListChecks className="w-5 h-5" />
                  <h2 className="form-section-title">Submission Checklist</h2>
                </div>
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
              
              <div className="space-y-6">
                {/* Total Flight Cost with enhanced styling */}
                <div className="form-section">
                  <div className="form-section-header">
                    <DollarSign className="w-5 h-5" />
                    <h2 className="form-section-title">Total Flight Cost</h2>
                  </div>
                  <FormField
                    control={form.control}
                    name="total_flight_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="total_flight_cost" className="flex items-center text-gray-200 mb-2">
                          <DollarSign className="h-5 w-5 mr-2 text-[#DAFF0D]" />
                          <span className="font-medium">Total Flight Cost ($)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="total_flight_cost"
                              type="number"
                              min={1}
                              placeholder="Enter total flight cost"
                              {...field}
                              onChange={(e) => {
                                const newTotalCost = parseInt(e.target.value) || 0;
                                field.onChange(newTotalCost);
                                
                                // Update requestedShareAmount when total cost changes
                                // based on current ratio
                                if (newTotalCost > 0) {
                                  const newShareAmount = Math.round(newTotalCost * ((100 - shareRatio) / 100));
                                  form.setValue('requested_share_amount', newShareAmount, { shouldValidate: true });
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
                <div className="form-section">
                  <div className="form-section-header">
                    <DollarSign className="w-5 h-5" />
                    <h2 className="form-section-title">Requested Share Amount</h2>
                  </div>
                  <FormField
                    control={form.control}
                    name="requested_share_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="requested_share_amount" className="flex items-center text-gray-200 mb-2">
                          <DollarSign className="h-5 w-5 mr-2 text-[#DAFF0D]" />
                          <span className="font-medium">Requested Share Amount ($)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              id="requested_share_amount"
                              type="number"
                              min={1}
                              max={totalFlightCost || 999999999}
                              className="pl-3 min-h-[44px] bg-gray-900/80 border-gray-700/80 focus:ring-[#DAFF0D] focus:border-[#DAFF0D] rounded-lg text-white"
                              {...field}
                              onChange={(e) => {
                                const requestedAmount = parseInt(e.target.value) || 0;
                                field.onChange(requestedAmount);
                                
                                // Update shareRatio when requested amount changes
                                const totalCost = form.getValues('total_flight_cost') || 0;
                                if (totalCost > 0) {
                                  // Calculate ratio based on what the *other* person pays (requestedAmount)
                                  const otherPaysRatio = Math.round((requestedAmount / totalCost) * 100);
                                  // Your ratio is 100 minus that
                                  const newRatio = Math.min(99, Math.max(1, 100 - otherPaysRatio));
                                  console.log(`[FORM Requested Amount Change] Updating shareRatio to: ${newRatio}%`);
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
                <div className="mt-6 overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 shadow-xl">
                  {/* Add the airport map above the summary */}
                  {form.watch('departure_location') && form.watch('arrival_location') && (
                    <div className="w-full h-60 relative rounded-t-xl overflow-hidden border-b border-gray-700/50">
                      <EnhancedAirportMap
                        departure={form.watch('departure_location')}
                        arrival={form.watch('arrival_location')}
                        className="w-full h-full"
                      />
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 text-white px-4 py-3">
                    <h3 className="font-bold text-base">Flight Share Offer Summary</h3>
                  </div>
                  <div className="bg-gray-800/90 px-4 py-3 space-y-3 shadow-inner">
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
                            <div className="bg-[#DAFF0D] h-full" style={{ width: `${shareRatio}%` }}></div>
                            <div className="bg-gray-600 h-full" style={{ width: `${100 - shareRatio}%` }}></div>
                          </div>
                          <span className="font-medium text-white text-sm">{shareRatio}% / {100 - shareRatio}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cost breakdown with enhanced styling */}
                    <div className="mt-4 bg-gray-900/70 rounded-lg p-3 border border-gray-800/80">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-300 text-sm">Total Flight Cost:</span>
                        <span className="font-bold text-white">${totalFlightCost || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-[#DAFF0D]/80 text-sm">You Pay:</span>
                        <span className="font-bold text-[#DAFF0D]">${totalFlightCost ? totalFlightCost - requestedShareAmount : 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-400 text-sm">Sharer Pays:</span>
                        <span className="font-bold text-gray-300">${requestedShareAmount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add a new final submission review section */}
                <div className="mt-6 overflow-hidden rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 shadow-xl">
                  <div className="bg-gradient-to-r from-[#DAFF0D]/20 to-[#DAFF0D]/10 text-white px-4 py-3 flex items-center border-b border-[#DAFF0D]/20">
                    <CheckCircle className="w-5 h-5 mr-2 text-[#DAFF0D]" />
                    <h3 className="font-bold text-base">Ready to Submit</h3>
                  </div>
                  <div className="bg-gray-800/90 px-4 py-3 shadow-inner">
                    <p className="text-gray-300 text-sm mb-3">
                      Your JetShare offer is ready to submit. Once published, it will appear in the marketplace
                      where other members can see it and request to join your flight.
                    </p>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Seat Configuration:</span>
                        <Badge className="bg-[#DAFF0D]/20 text-[#DAFF0D] border-[#DAFF0D]/30">
                          {/* Use form value for display */}
                          {form.getValues('available_seats') > 0
                            ? `${form.getValues('available_seats')} seats selected (${shareRatio}%)`
                            : 'Default configuration (50/50)'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Available to Book:</span>
                        <Badge className="bg-gray-700/50 text-gray-200 border-gray-600/50">
                          {form.getValues('available_seats')} seats
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Offer Status:</span>
                        <Badge className="bg-[#DAFF0D]/20 text-[#DAFF0D] border-[#DAFF0D]/30">
                          Open
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-5 bg-[#DAFF0D]/10 rounded-lg p-3 border border-[#DAFF0D]/20">
                      <p className="text-[#DAFF0D]/90 text-xs">
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
        
        {/* Sticky Navigation Footer - No changes needed */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-md border-t border-gray-700/80 p-3 flex items-center justify-between shadow-lg z-20">
          {activeSection > 0 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => goToPrevSection()}
              className="button-secondary min-h-[44px] px-4 text-white text-sm font-medium"
              aria-label="Go back to previous section"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/gdyup/dashboard?tab=offers')}
              className="button-secondary min-h-[44px] px-4 text-white text-sm font-medium"
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
                    ? "bg-[#DAFF0D]" 
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
              className="button-primary min-h-[44px] px-4 text-black font-medium text-sm"
              aria-label={`Continue to ${sections[activeSection + 1]}`}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              type="button"
              disabled={isSubmitting || isAuthenticating}
              className="button-primary min-h-[44px] px-4 text-black font-medium text-sm"
              aria-label="Review and submit offer"
              onClick={(e) => {
                console.log("Submit button clicked - initiating manual submit process");
                if (window.confirm('Are you ready to submit your JetShare offer?')) {
                  console.log("User confirmed submission - calling form.handleSubmit(onSubmit)");
                  form.handleSubmit(onSubmit)(e); // Explicitly call the submit handler with the event
                } else {
                  console.log("Submission cancelled by user.");
                }
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


