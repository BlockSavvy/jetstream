'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Check, ChevronsUpDown, Loader2, Search, X, Plane } from 'lucide-react';
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

// Types for aircraft models
interface AircraftModel {
  id: string;
  manufacturer: string;
  model: string;
  display_name: string;
  seat_capacity: number;
  range_nm?: number;
  cruise_speed_kts?: number;
  image_url?: string;
  thumbnail_url?: string;
  description?: string;
  is_popular?: boolean;
}

// Server-friendly props interface
export interface AircraftModelSelectorProps {
  value: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  onChangeValue?: string; // Serializable placeholder
  onChangeSeatCapacity?: number; // Serializable placeholder
  onCustomChangeValue?: string; // Serializable placeholder
}

// Client-only props interface with function handlers
interface ClientAircraftModelSelectorProps extends Omit<AircraftModelSelectorProps, 'onChangeValue' | 'onChangeSeatCapacity' | 'onCustomChangeValue'> {
  onChange: (value: string, seatCapacity?: number) => void;
  onCustomChange?: (value: string) => void;
}

// The actual component implementation
function AircraftModelSelectorImpl({
  value,
  onChange,
  onCustomChange,
  disabled = false,
  className,
  id,
}: ClientAircraftModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [aircraftModels, setAircraftModels] = useState<AircraftModel[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [directFetchAttempted, setDirectFetchAttempted] = useState(false);
  
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
  
  // Separate function for direct fetch in case we need to retry 
  const directFetchAircraftModels = async () => {
    try {
      console.log('Directly fetching aircraft models...');
      setDirectFetchAttempted(true);
      
      const response = await fetch(`/api/jetshare/getAircraftModels?t=${new Date().getTime()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Direct fetch result:', result);
      
      if (result.aircraft_models && Array.isArray(result.aircraft_models) && result.aircraft_models.length > 0) {
        // Success - update models and manufacturers
        const models = result.aircraft_models as AircraftModel[];
        console.log(`Models found in direct fetch: ${models.length}`, models.slice(0, 2));
        setAircraftModels(models);
        if (result.manufacturers && Array.isArray(result.manufacturers)) {
          // Type assertion to ensure manufacturers are treated as string[]
          const manufacturersArray = result.manufacturers.map((m: unknown) => String(m));
          setManufacturers(manufacturersArray);
        } else {
          // Ensure we're creating a properly typed string array from the aircraft models
          const uniqueManufacturers: string[] = [...new Set(
            (result.aircraft_models as AircraftModel[])
              .map(m => String(m.manufacturer))
              .filter(mfr => typeof mfr === 'string' && mfr.length > 0)
          )];
          setManufacturers(uniqueManufacturers);
        }
        setIsLoading(false);
        setError(null);
        return true;
      } else {
        throw new Error('No models found in response');
      }
    } catch (error) {
      console.error('Direct fetch error:', error);
      return false;
    }
  };
  
  // Add a function to handle errors with more detail
  const logError = (msg: string, error: any) => {
    console.error(`AircraftModelSelector Error - ${msg}:`, 
      error instanceof Error ? `${error.name}: ${error.message}` : error
    );
  };

  // Log successful model loading
  const logModelsLoaded = (count: number, source: string) => {
    console.log(`AircraftModelSelector - Loaded ${count} models successfully from ${source}`);
  };

  // Fetch aircraft models
  useEffect(() => {
    const fetchAircraftModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/jetshare/getAircraftModels?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch aircraft models: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Aircraft models API response:', data);
        
        if (data.aircraft_models && Array.isArray(data.aircraft_models) && data.aircraft_models.length > 0) {
          // Type-safe cast of the aircraft models
          const models = data.aircraft_models as AircraftModel[];
          setAircraftModels(models);
          logModelsLoaded(models.length, 'primary API');
          
          if (data.manufacturers && Array.isArray(data.manufacturers)) {
            // Type-safe cast of manufacturers array from API
            const apiManufacturers = data.manufacturers.map((m: unknown) => String(m));
            setManufacturers(apiManufacturers);
          } else {
            // Extract manufacturers with proper typing
            const uniqueManufacturers: string[] = [...new Set(
              models.map(model => String(model.manufacturer))
                .filter(mfr => typeof mfr === 'string' && mfr.length > 0)
            )];
            setManufacturers(uniqueManufacturers);
          }
          
          // Reset retry count on success
          setRetryCount(0);
        } else {
          logError('API returned empty or invalid aircraft_models', 
            { responseStatus: response.status, data }
          );
          throw new Error('Invalid response format or empty models list');
        }
      } catch (error) {
        logError('Error fetching aircraft models', error);
        
        // Check if we should retry (up to 3 times)
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          
          // Wait a bit before retrying (exponential backoff)
          const retryDelay = Math.pow(2, retryCount) * 500;
          console.log(`Retrying aircraft models fetch in ${retryDelay}ms...`);
          
          setTimeout(() => {
            fetchAircraftModels();
          }, retryDelay);
          return;
        }
        
        // Try to create the aircraft_models table and data
        try {
          console.log('Attempting to create aircraft models...');
          await fetch('/api/jetshare/createAircraftModels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          // Try to fetch the models again
          console.log('Refetching aircraft models after creation attempt...');
          const retryResponse = await fetch(`/api/jetshare/getAircraftModels?t=${new Date().getTime()}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            console.log('Retry fetch result:', retryData);
            
            if (retryData.aircraft_models && Array.isArray(retryData.aircraft_models) && retryData.aircraft_models.length > 0) {
              const models = retryData.aircraft_models as AircraftModel[];
              setAircraftModels(models);
              logModelsLoaded(models.length, 'retry API');
              setError(null);
              
              // Extract manufacturers with proper type handling
              const uniqueManufacturers: string[] = [...new Set(
                models.map(model => String(model.manufacturer))
                  .filter(mfr => typeof mfr === 'string' && mfr.length > 0)
              )];
              setManufacturers(uniqueManufacturers);
              
              setIsLoading(false);
              return;
            }
          }
        } catch (createError) {
          logError('Error creating or refetching aircraft models', createError);
        }
        
        // If all attempts fail, try direct fetch
        if (!directFetchAttempted) {
          const directSuccess = await directFetchAircraftModels();
          if (directSuccess) {
            return;
          }
        }
        
        // If all attempts fail, use fallback data
        setError('Using fallback aircraft data - you can still select models');
        
        // Provide fallback data when API fails
        const fallbackModels: AircraftModel[] = [
          { 
            id: 'gulfstream-g650', 
            manufacturer: 'Gulfstream', 
            model: 'G650', 
            display_name: 'Gulfstream G650', 
            seat_capacity: 19,
            is_popular: true
          },
          { 
            id: 'bombardier-global-7500', 
            manufacturer: 'Bombardier', 
            model: 'Global 7500', 
            display_name: 'Bombardier Global 7500', 
            seat_capacity: 19,
            is_popular: true
          },
          { 
            id: 'embraer-phenom-300e', 
            manufacturer: 'Embraer', 
            model: 'Phenom 300E', 
            display_name: 'Embraer Phenom 300E', 
            seat_capacity: 10,
            is_popular: true
          },
          { 
            id: 'cessna-citation-longitude', 
            manufacturer: 'Cessna', 
            model: 'Citation Longitude', 
            display_name: 'Cessna Citation Longitude', 
            seat_capacity: 12
          },
          { 
            id: 'dassault-falcon-8x', 
            manufacturer: 'Dassault', 
            model: 'Falcon 8X', 
            display_name: 'Dassault Falcon 8X', 
            seat_capacity: 16
          },
          { 
            id: 'other-custom', 
            manufacturer: 'Other', 
            model: 'Custom', 
            display_name: 'Other (Custom Aircraft)', 
            seat_capacity: 8
          }
        ];
        
        setAircraftModels(fallbackModels);
        // Extract manufacturers as string array
        const fallbackManufacturers: string[] = [...new Set(
          fallbackModels.map(model => model.manufacturer)
        )];
        setManufacturers(fallbackManufacturers);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAircraftModels();
  }, []);
  
  // Check if current value is "Other" and show custom input
  useEffect(() => {
    const isCustomModel = value && !aircraftModels.some(model => model.display_name === value);
    // Special case for "Other (Custom Aircraft)" or any custom model not in our list
    if (value === 'Other (Custom Aircraft)' || value === 'Custom Aircraft' || isCustomModel) {
      setShowCustomInput(true);
      setCustomValue(value);
    } else {
      setShowCustomInput(false);
    }
  }, [value, aircraftModels]);
  
  // Filter the models based on search and selected manufacturer
  const filteredModels = aircraftModels.filter(model => {
    const matchesSearch = !search || 
      model.display_name.toLowerCase().includes(search.toLowerCase()) ||
      model.manufacturer.toLowerCase().includes(search.toLowerCase());
      
    const matchesManufacturer = !selectedManufacturer || model.manufacturer === selectedManufacturer;
    
    return matchesSearch && matchesManufacturer;
  });
  
  // Handle selection change
  const handleSelect = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setShowCustomInput(true);
      onChange(customValue || 'Custom Aircraft');
      if (onCustomChange) {
        onCustomChange(customValue || 'Custom Aircraft');
      }
    } else {
      setShowCustomInput(false);
      
      // Find the model to get seat capacity
      const selectedModel = aircraftModels.find(model => model.display_name === selectedValue);
      if (selectedModel) {
        onChange(selectedValue, selectedModel.seat_capacity);
      } else {
        onChange(selectedValue);
      }
    }
    setOpen(false);
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
  
  // Add a rescue button that will appear if no models are loaded
  const rescueButton = (
    <Button 
      onClick={directFetchAircraftModels} 
      variant="outline" 
      size="sm" 
      className="mt-2 w-full"
    >
      <Loader2 className="mr-2 h-4 w-4" /> Retry Loading Aircraft Models
    </Button>
  );
  
  // Log whenever the models list or filtered models change
  useEffect(() => {
    console.log(`Aircraft models list updated: ${aircraftModels.length} models available`);
    console.log(`Filtered models: ${filteredModels.length} models match current criteria`);
    
    // Auto-retry if we somehow ended up with 0 models after load completed
    if (!isLoading && aircraftModels.length === 0 && !directFetchAttempted) {
      console.log('No models loaded after initial fetch, trying direct fetch...');
      directFetchAircraftModels();
    }
  }, [aircraftModels, filteredModels, isLoading]);
  
  // Add a debug log function to track image loading
  const debugImageLoading = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ImageDebug] ${message}`, data || '');
    }
  };

  // Modify the image error handling to limit retries
  const getJetImagePath = (model: AircraftModel): string => {
    // Extract manufacturer and model components for path construction
    const manufacturer = model.manufacturer.toLowerCase();
    const manufacturerFirstWord = manufacturer.split(' ')[0];
    const displayName = model.display_name.toLowerCase().replace(/\s+/g, '-');
    const modelName = model.model.toLowerCase().replace(/\s+/g, '-');
    
    // Special case map for known model paths
    const specialCaseMap: Record<string, string> = {
      'king-air-350i': '/images/jets/beechcraft/king-air-350i.jpg', // Note: no 'beechcraft-' prefix
      'global-7500': '/images/jets/bombardier/global-7500.jpg',
      'global-6000': '/images/jets/bombardier/global-6000.jpg',
      'global-5000': '/images/jets/bombardier/global-5000.jpg',
      'challenger-350': '/images/jets/bombardier/challenger-350.jpg',
      'challenger-650': '/images/jets/bombardier/challenger-650.jpg',
      'g650': '/images/jets/gulfstream/g650.jpg',
      'citation-latitude': '/images/jets/cessna/citation-latitude.jpg',
      'phenom-300e': '/images/jets/embraer/phenom-300e.jpg'
    };
    
    // Check special case map first
    if (specialCaseMap[modelName]) {
      debugImageLoading(`Using special case path for ${modelName}`, specialCaseMap[modelName]);
      return specialCaseMap[modelName];
    }
    
    if (specialCaseMap[displayName]) {
      debugImageLoading(`Using special case path for ${displayName}`, specialCaseMap[displayName]);
      return specialCaseMap[displayName];
    }
    
    // Default path construction
    return `/images/jets/${manufacturerFirstWord}/${modelName}.jpg`;
  };
  
  return (
    <div className={cn("relative w-full", className)}>
      <Combobox
        value={value}
        onChange={(newValue: string) => {
          const model = aircraftModels.find(m => m.display_name === newValue);
          onChange(newValue, model?.seat_capacity);
        }}
      >
        <div ref={inputRef} className="relative w-full cursor-default overflow-hidden rounded-lg border border-gray-600 dark:border-gray-600 text-left focus:outline-none">
          <Combobox.Input
            id={id}
            className="w-full pl-3 pr-10 py-2 text-white dark:text-white bg-gray-700/70 dark:bg-gray-700/90 border-none focus:ring-0 outline-none font-medium"
            placeholder="Select aircraft model"
            displayValue={(selected: string) => selected || ""}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 100)} // Delay to allow for selection
            autoComplete="off"
          />
          <Combobox.Button 
            className="absolute inset-y-0 right-0 flex items-center pr-2"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown
              className="h-4 w-4 text-gray-400 dark:text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        {open && (
          <>
            {portalContainer && createPortal(
              <div 
                className="pointer-events-auto fixed top-0 left-0 w-full h-full z-[99999]"
                onClick={(e) => {
                  // Close dropdown when clicking outside
                  if (e.target === e.currentTarget) {
                    setOpen(false);
                  }
                }}
                style={{backgroundColor: 'rgba(0,0,0,0.01)'}}
              >
                <div 
                  className="absolute shadow-xl border border-gray-700 rounded-md overflow-hidden"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    backgroundColor: '#1f2937', // gray-800
                    zIndex: 99999
                  }}
                >
                  <div className="bg-gray-800 dark:bg-gray-800">
                    {isLoading && (
                      <div className="relative cursor-default select-none py-3 px-4 text-gray-300 dark:text-gray-300 flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin text-amber-500" />
                        <span>Loading aircraft models...</span>
                      </div>
                    )}
                    
                    {error && (
                      <div className="relative cursor-default select-none py-3 px-4 text-red-400 dark:text-red-400">
                        <span>Error: {error}</span>
                      </div>
                    )}
                    
                    {!isLoading && !error && filteredModels.length === 0 && search !== '' && (
                      <div className="relative cursor-default select-none py-3 px-4 text-gray-300 dark:text-gray-300">
                        <span>No aircraft models found.</span>
                      </div>
                    )}
                    
                    <div className="max-h-60 overflow-auto">
                      {filteredModels.map((model) => (
                        <div
                          key={model.id}
                          className={`relative cursor-pointer select-none py-3 pl-10 pr-4 hover:bg-gray-700 ${
                            value === model.display_name ? 'bg-gray-700/60 text-amber-500' : 'text-gray-200'
                          }`}
                          onClick={() => {
                            const newValue = model.display_name;
                            onChange(newValue, model?.seat_capacity);
                            setOpen(false);
                          }}
                        >
                          <div className="flex items-center">
                            {/* Aircraft image */}
                            <div className="mr-3 h-8 w-12 flex items-center justify-center overflow-hidden rounded-sm bg-gray-700/50">
                              {model.image_url || model.thumbnail_url ? (
                                <img
                                  src={model.thumbnail_url || model.image_url}
                                  alt={model.display_name}
                                  className="h-full w-full object-cover"
                                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.src = "/images/placeholder-jet.jpg";
                                  }}
                                />
                              ) : (
                                // Attempt to find the image by trying multiple possible paths based on manufacturer and model
                                (() => {
                                  const imagePath = getJetImagePath(model);
                                  return (
                                    <img
                                      src={imagePath}
                                      alt={model.display_name}
                                      className="h-full w-full object-cover"
                                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                        const target = e.target as HTMLImageElement;
                                        const currentPath = target.src;
                                        
                                        // Prevent infinite retries by tracking attempts
                                        const attempts = parseInt(target.dataset.attempts || '0', 10) + 1;
                                        target.dataset.attempts = attempts.toString();
                                        
                                        // Stop after 3 attempts and use placeholder
                                        if (attempts >= 3) {
                                          debugImageLoading(`Max attempts reached for ${model.display_name}, using placeholder`, currentPath);
                                          target.src = "/images/placeholder-jet.jpg";
                                          target.onerror = null; // Prevent further errors
                                          return;
                                        }
                                        
                                        // Special handling for specific models to avoid loops
                                        if (model.display_name === 'Beechcraft King Air 350i' || 
                                            model.display_name === 'King Air 350i' ||
                                            model.model === 'King Air 350i') {
                                          debugImageLoading(`Special case for King Air 350i`, model.display_name);
                                          target.src = "/images/placeholder-jet.jpg";
                                          target.onerror = null; // Prevent further errors
                                          return;
                                        }
                                        
                                        // Special handling for "Other" models to prevent loops
                                        if (model.display_name === 'Other (Custom Aircraft)' || 
                                            model.manufacturer.toLowerCase() === 'other') {
                                          debugImageLoading(`Using placeholder for custom aircraft`, model.display_name);
                                          target.src = "/images/placeholder-jet.jpg";
                                          target.onerror = null; // Prevent further errors
                                          return;
                                        }
                                        
                                        // Generate potential fallback paths in order of preference
                                        const fallbackPaths = [
                                          `/images/jets/${model.manufacturer.toLowerCase()}/${model.model.toLowerCase()}.jpg`,
                                          `/images/jets/${model.manufacturer.toLowerCase()}/${model.display_name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                                          `/images/jets/${model.manufacturer.toLowerCase().split(' ')[0]}/${model.model.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                                          `/images/jets/${model.manufacturer.toLowerCase().split(' ')[0]}/${model.display_name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                                          `/images/placeholder-jet.jpg`
                                        ];
                                        
                                        // Find the current path index in our fallbacks
                                        let currentIndex = fallbackPaths.findIndex(path => 
                                          currentPath.endsWith(path));
                                        
                                        // If not found in fallbacks or it's the last path, use placeholder
                                        if (currentIndex === -1 || currentIndex === fallbackPaths.length - 1) {
                                          debugImageLoading(`Using placeholder after fallback attempts for ${model.display_name}`, { currentPath, attempts });
                                          target.src = "/images/placeholder-jet.jpg";
                                          target.onerror = null; // Prevent further errors
                                        } else {
                                          // Try the next fallback path
                                          const nextPath = fallbackPaths[currentIndex + 1];
                                          debugImageLoading(`Trying next path for ${model.display_name}`, { from: currentPath, to: nextPath, attempts });
                                          target.src = nextPath;
                                        }
                                      }}
                                    />
                                  );
                                })()
                              )}
                            </div>
                            <div>
                              <span
                                className={`block truncate font-medium ${
                                  value === model.display_name ? 'text-amber-400 drop-shadow-sm' : ''
                                }`}
                              >
                                {model.display_name}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-400">
                                {model.seat_capacity} seats
                              </span>
                            </div>
                          </div>
                          
                          {value === model.display_name && (
                            <span
                              className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-500"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>,
              portalContainer
            )}
          </>
        )}
      </Combobox>
      
      {/* Custom input field that appears when "Other" is selected */}
      {showCustomInput && (
        <Input
          value={customValue}
          onChange={handleCustomInputChange}
          placeholder="Enter custom aircraft model"
          className="mt-2"
        />
      )}
      
      {/* Rescue button */}
      {error && rescueButton}
    </div>
  );
}

// Public API - This is the component that gets exported and used
export default function AircraftModelSelector(props: AircraftModelSelectorProps) {
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
  const clientProps: ClientAircraftModelSelectorProps = {
    ...props,
    onChange: (value: string, seatCapacity?: number) => {
      // Handle onChange in the client component
      // For state management, you would typically use this with a useState hook in the parent
      if (window) {
        // Dispatch a custom event that can be listened to by parent components
        window.dispatchEvent(new CustomEvent('aircraftModelChange', { 
          detail: { value, seatCapacity } 
        }));
      }
      
      // Alternative approach: Use local storage for simple state persistence
      try {
        localStorage.setItem('selectedAircraftModel', value);
        if (seatCapacity) {
          localStorage.setItem('selectedAircraftCapacity', seatCapacity.toString());
        }
      } catch (e) {
        console.error('Failed to store aircraft selection: ', e);
      }
    },
    onCustomChange: props.onCustomChangeValue ? 
      (value: string) => {
        if (window) {
          window.dispatchEvent(new CustomEvent('aircraftCustomChange', { 
            detail: { value } 
          }));
        }
      } : 
      undefined
  };
  
  return <AircraftModelSelectorImpl {...clientProps} />;
} 