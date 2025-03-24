import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPinIcon, Calendar as CalendarIcon, Filter, X, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Airport, FlightFilters as FlightFiltersType } from '../types';
import { CrewSpecialization } from '@/lib/types/crew.types';

// Key crew specializations to show in the filters
const CREW_SPECIALIZATIONS = [
  'Comedy',
  'TED-talks',
  'Live Podcasts',
  'Business Networking',
  'Family-friendly Activities',
  'Musical Performances',
  'Wellness Sessions',
  'Interactive Mystery Events'
];

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
  
  // Handle specialized events toggle
  const handleSpecializedEventsToggle = (checked: boolean) => {
    onFilterChange({
      ...filters,
      specializedEventOnly: checked
    });
  };
  
  // Handle crew specialization toggle
  const toggleCrewSpecialization = (specialization: string) => {
    const currentSpecializations = filters.crewSpecializations || [];
    
    if (currentSpecializations.includes(specialization)) {
      onFilterChange({
        ...filters,
        crewSpecializations: currentSpecializations.filter(s => s !== specialization)
      });
    } else {
      onFilterChange({
        ...filters,
        crewSpecializations: [...currentSpecializations, specialization]
      });
    }
  };
  
  // Handle crew rating change
  const handleCrewRatingChange = (values: number[]) => {
    onFilterChange({
      ...filters,
      minCrewRating: values[0].toString()
    });
  };
  
  // Parse price range for slider
  const priceRange = [
    parseInt(filters.minPrice || '1000'),
    parseInt(filters.maxPrice || '50000')
  ];
  
  // Parse crew rating
  const crewRating = parseInt(filters.minCrewRating || '0');
  
  // Count active filters
  const activeFilterCount = [
    filters.origin,
    filters.destination,
    filters.dateFrom,
    filters.dateTo,
    filters.minSeats && parseInt(filters.minSeats) > 0 ? filters.minSeats : null,
    filters.minPrice && parseInt(filters.minPrice) > 1000 ? filters.minPrice : null,
    filters.maxPrice && parseInt(filters.maxPrice) < 50000 ? filters.maxPrice : null,
    filters.hasFractionalTokens ? 'fractional' : null,
    filters.specializedEventOnly ? 'specialized' : null,
    filters.minCrewRating && parseInt(filters.minCrewRating) > 0 ? filters.minCrewRating : null,
    filters.crewSpecializations?.length ? `${filters.crewSpecializations.length} specializations` : null
  ].filter(Boolean).length;
  
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full max-w-[min(calc(100vw-2rem),450px)] p-0 shadow-lg">
              <div className="p-4 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="origin">From</Label>
                    <Select
                      value={filters.origin || "any_origin"}
                      onValueChange={handleOriginChange}
                    >
                      <SelectTrigger id="origin" className="mt-1">
                        <SelectValue placeholder="Any origin" />
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
                  
                  <div>
                    <Label htmlFor="destination">To</Label>
                    <Select
                      value={filters.destination || "any_destination"}
                      onValueChange={handleDestinationChange}
                    >
                      <SelectTrigger id="destination" className="mt-1">
                        <SelectValue placeholder="Any destination" />
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
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Departure Date From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full mt-1 justify-start text-left font-normal",
                            !filters.dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? format(new Date(filters.dateFrom), "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                          onSelect={handleDateFromChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>Departure Date To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full mt-1 justify-start text-left font-normal",
                            !filters.dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? format(new Date(filters.dateTo), "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                          onSelect={handleDateToChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label>Price Range</Label>
                  <div className="px-2 pt-6 pb-2">
                    <Slider
                      defaultValue={priceRange}
                      min={1000}
                      max={50000}
                      step={1000}
                      onValueChange={handlePriceRangeChange}
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>${priceRange[0].toLocaleString()}</span>
                      <span>${priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 items-center gap-4">
                  <div>
                    <Label htmlFor="minSeats">Minimum Seats</Label>
                    <Input
                      id="minSeats"
                      type="number"
                      min={1}
                      value={filters.minSeats || ""}
                      onChange={handleMinSeatsChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fractional-toggle">Fractional Ownership</Label>
                    <Switch
                      id="fractional-toggle"
                      checked={filters.hasFractionalTokens || false}
                      onCheckedChange={handleFractionalToggle}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-lg mb-2">Crew & Specialized Experiences</h3>
                  
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="specialized-toggle">Specialized Events Only</Label>
                    <Switch
                      id="specialized-toggle"
                      checked={filters.specializedEventOnly || false}
                      onCheckedChange={handleSpecializedEventsToggle}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <Label className="mb-2 block">Crew Rating</Label>
                    <div className="px-2 pt-2 pb-1">
                      <Slider
                        defaultValue={[crewRating]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={handleCrewRatingChange}
                      />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Any</span>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" />
                          <span>{filters.minCrewRating || 0}+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Crew Specializations</Label>
                    <div className="flex flex-wrap gap-2">
                      {CREW_SPECIALIZATIONS.map((specialization) => (
                        <Badge
                          key={specialization}
                          variant={filters.crewSpecializations?.includes(specialization) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            filters.crewSpecializations?.includes(specialization)
                              ? "bg-amber-500 hover:bg-amber-600 text-white" 
                              : "bg-background hover:bg-muted"
                          }`}
                          onClick={() => toggleCrewSpecialization(specialization)}
                        >
                          {specialization}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={onReset}>
                    <X className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  
                  <Button variant="default" size="sm" onClick={() => setFiltersExpanded(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {filters.crewSpecializations && filters.crewSpecializations.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-normal">
                {filters.crewSpecializations.length} Specializations
              </Badge>
            </div>
          )}
          
          {filters.specializedEventOnly && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-normal bg-amber-100 text-amber-800 hover:bg-amber-200">
                Specialized Events Only
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 