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
import { MapPinIcon, Calendar as CalendarIcon, Filter, X, Star, Users, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Airport, FlightFilters as FlightFiltersType } from '../types';
import { CrewSpecialization, CaptainSpecialization } from '@/lib/types/crew.types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

// Key captain specializations to show in the filters
const CAPTAIN_SPECIALIZATIONS = [
  'Luxury',
  'Business',
  'Family-oriented',
  'Entertainment-focused',
  'Adventure',
  'VIP Service',
  'International Flights'
];

interface FlightFiltersProps {
  filters: FlightFiltersType;
  onFilterChange: (newFilters: FlightFiltersType) => void;
  onReset: () => void;
}

export function FlightFilters({ filters, onFilterChange, onReset }: FlightFiltersProps) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [crewTab, setCrewTab] = useState<string>(filters.captainOnly ? 'captain' : 'crew');
  
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
  
  // Handle captain only toggle
  const handleCaptainOnlyToggle = (checked: boolean) => {
    onFilterChange({
      ...filters,
      captainOnly: checked
    });
  };
  
  // Handle dedicated captain toggle
  const handleDedicatedCaptainToggle = (checked: boolean) => {
    onFilterChange({
      ...filters,
      dedicatedCaptainOnly: checked
    });
  };
  
  // Handle captain/crew tab change
  const handleCrewTabChange = (value: string) => {
    setCrewTab(value);
    if (value === 'captain') {
      onFilterChange({
        ...filters,
        captainOnly: true,
        specializedEventOnly: false,
        crewSpecializations: []
      });
    } else {
      onFilterChange({
        ...filters,
        captainOnly: false,
        dedicatedCaptainOnly: false,
        captainSpecializations: []
      });
    }
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
  
  // Handle captain specialization toggle
  const toggleCaptainSpecialization = (specialization: string) => {
    const currentSpecializations = filters.captainSpecializations || [];
    
    if (currentSpecializations.includes(specialization)) {
      onFilterChange({
        ...filters,
        captainSpecializations: currentSpecializations.filter(s => s !== specialization)
      });
    } else {
      onFilterChange({
        ...filters,
        captainSpecializations: [...currentSpecializations, specialization]
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
    filters.crewSpecializations?.length ? `${filters.crewSpecializations.length} specializations` : null,
    filters.captainOnly ? 'captain' : null,
    filters.dedicatedCaptainOnly ? 'dedicated' : null,
    filters.captainSpecializations?.length ? `${filters.captainSpecializations.length} captain specs` : null
  ].filter(Boolean).length;
  
  return (
    <div className="rounded-lg border p-4 shadow-sm bg-white mb-6">
      {/* Main filter bar - Always visible */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Origin Airport */}
        <div className="relative">
          <Label htmlFor="origin" className="text-xs font-medium mb-1 block">Origin</Label>
          <Select
            value={filters.origin || 'any_origin'}
            onValueChange={handleOriginChange}
          >
            <SelectTrigger id="origin" className="w-full bg-white">
              <SelectValue placeholder="Any Origin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any_origin">Any Origin</SelectItem>
              {airports.map((airport) => (
                <SelectItem key={airport.code} value={airport.code}>
                  {airport.code} - {airport.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Destination Airport */}
        <div className="relative">
          <Label htmlFor="destination" className="text-xs font-medium mb-1 block">Destination</Label>
          <Select
            value={filters.destination || 'any_destination'}
            onValueChange={handleDestinationChange}
          >
            <SelectTrigger id="destination" className="w-full bg-white">
              <SelectValue placeholder="Any Destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any_destination">Any Destination</SelectItem>
              {airports.map((airport) => (
                <SelectItem key={airport.code} value={airport.code}>
                  {airport.code} - {airport.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Picker */}
        <div className="relative">
          <Label htmlFor="date-from" className="text-xs font-medium mb-1 block">Departure Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-from"
                variant="outline"
                className="w-full justify-start text-left font-normal bg-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(new Date(filters.dateFrom), 'PP') : "Select date"}
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
        
        {/* Price Range */}
        <div className="relative">
          <Label htmlFor="price-range" className="text-xs font-medium mb-1 block">
            Budget: ${priceRange[0]} - ${priceRange[1]}
          </Label>
          <div className="px-2 pt-4 pb-2">
            <Slider
              id="price-range"
              defaultValue={[1000, 50000]}
              min={1000}
              max={50000}
              step={500}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={handlePriceRangeChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Advanced Filters Toggle and Counter */}
      <div className="flex justify-between items-center border-t border-gray-200 pt-4">
        <Button
          variant="outline"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="gap-2 text-sm"
        >
          <Filter className="h-4 w-4" />
          {filtersExpanded ? "Hide Advanced Filters" : "Show Advanced Filters"}
          {activeFilterCount > 4 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 rounded-full">
              {activeFilterCount - 4}
            </Badge>
          )}
        </Button>
        
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-sm h-9 px-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reset all filters
          </Button>
        )}
      </div>
      
      {/* Advanced Filter Panel (conditionally shown) */}
      {filtersExpanded && (
        <div className="mt-4 space-y-6 pt-4 border-t border-gray-200">
          {/* Rest of the filter contents */}
          
          {/* Minimum Seats */}
          <div className="space-y-1.5">
            <Label htmlFor="min-seats" className="text-sm font-medium">Minimum Seats</Label>
            <Input
              id="min-seats"
              type="number"
              min="1"
              max="20"
              placeholder="Any"
              value={filters.minSeats || ''}
              onChange={handleMinSeatsChange}
              className="w-full"
            />
          </div>
          
          {/* Fractional Token Option */}
          <div className="flex items-center justify-between">
            <Label htmlFor="fractional-tokens" className="cursor-pointer space-y-1.5">
              <div className="text-sm font-medium">Fractional Ownership Available</div>
              <p className="text-xs text-muted-foreground">Only show flights with available fractional tokens</p>
            </Label>
            <Switch
              id="fractional-tokens"
              checked={filters.hasFractionalTokens || false}
              onCheckedChange={handleFractionalToggle}
            />
          </div>
          
          {/* Specialized Experiences Tabs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Flight Professionals</Label>
            <Tabs defaultValue={crewTab} onValueChange={handleCrewTabChange}>
              <TabsList className="w-full">
                <TabsTrigger value="crew">Specialized Crew</TabsTrigger>
                <TabsTrigger value="captain">Elite Captains</TabsTrigger>
              </TabsList>
              
              <TabsContent value="crew" className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="specialized-events" className="cursor-pointer space-y-1.5">
                    <div className="text-sm font-medium">Specialized Experiences</div>
                    <p className="text-xs text-muted-foreground">Only show flights with themed events</p>
                  </Label>
                  <Switch
                    id="specialized-events"
                    checked={filters.specializedEventOnly || false}
                    onCheckedChange={handleSpecializedEventsToggle}
                  />
                </div>
                
                {/* Crew Specializations */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {CREW_SPECIALIZATIONS.map((specialization) => (
                      <Badge
                        key={specialization}
                        variant={filters.crewSpecializations?.includes(specialization) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer",
                          filters.crewSpecializations?.includes(specialization) && "bg-primary"
                        )}
                        onClick={() => toggleCrewSpecialization(specialization)}
                      >
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Crew Minimum Rating */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label htmlFor="crew-rating" className="text-sm font-medium">Minimum Rating</Label>
                    <span className="text-sm flex items-center">
                      {crewRating}
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 ml-1" />
                    </span>
                  </div>
                  <Slider
                    id="crew-rating"
                    defaultValue={[0]}
                    min={0}
                    max={5}
                    step={0.5}
                    value={[crewRating]}
                    onValueChange={handleCrewRatingChange}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="captain" className="pt-4 space-y-4">
                {/* Dedicated Captain Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="dedicated-captain" className="cursor-pointer space-y-1.5">
                    <div className="text-sm font-medium">Dedicated Captains Only</div>
                    <p className="text-xs text-muted-foreground">Only show flights with dedicated jet captains</p>
                  </Label>
                  <Switch
                    id="dedicated-captain"
                    checked={filters.dedicatedCaptainOnly || false}
                    onCheckedChange={handleDedicatedCaptainToggle}
                  />
                </div>
                
                {/* Captain Specializations */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Captain Specializations</Label>
                  <div className="flex flex-wrap gap-2">
                    {CAPTAIN_SPECIALIZATIONS.map((specialization) => (
                      <Badge
                        key={specialization}
                        variant={filters.captainSpecializations?.includes(specialization) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer",
                          filters.captainSpecializations?.includes(specialization) && "bg-amber-500 hover:bg-amber-600"
                        )}
                        onClick={() => toggleCaptainSpecialization(specialization)}
                      >
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-200">
          {filters.origin && filters.origin !== 'any_origin' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Origin: {filters.origin}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => handleOriginChange('any_origin')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.destination && filters.destination !== 'any_destination' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Destination: {filters.destination}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => handleDestinationChange('any_destination')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.dateFrom && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Departing: {format(new Date(filters.dateFrom), 'PP')}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => handleDateFromChange(undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {/* Keep the rest of the active filter badges */}
        </div>
      )}
    </div>
  );
} 