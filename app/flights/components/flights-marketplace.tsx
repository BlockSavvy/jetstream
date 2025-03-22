'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flight, FlightFilters } from '../types';
import { FlightCard } from './flight-card';
import { FlightFilters as FlightFiltersComponent } from './flight-filters';
import { BookingDialog } from './booking-dialog';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const ITEMS_PER_PAGE = 9;

export default function FlightsMarketplace() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FlightFilters>({});
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID for booking
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    
    getUser();
  }, [supabase]);
  
  // Fetch flights with applied filters
  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query parameters from filters
        const queryParams = new URLSearchParams();
        
        if (filters.origin && filters.origin !== 'any_origin') queryParams.append('origin', filters.origin);
        if (filters.destination && filters.destination !== 'any_destination') queryParams.append('destination', filters.destination);
        if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
        if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
        if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
        if (filters.minSeats) queryParams.append('minSeats', filters.minSeats);
        if (filters.hasFractionalTokens) queryParams.append('hasFractionalTokens', 'true');
        
        const response = await fetch(`/api/flights?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch flights');
        }
        
        const data = await response.json();
        setFlights(data);
        
        // Calculate total pages for pagination
        setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
        
        // Reset to first page when filters change
        setCurrentPage(1);
      } catch (err) {
        console.error('Error fetching flights:', err);
        setError('Failed to load flights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlights();
  }, [filters]);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FlightFilters) => {
    setFilters(newFilters);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilters({});
  };
  
  // Handle booking dialog
  const handleBookNow = (flight: Flight) => {
    setSelectedFlight(flight);
    setIsBookingOpen(true);
  };
  
  // Handle close of booking dialog
  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };
  
  // Get paginated flights
  const paginatedFlights = flights.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Check if we have any results
  const hasResults = flights.length > 0;
  
  return (
    <div className="w-full">
      {/* Filters Panel */}
      <FlightFiltersComponent 
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading flights...</span>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={handleResetFilters}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset and try again
          </Button>
        </Alert>
      )}
      
      {/* No Results State */}
      {!loading && !error && !hasResults && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>No flights found</AlertTitle>
          <AlertDescription>
            We couldn't find any flights matching your criteria. Try adjusting your filters or try again later.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={handleResetFilters}
          >
            Reset filters
          </Button>
        </Alert>
      )}
      
      {/* Results Grid */}
      {!loading && !error && hasResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedFlights.map((flight) => (
              <FlightCard 
                key={flight.id} 
                flight={flight} 
                onBookNow={handleBookNow} 
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="my-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                      isActive={currentPage === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
      
      {/* Booking Dialog */}
      <BookingDialog 
        flight={selectedFlight} 
        isOpen={isBookingOpen} 
        onClose={handleCloseBooking}
        userId={userId}
      />
    </div>
  );
} 