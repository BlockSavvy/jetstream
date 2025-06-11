'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import Image from 'next/image';
import { Check, ChevronsUpDown, Loader2, Search, Plane, ChevronDown, User } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@headlessui/react';
import { createPortal } from 'react-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from "@/components/auth-provider";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

// Types for jet data
interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  tail_number: string;
  capacity: number | string;
  range_nm?: number | string;
  cruise_speed_kts?: number | string;
  image_url?: string;
  thumbnail_url?: string;
  description?: string;
  is_popular?: boolean;
  display_name?: string;
  year?: number | string;
  owner_id?: string;
  max_altitude?: number | string;
  cabin_width?: number | string;
  cabin_height?: number | string;
  cabin_length?: number | string;
  interior_image_url?: string;
  berths?: boolean;
  lavatory?: boolean;
  galley?: boolean;
  entertainment?: string;
  wifi?: boolean;
  interior_type?: string;
}

// Server-friendly props interface
export interface JetSelectorProps {
  value: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  onChangeValue?: string; // Serializable placeholder
  onChangeSeatCapacity?: number; // Serializable placeholder
  onCustomChangeValue?: string; // Serializable placeholder
  onBlur?: () => void;
  placeholder?: string;
}

// Client-only props interface with function handlers
interface ClientJetSelectorProps extends Omit<JetSelectorProps, 'onChangeValue' | 'onChangeSeatCapacity' | 'onCustomChangeValue'> {
  onChange: (value: string, seatCapacity?: number, jetId?: string) => void;
  onCustomChange?: (value: string) => void;
}

// Default image URL if none provided by API
const defaultImageUrl = '/images/jets/default-jet.png';

