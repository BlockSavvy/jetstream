"use client";

import { useState } from 'react';
import { CrewSpecialization, CrewFilter } from '@/lib/types/crew.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Filter, X, SearchIcon } from 'lucide-react';

const SPECIALIZATIONS: CrewSpecialization[] = [
  'Comedy',
  'TED-talks',
  'Live Podcasts',
  'Wellness Sessions',
  'Business Networking',
  'Family-friendly Activities',
  'Musical Performances',
  'Interactive Mystery Events',
  'Culinary Experiences',
  'Wine Tasting',
  'Sports Commentary',
  'Tech Demos',
  'Creative Workshops',
  'Executive Coaching'
];

// Client component props (non-serializable)
type CrewFiltersClientProps = {
  filters: CrewFilter;
  onFilterChange: (newFilters: CrewFilter) => void;
  onReset: () => void;
};

// Client implementation
function CrewFiltersClient({ filters, onFilterChange, onReset }: CrewFiltersClientProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Handle specialization toggle
  const toggleSpecialization = (specialization: CrewSpecialization) => {
    const currentSpecializations = filters.specializations || [];
    
    if (currentSpecializations.includes(specialization)) {
      onFilterChange({
        ...filters,
        specializations: currentSpecializations.filter(s => s !== specialization)
      });
    } else {
      onFilterChange({
        ...filters,
        specializations: [...currentSpecializations, specialization]
      });
    }
  };
  
  // Handle rating change
  const handleRatingChange = (values: number[]) => {
    onFilterChange({
      ...filters,
      minRating: values[0]
    });
  };
  
  // Handle search term change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchTerm: event.target.value
    });
  };
  
  // Handle availability toggle
  const handleAvailabilityToggle = () => {
    onFilterChange({
      ...filters,
      available: !filters.available
    });
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or keywords..."
            className="pl-10"
            value={filters.searchTerm || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Popover open={filtersExpanded} onOpenChange={setFiltersExpanded}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {(filters.specializations?.length || filters.minRating || filters.available) ? (
                  <Badge variant="secondary" className="ml-1 px-1 py-0 h-5">
                    {[
                      filters.specializations?.length ? `${filters.specializations.length} specs` : null,
                      filters.minRating ? `${filters.minRating}+ rating` : null,
                      filters.available ? 'Available' : null
                    ].filter(Boolean).join(', ')}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALIZATIONS.map((specialization) => (
                      <Badge
                        key={specialization}
                        variant={filters.specializations?.includes(specialization) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          filters.specializations?.includes(specialization)
                            ? "bg-amber-500 hover:bg-amber-600 text-white" 
                            : "bg-background hover:bg-muted"
                        }`}
                        onClick={() => toggleSpecialization(specialization)}
                      >
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Minimum Rating</h4>
                  <div className="px-2">
                    <Slider
                      defaultValue={[filters.minRating || 0]}
                      max={5}
                      step={0.5}
                      onValueChange={handleRatingChange}
                      className="my-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Any</span>
                      <span>2.5</span>
                      <span>5.0 ★</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-2">
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
          
          <Button 
            variant={filters.available ? "default" : "outline"} 
            onClick={handleAvailabilityToggle}
            className={filters.available ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
          >
            Available Now
          </Button>
        </div>
      </div>
    </div>
  );
}

// Public component props (serializable)
export type CrewFiltersProps = {
  filters: CrewFilter;
  onFilterChangeAction: string; // Serialized function
  onResetAction: string; // Serialized function
};

// Public component with serializable props
export function CrewFilters({ filters, onFilterChangeAction, onResetAction }: CrewFiltersProps) {
  // Parse the serialized functions
  const handleFilterChange = (newFilters: CrewFilter) => {
    // Use indirect evaluation to convert the string to a function
    const onChangeFn = new Function('filters', onFilterChangeAction);
    onChangeFn(newFilters);
  };
  
  const handleReset = () => {
    const onResetFn = new Function(onResetAction);
    onResetFn();
  };
  
  return (
    <CrewFiltersClient
      filters={filters}
      onFilterChange={handleFilterChange}
      onReset={handleReset}
    />
  );
} 