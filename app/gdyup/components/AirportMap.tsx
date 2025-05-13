'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Map, Plane } from 'lucide-react';
import { extractAirportCode, getAirportImage, PLACEHOLDER_AIRPORT_MAP } from '@/lib/utils/airport-images';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  image_url?: string;
  route_map_template?: string;
  is_private?: boolean;
}

// For when we only have the airport code available
interface BasicAirportInfo {
  code: string;
  route_map_template?: string | null;
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
  hideUntilLoaded = false,
  disableFetch = false,
}: AirportMapProps) {
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(PLACEHOLDER_AIRPORT_MAP);
  const [isShowingRoute, setIsShowingRoute] = useState<boolean>(false);
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();

  // Fetch airport data for both departure and arrival
  useEffect(() => {
    if (disableFetch) return;

    // Reset states when props change
    setImageLoaded(false);
    setImageError(false);
    setImageUrl(PLACEHOLDER_AIRPORT_MAP);
    setIsShowingRoute(false);
    
    async function fetchAirports() {
      try {
        // Only fetch if we have airport codes
        const deptCode = departure ? extractAirportCode(departure) : '';
        const arriveCode = arrival ? extractAirportCode(arrival) : '';
        
        if (!deptCode && !arriveCode) return;
        
        // Build the query string based on what codes we have
        const codes = [deptCode, arriveCode].filter(Boolean).join(',');
        if (!codes) return;
        
        const response = await fetch(`/api/airports?codes=${codes}&t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch airports');
        
        const airportsData = await response.json();
        if (!Array.isArray(airportsData?.data)) throw new Error('Invalid airports data format');
        
        const airports = airportsData.data as Airport[];
        
        // Set the departure and arrival airports if found
        if (deptCode) {
          const deptAirport = airports.find((a: Airport) => a.code.toUpperCase() === deptCode.toUpperCase());
          if (deptAirport) setDepartureAirport(deptAirport);
        }
        
        if (arriveCode) {
          const arriveAirport = airports.find((a: Airport) => a.code.toUpperCase() === arriveCode.toUpperCase());
          if (arriveAirport) setArrivalAirport(arriveAirport);
        }
        
        // Generate image URL
        updateImageUrl(
          deptCode ? airports.find((a: Airport) => a.code.toUpperCase() === deptCode.toUpperCase()) || null : null,
          arriveCode ? airports.find((a: Airport) => a.code.toUpperCase() === arriveCode.toUpperCase()) || null : null
        );
      } catch (error) {
        console.error('Error fetching airport data:', error);
        setImageError(true);
        
        // Still try to generate image URL from the codes we have
        if (departure || arrival) {
          // Create basic airport objects with just the code
          const deptAirportInfo: BasicAirportInfo | null = departure ? { code: extractAirportCode(departure) } : null;
          const arriveAirportInfo: BasicAirportInfo | null = arrival ? { code: extractAirportCode(arrival) } : null;
          
          updateImageUrl(
            deptAirportInfo as Airport | null,
            arriveAirportInfo as Airport | null
          );
        }
      }
    }
    
    fetchAirports();
  }, [departure, arrival, disableFetch]);
  
  // Update the image URL when airports change
  function updateImageUrl(
    deptAirport: Airport | null, 
    arriveAirport: Airport | null
  ) {
    // Handle different scenarios for image loading
    if (showRoute && deptAirport && arrivalAirport) {
      // When we have both airports and showing a route, prioritize departure airport's image
      setIsShowingRoute(true);
      const departureImg = deptAirport.image_url || getAirportImage(deptAirport.code);
      setImageUrl(departureImg);
    } else if (deptAirport) {
      // Showing just departure airport
      const departureImg = deptAirport.image_url || getAirportImage(deptAirport.code);
      setImageUrl(departureImg);
    } else if (arriveAirport) {
      // Showing just arrival airport
      const arrivalImg = arriveAirport.image_url || getAirportImage(arriveAirport.code);
      setImageUrl(arrivalImg);
    } else {
      // Fallback to placeholder if no airports
      setImageUrl(PLACEHOLDER_AIRPORT_MAP);
    }
  }

  // Handle image load errors
  const handleImageError = () => {
    setImageError(true);
    
    // If the image fails to load, use the placeholder image
    if (imageUrl !== PLACEHOLDER_AIRPORT_MAP) {
      console.warn(`Airport map image failed to load: ${imageUrl}, falling back to default`);
      setImageUrl(PLACEHOLDER_AIRPORT_MAP);
    }
  };

  return (
    <div className={cn(
      "relative w-full max-h-[240px] rounded-lg overflow-hidden",
      className,
      hideUntilLoaded && !imageLoaded ? 'invisible' : 'visible'
    )}>
      {/* Placeholder while loading */}
      {!imageLoaded && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          getThemedBackgroundClasses('card')
        )}>
          <Map className="w-12 h-12 text-gdyup-text-muted" />
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={imageUrl}
        alt={departureAirport?.name || arrivalAirport?.name || 'Airport map'}
        className={cn("w-full h-full object-cover", imageClassName)}
        onLoad={() => setImageLoaded(true)}
        onError={handleImageError}
        width={400}
        height={240}
        priority
      />
      
      {/* Enhanced route visualization */}
      {imageLoaded && !imageError && isShowingRoute && departureAirport && arrivalAirport && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Route line with gradient */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-[3px] bg-gradient-to-r from-[#DAFF0D] via-[#DAFF0D] to-[#DAFF0D] relative">
              {/* Animated plane */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 animate-pulse">
                <Plane className={cn("h-4 w-4 transform -rotate-45", getThemedTextClasses('primary'))} />
              </div>
              
              {/* Origin indicator dot */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-[#DAFF0D]" />
              
              {/* Destination indicator dot */}
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#DAFF0D]" />
            </div>
          </div>
          
          {/* Airport codes with more elegant styling */}
          <div className={cn(
            "absolute bottom-3 left-3 bg-black/70 text-xs font-bold rounded-full px-3 py-1 flex items-center",
            getThemedTextClasses('primary')
          )}>
            {departureAirport.code}
          </div>
          <div className={cn(
            "absolute bottom-3 right-3 bg-black/70 text-xs font-bold rounded-full px-3 py-1 flex items-center",
            getThemedTextClasses('primary')
          )}>
            {arrivalAirport.code}
          </div>
        </div>
      )}
      
      {/* Just show single airport code if not showing a route */}
      {imageLoaded && !imageError && !isShowingRoute && (
        <div className={cn(
          "absolute bottom-3 right-3 bg-black/70 text-xs font-bold rounded-full px-3 py-1 flex items-center",
          getThemedTextClasses('primary')
        )}>
          <Plane className="w-3 h-3 mr-1" />
          {departureAirport?.code || arrivalAirport?.code || ''}
        </div>
      )}
      
      {/* Private airport badge */}
      {imageLoaded && !imageError && (departureAirport?.is_private || arrivalAirport?.is_private) && (
        <div className="absolute top-3 right-3 bg-[#DAFF0D] text-black text-xs font-bold rounded-full px-2 py-0.5">
          Private
        </div>
      )}
    </div>
  );
} 