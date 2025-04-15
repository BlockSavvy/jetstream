'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, ChevronsUpDown, Loader2, Search, Plane, ChevronDown } from 'lucide-react';
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

// Types for jet data
interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  tail_number: string;
  capacity: number;
  range_nm?: number;
  cruise_speed_kts?: number;
  image_url?: string;
  thumbnail_url?: string;
  description?: string;
  is_popular?: boolean;
  display_name?: string;
  year?: number;
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
}: ClientJetSelectorProps) {
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
  
  // Refs for positioning dropdown correctly
  const inputRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0
  });
  
  // Add state for portal container
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
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

  // Fetch jets from API
  useEffect(() => {
    const fetchJets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/jetshare/getJets?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch jets: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Jets API response:', data);
        
        if (data.jets && Array.isArray(data.jets) && data.jets.length > 0) {
          // Type-safe cast of the jets
          const loadedJets = data.jets as Jet[];
          
          // Enhance jets with display_name
          const enhancedJets = loadedJets.map(jet => ({
            ...jet,
            display_name: `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`,
            thumbnail_url: jet.image_url || `/images/jets/${jet.manufacturer.toLowerCase()}/${jet.model.toLowerCase().replace(/\s+/g, '-')}.jpg`
          }));
          
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
        } else {
          logError('API returned empty or invalid jets', 
            { responseStatus: response.status, data }
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
            is_popular: true
          },
          { 
            id: 'bombardier-global-7500', 
            manufacturer: 'Bombardier', 
            model: 'Global 7500', 
            tail_number: 'N2JS',
            display_name: 'Bombardier Global 7500 (N2JS)', 
            capacity: 19,
            is_popular: true
          },
          { 
            id: 'embraer-phenom-300e', 
            manufacturer: 'Embraer', 
            model: 'Phenom 300E', 
            tail_number: 'N3JS',
            display_name: 'Embraer Phenom 300E (N3JS)', 
            capacity: 10,
            is_popular: true
          },
          { 
            id: 'cessna-citation-longitude', 
            manufacturer: 'Cessna', 
            model: 'Citation Longitude', 
            tail_number: 'N4JS',
            display_name: 'Cessna Citation Longitude (N4JS)', 
            capacity: 12
          },
          { 
            id: 'dassault-falcon-8x', 
            manufacturer: 'Dassault', 
            model: 'Falcon 8X', 
            tail_number: 'N5JS',
            display_name: 'Dassault Falcon 8X (N5JS)', 
            capacity: 16
          },
          { 
            id: 'other-custom', 
            manufacturer: 'Other', 
            model: 'Custom', 
            tail_number: '',
            display_name: 'Other (Custom Aircraft)', 
            capacity: 8
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
  
  // Filter the jets based on search and selected manufacturer
  const filteredJets = jets.filter(jet => {
    const displayName = jet.display_name || `${jet.manufacturer} ${jet.model}${jet.tail_number ? ` (${jet.tail_number})` : ''}`;
    
    const matchesSearch = !search || 
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      jet.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
      jet.model.toLowerCase().includes(search.toLowerCase()) ||
      (jet.tail_number && jet.tail_number.toLowerCase().includes(search.toLowerCase()));
      
    const matchesManufacturer = !selectedManufacturer || jet.manufacturer === selectedManufacturer;
    
    const matchesCapacity = filterByCapacity ? jet.capacity >= filterByCapacity : true;
    
    return matchesSearch && matchesManufacturer && matchesCapacity;
  });
  
  // Fix the UI when a jet is selected to display an image and update label
  const updateSelectedState = (jet: Jet) => {
    setSelectedJet(jet);
    // Dispatch the custom event with the full jet data
    const jetChangeEvent = new CustomEvent('jetchange', {
      detail: {
        value: `${jet.manufacturer} ${jet.model}`,
        jetId: jet.id,
        seatCapacity: jet.capacity,
        range: jet.range_nm,
        image_url: jet.image_url || `/images/jets/${jet.manufacturer.toLowerCase()}/${jet.model.toLowerCase().replace(/\s+/g, '-')}.jpg`
      }
    });
    window.dispatchEvent(jetChangeEvent);
  };

  // When handling the jet selection, use this function
  const handleSelect = (currentValue: string, jet: Jet) => {
    updateSelectedState(jet);
    setOpen(false);
    if (onChange) {
      onChange(currentValue);
    }
  };
  
  // Handle custom input change
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
    if (onCustomChange) {
      onCustomChange(newValue);
    }
  };
  
  // Capacity filter options
  const capacityFilters = [
    { label: 'All', value: null },
    { label: '4+ seats', value: 4 },
    { label: '8+ seats', value: 8 },
    { label: '12+ seats', value: 12 },
    { label: '16+ seats', value: 16 }
  ];
  
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
              "w-full justify-between relative border-gray-300 dark:border-gray-700 bg-background",
              "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              "text-left font-normal h-14",
              selectedJet ? "text-foreground" : "text-muted-foreground",
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
                  {selectedJet.image_url ? (
                    <img 
                      src={selectedJet.image_url} 
                      alt={`${selectedJet.manufacturer} ${selectedJet.model}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to generic jet image
                        e.currentTarget.src = "/images/placeholder-jet.jpg";
                      }}
                    />
                  ) : (
                    <Plane className="h-5 w-5 text-blue-500 m-auto" />
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <span className="font-medium truncate text-white">
                    {selectedJet.manufacturer} {selectedJet.model}
                  </span>
                  <span className="text-xs text-gray-400">
                    {selectedJet.capacity} seats • {selectedJet.range_nm} nm range
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-gray-500">Select aircraft model</span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            
            {selectedJet && (
              <Badge 
                className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/4 bg-blue-500 text-white"
                variant="default"
              >
                Selected
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 max-h-[60vh] md:w-[400px]">
          <Command className="w-full">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Search jets..." 
                className="h-9 flex-1"
                value={search}
                onValueChange={setSearch}
              />
            </div>
            
            {/* Capacity filters */}
            <div className="flex items-center gap-1 p-2 border-b overflow-x-auto">
              {capacityFilters.map((filter) => (
                <Button
                  key={filter.label}
                  size="sm"
                  variant={filterByCapacity === filter.value ? "default" : "outline"}
                  className="text-xs h-7 px-2"
                  onClick={() => setFilterByCapacity(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            
            <CommandList className="max-h-[300px] overflow-auto">
              <CommandEmpty className="py-6 text-center text-sm">
                No jets found.
              </CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="px-2 py-1.5">
                      <Skeleton className="h-14 w-full rounded-md" />
                    </div>
                  ))
                ) : (
                  filteredJets.map((jet) => {
                    const jetName = `${jet.manufacturer} ${jet.model}`;
                    const isSelected = selectedJet?.id === jet.id;
                    
                    return (
                      <CommandItem
                        key={jet.id}
                        value={jetName}
                        onSelect={() => handleSelect(jetName, jet)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-3 cursor-pointer transition-colors",
                          isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        )}
                      >
                        {jet.image_url ? (
                          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                            <img 
                              src={jet.image_url} 
                              alt={jetName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                            <Plane className="h-5 w-5 text-blue-500" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{jetName}</span>
                          <span className="text-xs text-muted-foreground">
                            {jet.capacity} seats • {jet.range_nm} nm range
                            {jet.year && ` • ${jet.year}`}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-500 ml-auto" />
                        )}
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
          className="mt-2"
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
      // Handle onChange in the client component
      // For state management, you would typically use this with a useState hook in the parent
      if (window) {
        // Dispatch a custom event that can be listened to by parent components
        const event = new CustomEvent('jetchange', {
          detail: {
            value,
            seatCapacity,
            jetId
          }
        });
        window.dispatchEvent(event);
        
        // If we were given a serializable onChangeValue prop, we'll also need to dispatch an event for it
        if (props.onChangeValue) {
          const valueEvent = new CustomEvent('jetchange:value', {
            detail: {
              value
            }
          });
          window.dispatchEvent(valueEvent);
        }
        
        // If we were given a serializable onChangeSeatCapacity prop, we'll also need to dispatch an event for it
        if (props.onChangeSeatCapacity !== undefined) {
          const capacityEvent = new CustomEvent('jetchange:capacity', {
            detail: {
              capacity: seatCapacity
            }
          });
          window.dispatchEvent(capacityEvent);
        }
      }
    },
    onCustomChange: props.onCustomChangeValue 
      ? (value: string) => {
          if (window) {
            const event = new CustomEvent('jetcustomchange', {
              detail: { value }
            });
            window.dispatchEvent(event);
          }
        }
      : undefined
  };
  
  return <JetSelectorImpl {...clientProps} />;
} 