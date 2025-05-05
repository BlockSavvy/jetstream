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
import EnhancedLocationAutocomplete from './EnhancedLocationAutocomplete';
import { FormThemedDateTimePicker } from './FormThemedDateTimePicker';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { ThemedDateTimePicker } from './ThemedDateTimePicker';
import { RiFlightTakeoffLine } from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import JetDetailsTabs from './JetDetailsTabs';
import MobileJetSelector from "./MobileJetSelector";

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
  interior_type?: string;
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
    if (!manufacturer || !model) return '/images/jets/interior/interior1.jpg';
    return `/images/jets/interior/${model.toLowerCase().replace(/\s+/g, '-')}-interior.jpg`;
  } catch (e) {
    console.error('Error formatting jet interior image URL:', e);
    return '/images/jets/interior/interior1.jpg';
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

// First, define the ThemeSwitcher component near the top of the file, before the main component
// Add after imports but before the helper functions

// Theme Switcher component for live testing
function ThemeSwitcher() {
  const { theme, changeTheme, getThemeClasses, getThemeName } = useGdyupTheme();
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
 return (
    <div className={getThemeClasses({
      base: "px-4 py-2 mb-4 flex items-center justify-between border-b text-sm",
      default: "bg-gdyup-accent/70 border-gdyup-border",
      blue: "bg-blue-900/70 border-blue-800",
      pink: "bg-pink-900/70 border-pink-800"
    })}>
      <div className="flex items-center">
        <span className={getThemeClasses({
          base: "mr-2 opacity-70",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>Theme:</span>
        <span className={getThemeClasses({
          base: "font-medium",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>{getThemeName()}</span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => changeTheme('default')}
          className={cn(
            "w-6 h-6 rounded-full relative",
            theme === 'default' ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : '',
            "bg-[#DAFF0D]"
          )}
          aria-label="Switch to Default theme"
        />
        <button
          onClick={() => changeTheme('blue')}
          className={cn(
            "w-6 h-6 rounded-full relative",
            theme === 'blue' ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : '',
            "bg-[#F25C05]"
          )}
          aria-label="Switch to Luxury Black theme"
        />
        <button
          onClick={() => changeTheme('pink')}
          className={cn(
            "w-6 h-6 rounded-full relative",
            theme === 'pink' ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : '',
            "bg-[#F7931A]"
          )}
          aria-label="Switch to BTC Orange theme"
        />
      </div>
    </div>
  );
}

// Add this style before the component definition - after the ThemeSwitcher component
// Custom style to hide the input field in the JetSelector
const customJetSelectorStyles = `
  /* Hide all input fields with this placeholder anywhere in the document */
  input[placeholder="Enter custom aircraft model"] {
    display: none !important;
  }
  
  /* Hide input fields inside specific parents */
  .aircraft-selection-container input[placeholder="Enter custom aircraft model"] {
    display: none !important;
  }
  
  /* Target the container itself by custom classes */
  .aircraft-selection-container .input-field-container,
  .jet-selector-wrapper .input-field-container,
  div:has(> input[placeholder="Enter custom aircraft model"]) {
    display: none !important;
  }
  
  /* Target by attributes for specific matching */
  input[type="text"][placeholder="Enter custom aircraft model"] {
    display: none !important;
    height: 0 !important;
    opacity: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    pointer-events: none !important;
  }
  
  /* By position in DOM */
  .jet-selector-wrapper .mt-2 {
    display: none !important;
  }
`;
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
  
  // Get isMobile from theme hook instead of a separate media query
  const { isMobile } = useGdyupTheme();
  
  // State for aircraft details tabs
  const [detailsTab, setDetailsTab] = useState<string>('specs');
  
  // Function to fetch airports directly from the API
  const fetchAirports = useCallback(async () => {
    try {
      if (airports.length > 0) return; // Don't fetch if we already have airports
      
      setIsLoadingAirports(true);
      console.log('[JetShareOfferForm] Fetching airports data...');
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/airports?t=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Airport API error: ${response.status}`);
      }
      
      const airportsData = await response.json();
      
      if (!Array.isArray(airportsData)) {
        throw new Error('API did not return an array of airports');
      }
      
      console.log(`[JetShareOfferForm] Successfully loaded ${airportsData.length} airports`);
      setAirports(airportsData);
    } catch (error) {
      console.error('[JetShareOfferForm] Error fetching airports:', error);
      
      // If we have airports from props, use those as fallback
      if (airportsList && airportsList.length > 0) {
        console.log(`[JetShareOfferForm] Using ${airportsList.length} airports from props`);
        setAirports(airportsList);
      }
    } finally {
      setIsLoadingAirports(false);
    }
  }, [airports.length, airportsList]);
  
  // Fetch airports when component mounts
  useEffect(() => {
    fetchAirports();
  }, [fetchAirports]);
  
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
  const [jetInteriorPath, setJetInteriorPath] = useState<string>('/images/jets/interior/interior1.jpg');
  const [showInteriorImage, setShowInteriorImage] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("specs");
  const isUpdatingRef = useRef(false);
  // Add temporary state for selected seats from visualizer
  const [visualizerSelectedSeats, setVisualizerSelectedSeats] = useState<string[]>([]);
  // Ref to track initial mount for the visualizer effect
  const isVisualizerEffectInitialMount = useRef(true);
  // Add theme hook
  const { theme, getThemeClasses, changeTheme } = useGdyupTheme();

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

  // Fix the handleResetTo5050 function to properly handle 50/50 allocation
  const handleResetTo5050 = useCallback(() => {
    console.log('[FORM handleResetTo5050] Resetting to 50/50 allocation');
    
    // Set the ratio to exactly 50%
    setShareRatio(50);
    
    // Get the current total seats
    const totalSeats = form.getValues('total_seats') || 0;
    if (totalSeats <= 0) {
      console.warn('[FORM handleResetTo5050] Total seats not available or invalid.');
      return;
    }
    
    // Calculate exactly half the seats (rounded)
    const yourSeats = Math.ceil(totalSeats / 2);
    const partnerSeats = totalSeats - yourSeats;
    
    // Update the form with the partner seats
    form.setValue('available_seats', partnerSeats, { shouldValidate: true });
    
    // Update the share amount
    const totalCost = form.getValues('total_flight_cost') || 0;
    const newRequestedShareAmount = Math.round(totalCost * 0.5);
    form.setValue('requested_share_amount', newRequestedShareAmount, { shouldValidate: true });
    
    console.log(`[FORM handleResetTo5050] Setting visualization to ${yourSeats} seats for you, ${partnerSeats} for partner`);
    
    // Update the visualizer to show half the seats selected - with retry logic
    if (visualizerRef.current) {
      try {
        // First attempt
        visualizerRef.current.selectSeatsByCount(yourSeats);
        console.log(`[FORM handleResetTo5050] Visualizer updated on first try: ${yourSeats} seats`);
      } catch (e) {
        console.warn('[FORM handleResetTo5050] Error updating visualizer on first try:', e);
        // Retry after a short delay
        setTimeout(() => {
          try {
            if (visualizerRef.current) {
              visualizerRef.current.selectSeatsByCount(yourSeats);
              console.log(`[FORM handleResetTo5050] Visualizer updated on retry: ${yourSeats} seats`);
            }
          } catch (retryError) {
            console.error('[FORM handleResetTo5050] Error updating visualizer on retry:', retryError);
          }
        }, 200);
      }
    } else {
      console.warn('[FORM handleResetTo5050] Visualizer ref not available for selection');
    }
    
    // Immediately force update split configuration state
    const updatedConfig: OldSplitConfiguration = {
      jetId: selectedJetId || 'default',
      splitOrientation: 'horizontal',
      splitRatio: '50:50',
      splitPercentage: 50,
      allocatedSeats: {
        front: []  // This will be populated by the visualizer's onChange event
      }
    };
    setSplitConfiguration(updatedConfig);
    
    // Force a component update to reflect changes
    setForceUpdateCounter(prev => prev + 1);
    
  }, [form, visualizerRef, selectedJetId, setSplitConfiguration, setForceUpdateCounter, setShareRatio]);
  
  // Ensure proper seat initialization on load and reset to 50/50 when seats change
  useEffect(() => {
    const currentTotalSeats = form.getValues('total_seats');
    
    // Use a flag to track if this is the very first time we have a valid seat count
    const previousTotalSeats = prevTotalSeatsRef.current;
    const isInitialValidLoad = previousTotalSeats === undefined && 
                              typeof currentTotalSeats === 'number' && 
                              currentTotalSeats > 0;
    
    const hasChanged = previousTotalSeats !== undefined && 
                       typeof currentTotalSeats === 'number' && 
                       currentTotalSeats > 0 &&
                       previousTotalSeats !== currentTotalSeats;
    
    // Check if we're in the seat configuration section
    const isOnSeatSection = activeSection === 2;
    
    console.log(`[useEffect totalSeats] Current: ${currentTotalSeats}, Previous: ${previousTotalSeats}, IsInitial: ${isInitialValidLoad}, HasChanged: ${hasChanged}, IsOnSeatSection: ${isOnSeatSection}`);
    
    // Initial load or seat count changed - reset to 50/50
    if (isInitialValidLoad || hasChanged) {
      console.log('[useEffect totalSeats] Need to reset 50/50 split.');
      
      // Add a slightly longer delay to ensure visualizer is fully ready
      const timer = setTimeout(() => {
        handleResetTo5050();
        // Force an extra update to ensure the visualizer reflects the 50/50 split
        setForceUpdateCounter(prev => prev + 1);
      }, 500);
      
      return () => clearTimeout(timer);
    }
    // If we entered the seat section, make sure visualizer shows correct seats
    else if (isOnSeatSection) {
      console.log('[useEffect totalSeats] On seat section, ensuring visualizer is synchronized');
      
      const timer = setTimeout(() => {
        const availableSeats = form.getValues('available_seats') || 0;
        const yourSeats = currentTotalSeats - availableSeats;
        
        // Update visualizer to match current form state
        if (visualizerRef.current && currentTotalSeats > 0) {
          try {
            visualizerRef.current.selectSeatsByCount(yourSeats);
            console.log(`[useEffect totalSeats] Visualizer updated with ${yourSeats} selected seats`);
          } catch (error) {
            console.error('[useEffect totalSeats] Error updating visualizer:', error);
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
    
    // Update the previous seats ref for next render
    prevTotalSeatsRef.current = currentTotalSeats;
    
  }, [form, handleResetTo5050, prevTotalSeatsRef, setForceUpdateCounter, activeSection, visualizerRef]);

  // Add effect to synchronize visualizer when returning to seat section
  useEffect(() => {
    // Only run when on the seat configuration section (section 2)
    if (activeSection === 2) {
      // Small delay to ensure the section is fully rendered
      const timer = setTimeout(() => {
        // Get current form values
        const totalSeats = form.getValues('total_seats') || 0;
        const availableSeats = form.getValues('available_seats') || 0;
        const yourSeats = totalSeats - availableSeats;
        
        console.log(`[SeatSection Effect] Updating visualizer: Your seats=${yourSeats}, Partner seats=${availableSeats}`);
        
        // Update the visualizer to show the current selection
        if (visualizerRef.current && totalSeats > 0) {
          try {
            visualizerRef.current.selectSeatsByCount(yourSeats);
          } catch (error) {
            console.error('[SeatSection Effect] Error updating visualizer:', error);
          }
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [activeSection, form, visualizerRef]);

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
        interior_type: detail.interior_type || undefined,
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
      if (newJetDetails.interior_image_url) { setJetInteriorPath(newJetDetails.interior_image_url); } else { setJetInteriorPath('/images/jets/interior/interior1.jpg'); }
      
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

  // Event handler for jet change events coming from both selectors
  useEffect(() => {
    const handleJetChange = (event: any) => {
      console.log('JetChange event received:', event.detail);
      
      const { 
        value, 
        jetId, 
        seatCapacity, 
        manufacturer, 
        model,
        tail_number,
        range_nm,
        cruise_speed_kts,
        image_url
      } = event.detail;
      
      // Update form with complete aircraft model
      form.setValue('aircraft_model', value, { shouldValidate: true });
      
      // Update jet_id if provided
      if (jetId) {
        form.setValue('jet_id', jetId, { shouldValidate: true });
        setSelectedJetId(jetId);
        
        // Refresh jet data for the display
        setCurrentJetData({
          id: jetId,
          manufacturer,
          model,
          tail_number,
          capacity: seatCapacity,
          range_nm,
          cruise_speed_kts,
          image_url
        });
      }
      
      // If seat capacity is provided, update related fields
      if (seatCapacity && typeof seatCapacity === 'number' && seatCapacity > 0) {
        form.setValue('total_seats', seatCapacity, { shouldValidate: true });
        
        // Update available seats to default 50% if not already set
        if (!form.getValues('available_seats')) {
          form.setValue('available_seats', Math.floor(seatCapacity / 2), { shouldValidate: true });
        }
        // Cap available seats if they exceed the new total
        else if (form.getValues('available_seats') > seatCapacity) {
          form.setValue('available_seats', seatCapacity, { shouldValidate: true });
        }
      }
    };
    
    // Listen for both regular and custom events
    window.addEventListener('jetchange', handleJetChange);
    window.addEventListener('gdyup-jet-change', handleJetChange);
    
    return () => {
      window.removeEventListener('jetchange', handleJetChange);
      window.removeEventListener('gdyup-jet-change', handleJetChange);
    };
  }, [form, setSelectedJetId, setCurrentJetData]);
  
  // --- RENDER FUNCTIONS ---
  
  // Helper function for icon styling
  const getIconStyle = (isYellow: boolean = false) => {
    return isYellow 
      ? { color: 'black', stroke: 'black', strokeWidth: 2.5, fill: 'none', opacity: 1 } 
      : { opacity: 1 };
  };

  // Function to render the flight details section
  const renderFlightDetailsSection = () => {
    return (
      <div className="flex flex-col min-h-[85vh]">
        <div className="flex-grow px-1 md:px-4 mb-24">
          {/* Form starts directly without the duplicate header */}
          <Form {...form}>
            <div className="space-y-6">
              {/* Departure Date/Time - with enhanced visibility for icons */}
              <FormField
                control={form.control}
                name="departure_time"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className={getThemeClasses({
                      base: "text-sm font-medium",
                      default: "text-white",
                      blue: "text-blue-100",
                      pink: "text-pink-100"
                    })}>
                      Departure Date & Time
                    </FormLabel>
                    <ThemedDateTimePicker
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
                      <FormLabel className={getThemeClasses({
                        base: "text-sm font-medium",
                        default: "text-white",
                        blue: "text-blue-100",
                        pink: "text-pink-100"
                      })}>
                        Departure Airport
                      </FormLabel>
                      <FormControl>
                        <EnhancedLocationAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter departure location"
                          airports={airports}
                          variant="departure"
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
                      <FormLabel className={getThemeClasses({
                        base: "text-sm font-medium",
                        default: "text-white",
                        blue: "text-blue-100",
                        pink: "text-pink-100"
                      })}>
                        Arrival Airport
                      </FormLabel>
                      <FormControl>
                        <EnhancedLocationAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter arrival location"
                          airports={airports}
                          variant="arrival"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Flight route visualization - moved to the bottom */}
              {(form.watch('departure_location') || form.watch('arrival_location')) && (
                <div className={getThemeClasses({
                  base: "relative p-4 rounded-lg border mt-6 transition-colors",
                  default: "bg-gray-900/50 border-gray-800",
                  blue: "bg-blue-950/50 border-blue-900",
                  pink: "bg-pink-950/50 border-pink-900"
                })}>
                  <div className="flex items-center justify-center">
                    <div className={getThemeClasses({
                      base: "text-center",
                      default: "text-white",
                      blue: "text-blue-100",
                      pink: "text-pink-100"
                    })}>
                      {form.watch('departure_location') || 'Departure'}
                    </div>
                    
                    <div className="mx-4 flex-1 flex items-center justify-center">
                      <div className={getThemeClasses({
                        base: "h-0.5 flex-1 relative",
                        default: "bg-[#DAFF0D]",
                        blue: "bg-blue-500",
                        pink: "bg-pink-500"
                      })}>
                        <RiFlightTakeoffLine className={getThemeClasses({
                          base: "absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 text-lg",
                          default: "text-[#DAFF0D]",
                          blue: "text-blue-500",
                          pink: "text-pink-500"
                        })} />
                      </div>
                    </div>
                    
                    <div className={getThemeClasses({
                      base: "text-center",
                      default: "text-white",
                      blue: "text-blue-100",
                      pink: "text-pink-100"
                    })}>
                      {form.watch('arrival_location') || 'Arrival'}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <span className={getThemeClasses({
                      base: "text-sm",
                      default: "text-white/70",
                      blue: "text-blue-200/70",
                      pink: "text-pink-200/70"
                    })}>
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
        
        {/* Fixed navigation footer */}
        <div className="fixed bottom-0 left-0 right-0 w-full px-4 py-2 bg-black/80 backdrop-blur-sm border-t border-gray-800 z-20">
          <div className="max-w-screen-md mx-auto">
            {/* Navigation buttons with indicators between them */}
            <div className="flex justify-between items-center">
              {/* Disabled Back button for first section */}
              <Button
                type="button"
                disabled={true}
                className="w-32 md:w-36 h-11 rounded-md bg-[#DAFF0D]/50 text-black font-medium cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-1 text-black" style={{ color: 'black', stroke: 'black', strokeWidth: 2 }} />
                Back
              </Button>
              
              {/* Step indicators between buttons */}
              <div className="flex justify-center">
                {Array.from({ length: totalSections }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 mx-1 rounded-full ${
                      index === activeSection 
                        ? "bg-[#DAFF0D]" 
                        : getThemeClasses({
                          base: "bg-opacity-30",
                          default: "bg-gray-400",
                          blue: "bg-blue-400",
                          pink: "bg-pink-400"
                        })
                    }`}
                  />
                ))}
              </div>
              
              {/* Next button */}
              <Button
                type="button"
                onClick={() => goToNextSection()}
                className="w-32 md:w-36 h-11 rounded-md bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium"
              >
                Next
                <ArrowRight className="h-5 w-5 ml-1 text-black" style={{ color: 'black', stroke: 'black', strokeWidth: 2 }} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render the aircraft selection section
  const renderAircraftSelectionSection = () => {
    return (
      <div className="flex flex-col min-h-[85vh]">
        <div className="flex-grow px-1 md:px-4 mb-24 overflow-y-auto aircraft-selection-container">
          <Form {...form}>
            <div className="space-y-6">
              {/* Jet selector with mobile support */}
              <FormField
                control={form.control}
                name="aircraft_model"
                render={({ field }) => (
                  <FormItem className="jet-selector-wrapper">
                    <div className={getThemeClasses({
                      base: "rounded-lg border p-4 transition-colors",
                      default: "bg-black/30 border-gray-800",
                      blue: "bg-blue-950/30 border-blue-900",
                      pink: "bg-pink-950/30 border-pink-900"
                    })}>
                      <FormControl>
                        <div className="relative">
                          {/* Add a subtle highlight to the selector */}
                          <div className="absolute inset-0 rounded-md animate-pulse bg-[#DAFF0D]/20 -m-0.5"></div>
                          
                          {/* Conditionally render Mobile or Desktop selector */}
                          {isMobile ? (
                            <MobileJetSelector
                              key={`mobile-jet-selector-${forceUpdateCounter}`}
                              value={field.value}
                              onChangeValue="gdyup-jet-change"
                              className="relative z-10"
                            />
                          ) : (
                            <JetSelector
                              key={`jet-selector-${forceUpdateCounter}`}
                              value={field.value}
                              className={getThemeClasses({
                                base: "p-3 rounded-md border relative z-10", 
                                default: "bg-gray-800 border-gray-700 focus-within:border-[#DAFF0D]",
                                blue: "bg-blue-900 border-blue-800 focus-within:border-blue-400",
                                pink: "bg-pink-900 border-pink-800 focus-within:border-pink-400"
                              })}
                            />
                          )}
                        </div>
                      </FormControl>
                      
                      {/* Only show Change Aircraft button for desktop */}
                      {currentJetData && !isMobile && (
                        <div className="mt-3 text-center">
                          <Button
                            type="button"
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Trigger the dropdown to open
                              const jetSelectorButton = document.querySelector('.jet-selector-wrapper button[role="combobox"]');
                              if (jetSelectorButton) {
                                (jetSelectorButton as HTMLButtonElement).click();
                              }
                            }}
                            className={getThemeClasses({
                              base: "text-xs border",
                              default: "bg-gray-900 hover:bg-gray-800 border-gray-700 text-white",
                              blue: "bg-blue-900 hover:bg-blue-800 border-blue-700 text-blue-100",
                              pink: "bg-pink-900 hover:bg-pink-800 border-pink-700 text-pink-100"
                            })}
                          >
                            Change Aircraft
                          </Button>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Display aircraft details if available */}
              {currentJetData && (
                <motion.div 
                  className="space-y-6 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Aircraft image and tabs */}
                  <div className={getThemeClasses({
                    base: "rounded-lg border overflow-hidden transition-colors shadow-lg",
                    default: "bg-black/50 border-gray-700",
                    blue: "bg-black/50 border-blue-800",
                    pink: "bg-black/50 border-pink-800"
                  })}>
                    {/* Aircraft image with enhanced background */}
                    <div className="p-3">
                      <div className="aspect-video relative overflow-hidden rounded shadow-inner bg-gradient-to-b from-black/70 to-black/40">
                        <motion.img
                          key={showInteriorImage ? 'interior' : 'exterior'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          src={showInteriorImage ? jetInteriorPath : jetImagePath}
                          alt={form.watch('aircraft_model') || `${currentJetData.manufacturer} ${currentJetData.model}`}
                          className="object-cover w-full h-full"
                        />

                        {/* Aircraft name with improved visibility */}
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                          <div className="flex flex-col bg-black/70 backdrop-blur-md p-3 rounded-md shadow-lg border border-[#DAFF0D]/30">
                            <span className="text-[#DAFF0D] font-bold text-lg">
                              {`${currentJetData.manufacturer} ${currentJetData.model}`}
                            </span>
                            {currentJetData.tail_number && (
                              <span className="text-gray-300 text-sm">
                                Tail: {currentJetData.tail_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Implement JetDetailsTabs component */}
                    <div className="p-3">
                      <JetDetailsTabs 
                        jetData={currentJetData}
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
              {!currentJetData && (
                <div className={getThemeClasses({
                  base: "mt-6 p-6 rounded-lg border text-center",
                  default: "bg-gray-900/20 border-gray-800/30 text-white/80",
                  blue: "bg-blue-950/20 border-blue-900/30 text-blue-200/80",
                  pink: "bg-pink-950/20 border-pink-900/30 text-pink-200/80"
                })}>
                  <p>Please select an aircraft from the dropdown above</p>
                </div>
              )}
            </div>
          </Form>
        </div>
        
        {/* Fixed navigation footer */}
        <div className="fixed bottom-0 left-0 right-0 w-full px-4 py-2 bg-black/80 backdrop-blur-sm border-t border-gray-800 z-20">
          <div className="max-w-screen-md mx-auto">
            {/* Navigation buttons with indicators between them */}
            <div className="flex justify-between items-center">
              {/* Back button */}
              <Button
                type="button"
                onClick={() => goToPrevSection()}
                className="w-32 md:w-36 h-11 rounded-md bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium"
              >
                <ChevronLeft className="h-5 w-5 mr-1 text-black" style={{ color: 'black', stroke: 'black', strokeWidth: 2 }} />
                Back
              </Button>
              
              {/* Step indicators between buttons */}
              <div className="flex justify-center">
                {Array.from({ length: totalSections }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 mx-1 rounded-full ${
                      index === activeSection 
                        ? "bg-[#DAFF0D]" 
                        : getThemeClasses({
                          base: "bg-opacity-30",
                          default: "bg-gray-400",
                          blue: "bg-blue-400",
                          pink: "bg-pink-400"
                        })
                    }`}
                  />
                ))}
              </div>
              
              {/* Next button */}
              <Button
                type="button"
                onClick={() => goToNextSection()}
                className="w-32 md:w-36 h-11 rounded-md bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium"
              >
                Next
                <ArrowRight className="h-5 w-5 ml-1 text-black" style={{ color: 'black', stroke: 'black', strokeWidth: 2 }} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render the seat configuration section
  const renderSeatConfigurationSection = () => {
    return (
      <div className="flex flex-col min-h-[85vh]">
        <div className="flex-grow px-1 md:px-4 mb-24"> {/* Added padding for mobile */}
          {/* Remove duplicate heading */}
          <div className="space-y-4">
            <Form {...form}>
              <div className="space-y-6">
                {/* Simplified instruction message with clearer text */}
                <div className={getThemeClasses({
                  base: "p-4 rounded-lg border text-sm",
                  default: "bg-black/20 border-gray-800 text-white/90",
                  blue: "bg-blue-950/30 border-blue-900 text-blue-100/90",
                  pink: "bg-pink-950/30 border-pink-900 text-pink-100/90"
                })}>
                  <p className="text-center font-medium">Select how many seats to keep for yourself</p>
                </div>
                
                {/* Seat Visualizer with integrated allocation summary */}
                <div className="relative">
                  {showSeatVisualizer && (
                    <div className={getThemeClasses({
                      base: "rounded-lg border p-2 md:p-4 transition-colors",
                      default: "bg-black/30 border-gray-800",
                      blue: "bg-blue-950/30 border-blue-900",
                      pink: "bg-pink-950/30 border-pink-900"
                    })}>
                      <JetSeatVisualizer
                        ref={visualizerRef}
                        jet_id={selectedJetId || 'default'}
                        totalSeats={form.getValues('total_seats')}
                        onChange={handleSplitConfigurationChange}
                        readOnly={false}
                        showControls={false} // Hide embedded controls
                        showLegend={true}
                        selectionDisabled={false}
                        seatConfig={{}}
                        className="mb-0"
                        key={`visualizer-${selectedJetId}-${form.getValues('total_seats')}`} // Force re-render when jet or seat count changes
                      />
                    </div>
                  )}
                              
                  {/* Seat allocation summary, slider, and actions - redesigned for mobile */}
                  <div className={getThemeClasses({
                    base: "mt-6 p-4 rounded-lg border space-y-5 transition-colors",
                    default: "bg-gray-900/50 border-gray-800",
                    blue: "bg-blue-950/50 border-blue-900",
                    pink: "bg-pink-950/50 border-pink-900"
                  })}>
                    {/* Seat counters with improved styling */}
                    <div className="grid grid-cols-2 gap-4 bg-black/30 rounded-lg p-4">
                      <div className="flex flex-col items-center">
                        <div className={getThemeClasses({
                          base: "flex items-center text-sm mb-1",
                          default: "text-[#DAFF0D]",
                          blue: "text-blue-300",
                          pink: "text-pink-300"
                        })}>
                          <Users className="h-4 w-4 mr-1.5" />
                          <span>Your seats</span>
                        </div>
                        <span className={getThemeClasses({
                          base: "text-3xl font-bold",
                          default: "text-white",
                          blue: "text-blue-100",
                          pink: "text-pink-100"
                        })}>{form.watch('total_seats') - form.watch('available_seats')}</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className={getThemeClasses({
                          base: "flex items-center text-sm mb-1",
                          default: "text-[#DAFF0D]",
                          blue: "text-blue-300",
                          pink: "text-pink-300"
                        })}>
                          <Users className="h-4 w-4 mr-1.5" />
                          <span>Partner seats</span>
                        </div>
                        <span className={getThemeClasses({
                          base: "text-3xl font-bold",
                          default: "text-white",
                          blue: "text-blue-100",
                          pink: "text-pink-100"
                        })}>{form.watch('available_seats')}</span>
                      </div>
                    </div>
                    
                    {/* Slider section with improved spacing and style */}
                    <div className="mt-5">
                      <div className="flex justify-between items-center mb-3">
                        <div className={getThemeClasses({
                          base: "text-sm font-medium",
                          default: "text-white/80",
                          blue: "text-blue-100/80",
                          pink: "text-pink-100/80"
                        })}>
                          Adjust seat allocation:
                        </div>
                        <div className={getThemeClasses({
                          base: "text-sm font-semibold px-3 py-1 rounded-full",
                          default: "bg-[#DAFF0D] text-black",
                          blue: "bg-blue-500 text-white",
                          pink: "bg-pink-500 text-white"
                        })}>
                          {shareRatio}%
                        </div>
                      </div>
                      
                      {/* Enhanced slider with better styling */}
                      <Slider
                        defaultValue={[50]} // Default to 50%
                        min={0}
                        max={100}
                        step={1}
                        value={[shareRatio]}
                        onValueChange={(values) => {
                          // Update share ratio state
                          const newRatio = values[0];
                          setShareRatio(newRatio);
                          
                          // Calculate and select seats based on the ratio
                          const totalSeats = form.getValues('total_seats') || 0;
                          const targetCount = Math.round(totalSeats * (newRatio / 100));
                          
                          // Update available seats directly
                          const partnerSeats = totalSeats - targetCount;
                          form.setValue('available_seats', partnerSeats, { shouldValidate: true });
                          
                          // Update the visualizer if available
                          if (visualizerRef.current?.selectSeatsByCount) {
                            visualizerRef.current.selectSeatsByCount(targetCount);
                          }
                          
                          // Update share amount
                          updateShareAmount(newRatio);
                        }}
                        className={getThemeClasses({
                          base: "my-4",
                          default: "[&>.range]:bg-[#DAFF0D] [&>[role=slider]]:bg-[#DAFF0D] [&>[role=slider]]:h-5 [&>[role=slider]]:w-5 [&>[role=slider]]:mt-[-8px]",
                          blue: "[&>.range]:bg-blue-500 [&>[role=slider]]:bg-blue-500 [&>[role=slider]]:h-5 [&>[role=slider]]:w-5 [&>[role=slider]]:mt-[-8px]",
                          pink: "[&>.range]:bg-pink-500 [&>[role=slider]]:bg-pink-500 [&>[role=slider]]:h-5 [&>[role=slider]]:w-5 [&>[role=slider]]:mt-[-8px]"
                        })}
                        aria-label="Seat allocation percentage"
                      />
                      
                      {/* Simplified ratio display */}
                      <div className={getThemeClasses({
                        base: "flex items-center justify-between text-sm px-1",
                        default: "text-white/80",
                        blue: "text-blue-100/80",
                        pink: "text-pink-100/80"
                      })}>
                        <div>You: {shareRatio}%</div>
                        <div>Partner: {100 - shareRatio}%</div>
                      </div>
                    </div>
                    
                    {/* Action buttons with improved visibility */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <Button
                        type="button"
                        onClick={handleResetTo5050}
                        className={getThemeClasses({
                          base: "h-12 rounded-md font-medium",
                          default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
                          blue: "bg-blue-500 hover:bg-blue-600 text-white",
                          pink: "bg-pink-500 hover:bg-pink-600 text-white"
                        })}
                      >
                        Reset to 50/50
                      </Button>
                      
                      <Button
                        type="button"
                        onClick={handleClearSelection}
                        className={getThemeClasses({
                          base: "h-12 rounded-md font-medium",
                          default: "bg-green-500 hover:bg-green-600 text-white",
                          blue: "bg-green-500 hover:bg-green-600 text-white",
                          pink: "bg-green-500 hover:bg-green-600 text-white"
                        })}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </div>
        
        {/* Fixed navigation footer */}
        <div className="fixed bottom-0 left-0 right-0 w-full px-4 py-2 bg-black/80 backdrop-blur-sm border-t border-gray-800 z-20">
          <div className="max-w-screen-md mx-auto">
            {/* Navigation buttons with indicators between them */}
            <div className="flex justify-between items-center">
              {/* Navigation buttons */}
              <Button
                type="button"
                onClick={() => goToPrevSection()}
                className={getThemeClasses({
                  base: "w-32 md:w-36 h-11 rounded-md font-medium",
                  default: "bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black",
                  blue: "bg-blue-500 hover:bg-blue-600 text-white",
                  pink: "bg-pink-500 hover:bg-pink-600 text-white"
                })}
              >
                <ChevronLeft className="h-5 w-5 mr-1" style={theme === 'default' ? { color: 'black', stroke: 'black', strokeWidth: 2 } : {}} />
                Back
              </Button>
              
              {/* Step indicators between buttons */}
              <div className="flex justify-center">
                {Array.from({ length: totalSections }).map((_, index) => (
                  <div
                    key={index}
                    className={index === activeSection 
                      ? getThemeClasses({
                          base: "w-2 h-2 mx-1 rounded-full",
                          default: "bg-[#DAFF0D]",
                          blue: "bg-blue-500",
                          pink: "bg-pink-500"
                        })
                      : getThemeClasses({
                          base: "w-2 h-2 mx-1 rounded-full bg-opacity-30",
                          default: "bg-gray-400",
                          blue: "bg-blue-400",
                          pink: "bg-pink-400"
                        })
                    }
                  />
                ))}
              </div>
              
              {/* Continue button */}
              <Button
                type="button"
                onClick={() => goToNextSection()}
                className={getThemeClasses({
                  base: "w-32 md:w-36 h-11 rounded-md font-medium",
                  default: "bg-green-500 hover:bg-green-600 text-white",
                  blue: "bg-green-500 hover:bg-green-600 text-white",
                  pink: "bg-green-500 hover:bg-green-600 text-white"
                })}
              >
                Continue
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render the cost details section
  const renderCostDetailsSection = () => {
    return (
      <div className="flex flex-col min-h-[85vh]">
        <div className="flex-grow px-1 md:px-4 mb-24">
          {/* Removed duplicate heading */}
          <Form {...form}>
            <div className="space-y-6">
              {/* Flight Summary */}
              <div className={getThemeClasses({
                base: "p-4 rounded-lg border mb-6 transition-colors",
                default: "bg-gray-900/50 border-gray-800",
                blue: "bg-blue-950/50 border-blue-900",
                pink: "bg-pink-950/50 border-pink-900"
              })}>
                <h4 className={getThemeClasses({
                  base: "text-sm font-medium mb-3",
                  default: "text-white",
                  blue: "text-blue-100",
                  pink: "text-pink-100"
                })}>
                  Flight Summary
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className={getThemeClasses({
                    base: "flex flex-col",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    <span className="opacity-70">Departure:</span>
                    <span className="font-medium">{form.watch('departure_location') || 'Not specified'}</span>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    <span className="opacity-70">Arrival:</span>
                    <span className="font-medium">{form.watch('arrival_location') || 'Not specified'}</span>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    <span className="opacity-70">Date & Time:</span>
                    <span className="font-medium">
                      {form.watch('departure_time') 
                        ? format(form.watch('departure_time'), "MMM d, yyyy 'at' h:mm a") 
                        : 'Not specified'}
                                  </span>
                                  </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    <span className="opacity-70">Aircraft:</span>
                    <span className="font-medium">{form.watch('aircraft_model') || 'Not specified'}</span>
                                </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    <span className="opacity-70">Your Seats:</span>
                    <span className="font-medium">{form.watch('total_seats') - form.watch('available_seats')} of {form.watch('total_seats')}</span>
                  </div>
                  
                  <div className={getThemeClasses({
                    base: "flex flex-col",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    <span className="opacity-70">Available Seats:</span>
                    <span className="font-medium">{form.watch('available_seats')}</span>
                  </div>
                </div>
              </div>
              
              {/* Total Flight Cost */}
              <FormField
                control={form.control}
                name="total_flight_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={getThemeClasses({
                      base: "text-sm font-medium flex items-center",
                      default: "text-white",
                      blue: "text-blue-100",
                      pink: "text-pink-100"
                    })}>
                      <DollarSign className="h-4 w-4 mr-1 opacity-70" />
                      Total Flight Cost (USD)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? '' : value);
                          
                          // Update requested share amount based on total cost and current ratio
                          const totalCost = isNaN(value) ? 0 : value;
                          if (totalCost > 0) {
                            // Calculate based on the current shareRatio
                            const newShareAmount = Math.round(totalCost * ((100 - shareRatio) / 100));
                            form.setValue('requested_share_amount', newShareAmount, { shouldValidate: true });
                          }
                        }}
                        className={getThemeClasses({
                          base: "border",
                          default: "bg-gray-800 border-gray-700 focus:border-[#DAFF0D] text-white",
                          blue: "bg-blue-900 border-blue-800 focus:border-blue-400 text-blue-100",
                          pink: "bg-pink-900 border-pink-800 focus:border-pink-400 text-pink-100"
                        })}
                      />
                    </FormControl>
                    <FormDescription className={getThemeClasses({
                      base: "text-xs mt-1",
                      default: "text-white/60",
                      blue: "text-blue-200/60",
                      pink: "text-pink-200/60"
                    })}>
                      The total cost of the flight in USD.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Requested Share Amount */}
              <FormField
                control={form.control}
                name="requested_share_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={getThemeClasses({
                      base: "text-sm font-medium flex items-center",
                      default: "text-white",
                      blue: "text-blue-100",
                      pink: "text-pink-100"
                    })}>
                      <DollarSign className="h-4 w-4 mr-1 opacity-70" />
                      Requested Share Amount (USD)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={form.watch('total_flight_cost')}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(isNaN(value) ? '' : value);
                        }}
                        className={getThemeClasses({
                          base: "border",
                          default: "bg-gray-800 border-gray-700 focus:border-[#DAFF0D] text-white",
                          blue: "bg-blue-900 border-blue-800 focus:border-blue-400 text-blue-100",
                          pink: "bg-pink-900 border-pink-800 focus:border-pink-400 text-pink-100"
                        })}
                      />
                    </FormControl>
                    <FormDescription className={getThemeClasses({
                      base: "text-xs mt-1",
                      default: "text-white/60",
                      blue: "text-blue-200/60",
                      pink: "text-pink-200/60"
                    })}>
                      The amount you're requesting from your partner. Cannot exceed the total flight cost.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cost summary */}
              <div className={getThemeClasses({
                base: "p-4 rounded-lg border mt-4 transition-colors",
                default: "bg-gray-900/50 border-gray-800",
                blue: "bg-blue-950/50 border-blue-900",
                pink: "bg-pink-950/50 border-pink-900"
              })}>
                <div className="flex justify-between items-center mb-2">
                  <div className={getThemeClasses({
                    base: "text-sm",
                    default: "text-white/70",
                    blue: "text-blue-200/70",
                    pink: "text-pink-200/70"
                  })}>
                    Total Flight Cost:
                                </div>
                  <div className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    ${form.watch('total_flight_cost') || 0}
                              </div>
                            </div>
                
                <div className="flex justify-between items-center mb-2">
                  <div className={getThemeClasses({
                    base: "text-sm",
                    default: "text-white/70",
                    blue: "text-blue-200/70",
                    pink: "text-pink-200/70"
                  })}>
                    Your Cost:
                  </div>
                  <div className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    ${(form.watch('total_flight_cost') || 0) - (form.watch('requested_share_amount') || 0)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className={getThemeClasses({
                    base: "text-sm",
                    default: "text-white/70",
                    blue: "text-blue-200/70",
                    pink: "text-pink-200/70"
                  })}>
                    Partner Cost:
                  </div>
                  <div className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    ${form.watch('requested_share_amount') || 0}
                  </div>
                </div>
                
                <div className="w-full h-px my-3 bg-gray-800"></div>
                
                <div className="flex justify-between items-center">
                  <div className={getThemeClasses({
                    base: "text-sm",
                    default: "text-white/70",
                    blue: "text-blue-200/70",
                    pink: "text-pink-200/70"
                  })}>
                    Cost per Seat (Avg):
                  </div>
                  <div className={getThemeClasses({
                    base: "font-medium",
                    default: "text-white",
                    blue: "text-blue-100",
                    pink: "text-pink-100"
                  })}>
                    ${form.watch('total_flight_cost') && form.watch('total_seats') 
                      ? Math.round((form.watch('total_flight_cost') || 0) / (form.watch('total_seats') || 1)) 
                      : 0}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>
        
        {/* Fixed navigation footer */}
        <div className="fixed bottom-0 left-0 right-0 w-full px-4 py-2 bg-black/80 backdrop-blur-sm border-t border-gray-800 z-20">
          <div className="max-w-screen-md mx-auto">
            {/* Navigation buttons with indicators between them */}
            <div className="flex justify-between items-center">
              {/* Back button */}
              <Button
                type="button"
                onClick={() => goToPrevSection()}
                className="w-32 md:w-36 h-11 rounded-md bg-[#DAFF0D] hover:bg-[#DAFF0D]/90 text-black font-medium"
              >
                <ChevronLeft className="h-5 w-5 mr-1 text-black" style={{ color: 'black', stroke: 'black', strokeWidth: 2 }} />
                Back
              </Button>
              
              {/* Step indicators between buttons */}
              <div className="flex justify-center">
                {Array.from({ length: totalSections }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 mx-1 rounded-full ${
                      index === activeSection 
                        ? "bg-[#DAFF0D]" 
                        : getThemeClasses({
                          base: "bg-opacity-30",
                          default: "bg-gray-400",
                          blue: "bg-blue-400",
                          pink: "bg-pink-400"
                        })
                    }`}
                  />
                ))}
              </div>
              
              {/* Submit button */}
              <Button
                type="button"
                onClick={() => {
                  // Validate form before submitting
                  form.trigger().then(isValid => {
                    if (isValid) {
                      console.log("Form is valid, submitting...");
                      // Ensure we have split configuration before submission
                      if (!splitConfiguration && visualizerRef.current) {
                        // Get current values from form
                        const totalSeats = form.getValues('total_seats') || 0;
                        const availableSeats = form.getValues('available_seats') || 0;
                        const yourSeats = totalSeats - availableSeats;
                        const percentage = totalSeats > 0 ? Math.round((yourSeats / totalSeats) * 100) : 50;
                        
                        // Create minimal split configuration
                        setSplitConfiguration({
                          jetId: selectedJetId || 'default',
                          splitOrientation: 'horizontal',
                          splitRatio: `${percentage}:${100-percentage}`,
                          splitPercentage: percentage,
                          allocatedSeats: { front: [] }
                        });
                      }
                      onSubmit(form.getValues());
                    } else {
                      // Show validation errors
                      console.log("Form validation failed");
                      toast.error('Please fix form errors before submitting');
                    }
                  });
                }}
                disabled={isSubmitting}
                className={`w-32 md:w-36 h-11 rounded-md font-medium ${
                  isSubmitting 
                    ? 'bg-green-700 text-white/70 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" style={getIconStyle(false)} />
                    Saving...
                  </>
                ) : (
                  <>
                    Submit
                    <ArrowRight className="h-5 w-5 ml-1 text-white" style={getIconStyle(false)} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN RETURN --- 
  if (isAuthenticating || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin gdyup-primary mb-4" />
        <p className={getThemeClasses({
          base: "text-center",
          default: "text-white/70",
          blue: "text-blue-200/70",
          pink: "text-pink-200/70"
        })}>Verifying authentication...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className={getThemeClasses({
          base: "p-4 mb-6 rounded-full",
          default: "bg-gdyup-primary/20 text-gdyup-primary",
          blue: "bg-blue-500/20 text-blue-500",
          pink: "bg-pink-500/20 text-pink-500"
        })}>
          <UserPlus className="h-12 w-12" />
        </div>
        <h2 className={getThemeClasses({
          base: "text-2xl font-bold mb-4",
          default: "text-white",
          blue: "text-blue-100",
          pink: "text-pink-100"
        })}>Authentication Required</h2>
        <p className={getThemeClasses({
          base: "mb-6 max-w-md",
          default: "text-white/70",
          blue: "text-blue-200/70",
          pink: "text-pink-200/70"
        })}>
          You need to be signed in to create a flight share offer. Please sign in or create an account to continue.
        </p>
        <Button
          onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
          className={getThemeClasses({
            base: "mb-4",
            default: "bg-gdyup-primary hover:bg-gdyup-primary/90 text-black",
            blue: "bg-blue-500 hover:bg-blue-600 text-white",
            pink: "bg-pink-500 hover:bg-pink-600 text-white"
          })}
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/jetshare')}
          className={getThemeClasses({
            base: "",
            default: "border-gray-700 text-white hover:bg-gray-800",
            blue: "border-blue-800 text-blue-100 hover:bg-blue-900",
            pink: "border-pink-800 text-pink-100 hover:bg-pink-900"
          })}
        >
          Return to JetShare Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className={getThemeClasses({
      base: "relative rounded-lg border shadow-sm overflow-hidden transition-colors",
      default: "bg-gray-900 border-gray-800",
      blue: "bg-blue-950 border-blue-900",
      pink: "bg-pink-950 border-pink-900"
    })}>
      {/* Inject the custom style to hide the input field */}
      <style>{customJetSelectorStyles}</style>
      
      <div className="p-4 md:p-6">
        {/* Form content */}
        <div className="relative">
          {/* Title area - single title only */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className={getThemeClasses({
                base: "text-xl font-bold",
                default: "text-white",
                blue: "text-blue-100", 
                pink: "text-pink-100"
              })}>
                {sections[activeSection]}
              </h2>
              
              <p className={getThemeClasses({
                base: "text-sm mt-1",
                default: "text-white/70",
                blue: "text-blue-200/70", 
                pink: "text-pink-200/70"
              })}>
                {activeSection === 0 && "Enter your flight route details for existing or new bookings"}
                {activeSection === 1 && "Use the dropdown below to select from your fleet or available options"}
                {activeSection === 2 && "Configure seat allocation between you and your partner"}
                {activeSection === 3 && "Set your share pricing and review details"}
              </p>
            </div>
          </div>
          
          {isEditMode && (
            <div className={getThemeClasses({
              base: "mb-4 p-3 rounded-md text-sm",
              default: "bg-amber-900/20 text-amber-400 border border-amber-900/30",
              blue: "bg-amber-900/20 text-amber-400 border border-amber-900/30",
              pink: "bg-amber-900/20 text-amber-400 border border-amber-900/30"
            })}>
              <div className="flex items-center">
                <Info className="w-5 h-5 mr-2 opacity-70" />
                <span>You are editing an existing offer. Changes will be saved when you submit.</span>
                                  </div>
                                </div>
                              )}
                              
          {/* Remove the main progress indicator */}
          
          {/* Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ 
                type: "spring",
                stiffness: 300, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="relative"
            >
              {/* Remove the progress dots from the top */}
              
              {/* Render the active section */}
              {activeSection === 0 && renderFlightDetailsSection()}
              {activeSection === 1 && renderAircraftSelectionSection()}
              {activeSection === 2 && renderSeatConfigurationSection()}
              {activeSection === 3 && renderCostDetailsSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
  
  // ... existing code ...



