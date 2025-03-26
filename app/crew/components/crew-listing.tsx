"use client";

import { useState, useEffect, useCallback } from 'react';
import { CrewMember, CrewFilter } from '@/lib/types/crew.types';
import { CrewCard } from './crew-card';
import { CrewFilters } from './crew-filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ChevronLeft, ChevronRight, Star, Shield, UserPlus, Briefcase, HeartHandshake, Music, Leaf } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CrewListingProps {
  filters: CrewFilter;
}

export function CrewListing({ filters }: CrewListingProps) {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [filteredResults, setFilteredResults] = useState<CrewMember[]>([]);
  const [featuredCrew, setFeaturedCrew] = useState<CrewMember[]>([]);
  const [businessCrew, setBusinessCrew] = useState<CrewMember[]>([]);
  const [wellnessCrew, setWellnessCrew] = useState<CrewMember[]>([]);
  const [entertainmentCrew, setEntertainmentCrew] = useState<CrewMember[]>([]);
  const [familyCrew, setFamilyCrew] = useState<CrewMember[]>([]);
  
  const [localFilters, setLocalFilters] = useState<CrewFilter>(filters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFiltersActive, setIsFiltersActive] = useState(false);
  
  const ITEMS_PER_PAGE = 12; 
  
  // Keep local filters in sync with prop filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Setup event listeners for filter changes
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const { filters: newFilters } = event.detail;
      setLocalFilters(newFilters);
    };
    
    const handleFilterReset = () => {
      setLocalFilters(prev => ({ 
        isCaptain: prev.isCaptain 
      }));
    };
    
    // Add event listeners
    document.addEventListener('crew-filter-change', handleFilterChange as EventListener);
    document.addEventListener('crew-filter-reset', handleFilterReset as EventListener);
    
    // Clean up
    return () => {
      document.removeEventListener('crew-filter-change', handleFilterChange as EventListener);
      document.removeEventListener('crew-filter-reset', handleFilterReset as EventListener);
    };
  }, []);
  
  // Organize crew members by categories
  useEffect(() => {
    // Check if filters are active
    const hasActiveFilters = 
      (localFilters.specializations && localFilters.specializations.length > 0) ||
      localFilters.minRating !== undefined ||
      localFilters.available !== undefined ||
      localFilters.searchTerm !== undefined ||
      localFilters.minYearsExperience !== undefined ||
      localFilters.dedicatedOnly === true;
    
    setIsFiltersActive(hasActiveFilters);
    
    if (hasActiveFilters) {
      // When filters are active, show filtered results in a regular grid
      setFilteredResults(crewMembers);
    } else {
      // When no filters, organize by categories
      
      // Featured crew (top rated captains)
      const topCaptains = crewMembers
        .filter(crew => crew.isCaptain)
        .sort((a, b) => (b.ratingsAvg || 0) - (a.ratingsAvg || 0))
        .slice(0, 3);
      
      setFeaturedCrew(topCaptains);
      
      // Business oriented crew
      const businessKeywords = ['business', 'networking', 'professional', 'ted', 'talk', 'workshop', 'executive'];
      const businessRelated = crewMembers.filter(crew => {
        return crew.specializations.some(spec => 
          businessKeywords.some(keyword => spec.toLowerCase().includes(keyword))
        );
      }).slice(0, 6);
      
      setBusinessCrew(businessRelated);
      
      // Wellness crew
      const wellnessKeywords = ['wellness', 'mindfulness', 'meditation', 'yoga', 'health', 'relax', 'spa', 'retreat'];
      const wellnessRelated = crewMembers.filter(crew => {
        return crew.specializations.some(spec => 
          wellnessKeywords.some(keyword => spec.toLowerCase().includes(keyword))
        );
      }).slice(0, 6);
      
      setWellnessCrew(wellnessRelated);
      
      // Entertainment crew
      const entertainmentKeywords = ['entertainment', 'comedy', 'music', 'performance', 'podcast', 'show', 'art'];
      const entertainmentRelated = crewMembers.filter(crew => {
        return crew.specializations.some(spec => 
          entertainmentKeywords.some(keyword => spec.toLowerCase().includes(keyword))
        );
      }).slice(0, 6);
      
      setEntertainmentCrew(entertainmentRelated);
      
      // Family-friendly crew
      const familyKeywords = ['family', 'kid', 'children', 'friendly', 'games', 'activities'];
      const familyRelated = crewMembers.filter(crew => {
        return crew.specializations.some(spec => 
          familyKeywords.some(keyword => spec.toLowerCase().includes(keyword))
        );
      }).slice(0, 6);
      
      setFamilyCrew(familyRelated);
    }
  }, [crewMembers, localFilters]);
  
  // Fetch crew members with applied filters
  const fetchCrewMembers = useCallback(async (pageToFetch = page) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (localFilters.specializations && localFilters.specializations.length > 0) {
        queryParams.append('specializations', localFilters.specializations.join(','));
      }
      
      if (localFilters.minRating) {
        queryParams.append('minRating', localFilters.minRating.toString());
      }
      
      if (localFilters.available) {
        queryParams.append('available', 'true');
      }
      
      if (localFilters.searchTerm) {
        queryParams.append('query', localFilters.searchTerm);
      }
      
      if (localFilters.isCaptain !== undefined) {
        queryParams.append('isCaptain', localFilters.isCaptain.toString());
      }
      
      if (localFilters.dedicatedOnly) {
        queryParams.append('dedicatedOnly', 'true');
      }
      
      if (localFilters.minYearsExperience) {
        queryParams.append('minYearsExperience', localFilters.minYearsExperience.toString());
      }
      
      // When not using filters, request more items for categorization
      const limit = isFiltersActive ? ITEMS_PER_PAGE : 50;
      
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', ((pageToFetch - 1) * ITEMS_PER_PAGE).toString());
      queryParams.append('count', 'true'); // Request total count for pagination
      
      const response = await fetch(`/api/crew?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch crew members');
      }
      
      const data = await response.json();
      
      setCrewMembers(data.crew || []);
      setFilteredResults(data.crew || []);
      setHasMore(data.hasMore || false);
      setTotalItems(data.totalCount || 0);
      setTotalPages(Math.ceil((data.totalCount || 0) / ITEMS_PER_PAGE));
      setPage(pageToFetch);
    } catch (err) {
      console.error('Error fetching crew members:', err);
      setError('Failed to load crew members. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, localFilters, ITEMS_PER_PAGE, isFiltersActive]);
  
  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchCrewMembers(1);
  }, [localFilters, fetchCrewMembers]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchCrewMembers(newPage);
  };
  
  // Reset filters
  const handleReset = () => {
    const resetEvent = new CustomEvent('crew-filter-reset');
    document.dispatchEvent(resetEvent);
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={() => handlePageChange(1)}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show surrounding pages
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i <= totalPages && i > 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageChange(i)}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // Show ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  // Render category section with title and cards
  const renderCategorySection = (title: string, icon: React.ReactNode, crew: CrewMember[], emptyMessage?: string) => {
    if (crew.length === 0 && !loading) {
      return null;
    }
    
    return (
      <div className="mt-10">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-full bg-amber-100 mr-3">
            {icon}
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        {crew.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {crew.map((crewMember) => (
              <CrewCard key={crewMember.id} crew={crewMember} />
            ))}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-sm border h-[350px]">
                <Skeleton className="h-32 w-full" />
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{emptyMessage || 'No crew members found in this category'}</p>
        )}
      </div>
    );
  };
  
  // Featured crew section with larger cards
  const renderFeaturedSection = () => {
    if (featuredCrew.length === 0 && !loading) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <div className="flex items-center mb-6">
          <div className="p-2 rounded-full bg-amber-100 mr-3">
            <Star className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold">Featured Elite Captains</h2>
        </div>
        
        {featuredCrew.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCrew.map((captain) => (
              <div key={captain.id} className="relative group">
                <CrewCard crew={captain} />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden shadow-sm border h-[350px]">
                <Skeleton className="h-32 w-full" />
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 w-full" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <CrewFilters filters={localFilters} />
      
      {error && (
        <div className="py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => fetchCrewMembers(1)}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      )}
      
      {!error && (
        <>
          {/* Results summary when filters are active */}
          {isFiltersActive && !loading && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
              {totalItems > 0 ? ` of ${totalItems}` : ''}
            </div>
          )}
          
          {/* Filtered results grid when filters are active */}
          {isFiltersActive ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredResults.map((crew) => (
                  <CrewCard key={crew.id} crew={crew} />
                ))}
                
                {loading && page === 1 && (
                  Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                    <div key={i} className="rounded-lg overflow-hidden shadow-sm border h-[350px]">
                      <Skeleton className="h-32 w-full" />
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-12 w-full" />
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-12 rounded-full" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                          <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Pagination for filtered results */}
              {totalPages > 1 && !loading && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(page - 1)} 
                        className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {renderPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(page + 1)} 
                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            // Categorized sections when no filters are active
            <>
              {/* Featured Elite Captains Section */}
              {renderFeaturedSection()}
              
              {/* Business & Professional Experiences */}
              {renderCategorySection('Business & Professional Experiences', 
                <Briefcase className="h-5 w-5 text-amber-600" />, 
                businessCrew
              )}
              
              {/* Wellness & Mindfulness */}
              {renderCategorySection('Wellness & Mindfulness', 
                <Leaf className="h-5 w-5 text-amber-600" />, 
                wellnessCrew
              )}
              
              {/* Entertainment & Cultural Experiences */}
              {renderCategorySection('Entertainment & Cultural Experiences', 
                <Music className="h-5 w-5 text-amber-600" />, 
                entertainmentCrew
              )}
              
              {/* Family-Friendly Experiences */}
              {renderCategorySection('Family-Friendly Experiences', 
                <HeartHandshake className="h-5 w-5 text-amber-600" />, 
                familyCrew
              )}
            </>
          )}
          
          {/* Loading indicator for additional pages */}
          {loading && page > 1 && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                disabled
                className="min-w-[140px]"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </Button>
            </div>
          )}
          
          {/* No results message */}
          {!loading && isFiltersActive && filteredResults.length === 0 && (
            <div className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No crew members found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms.</p>
              <Button onClick={handleReset} variant="default">
                Reset Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 