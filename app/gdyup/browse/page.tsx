'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, Plane, Clock, Star, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/lib/auth-provider';
import { toast } from 'sonner';
import ElitePaymentSheet from '../components/ElitePaymentSheet';
import GdyupClientLayout from '../components/GdyupClientLayout';
import { apiClient } from '../utils/api-client';
import { motion, AnimatePresence } from 'framer-motion';

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
    images?: string[];
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
  const [error, setError] = useState<string | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState({
    departureDate: '',
    passengers: '1'
  });
  
  const { getThemedTextClasses } = useGdyupTheme();
  const { user } = useAuth();

  // ELITE REAL DATABASE LOADING - Force real data only!
  const fetchFlights = async (showRetry = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (showRetry) {
        console.log(`[Browse] 🔄 RETRY ATTEMPT ${retryCount + 1} - Loading real flights...`);
      } else {
        console.log('[Browse] 🚀 ELITE LOADING - Real flights from database...');
      }
      
      // Use the new REAL DATA ONLY API client
      const data = await apiClient.getFlights();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No flights available in database');
      }
      
      // Filter for available flights only
      const availableFlights = data.filter((flight: Flight) => 
        flight.status === 'scheduled' && flight.available_seats > 0
      );
      
      console.log(`[Browse] ✅ SUCCESS: Loaded ${availableFlights.length} available flights from database`);
      setFlights(availableFlights);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('[Browse] 🚨 CRITICAL ERROR loading flights:', error);
      setError(error instanceof Error ? error.message : 'Failed to load flights');
      setFlights([]); // Clear flights on error
      
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        toast.error(`Loading failed, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => fetchFlights(true), 2000); // Retry after 2 seconds
      } else {
        toast.error('Failed to load flights. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch flights on component mount
  useEffect(() => {
    fetchFlights();
  }, []);

  // Filter flights based on search and filters
  const filteredFlights = flights.filter(flight => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      flight.origin?.city?.toLowerCase().includes(searchLower) ||
      flight.destination?.city?.toLowerCase().includes(searchLower) ||
      flight.origin_airport?.toLowerCase().includes(searchLower) ||
      flight.destination_airport?.toLowerCase().includes(searchLower) ||
      flight.jets?.manufacturer?.toLowerCase().includes(searchLower) ||
      flight.jets?.model?.toLowerCase().includes(searchLower);
    
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

  // Manual retry function
  const handleRetry = () => {
    setRetryCount(0);
    fetchFlights();
  };

  return (
    <div className="min-h-screen gdyup-app bg-black text-white">
      {/* ELITE HEADER */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Title */}
            <h1 className="text-3xl font-bold text-white">
              Browse Flights
            </h1>
            
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={20} />
                <input
                  type="text"
                  placeholder="Search destinations, airports, or aircraft..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:outline-none transition-all"
                />
              </div>
              
              {/* Filter Button */}
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 px-6 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Filter size={18} />
                Filters
              </motion.button>
              
              {/* Refresh Button */}
              <motion.button
                onClick={handleRetry}
                disabled={loading}
                className="h-12 px-4 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 font-medium hover:bg-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Loading...' : 'Refresh'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FILTERS PANEL */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 border-b border-white/10"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Departure Date</label>
                  <input
                    type="date"
                    value={filters.departureDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white/20 focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Passengers</label>
                  <select
                    value={filters.passengers}
                    onChange={(e) => setFilters(prev => ({ ...prev, passengers: e.target.value }))}
                    className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-lg text-white focus:bg-white/20 focus:border-white/40 focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num} className="bg-black text-white">{num} passenger{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* LOADING STATE */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full mb-6"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h3 className="text-2xl font-bold text-white mb-2">Loading Elite Flights</h3>
            <p className="text-white/70">Fetching real data from our database...</p>
            {retryCount > 0 && (
              <p className="text-yellow-400 mt-2">Retry attempt {retryCount}/3</p>
            )}
          </motion.div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/40 rounded-xl p-6 text-center"
          >
            <h3 className="text-xl font-bold text-red-400 mb-2">Failed to Load Flights</h3>
            <p className="text-white/80 mb-4">{error}</p>
            <motion.button
              onClick={handleRetry}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* NO FLIGHTS STATE */}
        {!loading && !error && filteredFlights.length === 0 && flights.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Plane className="mx-auto text-white/40 mb-6" size={64} />
            <h3 className="text-2xl font-bold text-white mb-2">No Flights Available</h3>
            <p className="text-white/70 mb-6">The database currently has no flights scheduled.</p>
            <motion.button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Refresh Flights
            </motion.button>
          </motion.div>
        )}

        {/* FLIGHTS GRID */}
        {!loading && !error && filteredFlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredFlights.map((flight, index) => (
              <motion.div
                key={flight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group"
              >
                {/* Flight Route */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">{flight.origin?.city || flight.origin_airport}</div>
                    <div className="text-sm text-white/60">{flight.origin?.code || flight.origin_airport}</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-px bg-white/30 flex-1"></div>
                    <ArrowRight className="mx-3 text-white/60" size={20} />
                    <div className="h-px bg-white/30 flex-1"></div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{flight.destination?.city || flight.destination_airport}</div>
                    <div className="text-sm text-white/60">{flight.destination?.code || flight.destination_airport}</div>
                  </div>
                </div>

                {/* Flight Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock size={16} />
                    <span className="text-sm">
                      {formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}
                    </span>
                    <span className="text-xs text-white/60">({formatDuration(flight.departure_time, flight.arrival_time)})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar size={16} />
                    <span className="text-sm">{formatDate(flight.departure_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <Plane size={16} />
                    <span className="text-sm">{flight.jets?.manufacturer} {flight.jets?.model}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <Users size={16} />
                    <span className="text-sm">{flight.available_seats} seats available</span>
                  </div>
                </div>

                {/* Price & Book Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">${flight.base_price.toLocaleString()}</div>
                    <div className="text-xs text-white/60">per seat</div>
                  </div>
                  <motion.button
                    onClick={() => handleBookFlight(flight)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Book Now
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Results Summary */}
        {!loading && !error && filteredFlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center text-white/70"
          >
            Showing {filteredFlights.length} of {flights.length} available flights
          </motion.div>
        )}
      </div>

      {/* Payment Sheet */}
      <ElitePaymentSheet
        isOpen={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        amount={selectedFlight ? selectedFlight.base_price : 0}
        currency="USD"
        description={selectedFlight ? `Flight from ${selectedFlight.origin?.city || selectedFlight.origin_airport} to ${selectedFlight.destination?.city || selectedFlight.destination_airport}` : ''}
        onPaymentComplete={(result) => {
          console.log('Payment completed:', result);
          setShowPaymentSheet(false);
          setSelectedFlight(null);
          toast.success('Flight booked successfully!');
        }}
        onPaymentError={(error) => {
          console.error('Payment error:', error);
          toast.error('Payment failed. Please try again.');
        }}
      />
    </div>
  );
} 