// The actual component implementation
function JetSelectorImpl({
  value,
  onChange,
  onCustomChange,
  disabled = false,
  className,
  id,
  onBlur,
  placeholder = "Select aircraft model"
}: ClientJetSelectorProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [jets, setJets] = useState<Jet[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedJet, setSelectedJet] = useState<Jet | null>(null);
  const [filterByCapacity, setFilterByCapacity] = useState<number | null>(null);
  // Add new state for filtering by user's own jets
  const [showOnlyMyJets, setShowOnlyMyJets] = useState(true);
  
  // Get user session to determine user's jets
  const { user, session } = useAuth();
  const userId = user ? user.id : null;
  
  // Get theme helpers
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  // Add ref to prevent update loops
  const isUpdatingRef = useRef(false);
  
  // Refs for positioning dropdown correctly
  const inputRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0
  });
  
  // Add state for portal container
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // Add state to track failed image loads to prevent infinite retries
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(new Set());
  
  // Initialize portal container on mount
  useEffect(() => {
    // Check if document is available (only in browser)
    if (typeof document !== 'undefined') {
      // Create or find the portal container
      let container = document.getElementById('dropdown-portal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'dropdown-portal-container';
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '0';
        container.style.overflow = 'visible';
        container.style.zIndex = '9999';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    }
    
    // Cleanup function to remove the container when component unmounts
    return () => {
      if (typeof document !== 'undefined' && !document.getElementById('keep-dropdown-portal')) {
        const container = document.getElementById('dropdown-portal-container');
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    };
  }, []);
  
  // Calculate dropdown position when opened
  useEffect(() => {
    if (open && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [open]);
  
  // Add a function to handle errors with more detail
  const logError = (msg: string, error: any) => {
    console.error(`JetSelector Error - ${msg}:`, 
      error instanceof Error ? `${error.name}: ${error.message}` : error
    );
  };

  // Log successful jet loading
  const logJetsLoaded = (count: number, source: string) => {
    console.log(`JetSelector - Loaded ${count} jets successfully from ${source}`);
  };

  // Function to safely handle image URLs
  const getSafeImageUrl = (jet: Jet): string => {
    // If there's a valid image URL and it hasn't failed before, use it
    if (jet.image_url && !failedImageUrls.has(jet.image_url)) {
      return jet.image_url;
    }
    
    // Otherwise use placeholder
    return "/images/placeholder-jet.jpg";
  };

  // Add fetchJets function to load jets from API
  useEffect(() => {
    const fetchJets = async () => {
      if (jets.length > 0) return; // Skip if we already have jets loaded
      
      setIsLoading(true);
      
      try {
        // Use the correct API endpoint for GDYUP with correct parameters
        let apiUrl = '/api/jetshare/getJets';
        
        // Add timestamp to prevent caching issues
        const timestamp = Date.now();
        apiUrl += `?t=${timestamp}`;
        
        console.log(`Fetching jets from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.jets && Array.isArray(data.jets)) {
          console.log(`Successfully fetched ${data.jets.length} jets from database`);
          
          const jetsList = data.jets.map((jet: Jet) => ({
            ...jet,
            display_name: `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`,
            image_url: jet.image_url || getSafeImageUrl(jet)
          }));
          
          setJets(jetsList);
          
          // Extract and set unique manufacturers for filtering
          if (jetsList.length > 0) {
            const uniqueManufacturers = [...new Set(jetsList.map((jet: Jet) => jet.manufacturer))].sort();
            setManufacturers(uniqueManufacturers as string[]);
          }
          
          logJetsLoaded(jetsList.length, 'API');
        } else {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        logError('Error fetching jets', error);
        // Fall back to default jets if API fails
        setJets([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJets();
  }, [getSafeImageUrl, logJetsLoaded, logError]);

  // Move the fetchJetDetails function to the beginning
  const fetchJetDetails = async (jetId: string) => {
    try {
      console.log(`Fetching complete details for jet ID: ${jetId}`);
      
      // Add timestamp to the URL to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/jetshare/getJet?jet_id=${jetId}&t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jet details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Retrieved complete jet details:', data);
      
      if (data && data.jet) {
        // Dispatch jet change event with the fetched details
        console.log(`[JetSelector fetchJetDetails] Preparing to dispatch jetchange for ID: ${jetId}`, data.jet);
        
        // Make sure we're using the fetched data, not stale state
        updateSelectedState(data.jet);
        
        return data.jet;
      } else {
        throw new Error('Invalid response format: missing jet data');
      }
    } catch (error) {
      console.error('Error fetching jet details:', error);
      return null;
    }
  };

  // Add a function to generate optimal layouts based on seat count
  const generateOptimalLayout = (seatCount: number) => {
    if (!seatCount || seatCount <= 0) return null;
    
    console.log(`[generateOptimalLayout] Generating layout for ${seatCount} seats`);
    
    // Generate layout based on seat count
    let rows, seatsPerRow;
    let skipPositions: string[] = [];
    
    // For jets with different seat counts, determine an optimal layout
    if (seatCount <= 6) {
      // Small jets: 2-3 seats per row
      seatsPerRow = 2;
      rows = Math.ceil(seatCount / seatsPerRow);
    } else if (seatCount <= 9) {
      // Medium jets: 3 seats per row
      seatsPerRow = 3;
      rows = Math.ceil(seatCount / seatsPerRow);
    } else if (seatCount <= 12) {
      // Standard configuration: 4 seats per row with aisle
      seatsPerRow = 4;
      rows = Math.ceil(seatCount / seatsPerRow);
      
      // Create an aisle in the middle
      for (let r = 0; r < rows; r++) {
        skipPositions.push(`${r},${Math.floor(seatsPerRow / 2)}`);
      }
    } else if (seatCount === 14) {
      // Special case for 14 seats: 5 columns with middle aisle, 4 rows
      seatsPerRow = 5; 
      rows = 4;
      
      // Skip the middle position in all rows to create an aisle
      for (let r = 0; r < rows; r++) {
        skipPositions.push(`${r},2`);
      }
      
      // Create a wider space in back rows
      skipPositions.push(`3,0`);
      skipPositions.push(`3,4`);
    } else {
      // Larger configurations: 6 seats per row with aisle
      seatsPerRow = 6;
      rows = Math.ceil(seatCount / seatsPerRow);
      
      // Create an aisle in the middle
      for (let r = 0; r < rows; r++) {
        skipPositions.push(`${r},2`);
        skipPositions.push(`${r},3`);
      }
    }
    
    // Calculate total grid positions
    const totalPositions = rows * seatsPerRow - skipPositions.length;
    
    // Skip additional positions if needed
    if (totalPositions > seatCount) {
      const extraToSkip = totalPositions - seatCount;
      
      // Skip from the back rows
      let skipped = 0;
      for (let r = rows - 1; r >= 0 && skipped < extraToSkip; r--) {
        for (let c = seatsPerRow - 1; c >= 0 && skipped < extraToSkip; c--) {
          const posStr = `${r},${c}`;
          if (!skipPositions.includes(posStr)) {
            skipPositions.push(posStr);
            skipped++;
          }
        }
      }
    }
    
    return {
      rows,
      seatsPerRow,
      layoutType: 'generated' as const,
      totalSeats: seatCount,
      skipPositions
    };
  };

  // Update the selected state and dispatch events
  const updateSelectedState = useCallback((jet: any) => {
    console.log(`[updateSelectedState] Called with jet:`, jet);
    
    // Prevent duplicate updates during processing
    if (isUpdatingRef.current) {
      console.log('[updateSelectedState] Update already in progress, skipping.');
      return;
    }
    
    isUpdatingRef.current = true;
    console.log('[updateSelectedState] isUpdatingRef set to true.');

    try {
      console.log('[updateSelectedState] Setting selected jet state...');
      setSelectedJet(jet);
      
      // Get a safe image URL, defaulting to the placeholder if needed
      console.log('[updateSelectedState] Getting safe image URL...');
      const imageUrl = jet.image_url || defaultImageUrl;
      
      // Parse numeric fields from API response
      console.log('[updateSelectedState] Parsing numeric fields...');
      const capacity = parseInt(String(jet.capacity)) || 0;
      const range = parseInt(String(jet.range_nm)) || 0;
      const cruiseSpeed = parseInt(String(jet.cruise_speed_kts)) || 0;
      const maxAltitude = parseInt(String(jet.max_altitude)) || 0;
      const cabinWidth = parseInt(String(jet.cabin_width)) || 0;
      const cabinHeight = parseInt(String(jet.cabin_height)) || 0;
      const cabinLength = parseInt(String(jet.cabin_length)) || 0;
      const year = parseInt(String(jet.year)) || 0;
      
      console.log('[updateSelectedState] Numeric fields parsed successfully.');
      
      // Create a custom layout if needed based on capacity
      let customLayout = null;
      
      // Generate an optimal seat layout based on the capacity
      // CRITICAL: Let the seatCount be directly determined by the jet's capacity from the API
      if (capacity > 0) {
        customLayout = generateOptimalLayout(capacity);
        console.log(`[updateSelectedState] Generated custom layout for capacity: ${capacity}`, customLayout);
      }
      
      // Create a comprehensive payload including ALL fields from the API
      console.log('[updateSelectedState] Dispatching event via setTimeout...');
      
      // Use setTimeout to avoid React state update loops
      setTimeout(() => {
        console.log('[updateSelectedState setTimeout] Dispatching jetchange event NOW.');
        
        // Create complete event payload with all data from the original jet object
        const eventDetailPayload = {
          // Start with ALL properties from the original jet object
          ...jet,
          // Then override or add specific fields we've processed
          value: `${jet.manufacturer || 'Unknown'} ${jet.model || 'Model'}`,
          jetId: jet.id,
          id: jet.id, // Ensure id is set for JetDetailsTabs
          seatCapacity: capacity,
          range: range,
          cruise_speed_kts: cruiseSpeed,
          max_altitude: maxAltitude,
          cabin_width: cabinWidth,
          cabin_height: cabinHeight,
          cabin_length: cabinLength,
          year: year,
          manufacturer: jet.manufacturer || 'Unknown',
          model: jet.model || 'Model',
          tail_number: jet.tail_number || 'N/A',
          owner_id: jet.owner_id,
          image_url: imageUrl,
          interior_image_url: jet.interior_image_url,
          // Include missing amenity fields (defaulting to false/null if not present)
          berths: jet.berths || false,
          lavatory: jet.lavatory || false,
          galley: jet.galley || false,
          wifi: jet.wifi || false,
          entertainment: jet.entertainment || null,
          interior_type: jet.interior_type || null,
          // Include custom layout if generated
          has_custom_layout: !!customLayout,
          custom_layout: customLayout
        };
        
        console.log('[updateSelectedState] Event payload created with all jet data fields', eventDetailPayload);
        
        // Dispatch the event
        const jetChangeEvent = new CustomEvent('jetchange', {
          detail: eventDetailPayload,
          bubbles: true
        });
        
        window.dispatchEvent(jetChangeEvent);
        console.log('[updateSelectedState setTimeout] Event dispatched. Resetting isUpdatingRef.');
        
        // Reset the updating ref
        isUpdatingRef.current = false;
      }, 0);
    } catch (error) {
      console.error('[updateSelectedState] Error updating selected state:', error);
      isUpdatingRef.current = false;
    }
  }, [defaultImageUrl, generateOptimalLayout]);

  // Modify handleSelect
  const handleSelect = (currentValue: string, jet: Jet) => {
    console.log(`[handleSelect] Jet selected: ${currentValue}, ID: ${jet.id}. Fetching details...`);
    fetchJetDetails(jet.id);
    setOpen(false);
    
    // isUpdatingRef will be reset within updateSelectedState's setTimeout
  };
  
  // Handle custom input change
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent re-entrancy
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    const newValue = e.target.value;
    setCustomValue(newValue);
    
    // Use timeouts to break potential update loops
    setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
      
      if (onCustomChange) {
        onCustomChange(newValue);
      }
      
      // Reset flag after callbacks are executed
      isUpdatingRef.current = false;
    }, 0);
  };
  
  // Toggle My Jets filter
  const toggleMyJetsFilter = () => {
    setShowOnlyMyJets(prev => !prev);
  };
  
  // Capacity filter options
  const capacityFilters = [
    { label: 'All', value: null },
    { label: '4+ seats', value: 4 },
    { label: '8+ seats', value: 8 },
    { label: '12+ seats', value: 12 },
    { label: '16+ seats', value: 16 }
  ];
  
  // Add a more robust function for getting capacity display
  const formatCapacity = (capacity: number | string | undefined | null): string => {
    if (capacity === undefined || capacity === null) {
      return '?';
    }
    
    // Handle both string and number types
    const capacityStr = String(capacity);
    
    // If it's "0", treat it as unknown
    if (capacityStr === '0') {
      return '?';
    }
    
    return capacityStr;
  };

  // Filter jets based on search, manufacturer, capacity, and user ownership
  const filteredJets = useMemo(() => {
    // Log the current jets for debugging
    console.log('[JetSelector] Current jets state before filtering:', jets);
    
    return jets.filter((jet: Jet) => {
      const displayName = jet.display_name || `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`;
      
      // Check if jet matches search criteria
      const matchesSearch = !search || 
        displayName.toLowerCase().includes(search.toLowerCase()) ||
        jet.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
        jet.model.toLowerCase().includes(search.toLowerCase()) ||
        (jet.tail_number && jet.tail_number.toLowerCase().includes(search.toLowerCase()));
      
      // Check if jet matches manufacturer filter
      const matchesManufacturer = !selectedManufacturer || 
        jet.manufacturer === selectedManufacturer;
      
      // Handle capacity comparison safely with numeric conversion
      const jetCapacity = typeof jet.capacity === 'string' ? 
        parseInt(jet.capacity) : 
        jet.capacity;
      
      const matchesCapacity = !filterByCapacity || 
        (typeof jetCapacity === 'number' && jetCapacity >= filterByCapacity);
      
      // Check if the jet belongs to the current user 
      // (only if showOnlyMyJets is true AND we have a userId)
      const isOwnedByUser = !showOnlyMyJets || !userId || jet.owner_id === userId;
      
      return matchesSearch && matchesManufacturer && matchesCapacity && isOwnedByUser;
    });
  }, [jets, search, selectedManufacturer, filterByCapacity, showOnlyMyJets, userId]);

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between relative border-gdyup-border bg-gdyup-bg-dark",
              "hover:bg-gdyup-bg-card transition-colors",
              "text-left font-normal h-14",
              selectedJet ? "text-gdyup-text" : "text-gdyup-text-subtle",
              className
            )}
            onClick={() => setOpen(!open)}
            id={id}
            onBlur={onBlur}
          >
            {isLoading ? (
              <Skeleton className="h-5 w-full" />
            ) : selectedJet ? (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gdyup-bg-card border border-gdyup-border">
                  {selectedJet.image_url && !failedImageUrls.has(selectedJet.image_url) ? (
                    <img 
                      src={selectedJet.image_url} 
                      alt={`${selectedJet.manufacturer} ${selectedJet.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log("Jet image failed to load, using placeholder");
                        // Add the failed URL to our Set to prevent future attempts
                        setFailedImageUrls(prev => new Set([...prev, selectedJet.image_url as string]));
                        e.currentTarget.src = "/images/placeholder-jet.jpg";
                      }}
                    />
                  ) : (
                    <Plane className={cn("h-5 w-5 m-auto", getThemedTextClasses('primary'))} />
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-medium truncate text-gdyup-text">
                    {selectedJet.manufacturer} {selectedJet.model}
                  </span>
                  <span className="text-xs text-gdyup-text-subtle">
                    {formatCapacity(selectedJet.capacity)} seats • {selectedJet.range_nm ? formatCapacity(selectedJet.range_nm) : '?'} nm range
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gdyup-text-subtle">{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            
            {selectedJet && (
              <Badge 
                className={cn(
                  "absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/4", 
                  getThemedBackgroundClasses('primary'),
                  "text-gdyup-button-text"
                )}
                variant="default"
              >
                Selected
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 max-h-[60vh] md:w-[400px] bg-gdyup-bg-dark border-gdyup-border text-gdyup-text">
          <Command className="w-full bg-gdyup-bg-dark text-gdyup-text">
            <div className="flex items-center border-b border-gdyup-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gdyup-text-subtle" />
              <CommandInput 
                placeholder="Search jets..." 
                className="h-9 flex-1 bg-transparent text-gdyup-text placeholder:text-gdyup-text-subtle focus:outline-none"
                value={search}
                onValueChange={setSearch}
              />
            </div>
            
            {/* Filter toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gdyup-border overflow-x-auto">
              {/* My Jets Filter */}
              <Button
                size="sm"
                variant={showOnlyMyJets ? "default" : "outline"}
                className={cn(
                  "text-xs h-7 px-2",
                  showOnlyMyJets 
                    ? cn(getThemedButtonClasses('primary'), "text-gdyup-button-text")
                    : "bg-gdyup-bg-card text-gdyup-text-medium hover:bg-gdyup-bg-card/80 border-gdyup-border"
                )}
                onClick={toggleMyJetsFilter}
              >
                <User className="h-3 w-3 mr-1" />
                My Jets
              </Button>
              
              {/* Capacity filters */}
              {capacityFilters.map((filter) => (
                <Button
                  key={filter.label}
                  size="sm"
                  variant={filterByCapacity === filter.value ? "default" : "outline"}
                  className={cn(
                    "text-xs h-7 px-2",
                    filterByCapacity === filter.value 
                      ? cn(getThemedButtonClasses('primary'), "text-gdyup-button-text")
                      : "bg-gdyup-bg-card text-gdyup-text-medium hover:bg-gdyup-bg-card/80 border-gdyup-border"
                  )}
                  onClick={() => setFilterByCapacity(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            
            <CommandList className="max-h-[300px] overflow-auto bg-gdyup-bg-dark">
              <CommandEmpty className="py-6 text-center text-sm text-gdyup-text-subtle">
                No jets found.
              </CommandEmpty>
              <CommandGroup className="bg-gdyup-bg-dark">
                {isLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="px-2 py-1.5">
                      <Skeleton className="h-14 w-full rounded-md bg-gdyup-bg-card" />
                    </div>
                  ))
                ) : (
                  filteredJets.map((jet) => {
                    const jetName = `${jet.manufacturer} ${jet.model}`;
                    const isSelected = selectedJet?.id === jet.id;
                    const isOwned = jet.owner_id === userId;
                    
                    return (
                      <CommandItem
                        key={jet.id}
                        value={jetName}
                        onSelect={() => handleSelect(jetName, jet)}
                        className={cn(
                          "flex justify-between py-3 px-2 cursor-pointer relative overflow-hidden",
                          isSelected 
                            ? "bg-gdyup-bg-card border-2 border-gdyup-primary shadow-lg text-gdyup-text"
                            : isOwned 
                              ? "bg-gdyup-bg-card/80 border border-gdyup-primary/30 rounded-md text-gdyup-text" 
                              : "hover:bg-gdyup-bg-card hover:text-gdyup-text"
                        )}
                      >
                        <div className="flex items-center gap-2 z-10 relative">
                          <div className="relative w-12 h-12 rounded overflow-hidden border border-gdyup-border flex-shrink-0">
                            {jet.image_url && !failedImageUrls.has(jet.image_url) ? (
                              <img 
                                src={jet.image_url}
                                alt={jetName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log("Jet image failed to load, using placeholder");
                                  // Add the failed URL to our Set to prevent future attempts
                                  setFailedImageUrls(prev => new Set([...prev, jet.image_url as string]));
                                  e.currentTarget.src = "/images/placeholder-jet.jpg";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gdyup-bg-dark flex items-center justify-center">
                                <Plane className={cn("h-5 w-5", getThemedTextClasses('primary'))} />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              isSelected ? "text-gdyup-text" : "text-gdyup-text-medium"
                            )}>
                              {jetName}
                            </p>
                            {jet.tail_number && (
                              <p className={cn(
                                "text-xs", 
                                isSelected ? "text-gdyup-text-medium" : "text-gdyup-text-subtle"
                              )}>
                                Tail: {jet.tail_number}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 z-10 relative">
                          {isOwned && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "border-gdyup-primary/70 text-gdyup-primary bg-gdyup-bg-card/50 text-xs", 
                                isSelected && "border-gdyup-primary bg-gdyup-bg-dark/60 text-gdyup-primary"
                              )}
                            >
                              My Jet
                            </Badge>
                          )}
                          <p className={cn(
                            "text-sm", 
                            isSelected ? 'text-gdyup-text-medium' : 'text-gdyup-text-subtle'
                          )}>
                            {formatCapacity(jet.capacity)} Seats
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Custom input field that appears when "Other" is selected */}
      {showCustomInput && (
        <Input
          value={customValue}
          onChange={handleCustomInputChange}
          placeholder="Enter custom aircraft model"
          className="mt-2 bg-gdyup-bg-card border-gdyup-border text-gdyup-text placeholder:text-gdyup-text-subtle"
        />
      )}
    </div>
  );
}

// Public API - This is the component that gets exported and used
export default function JetSelector(props: JetSelectorProps) {
  // Use a client-side effect to handle the non-serializable callbacks
  const [mounted, setMounted] = useState(false);
  const { getThemedBackgroundClasses } = useGdyupTheme();
  
  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render until client-side to avoid hydration issues
  if (!mounted) {
    return <div className={cn(props.className || "w-full h-10 rounded-lg animate-pulse", getThemedBackgroundClasses('card'))} />;
  }
  
  // Transform serializable props to actual function handlers
  const clientProps: ClientJetSelectorProps = {
    ...props,
    onChange: (value: string, seatCapacity?: number, jetId?: string) => {
      // This function satisfies the type but doesn't need to dispatch the primary event
      // Log for debugging if needed
      // console.log(`[JetSelector Wrapper onChange Stub] Called with value: ${value}`);
    },
    onCustomChange: props.onCustomChangeValue 
      ? (value: string) => {
          if (typeof window === 'undefined') return;
          const event = new CustomEvent('jetcustomchange', {
            detail: { value }
          });
          window.dispatchEvent(event);
        }
      : undefined
  };
  
  // Return the component directly - we've hardened it against session errors
  return <JetSelectorImpl {...clientProps} />;
} 