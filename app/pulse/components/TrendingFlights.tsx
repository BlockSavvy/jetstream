"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Zap, 
  Activity,
  Loader2
} from "lucide-react";
import { Flight } from "@/app/flights/types";
import { getJetImage } from "@/lib/utils/jet-images";
import { format } from "date-fns";

export default function TrendingFlights() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch flights from the API
  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await fetch('/api/flights');
        
        if (!response.ok) {
          throw new Error('Failed to fetch flights');
        }
        
        const data = await response.json();
        
        // Sort by base_price to get premium flights first (descending order)
        const sortedFlights = [...data].sort((a, b) => b.base_price - a.base_price);
        
        // Take the top 5 premium flights
        setFlights(sortedFlights.slice(0, 5));
      } catch (err) {
        console.error('Error fetching flights:', err);
        setError('Failed to load trending flights');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlights();
  }, []);

  // Calculate match score based on price (higher price = higher score for this demo)
  const calculateMatchScore = (price: number): number => {
    const maxPrice = 25000; // Assumed max price
    const minScore = 85; // Minimum score we want to show
    const score = Math.min(98, minScore + ((price / maxPrice) * (100 - minScore)));
    return Math.round(score);
  };

  // Generate urgency message based on available seats
  const getUrgencyMessage = (availableSeats: number): string => {
    if (availableSeats <= 2) return `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} left!`;
    if (availableSeats <= 4) return "Filling fast!";
    if (availableSeats <= 6) return "Limited availability";
    return "VIP access included";
  };

  return (
    <section id="pulse-results" className="py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Pulse Recommendations</h2>
            <p className="text-gray-400">Curated flights based on your preferences and trending events</p>
          </div>
          <Badge 
            className="mt-2 md:mt-0 bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1 rounded-full"
          >
            <Activity className="w-4 h-4 mr-1" /> AI-Powered
          </Badge>
        </div>
  
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-lg text-gray-300">Loading trending flights...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <Carousel 
            ref={carouselRef}
            className="w-full"
            opts={{
              align: "start",
              loop: true
            }}
          >
            <CarouselContent className="-ml-4">
              {flights.map((flight) => {
                const matchScore = calculateMatchScore(flight.base_price);
                const urgencyMsg = getUrgencyMessage(flight.available_seats);
                const departureDate = new Date(flight.departure_time);
                const returnDate = new Date(flight.arrival_time);
                
                // Format dates
                const formattedDepartureDate = format(departureDate, 'MMM d, yyyy');
                
                // Get event name (using destination city as fallback)
                const eventName = flight.destination?.city ? `${flight.destination.city} Experience` : 'Destination Experience';
                
                // Get jet image
                const jetImage = getJetImage(flight.jets, 0);
                
                // Format currency
                const formattedPrice = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(flight.base_price);
                
                // Calculate fractional tokens (approximately 1 token per $5000)
                const fractionalTokens = (flight.base_price / 5000).toFixed(1);
                
                return (
                  <CarouselItem 
                    key={flight.id} 
                    className="pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <Card className="bg-gray-900 border border-gray-800 shadow-xl overflow-hidden h-full transition-all duration-200 hover:border-amber-500/50 hover:shadow-amber-500/10">
                      <div className="relative h-44 bg-gray-800">
                        <div 
                          className="absolute inset-0 bg-center bg-cover"
                          style={{
                            backgroundImage: `url(${jetImage})`,
                            backgroundPosition: "center"
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-amber-500 text-white">
                            {matchScore}% Match
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-xl font-bold text-white truncate">{eventName}</h3>
                          <div className="flex items-center text-gray-300 text-sm">
                            <MapPin className="w-3.5 h-3.5 mr-1" />
                            <span>{flight.destination?.city || 'Unknown City'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center text-gray-400 text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formattedDepartureDate}</span>
                          </div>
                          <div className="flex items-center text-amber-400 text-sm">
                            <Zap className="w-4 h-4 mr-1" />
                            <span>{urgencyMsg}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-white">
                            <div className="text-2xl font-bold">{formattedPrice}</div>
                            <div className="text-sm text-gray-400">or {fractionalTokens} JET</div>
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{flight.jets.capacity} Passengers</span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                          size="sm"
                          onClick={() => window.location.href = `/flights?id=${flight.id}`}
                        >
                          Book Now
                        </Button>
                      </CardFooter>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="left-0 -translate-x-1/2 bg-gray-800/80 text-white hover:bg-gray-700 border-gray-700" />
              <CarouselNext className="right-0 translate-x-1/2 bg-gray-800/80 text-white hover:bg-gray-700 border-gray-700" />
            </div>
          </Carousel>
        )}
      </motion.div>
    </section>
  );
} 