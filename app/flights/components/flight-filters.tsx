import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPinIcon, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Airport, FlightFilters as FlightFiltersType } from '../types';

interface FlightFiltersProps {
  filters: FlightFiltersType;
  onFilterChange: (newFilters: FlightFiltersType) => void;
  onReset: () => void;
}

export function FlightFilters({ filters, onFilterChange, onReset }: FlightFiltersProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Fetch airports for the selects
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch('/api/airports');
        const data = await response.json();
        setAirports(data);
      } catch (error) {
        console.error('Error fetching airports:', error);
      }
    };
    
    fetchAirports();
  }, []);
  
  // Handle price range changes
  const handlePriceRangeChange = (values: number[]) => {
    onFilterChange({
      ...filters,
      minPrice: values[0].toString(),
      maxPrice: values[1].toString()
    });
  };
  
  // Handle origin airport change
  const handleOriginChange = (value: string) => {
    onFilterChange({
      ...filters,
      origin: value === 'any_origin' ? undefined : value
    });
  };
  
  // Handle destination airport change
  const handleDestinationChange = (value: string) => {
    onFilterChange({
      ...filters,
      destination: value === 'any_destination' ? undefined : value
    });
  };
  
  // Handle date from change
  const handleDateFromChange = (date: Date | undefined) => {
    onFilterChange({
      ...filters,
      dateFrom: date ? date.toISOString() : undefined
    });
  };
  
  // Handle date to change
  const handleDateToChange = (date: Date | undefined) => {
    onFilterChange({
      ...filters,
      dateTo: date ? date.toISOString() : undefined
    });
  };
  
  // Handle minimum seats change
  const handleMinSeatsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      minSeats: event.target.value
    });
  };
  
  // Handle fractional ownership toggle
  const handleFractionalToggle = (checked: boolean) => {
    onFilterChange({
      ...filters,
      hasFractionalTokens: checked
    });
  };
  
  // Parse price range for slider
  const priceRange = [
    parseInt(filters.minPrice || '1000'),
    parseInt(filters.maxPrice || '50000')
  ];
  
  return (
    <div className="bg-card border rounded-lg shadow-sm p-5 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Filter className="h-5 w-5 mr-2" /> 
          Filters
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReset}
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="md:hidden"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            {filtersExpanded ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>
      
      <div className={cn(
        "grid gap-6",
        filtersExpanded ? "grid-cols-1" : "hidden md:grid md:grid-cols-2 lg:grid-cols-4"
      )}>
        {/* Origin & Destination Selects */}
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <Select 
            value={filters.origin || 'any_origin'} 
            onValueChange={handleOriginChange}
          >
            <SelectTrigger id="origin" className="w-full">
              <SelectValue placeholder="Select origin">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {filters.origin 
                      ? airports.find(a => a.code === filters.origin)?.city || filters.origin
                      : 'Any origin'
                    }
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any_origin">Any origin</SelectItem>
              {airports.map((airport) => (
                <SelectItem key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Select 
            value={filters.destination || 'any_destination'} 
            onValueChange={handleDestinationChange}
          >
            <SelectTrigger id="destination" className="w-full">
              <SelectValue placeholder="Select destination">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {filters.destination 
                      ? airports.find(a => a.code === filters.destination)?.city || filters.destination
                      : 'Any destination'
                    }
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any_destination">Any destination</SelectItem>
              {airports.map((airport) => (
                <SelectItem key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Range Pickers */}
        <div className="space-y-2">
          <Label>Departure Date (From)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? (
                  format(new Date(filters.dateFrom), "PPP")
                ) : (
                  <span>Any date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={handleDateFromChange}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>Departure Date (To)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? (
                  format(new Date(filters.dateTo), "PPP")
                ) : (
                  <span>Any date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={handleDateToChange}
                initialFocus
                disabled={(date) => 
                  date < new Date() || 
                  (filters.dateFrom ? date < new Date(filters.dateFrom) : false)
                }
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Price Range Slider */}
        <div className="space-y-2 lg:col-span-2">
          <div className="flex justify-between">
            <Label>Price Range</Label>
            <span className="text-sm text-muted-foreground">
              ${priceRange[0]} - ${priceRange[1]}
            </span>
          </div>
          <Slider
            defaultValue={[1000, 50000]}
            value={priceRange}
            max={100000}
            min={1000}
            step={1000}
            onValueChange={handlePriceRangeChange}
            className="py-4"
          />
        </div>
        
        {/* Min Seats Input */}
        <div className="space-y-2">
          <Label htmlFor="minSeats">Minimum Seats</Label>
          <Input
            id="minSeats"
            type="number"
            min="1"
            max="18"
            value={filters.minSeats || ''}
            onChange={handleMinSeatsChange}
            placeholder="Any"
          />
        </div>
        
        {/* Fractional Ownership Toggle */}
        <div className="space-y-2">
          <Label htmlFor="fractional" className="block mb-2">Show Jets with Fractional Ownership</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="fractional"
              checked={filters.hasFractionalTokens || false}
              onCheckedChange={handleFractionalToggle}
            />
            <Label htmlFor="fractional" className="cursor-pointer">
              {filters.hasFractionalTokens ? 'Yes' : 'No'}
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
} 