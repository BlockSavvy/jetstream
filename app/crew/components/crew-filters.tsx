"use client";

import { useState, useEffect } from 'react';
import { Search, X, Filter, Star, ChevronsUpDown, Check, Calendar, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { CrewFilter, CrewSpecialization, CaptainSpecialization } from '@/lib/types/crew.types';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

interface CrewFiltersProps {
  filters: CrewFilter;
}

export function CrewFilters({ filters }: CrewFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<CrewFilter>(filters);
  const [activeTab, setActiveTab] = useState<string>(filters.isCaptain ? "captain" : "crew");
  const [specializationsOpen, setSpecializationsOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [yearsOpen, setYearsOpen] = useState(false);
  
  // Keep local filters in sync with prop filters
  useEffect(() => {
    setLocalFilters(filters);
    setActiveTab(filters.isCaptain ? "captain" : "crew");
  }, [filters]);
  
  // Crew Specializations
  const crewSpecializations: CrewSpecialization[] = [
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
  
  // Captain Specializations
  const captainSpecializations: CaptainSpecialization[] = [
    'Luxury',
    'Business',
    'Family-oriented',
    'Entertainment-focused',
    'Adventure',
    'VIP Service',
    'International Flights',
    'Long-haul Expert',
    'Private Events',
    'Sports Team Transport'
  ];
  
  // When the user updates a filter value
  const handleFilterChange = (key: keyof CrewFilter, value: any) => {
    if (key === 'searchTerm') {
      // For search term, dispatch event immediately
      const event = new CustomEvent('crew-filter-change', {
        detail: { filters: { ...filters, searchTerm: value } }
      });
      document.dispatchEvent(event);
    } else {
      setLocalFilters(prev => ({ ...prev, [key]: value }));
    }
  };
  
  // Toggle specialization selection
  const toggleSpecialization = (spec: string) => {
    const currentSpecs = localFilters.specializations || [];
    const isSelected = currentSpecs.includes(spec);
    
    if (isSelected) {
      handleFilterChange('specializations', currentSpecs.filter(s => s !== spec));
    } else {
      handleFilterChange('specializations', [...currentSpecs, spec]);
    }
  };
  
  // When the user applies the filters from the filter sheet
  const applyFilters = () => {
    // Handle crew type filter
    if (activeTab === "captain") {
      localFilters.isCaptain = true;
    } else if (activeTab === "crew") {
      localFilters.isCaptain = false;
    }
    
    // Dispatch event with updated filters
    const event = new CustomEvent('crew-filter-change', {
      detail: { filters: localFilters }
    });
    document.dispatchEvent(event);
    
    setIsOpen(false);
  };
  
  // When the user resets filters
  const handleReset = () => {
    const resetFilters = { isCaptain: activeTab === 'captain' };
    setLocalFilters(resetFilters);
    
    // Dispatch event with reset filters
    const event = new CustomEvent('crew-filter-reset');
    document.dispatchEvent(event);
    
    setIsOpen(false);
  };
  
  // Count active filters (excluding search term)
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'searchTerm') return count;
    if (key === 'specializations' && Array.isArray(value)) return count + value.length;
    return count + (value ? 1 : 0);
  }, 0);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Clear specializations when switching tabs
    setLocalFilters(prev => ({
      ...prev,
      specializations: [],
    }));
  };
  
  // Remove a single filter
  const removeFilter = (key: keyof CrewFilter, value?: string) => {
    let updatedFilters: CrewFilter;
    
    if (key === 'specializations' && value && filters.specializations) {
      updatedFilters = {
        ...filters,
        specializations: filters.specializations.filter(s => s !== value)
      };
    } else {
      updatedFilters = { ...filters, [key]: undefined };
    }
    
    // Dispatch event with updated filters
    const event = new CustomEvent('crew-filter-change', {
      detail: { filters: updatedFilters }
    });
    document.dispatchEvent(event);
  };
  
  // Currently selected specializations
  const selectedSpecializations = localFilters.specializations || [];
  
  return (
    <div className="rounded-lg border bg-card dark:bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 p-6">
        {/* Search input */}
        <div className="flex-grow">
          <Label htmlFor="search" className="text-sm font-medium sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text" 
              placeholder="Search by name or keywords..."
              className="w-full pl-9 bg-background dark:bg-background focus-visible:ring-amber-500"
              value={localFilters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </div>
        </div>
        
        {/* Specializations filter */}
        <div className="w-full md:w-56">
          <Label htmlFor="specializations" className="text-sm font-medium sr-only">
            Specializations
          </Label>
          <Popover open={specializationsOpen} onOpenChange={setSpecializationsOpen}>
            <PopoverTrigger asChild>
              <Button
                id="specializations"
                variant="outline"
                role="combobox"
                aria-expanded={specializationsOpen}
                className="w-full justify-between bg-background dark:bg-background"
              >
                {selectedSpecializations.length > 0
                  ? `${selectedSpecializations.length} Selected`
                  : "Specializations"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] md:w-[320px] p-0">
              <Command className="bg-background dark:bg-background">
                <CommandInput placeholder="Search specializations..." />
                <CommandEmpty>No specialization found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {crewSpecializations.map((specialization) => (
                    <CommandItem
                      key={specialization}
                      onSelect={() => toggleSpecialization(specialization)}
                      className="flex items-center cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedSpecializations.includes(specialization)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{specialization}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem 
                    onSelect={() => {
                      handleFilterChange('specializations', []);
                      setSpecializationsOpen(false);
                    }}
                    className="justify-center text-center cursor-pointer"
                  >
                    Clear Filters
                  </CommandItem>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Minimum rating filter */}
        <div className="w-full md:w-56">
          <Label htmlFor="min-rating" className="text-sm font-medium sr-only">
            Minimum Rating
          </Label>
          <Popover open={ratingOpen} onOpenChange={setRatingOpen}>
            <PopoverTrigger asChild>
              <Button
                id="min-rating"
                variant="outline"
                role="combobox"
                aria-expanded={ratingOpen}
                className="w-full justify-between bg-background dark:bg-background"
              >
                {localFilters.minRating 
                  ? `★ ${localFilters.minRating}+` 
                  : "Minimum Rating"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command className="bg-background dark:bg-background">
                <CommandGroup className="p-2">
                  <div className="flex flex-col space-y-4 p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Minimum Rating</span>
                      <span className="text-sm font-medium">
                        {localFilters.minRating || 'Any'} {localFilters.minRating ? '★' : ''}
                      </span>
                    </div>
                    <Slider
                      value={[localFilters.minRating || 0]}
                      min={0}
                      max={5}
                      step={0.5}
                      onValueChange={(values) => handleFilterChange('minRating', values[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Any</span>
                      <span>★★★★★</span>
                    </div>
                  </div>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem 
                    onSelect={() => handleFilterChange('minRating', null)}
                    className="justify-center text-center cursor-pointer"
                  >
                    Clear
                  </CommandItem>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Availability filter */}
        <div className="w-full md:w-56">
          <Label htmlFor="availability" className="text-sm font-medium sr-only">
            Availability
          </Label>
          <Button
            id="availability"
            variant="outline"
            className={cn(
              "w-full justify-start bg-background dark:bg-background",
              localFilters.available && "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-50 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            )}
            onClick={() => handleFilterChange('available', !localFilters.available)}
          >
            <Calendar className={cn("mr-2 h-4 w-4", localFilters.available && "text-amber-500")} />
            {localFilters.available ? "Available Now" : "Any Availability"}
          </Button>
        </div>
        
        {/* Captain specific fields - only show when isCaptain is true */}
        {localFilters.isCaptain && (
          <>
            {/* Years of experience filter */}
            <div className="w-full md:w-56">
              <Label htmlFor="years-experience" className="text-sm font-medium sr-only">
                Years of Experience
              </Label>
              <Popover open={yearsOpen} onOpenChange={setYearsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="years-experience"
                    variant="outline"
                    role="combobox"
                    aria-expanded={yearsOpen}
                    className="w-full justify-between bg-background dark:bg-background"
                  >
                    {localFilters.minYearsExperience 
                      ? `${localFilters.minYearsExperience}+ Years` 
                      : "Experience"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command className="bg-background dark:bg-background">
                    <CommandGroup className="p-2">
                      <div className="flex flex-col space-y-4 p-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Minimum Years</span>
                          <span className="text-sm font-medium">
                            {localFilters.minYearsExperience || 'Any'}
                          </span>
                        </div>
                        <Slider
                          value={[localFilters.minYearsExperience || 0]}
                          min={0}
                          max={30}
                          step={1}
                          onValueChange={(values) => handleFilterChange('minYearsExperience', values[0])}
                          className="w-full"
                        />
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Any</span>
                          <span>30 yrs</span>
                        </div>
                      </div>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem 
                        onSelect={() => handleFilterChange('minYearsExperience', null)}
                        className="justify-center text-center cursor-pointer"
                      >
                        Clear
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Dedicated filter */}
            <div className="w-full md:w-56">
              <Label htmlFor="dedicated" className="text-sm font-medium sr-only">
                Dedicated Captains
              </Label>
              <Button
                id="dedicated"
                variant="outline"
                className={cn(
                  "w-full justify-start bg-background dark:bg-background",
                  localFilters.dedicatedOnly && "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-50 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                )}
                onClick={() => handleFilterChange('dedicatedOnly', !localFilters.dedicatedOnly)}
              >
                <Anchor className={cn("mr-2 h-4 w-4", localFilters.dedicatedOnly && "text-amber-500")} />
                {localFilters.dedicatedOnly ? "Dedicated Only" : "All Captains"}
              </Button>
            </div>
          </>
        )}
        
        {/* Reset button */}
        <div>
          <Button 
            variant="ghost" 
            onClick={handleReset}
            className="w-full md:w-auto bg-background dark:bg-background"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
} 