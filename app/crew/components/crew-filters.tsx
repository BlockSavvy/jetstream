"use client";

import { useState, useEffect } from 'react';
import { Search, X, Filter, Star } from 'lucide-react';
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

interface CrewFiltersProps {
  filters: CrewFilter;
}

export function CrewFilters({ filters }: CrewFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<CrewFilter>(filters);
  const [activeTab, setActiveTab] = useState<string>(filters.isCaptain ? "captain" : "crew");
  
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
    <div className="bg-white rounded-lg border p-4 shadow-sm space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search by name or keywords..."
            className="pl-9 pr-4"
            value={filters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          />
          {filters.searchTerm && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => handleFilterChange('searchTerm', '')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Filter Options</SheetTitle>
            </SheetHeader>
            
            <div className="py-4 space-y-6">
              <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="crew">Crew Members</TabsTrigger>
                  <TabsTrigger value="captain">Elite Captains</TabsTrigger>
                </TabsList>
                
                <TabsContent value="crew" className="mt-4 space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="specializations" className="border-b">
                      <AccordionTrigger className="text-base font-medium">Specializations</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {crewSpecializations.map(spec => (
                            <Badge 
                              key={spec}
                              variant={selectedSpecializations.includes(spec) ? "default" : "outline"} 
                              className={cn(
                                "cursor-pointer",
                                selectedSpecializations.includes(spec) && "bg-amber-500 hover:bg-amber-600"
                              )}
                              onClick={() => toggleSpecialization(spec)}
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>
                
                <TabsContent value="captain" className="mt-4 space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="specializations" className="border-b">
                      <AccordionTrigger className="text-base font-medium">Specializations</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {captainSpecializations.map(spec => (
                            <Badge 
                              key={spec}
                              variant={selectedSpecializations.includes(spec) ? "default" : "outline"} 
                              className={cn(
                                "cursor-pointer",
                                selectedSpecializations.includes(spec) && "bg-amber-500 hover:bg-amber-600"
                              )}
                              onClick={() => toggleSpecialization(spec)}
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Years of Experience (min)</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Slider
                          value={[localFilters.minYearsExperience || 0]}
                          min={0}
                          max={30}
                          step={1}
                          onValueChange={(values) => handleFilterChange('minYearsExperience', values[0])}
                          className="flex-1"
                        />
                        <span className="min-w-[40px] text-center font-medium">
                          {localFilters.minYearsExperience || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dedicated-only" className="cursor-pointer">
                        <div>
                          <span className="text-base font-medium">Dedicated Captains Only</span>
                          <p className="text-sm text-muted-foreground">Only show captains dedicated to specific jets</p>
                        </div>
                      </Label>
                      <Switch
                        id="dedicated-only"
                        checked={localFilters.dedicatedOnly || false}
                        onCheckedChange={(checked) => handleFilterChange('dedicatedOnly', checked)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Minimum Rating</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[localFilters.minRating || 0]}
                      min={0}
                      max={5}
                      step={0.5}
                      onValueChange={(values) => handleFilterChange('minRating', values[0])}
                      className="flex-1"
                    />
                    <span className="min-w-[40px] text-center font-medium flex items-center">
                      {localFilters.minRating || 0}
                      <Star className="ml-1 h-4 w-4 fill-amber-400 text-amber-400" />
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="available-toggle" className="cursor-pointer">
                    <div>
                      <span className="text-base font-medium">Available Now</span>
                      <p className="text-sm text-muted-foreground">Only show currently available</p>
                    </div>
                  </Label>
                  <Switch
                    id="available-toggle"
                    checked={localFilters.available || false}
                    onCheckedChange={(checked) => handleFilterChange('available', checked)}
                  />
                </div>
              </div>
            </div>
            
            <SheetFooter className="flex-row gap-3 pt-2 border-t">
              <Button 
                variant="outline" 
                onClick={handleReset}
                className="flex-1"
              >
                Reset
              </Button>
              <Button 
                onClick={applyFilters}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.minRating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {`${filters.minRating}+ `}
              <Star className="h-3 w-3 fill-current" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => removeFilter('minRating')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.available && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Available Now
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => removeFilter('available')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.isCaptain && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Captains Only
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => removeFilter('isCaptain')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.dedicatedOnly && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Dedicated Only
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => removeFilter('dedicatedOnly')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.minYearsExperience && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {`${filters.minYearsExperience}+ Years`}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => removeFilter('minYearsExperience')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.specializations && filters.specializations.map(spec => (
            <Badge key={spec} variant="secondary" className="flex items-center gap-1">
              {spec}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={() => removeFilter('specializations', spec)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-6 px-2 hover:bg-transparent hover:text-amber-600"
            onClick={handleReset}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
} 