"use client";

import { useState, useEffect } from 'react';
import { CrewMember, CrewFilter } from '@/lib/types/crew.types';
import { CrewCard } from './crew-card';
import { CrewFilters } from './crew-filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export function CrewListing() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CrewFilter>({});
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  
  const ITEMS_PER_PAGE = 9;
  
  // Fetch crew members with applied filters
  const fetchCrewMembers = async (resetList = false) => {
    const currentPage = resetList ? 1 : page;
    
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.specializations && filters.specializations.length > 0) {
        queryParams.append('specializations', filters.specializations.join(','));
      }
      
      if (filters.minRating) {
        queryParams.append('minRating', filters.minRating.toString());
      }
      
      if (filters.available) {
        queryParams.append('available', 'true');
      }
      
      if (filters.searchTerm) {
        queryParams.append('query', filters.searchTerm);
      }
      
      queryParams.append('limit', ITEMS_PER_PAGE.toString());
      queryParams.append('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      
      const response = await fetch(`/api/crew?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch crew members');
      }
      
      const data = await response.json();
      
      // Update the list, either by resetting or appending
      if (resetList) {
        setCrewMembers(data.crew);
        setPage(1);
      } else {
        setCrewMembers(prev => [...prev, ...data.crew]);
      }
      
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching crew members:', err);
      setError('Failed to load crew members. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchCrewMembers(true);
  }, [filters]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: CrewFilter) => {
    setFilters(newFilters);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({});
  };
  
  // Load more crew members
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchCrewMembers(false);
  };
  
  return (
    <div className="space-y-8">
      <CrewFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onReset={handleResetFilters} 
      />
      
      {error && (
        <div className="py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button 
            onClick={() => fetchCrewMembers(true)}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      )}
      
      {!error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crewMembers.map((crew) => (
              <CrewCard key={crew.id} crew={crew} />
            ))}
            
            {loading && page === 1 && (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="rounded-lg overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {(hasMore || loading && page > 1) && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleLoadMore} 
                variant="outline" 
                disabled={loading}
                className="min-w-[140px]"
              >
                {loading && page > 1 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
          
          {!loading && crewMembers.length === 0 && (
            <div className="py-16 text-center">
              <h3 className="text-lg font-semibold mb-2">No crew members found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms.</p>
              <Button onClick={handleResetFilters} variant="default">
                Reset Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 