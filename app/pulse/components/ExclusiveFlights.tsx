"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Ticket, 
  MapPin, 
  Calendar,
  Gem,
  Loader2
} from "lucide-react";
import { Flight } from "@/app/flights/types";
import { getJetImage } from "@/lib/utils/jet-images";
import { format } from "date-fns";

// Special event mapping for premium jets
const specialEvents = {
  'Gulfstream': {
    'G650': 'Crypto Summit Winter Retreat',
    'G700': 'Billionaire\'s Winter Investment Retreat',
    'default': 'Executive Luxury Experience'
  },
  'Bombardier': {
    'Global 7500': 'Ultra VIP Music Festival Package',
    'Global 8000': 'Exclusive Fashion Week Access',
    'default': 'Premium Luxury Retreat'
  },
  'Dassault': {
    'Falcon 8X': 'VIP Art Collector\'s Tour',
    'default': 'Private Gallery Access'
  },
  'Boeing': {
    'BBJ 787': 'Global Investment Summit',
    'BBJ 777X': 'International Entrepreneurs Retreat',
    'default': 'Exclusive Corporate Experience'
  },
  'Airbus': {
    'ACJ350 XWB': 'International Luxury Forum',
    'default': 'Global Executive Summit'
  },
  'default': 'Exclusive Private Experience'
};

export default function ExclusiveFlights() {
  const [exclusiveFlights, setExclusiveFlights] = useState<Flight[]>([]);
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
        
        // Filter premium jets only (price > $15000) and sort by price descending
        const premiumFlights = data
          .filter((flight: Flight) => flight.base_price > 15000)
          .sort((a: Flight, b: Flight) => b.base_price - a.base_price)
          .slice(0, 3); // Take top 3 premium flights
        
        setExclusiveFlights(premiumFlights);
      } catch (err) {
        console.error('Error fetching exclusive flights:', err);
        setError('Failed to load exclusive flights');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlights();
  }, []);

  // Get special event name based on jet manufacturer and model
  const getSpecialEventName = (manufacturer: string, model: string): string => {
    const manufacturerEvents = specialEvents[manufacturer as keyof typeof specialEvents] || specialEvents.default;
    
    if (typeof manufacturerEvents === 'string') {
      return manufacturerEvents;
    }
    
    return manufacturerEvents[model as keyof typeof manufacturerEvents] || manufacturerEvents.default;
  };

  // Get limited allocation text based on price
  const getLimitedAllocationText = (price: number, availableSeats: number): string => {
    if (availableSeats <= 2) return `Only ${availableSeats} NFT ticket${availableSeats === 1 ? '' : 's'} available`;
    if (price > 22000) return "Limited NFT allocation";
    if (price > 18000) return "Only 4 NFT tickets remaining";
    return "Only 6 NFT tickets available";
  };

  // Generate a description based on the event and destination
  const generateDescription = (eventName: string, destination: string): string => {
    const descriptions = [
      `Exclusive access to the world's most prestigious ${eventName.split(' ')[0].toLowerCase()} summit in ${destination}, including private sessions with industry leaders.`,
      `VIP access to ${destination}'s most exclusive venues with curated networking opportunities and luxury accommodations.`,
      `Network with ultra-high-net-worth individuals at this exclusive ${eventName.toLowerCase()} in a luxury ${destination} setting.`
    ];
    
    // Return a consistent description based on the event name length as a simple hash
    const index = eventName.length % descriptions.length;
    return descriptions[index];
  };

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-8"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600 mb-3">
            Exclusive Pulse Flights – Limited Edition NFTs
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Secure your spot on these ultra-exclusive flights with tokenized NFT tickets, providing verifiable ownership and special perks.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="ml-2 text-lg text-gray-300">Loading exclusive flights...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exclusiveFlights.map((flight, index) => {
              const departureDate = new Date(flight.departure_time);
              const returnDate = new Date(flight.arrival_time);
              const formattedDepartureDate = format(departureDate, 'MMM d, yyyy');
              const formattedReturnDate = format(returnDate, 'MMM d, yyyy');
              
              // Get jet image
              const jetImage = getJetImage(flight.jets, 0);
              
              // Get special event name
              const eventName = getSpecialEventName(flight.jets.manufacturer, flight.jets.model);
              
              // Format currency
              const formattedPrice = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(flight.base_price);
              
              // Calculate crypto price (approximately 1 ETH = $3500)
              const cryptoPrice = (flight.base_price / 3500).toFixed(2);
              
              // Get limited allocation text
              const limitedText = getLimitedAllocationText(flight.base_price, flight.available_seats);
              
              // Generate description
              const description = generateDescription(eventName, flight.destination?.city || 'exclusive location');
              
              return (
                <motion.div
                  key={flight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <Card className="bg-gray-900 border border-gray-800 shadow-xl overflow-hidden h-full hover:border-amber-500/30 transition-all duration-300">
                    <div className="relative h-48 bg-gray-800">
                      <div 
                        className="absolute inset-0 bg-center bg-cover"
                        style={{
                          backgroundImage: `url(${jetImage})`,
                          backgroundPosition: "center"
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                      </div>
                      
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-purple-600 text-white flex items-center px-3 py-1">
                          <Ticket className="w-3.5 h-3.5 mr-1.5" />
                          NFT Tokenized Ticket
                        </Badge>
                      </div>
                      
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-xl font-bold text-white">{eventName}</h3>
                        <div className="flex items-center text-gray-300 text-sm">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          <span>{flight.destination?.city || 'Exclusive Destination'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <div className="flex items-center text-gray-400 text-sm mb-3">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>{formattedDepartureDate} - {formattedReturnDate}</span>
                      </div>
                      
                      <p className="text-gray-400 mb-4 text-sm">
                        {description}
                      </p>
                      
                      <div className="bg-gray-800/50 px-3 py-2 rounded-md mb-4">
                        <div className="flex items-center text-amber-400 text-sm mb-1">
                          <Gem className="w-4 h-4 mr-1.5" />
                          <span>{limitedText}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-white">
                            <div className="text-xl font-bold">{formattedPrice}</div>
                            <div className="text-sm text-purple-400">or {cryptoPrice} ETH</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="px-5 pb-5 pt-0">
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                        onClick={() => window.location.href = `/flights?id=${flight.id}`} 
                      >
                        Reserve NFT Ticket
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </section>
  );
} 