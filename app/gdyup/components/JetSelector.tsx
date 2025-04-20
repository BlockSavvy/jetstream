'use client';

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
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

  // Fetch jets from API
  useEffect(() => {
    const fetchJets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        
        // First attempt with credentials
        console.log('Attempting to fetch jets with credentials...');
        try {
          const response = await fetch(`/api/jetshare/getJets?t=${timestamp}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            credentials: 'include' // Include cookies
          });
          
          // If we got a successful response, process it
          if (response.ok) {
            const data = await response.json();
            console.log('Jets API response:', data);
            
            if (data.jets && Array.isArray(data.jets) && data.jets.length > 0) {
              // Type-safe cast of the jets
              const loadedJets = data.jets as Jet[];
              
              // Debug: log the first jet to see its structure
              if (loadedJets.length > 0) {
                console.log('Sample jet data structure:', loadedJets[0]);
              }
              
              // Enhance jets with display_name and use safer image URL handling
              const enhancedJets = loadedJets.map(jet => {
                // Log any jets with string capacity to debug
                if (typeof jet.capacity === 'string') {
                  console.log(`Jet with string capacity: ${jet.id} - ${jet.manufacturer} ${jet.model} - capacity: ${jet.capacity}`);
                }
                
                return {
                  ...jet,
                  display_name: `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`,
                  // Use the safe image function to get the thumbnail URL
                  thumbnail_url: getSafeImageUrl(jet)
                };
              });
              
              setJets(enhancedJets);
              logJetsLoaded(enhancedJets.length, 'API');
              
              // Extract unique manufacturers
              const uniqueManufacturers: string[] = [...new Set(
                enhancedJets.map(jet => String(jet.manufacturer))
                  .filter(mfr => typeof mfr === 'string' && mfr.length > 0)
              )];
              setManufacturers(uniqueManufacturers);
              
              // Reset retry count on success
              setRetryCount(0);
              return; // Exit early on success
            }
          } else if (response.status === 401) {
            // If unauthorized, try the fallback approach
            console.log('Auth error (401), trying alternative fetch...');
            // Continue to fallback attempt below
          } else {
            // For other error status codes
            throw new Error(`Failed to fetch jets: ${response.status} ${response.statusText}`);
          }
        } catch (credentialError) {
          console.error('Error in credentials fetch:', credentialError);
          // Continue to fallback attempt
        }
        
        // Second attempt without credentials if the first failed
        console.log('Trying direct fetch without auth...');
        const fallbackResponse = await fetch(`/api/jetshare/getJets?t=${timestamp + 1}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Content-Type': 'application/json',
          },
          // No credentials included
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback fetch failed: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.jets && Array.isArray(fallbackData.jets) && fallbackData.jets.length > 0) {
          // Process data as before
          const loadedJets = fallbackData.jets as Jet[];
          
          const enhancedJets = loadedJets.map(jet => {
            return {
              ...jet,
              display_name: `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`,
              thumbnail_url: getSafeImageUrl(jet)
            };
          });
          
          setJets(enhancedJets);
          logJetsLoaded(enhancedJets.length, 'API (fallback)');
          
          const uniqueManufacturers: string[] = [...new Set(
            enhancedJets.map(jet => String(jet.manufacturer))
              .filter(mfr => typeof mfr === 'string' && mfr.length > 0)
          )];
          setManufacturers(uniqueManufacturers);
          
          // Reset retry count on success
          setRetryCount(0);
        } else {
          logError('API returned empty or invalid jets', 
            { responseStatus: fallbackResponse.status, data: fallbackData }
          );
          throw new Error('Invalid response format or empty jets list');
        }
      } catch (error) {
        logError('Error fetching jets', error);
        
        // Check if we should retry (up to 3 times)
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          
          // Wait a bit before retrying (exponential backoff)
          const retryDelay = Math.pow(2, retryCount) * 500;
          console.log(`Retrying jets fetch in ${retryDelay}ms...`);
          
          setTimeout(() => {
            fetchJets();
          }, retryDelay);
          return;
        }
        
        // If all attempts fail, use fallback data
        setError('Using fallback jet data - you can still select models');
        
        // Provide fallback data when API fails
        const fallbackJets: Jet[] = [
          { 
            id: 'gulfstream-g650', 
            manufacturer: 'Gulfstream', 
            model: 'G650', 
            tail_number: 'N1JS',
            display_name: 'Gulfstream G650 (N1JS)', 
            capacity: 19,
            is_popular: true,
            image_url: "/images/placeholder-jet.jpg"
          },
          { 
            id: 'bombardier-global-7500', 
            manufacturer: 'Bombardier', 
            model: 'Global 7500', 
            tail_number: 'N2JS',
            display_name: 'Bombardier Global 7500 (N2JS)', 
            capacity: 19,
            is_popular: true,
            image_url: "/images/placeholder-jet.jpg"
          },
          { 
            id: 'embraer-phenom-300e', 
            manufacturer: 'Embraer', 
            model: 'Phenom 300E', 
            tail_number: 'N3JS',
            display_name: 'Embraer Phenom 300E (N3JS)', 
            capacity: 10,
            is_popular: true,
            image_url: "/images/placeholder-jet.jpg"
          },
          { 
            id: 'cessna-citation-longitude', 
            manufacturer: 'Cessna', 
            model: 'Citation Longitude', 
            tail_number: 'N4JS',
            display_name: 'Cessna Citation Longitude (N4JS)', 
            capacity: 12,
            image_url: "/images/placeholder-jet.jpg"
          },
          { 
            id: 'dassault-falcon-8x', 
            manufacturer: 'Dassault', 
            model: 'Falcon 8X', 
            tail_number: 'N5JS',
            display_name: 'Dassault Falcon 8X (N5JS)', 
            capacity: 16,
            image_url: "/images/placeholder-jet.jpg"
          },
          { 
            id: 'other-custom', 
            manufacturer: 'Other', 
            model: 'Custom', 
            tail_number: '',
            display_name: 'Other (Custom Aircraft)', 
            capacity: 8,
            image_url: "/images/placeholder-jet.jpg"
          }
        ];
        
        setJets(fallbackJets);
        // Extract manufacturers as string array
        const fallbackManufacturers: string[] = [...new Set(
          fallbackJets.map(jet => jet.manufacturer)
        )];
        setManufacturers(fallbackManufacturers);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJets();
  }, []);
  
  // Check if current value is "Other" and show custom input
  useEffect(() => {
    // Prevent re-entrancy during updates
    if (isUpdatingRef.current) return;
    
    // Need to check against display_name which we create from manufacturer and model
    const jet = jets.find(j => 
      `${j.manufacturer} ${j.model}${j.tail_number ? ` (${j.tail_number})` : ''}` === value ||
      j.display_name === value
    );
    
    // Special case for "Other (Custom Aircraft)" or any custom model not in our list
    if ((!jet && value) || (jet && jet.model === 'Custom')) {
      setShowCustomInput(true);
      setCustomValue(value);
    } else {
      setShowCustomInput(false);
    }
  }, [value, jets]);
  
  // Filter the jets based on search, selected manufacturer, and owner
  const filteredJets = jets.filter(jet => {
    const displayName = jet.display_name || `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`;
    
    const matchesSearch = !search || 
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      jet.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      jet.model.toLowerCase().includes(search.toLowerCase()) ||
      (jet.tail_number && jet.tail_number.toLowerCase().includes(search.toLowerCase()));
      
    const matchesManufacturer = !selectedManufacturer || jet.manufacturer === selectedManufacturer;
    
    // Handle capacity comparison safely by ensuring numeric comparison
    const jetCapacity = typeof jet.capacity === 'string' ? parseInt(jet.capacity) : jet.capacity;
    const matchesCapacity = filterByCapacity ? jetCapacity >= filterByCapacity : true;
    
    // Check if the jet belongs to the current user (only if showOnlyMyJets is true AND we have a userId)
    const isOwnedByUser = !showOnlyMyJets || !userId || jet.owner_id === userId;
    
    return matchesSearch && matchesManufacturer && matchesCapacity && isOwnedByUser;
  });
  
  // Modify the updateSelectedState function to include more detailed jet information
  const updateSelectedState = (jet: Jet) => {
    // Prevent re-entrancy
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    setSelectedJet(jet);
    
    // Use the safe image URL helper function
    const imageUrl = getSafeImageUrl(jet);
    
    // Ensure numeric fields are properly parsed
    const capacity = typeof jet.capacity === 'string' ? parseInt(jet.capacity) : jet.capacity;
    const range = jet.range_nm ? (typeof jet.range_nm === 'string' ? parseInt(jet.range_nm) : jet.range_nm) : null;
    const cruiseSpeed = jet.cruise_speed_kts ? (typeof jet.cruise_speed_kts === 'string' ? parseInt(jet.cruise_speed_kts) : jet.cruise_speed_kts) : null;
    const maxAltitude = jet.max_altitude ? (typeof jet.max_altitude === 'string' ? parseInt(jet.max_altitude) : jet.max_altitude) : null;
    const cabinWidth = jet.cabin_width ? (typeof jet.cabin_width === 'string' ? parseFloat(jet.cabin_width) : jet.cabin_width) : null;
    const cabinHeight = jet.cabin_height ? (typeof jet.cabin_height === 'string' ? parseFloat(jet.cabin_height) : jet.cabin_height) : null;
    const cabinLength = jet.cabin_length ? (typeof jet.cabin_length === 'string' ? parseFloat(jet.cabin_length) : jet.cabin_length) : null;
    const year = jet.year ? (typeof jet.year === 'string' ? parseInt(jet.year) : jet.year) : null;
    
    // Log the jet data for debugging
    console.log('Selected jet data:', {
      id: jet.id,
      manufacturer: jet.manufacturer,
      model: jet.model,
      capacity,
      range,
      cruiseSpeed,
      tailNumber: jet.tail_number,
      imageUrl
    });
    
    // Dispatch the custom event with the full jet data
    const jetChangeEvent = new CustomEvent('jetchange', {
      detail: {
        value: `${jet.manufacturer} ${jet.model}`,
        jetId: jet.id,
        seatCapacity: capacity,
        range,
        cruise_speed_kts: cruiseSpeed,
        max_altitude: maxAltitude,
        cabin_width: cabinWidth,
        cabin_height: cabinHeight,
        cabin_length: cabinLength,
        year,
        manufacturer: jet.manufacturer,
        model: jet.model,
        tail_number: jet.tail_number,
        owner_id: jet.owner_id,
        // Always use the safe image URL
        image_url: imageUrl
      }
    });
    
    // Use setTimeout to break the update loop
    setTimeout(() => {
      window.dispatchEvent(jetChangeEvent);
      // Reset flag after event is dispatched
      isUpdatingRef.current = false;
    }, 0);
  };

  // When handling the jet selection, use this function
  const handleSelect = (currentValue: string, jet: Jet) => {
    // Prevent re-entrancy
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // Fetch complete jet details when selected
    fetchJetDetails(jet.id, jet);
    setOpen(false);
    
    // Use timeout to break potential update loops
    if (onChange) {
      setTimeout(() => {
        onChange(currentValue);
        // We don't reset isUpdatingRef here because updateSelectedState will do it
      }, 0);
    } else {
      // If no onChange, we need to reset the flag
      isUpdatingRef.current = false;
    }
  };
  
  // Add a new function to fetch complete jet details
  const fetchJetDetails = async (jetId: string, fallbackJet: Jet) => {
    console.log(`Fetching complete details for jet ID: ${jetId}`);
    
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/jetshare/getJet?jet_id=${jetId}&t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jet details: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.jet) {
        console.log('Retrieved complete jet details:', data.jet);
        
        // Create a merged jet object that combines the original jet with the detailed data
        const detailedJet: Jet = {
          ...fallbackJet,
          ...data.jet,
          // Ensure these fields are preserved from the original if they exist
          display_name: fallbackJet.display_name || `${data.jet.manufacturer} ${data.jet.model}`,
          image_url: data.jet.image_url || fallbackJet.image_url
        };
        
        // Update the state with the detailed jet information
        updateSelectedState(detailedJet);
      } else {
        // If we couldn't get detailed data, use what we have
        console.warn('No jet details returned from API, using existing data');
        updateSelectedState(fallbackJet);
      }
    } catch (error) {
      console.error('Error fetching jet details:', error);
      // Fall back to using the existing jet data
      updateSelectedState(fallbackJet);
    }
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
              "w-full justify-between relative border-gray-700 bg-black",
              "hover:bg-gray-900 transition-colors",
              "text-left font-normal h-14",
              selectedJet ? "text-white" : "text-gray-500",
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
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-800 border border-gray-700">
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
                    <Plane className="h-5 w-5 text-[#DAFF0D] m-auto" />
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-medium truncate text-white">
                    {selectedJet.manufacturer} {selectedJet.model}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatCapacity(selectedJet.capacity)} seats • {selectedJet.range_nm ? formatCapacity(selectedJet.range_nm) : '?'} nm range
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            
            {selectedJet && (
              <Badge 
                className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/4 bg-[#DAFF0D] text-black"
                variant="default"
              >
                Selected
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 max-h-[60vh] md:w-[400px] bg-black border-gray-800 text-white">
          <Command className="w-full bg-black text-white">
            <div className="flex items-center border-b border-gray-800 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />
              <CommandInput 
                placeholder="Search jets..." 
                className="h-9 flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
                value={search}
                onValueChange={setSearch}
              />
            </div>
            
            {/* Filter toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-800 overflow-x-auto">
              {/* My Jets Filter */}
              <Button
                size="sm"
                variant={showOnlyMyJets ? "default" : "outline"}
                className={cn(
                  "text-xs h-7 px-2",
                  showOnlyMyJets 
                    ? "bg-[#DAFF0D] text-black hover:bg-[#E8FF4D]" 
                    : "bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-700"
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
                      ? "bg-[#DAFF0D] text-black hover:bg-[#E8FF4D]" 
                      : "bg-gray-900 text-gray-300 hover:bg-gray-800 border-gray-700"
                  )}
                  onClick={() => setFilterByCapacity(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            
            <CommandList className="max-h-[300px] overflow-auto bg-black">
              <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                No jets found.
              </CommandEmpty>
              <CommandGroup className="bg-black">
                {isLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="px-2 py-1.5">
                      <Skeleton className="h-14 w-full rounded-md bg-gray-800" />
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
                            ? "bg-blue-900/40 border-2 border-primary shadow-md relative" 
                            : isOwned 
                              ? "bg-gray-800/80 border border-[#DAFF0D]/30 rounded-md" 
                              : "hover:bg-gray-700/50",
                        )}
                      >
                        {/* Selected jet overlay with gradient */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-800/40 to-purple-700/40 z-0" />
                        )}
                        
                        <div className="flex items-center gap-2 z-10 relative">
                          <div className="relative w-12 h-12 rounded overflow-hidden border border-gray-600 flex-shrink-0">
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
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <Plane className="h-5 w-5 text-[#DAFF0D]" />
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <p className={cn(
                              "font-medium text-sm",
                              isSelected ? "text-white" : "text-gray-200"
                            )}>
                              {jetName}
                            </p>
                            {jet.tail_number && (
                              <p className="text-xs text-gray-400">
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
                                "border-[#DAFF0D]/70 text-[#DAFF0D] bg-gray-900/50 text-xs", 
                                isSelected && "border-[#DAFF0D] bg-gray-900/80"
                              )}
                            >
                              My Jet
                            </Badge>
                          )}
                          <p className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
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
          className="mt-2 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
        />
      )}
    </div>
  );
}

