'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Map, Plane } from 'lucide-react';
import { extractAirportCode, getAirportImage, getRouteMapImage, getRouteMapForCodes } from '@/lib/utils/airport-images';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  image_url?: string;
  route_map_template?: string;
  is_private?: boolean;
}

interface AirportMapProps {
  departure?: string;
  arrival?: string;
  showRoute?: boolean;
  className?: string;
  imageClassName?: string;
  hideUntilLoaded?: boolean;
  disableFetch?: boolean; // Set to true to disable API fetch (for static usage)
}

export default function AirportMap({
  departure,
  arrival,
  showRoute = true,
  className = '',
  imageClassName = '',
  hideUntilLoaded = true,
  disableFetch = false
}: AirportMapProps) {
  const [departureCode, setDepartureCode] = useState<string | null>(null);
  const [arrivalCode, setArrivalCode] = useState<string | null>(null);
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [imageSrc, setImageSrc] = useState<string>('/images/airports/placeholder_airport_map.png');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Extract airport codes from departure/arrival strings
  useEffect(() => {
    if (departure) {
      const extractedCode = extractAirportCode(departure);
      setDepartureCode(extractedCode);
    } else {
      setDepartureCode(null);
    }
    
    if (arrival) {
      const extractedCode = extractAirportCode(arrival);
      setArrivalCode(extractedCode);
    } else {
      setArrivalCode(null);
    }
  }, [departure, arrival]);

  // Fetch airport data when codes change
  useEffect(() => {
    // If fetching is disabled, use the placeholder map
    if (disableFetch) {
      // Set placeholder image
      setImageSrc(getRouteMapForCodes(departureCode, arrivalCode));
      return;
    }
    
    const fetchAirportData = async () => {
      if (!departureCode && !arrivalCode) {
        setImageSrc('/images/airports/placeholder_airport_map.png');
        return;
      }
      
      setIsFetching(true);
      
      try {
        // Build a query to fetch both airports in one request if possible
        const codes = [];
        if (departureCode) codes.push(departureCode);
        if (arrivalCode && arrivalCode !== departureCode) codes.push(arrivalCode);
        
        const query = codes.join(',');
        const timestamp = Date.now(); // Prevent caching
        
        const response = await fetch(`/api/airports?codes=${query}&t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Airport API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          // Find the departure and arrival airports in the response
          const depAirport = departureCode ? data.find((a: Airport) => a.code === departureCode) : null;
          const arrAirport = arrivalCode ? data.find((a: Airport) => a.code === arrivalCode) : null;
          
          // Update state
          if (depAirport) setDepartureAirport(depAirport);
          if (arrAirport) setArrivalAirport(arrAirport);
          
          // Set the image source based on the airports we found
          if (showRoute && depAirport && arrAirport) {
            // Show route map
            setImageSrc(getRouteMapImage(depAirport, arrAirport));
          } else if (depAirport) {
            // Show departure airport
            setImageSrc(getAirportImage(depAirport));
          } else if (arrAirport) {
            // Show arrival airport
            setImageSrc(getAirportImage(arrAirport));
          } else {
            // Fallback
            setImageSrc('/images/airports/placeholder_airport_map.png');
          }
        } else {
          // Fallback to placeholder if no data
          setImageSrc('/images/airports/placeholder_airport_map.png');
        }
      } catch (error) {
        console.error('Error fetching airport data:', error);
        // Fallback to placeholder on error
        setImageSrc('/images/airports/placeholder_airport_map.png');
      } finally {
        setIsFetching(false);
      }
    };
    
    // Only fetch if we have at least one code
    if (departureCode || arrivalCode) {
      fetchAirportData();
    } else {
      setImageSrc('/images/airports/placeholder_airport_map.png');
    }
  }, [departureCode, arrivalCode, showRoute, disableFetch]);

  // Reset loading state when image source changes
  useEffect(() => {
    setIsLoading(true);
  }, [imageSrc]);

  return (
    <div className={`relative rounded-lg overflow-hidden ${className} ${hideUntilLoaded && (isLoading || isFetching) ? 'bg-gray-800/40 animate-pulse' : ''}`}>
      {/* Map Placeholder with gradient overlay shown while loading */}
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 z-10">
          <Map className="w-8 h-8 text-gray-400 animate-pulse" />
        </div>
      )}
      
      {/* Actual map image */}
      <Image
        src={imageSrc}
        alt={showRoute 
          ? `Route from ${departureAirport?.city || departureCode || 'departure'} to ${arrivalAirport?.city || arrivalCode || 'arrival'}`
          : `Airport ${departureAirport?.name || arrivalAirport?.name || departureCode || arrivalCode || 'map'}`
        }
        width={800}
        height={400}
        className={`w-full h-full object-cover ${imageClassName} ${hideUntilLoaded && isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ transition: 'opacity 0.3s ease-in-out' }}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)} // Handle case where image fails to load
      />
      
      {/* Route visualization overlay - shown when we have a route */}
      {!isLoading && showRoute && departureCode && arrivalCode && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Route line */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-0.5 bg-gradient-to-r from-blue-500 via-white to-amber-500 relative z-20">
              {/* Animated plane along the route */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 animate-pulse">
                <Plane className="h-6 w-6 text-white transform rotate-45 drop-shadow-glow" />
              </div>
              
              {/* Origin marker */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-blue-600 z-20" />
              
              {/* Destination marker */}
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-500 z-20" />
            </div>
          </div>
          
          {/* Airport codes - enhanced with city names if available */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-900/80 text-blue-100 text-xs font-bold rounded">
            {departureAirport?.city ? (
              <span>{departureAirport.city} <span className="opacity-80">({departureCode})</span></span>
            ) : departureCode}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-amber-900/80 text-amber-100 text-xs font-bold rounded">
            {arrivalAirport?.city ? (
              <span>{arrivalAirport.city} <span className="opacity-80">({arrivalCode})</span></span>
            ) : arrivalCode}
          </div>
        </div>
      )}
      
      {/* Single airport label when not showing a route */}
      {!isLoading && !showRoute && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-900/80 text-blue-100 text-xs font-bold rounded">
          {departureAirport?.city || arrivalAirport?.city ? (
            <span>
              {departureAirport?.city || arrivalAirport?.city} 
              <span className="opacity-80 ml-1">({departureCode || arrivalCode})</span>
            </span>
          ) : (departureCode || arrivalCode)}
        </div>
      )}
      
      {/* Optional airport badge for private airports */}
      {!isLoading && (
        (departureAirport?.is_private || arrivalAirport?.is_private) && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-[#DAFF0D]/80 text-black text-xs font-bold rounded">
            Private
          </div>
        )
      )}
    </div>
  );
} 