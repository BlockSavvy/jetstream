import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
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
}

export default function AircraftModelSelector({
  value,
  onChange,
  onCustomChange,
  disabled = false,
  className,
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
  
  // Fetch aircraft models
  useEffect(() => {
    const fetchAircraftModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/jetshare/getAircraftModels?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch aircraft models');
        }
        
        const data = await response.json();
        
        if (data.aircraft_models && Array.isArray(data.aircraft_models)) {
          setAircraftModels(data.aircraft_models);
          if (data.manufacturers) {
            setManufacturers(data.manufacturers);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching aircraft models:', error);
        setError('Failed to load aircraft models');
        setAircraftModels([]);
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
  
  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
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
                <span>Error loading models</span>
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
                          src={selectedModel.thumbnail_url || selectedModel.image_url}
                          alt={selectedModel.display_name}
                          width={20}
                          height={20}
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
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
                <p className="py-3 px-4 text-center text-sm">No aircraft models available</p>
              )}
            </CommandEmpty>
            
            <CommandList>
              <ScrollArea className="h-[300px] overflow-auto">
                {/* Popular models section */}
                {!search && !selectedManufacturer && (
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
                            {model.image_url && (
                              <div className="h-8 w-12 relative overflow-hidden rounded-sm">
                                <Image 
                                  src={model.thumbnail_url || model.image_url}
                                  alt={model.display_name}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
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
                <CommandGroup heading={search || selectedManufacturer ? 'Search Results' : 'All Models'}>
                  {filteredModels.map(model => (
                    <CommandItem
                      key={model.id}
                      value={model.display_name}
                      onSelect={() => handleSelect(model.display_name)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {model.image_url && (
                          <div className="h-8 w-12 relative overflow-hidden rounded-sm">
                            <Image 
                              src={model.thumbnail_url || model.image_url}
                              alt={model.display_name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
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
    </div>
  );
} 