'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/lib/auth-provider';
import { toast } from 'sonner';
import ElitePaymentSheet from '../components/ElitePaymentSheet';
import GdyupClientLayout from '../components/GdyupClientLayout';

interface Flight {
  id: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  base_price: number;
  status: string;
  jets: {
    id: string;
    manufacturer: string;
    model: string;
    capacity: number;
  };
  origin: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
  destination: {
    code: string;
    name: string;
    city: string;
    country: string;
  };
}

export default function BrowsePage() {
  return (
    <GdyupClientLayout>
      <BrowsePageContent />
    </GdyupClientLayout>
  );
}

function BrowsePageContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [filters, setFilters] = useState({
    departureDate: '',
    passengers: '1'
  });
  
  const { getThemedTextClasses } = useGdyupTheme();
  const { user } = useAuth();

  // Fetch flights from API
  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flights');
      
      if (!response.ok) {
        throw new Error('Failed to fetch flights');
      }
      
      const data = await response.json();
      
      // Filter for available flights only
      const availableFlights = data.flights?.filter((flight: Flight) => 
        flight.status === 'scheduled' && flight.available_seats > 0
      ) || [];
      
      setFlights(availableFlights);
    } catch (error) {
      console.error('Error fetching flights:', error);
      toast.error('Failed to load flights');
    } finally {
      setLoading(false);
    }
  };

  // Filter flights based on search and filters
  const filteredFlights = flights.filter(flight => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      flight.origin?.city?.toLowerCase().includes(searchLower) ||
      flight.destination?.city?.toLowerCase().includes(searchLower) ||
      flight.origin_airport?.toLowerCase().includes(searchLower) ||
      flight.destination_airport?.toLowerCase().includes(searchLower);
    
    const matchesDate = !filters.departureDate || 
      new Date(flight.departure_time).toDateString() === new Date(filters.departureDate).toDateString();
    
    const matchesPassengers = !filters.passengers || 
      flight.available_seats >= parseInt(filters.passengers);
    
    return matchesSearch && matchesDate && matchesPassengers;
  });

  const formatDuration = (departureTime: string, arrivalTime: string) => {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleBookFlight = (flight: Flight) => {
    if (!user) {
      toast.error('Please sign in to book flights');
      return;
    }
    
    setSelectedFlight(flight);
    setShowPaymentSheet(true);
  };

  const handlePaymentComplete = (result: any) => {
    console.log('Payment completed:', result);
    setShowPaymentSheet(false);
    setSelectedFlight(null);
    toast.success('Flight booked successfully!');
    // TODO: Redirect to booking confirmation or boarding pass
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  };

  return (
    <>
      <div className="main-content min-h-screen bg-gdyup-bg-dark">
        {/* Header */}
        <div className="px-6 py-6">
          <h1 className="gdyup-title text-3xl font-bold mb-2">
            Browse Flights
          </h1>
          <p className={cn("text-lg", getThemedTextClasses('secondary'))}>
            Find available seats on private jets
          </p>
        </div>

        {/* Search & Filters */}
        <div className="px-6 mb-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gdyup-text-subtle" size={20} />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-elite pl-12 w-full"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "btn-secondary-elite px-4 flex items-center gap-2",
                showFilters && "bg-gdyup-primary text-gdyup-button-text"
              )}
            >
              <Filter size={20} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="elite-card p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={filters.departureDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="input-elite"
                  />
                </div>
                <div>
                  <label className={cn("block text-sm font-medium mb-2", getThemedTextClasses())}>
                    Passengers
                  </label>
                  <select 
                    value={filters.passengers}
                    onChange={(e) => setFilters(prev => ({ ...prev, passengers: e.target.value }))}
                    className="select-elite"
                  >
                    <option value="1">1 passenger</option>
                    <option value="2">2 passengers</option>
                    <option value="3">3 passengers</option>
                    <option value="4">4+ passengers</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Flight Listings */}
        <div className="px-6 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin"></div>
              <span className={cn("ml-3", getThemedTextClasses())}>Loading flights...</span>
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="elite-card p-8 text-center">
              <Plane className="text-gdyup-text-subtle mx-auto mb-4" size={48} />
              <h3 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                No flights found
              </h3>
              <p className={cn("text-base", getThemedTextClasses('muted'))}>
                {searchQuery || filters.departureDate || filters.passengers !== '1' 
                  ? "Try adjusting your search criteria or filters."
                  : "No flights are currently available. Check back later!"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFlights.map((flight) => (
                <div key={flight.id} className="elite-card p-6 cursor-pointer">
                  {/* Flight Route */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gdyup-text">
                          {flight.origin?.code || flight.origin_airport}
                        </div>
                        <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                          {formatTime(flight.departure_time)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-4">
                        <div className="h-px bg-gdyup-border flex-1"></div>
                        <Plane className="text-gdyup-primary" size={20} />
                        <div className="h-px bg-gdyup-border flex-1"></div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gdyup-text">
                          {flight.destination?.code || flight.destination_airport}
                        </div>
                        <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                          {formatDuration(flight.departure_time, flight.arrival_time)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gdyup-primary">
                        ${Math.round(flight.base_price / (flight.jets?.capacity || flight.available_seats)).toLocaleString()}
                      </div>
                      <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                        per seat
                      </div>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} className="text-gdyup-text-subtle" />
                        <span className={getThemedTextClasses('secondary')}>
                          {formatDate(flight.departure_time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users size={16} className="text-gdyup-text-subtle" />
                        <span className={getThemedTextClasses('secondary')}>
                          {flight.available_seats} seats available
                        </span>
                      </div>
                    </div>
                    
                    <div className={cn("font-medium", getThemedTextClasses('muted'))}>
                      {flight.jets?.manufacturer} {flight.jets?.model}
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-gdyup-text-subtle" />
                      <span className={getThemedTextClasses('secondary')}>
                        {flight.origin?.city}, {flight.origin?.country}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-gdyup-text-subtle" />
                      <span className={getThemedTextClasses('secondary')}>
                        {flight.destination?.city}, {flight.destination?.country}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gdyup-border">
                    <button 
                      className="btn-primary-elite w-full"
                      onClick={() => handleBookFlight(flight)}
                    >
                      Book Flight - ${Math.round(flight.base_price / (flight.jets?.capacity || flight.available_seats)).toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More - if needed for pagination */}
          {!loading && filteredFlights.length > 0 && filteredFlights.length >= 10 && (
            <div className="mt-8 text-center">
              <button 
                className="btn-secondary-elite"
                onClick={() => {
                  // TODO: Implement pagination
                  toast.info('Pagination coming soon!');
                }}
              >
                Load More Flights
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Elite Payment Sheet */}
      <ElitePaymentSheet
        isOpen={showPaymentSheet}
        onClose={() => {
          setShowPaymentSheet(false);
          setSelectedFlight(null);
        }}
        amount={selectedFlight ? Math.round(selectedFlight.base_price / (selectedFlight.jets?.capacity || selectedFlight.available_seats)) : 0}
        currency="USD"
        description={selectedFlight ? `Flight from ${selectedFlight.origin?.city} to ${selectedFlight.destination?.city}` : ''}
        onPaymentComplete={handlePaymentComplete}
        onPaymentError={handlePaymentError}
      />
    </>
  );
} 