// Public API - This is the component that gets exported and used
export default function JetSelector(props: JetSelectorProps) {
  // Use a client-side effect to handle the non-serializable callbacks
  const [mounted, setMounted] = useState(false);
  
  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render until client-side to avoid hydration issues
  if (!mounted) {
    return <div className={props.className || "w-full h-10 bg-gray-700/70 rounded-lg animate-pulse"} />;
  }
  
  // Transform serializable props to actual function handlers
  const clientProps: ClientJetSelectorProps = {
    ...props,
    onChange: (value: string, seatCapacity?: number, jetId?: string) => {
      // Ensure we're only running in a browser environment
      if (typeof window === 'undefined') return;

      // Handle onChange in the client component
      // Use setTimeout to break potential update loops
      const event = new CustomEvent('jetchange', {
        detail: {
          value,
          seatCapacity,
          jetId
        }
      });
      
      window.dispatchEvent(event);
      
      // If we were given a serializable onChangeValue prop, dispatch that event too
      if (props.onChangeValue) {
        const valueEvent = new CustomEvent('jetchange:value', {
          detail: { value }
        });
        window.dispatchEvent(valueEvent);
      }
      
      // If we were given a serializable onChangeSeatCapacity prop, dispatch that event too
      if (props.onChangeSeatCapacity !== undefined) {
        const capacityEvent = new CustomEvent('jetchange:capacity', {
          detail: { capacity: seatCapacity }
        });
        window.dispatchEvent(capacityEvent);
      }
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