import { useState, useEffect } from 'react';
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

interface AircraftModelSelectorProps {
  value: string;
  onChange: (value: string, seatCapacity?: number) => void;
  onCustomChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function AircraftModelSelector({
  value,
  onChange,
  onCustomChange,
  disabled = false,
  className,
  id,
}: AircraftModelSelectorProps) {
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
    setShowCustomInput(!!isCustomModel);
    if (isCustomModel) {
      setCustomValue(value);
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
  
  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            id={id}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading aircraft models...</span>
              </div>
            ) : error ? (
              <div className="flex items-center text-red-500">
                <span>{error}</span>
              </div>
            ) : showCustomInput ? (
              <span>{customValue || 'Custom Aircraft'}</span>
            ) : value ? (
              <div className="flex items-center">
                {(() => {
                  const selectedModel = aircraftModels.find(m => m.display_name === value);
                  if (selectedModel?.image_url) {
                    return (
                      <div className="mr-2 h-5 w-5 relative overflow-hidden rounded-sm">
                        <Image 
                          src={selectedModel.thumbnail_url || selectedModel.image_url || "/images/placeholder-jet.jpg"}
                          alt={selectedModel.display_name}
                          width={20}
                          height={20}
                          className="object-cover"
                          onError={(e) => {
                            // Fall back to a placeholder image
                            (e.target as HTMLImageElement).src = "/images/placeholder-jet.jpg";
                          }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
                <span>{value}</span>
              </div>
            ) : (
              <span>Select an aircraft model</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Search aircraft..." 
                value={search}
                onValueChange={setSearch}
                className="flex-1"
              />
              {search && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSearch('')}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Manufacturer filter buttons */}
            {manufacturers.length > 0 && (
              <div className="px-2 py-2 border-b flex gap-1 flex-wrap">
                <Badge 
                  variant={selectedManufacturer === null ? "default" : "outline"}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedManufacturer(null)}
                >
                  All
                </Badge>
                {manufacturers.map(manufacturer => (
                  <Badge 
                    key={manufacturer}
                    variant={selectedManufacturer === manufacturer ? "default" : "outline"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedManufacturer(prev => prev === manufacturer ? null : manufacturer)}
                  >
                    {manufacturer}
                  </Badge>
                ))}
              </div>
            )}
            
            <CommandEmpty>
              {search ? (
                <>
                  <p className="py-3 px-4 text-center text-sm">No matching aircraft found</p>
                  <CommandItem 
                    value="custom"
                    onSelect={() => handleSelect('custom')}
                    className="border-t cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Use "{search}" as custom model</span>
                      <span className="text-xs opacity-70">Custom</span>
                    </div>
                  </CommandItem>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">No aircraft models available</p>
                  {error && (
                    <Button 
                      onClick={directFetchAircraftModels} 
                      variant="outline" 
                      size="sm"
                      className="mx-auto"
                    >
                      <Loader2 className="mr-2 h-4 w-4" /> Retry Loading Models
                    </Button>
                  )}
                </div>
              )}
            </CommandEmpty>
            
            <CommandList>
              <ScrollArea className="h-[300px] overflow-auto">
                {/* Debug information - will help diagnose issue */}
                <div className="px-4 py-2 text-xs text-muted-foreground border-b">
                  <div>Models loaded: {aircraftModels.length}</div>
                  <div>Filtered models: {filteredModels.length}</div>
                  <div>Search term: {search || "none"}</div>
                  <div>Selected manufacturer: {selectedManufacturer || "none"}</div>
                </div>

                {/* Always show models if they're loaded, regardless of filters */}
                {aircraftModels.length > 0 && filteredModels.length === 0 && !search && !selectedManufacturer && (
                  <CommandGroup heading="All Available Models">
                    {aircraftModels.map(model => (
                      <CommandItem
                        key={model.id}
                        value={model.display_name}
                        onSelect={() => handleSelect(model.display_name)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-12 flex items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                            <Plane className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{model.display_name}</span>
                            <span className="text-xs text-muted-foreground">{model.seat_capacity} seats</span>
                          </div>
                        </div>
                        
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === model.display_name ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Fallback: Show all models if no filters are applied and popular section is empty */}
                {aircraftModels.length > 0 && (!search && !selectedManufacturer) && 
                 !aircraftModels.some(model => model.is_popular) && (
                  <CommandGroup heading="All Aircraft Models">
                    {aircraftModels.map(model => (
                      <CommandItem
                        key={model.id}
                        value={model.display_name}
                        onSelect={() => handleSelect(model.display_name)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {(model.image_url || model.thumbnail_url) ? (
                            <div className="h-8 w-12 relative overflow-hidden rounded-sm">
                              <Image 
                                src={model.thumbnail_url || model.image_url || "/images/placeholder-jet.jpg"}
                                alt={model.display_name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  // Fall back to a placeholder image
                                  (e.target as HTMLImageElement).src = "/images/placeholder-jet.jpg";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-12 flex items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                              <Plane className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{model.display_name}</span>
                            <span className="text-xs text-muted-foreground">{model.seat_capacity} seats</span>
                          </div>
                        </div>
                        
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === model.display_name ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Popular models section */}
                {!search && !selectedManufacturer && aircraftModels.some(model => model.is_popular) && (
                  <CommandGroup heading="Popular Models">
                    {aircraftModels
                      .filter(model => model.is_popular)
                      .map(model => (
                        <CommandItem
                          key={model.id}
                          value={model.display_name}
                          onSelect={() => handleSelect(model.display_name)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {(model.image_url || model.thumbnail_url) ? (
                              <div className="h-8 w-12 relative overflow-hidden rounded-sm">
                                <Image 
                                  src={model.thumbnail_url || model.image_url || "/images/placeholder-jet.jpg"}
                                  alt={model.display_name}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    // Fall back to a placeholder image
                                    (e.target as HTMLImageElement).src = "/images/placeholder-jet.jpg";
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-8 w-12 flex items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                                <Plane className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-medium">{model.display_name}</span>
                              <span className="text-xs text-muted-foreground">{model.seat_capacity} seats</span>
                            </div>
                          </div>
                          
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === model.display_name ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                
                {/* All models or filtered models */}
                {(search || selectedManufacturer) && filteredModels.length > 0 && (
                  <CommandGroup heading={search || selectedManufacturer ? 'Search Results' : 'All Models'}>
                    {filteredModels.map(model => (
                      <CommandItem
                        key={model.id}
                        value={model.display_name}
                        onSelect={() => handleSelect(model.display_name)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {(model.image_url || model.thumbnail_url) ? (
                            <div className="h-8 w-12 relative overflow-hidden rounded-sm">
                              <Image 
                                src={model.thumbnail_url || model.image_url || "/images/placeholder-jet.jpg"}
                                alt={model.display_name}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  // Fall back to a placeholder image
                                  (e.target as HTMLImageElement).src = "/images/placeholder-jet.jpg";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-12 flex items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-800">
                              <Plane className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{model.display_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {model.seat_capacity} seats
                              {model.range_nm && ` • ${model.range_nm} nm range`}
                            </span>
                          </div>
                        </div>
                        
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === model.display_name ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {/* Custom option */}
                <CommandGroup heading="Custom">
                  <CommandItem 
                    value="custom"
                    onSelect={() => handleSelect('custom')}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>Other (Custom Aircraft)</span>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          showCustomInput ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                </CommandGroup>
              </ScrollArea>
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
      
      {/* Rescue button */}
      {error && rescueButton}
    </div>
  );
} 