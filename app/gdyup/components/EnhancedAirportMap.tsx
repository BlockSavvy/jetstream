'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Map, Plane, Loader2 } from 'lucide-react';
import { extractAirportCode, getAirportImage } from '@/lib/utils/airport-images';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  image_url?: string;
  is_private?: boolean;
}

interface EnhancedAirportMapProps {
  departure?: string;
  arrival?: string;
  className?: string;
  compact?: boolean;
  hideBackground?: boolean;
  animationDuration?: number;
}

export default function EnhancedAirportMap({
  departure,
  arrival,
  className = '',
  compact = false,
  hideBackground = false,
  animationDuration = 3
}: EnhancedAirportMapProps) {
  const [departureCode, setDepartureCode] = useState<string | null>(null);
  const [arrivalCode, setArrivalCode] = useState<string | null>(null);
  const [departureAirport, setDepartureAirport] = useState<Airport | null>(null);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [successfullyLoaded, setSuccessfullyLoaded] = useState<Record<string, boolean>>({});

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
    const fetchAirportData = async () => {
      // Don't fetch if neither airport is provided
      if (!departureCode && !arrivalCode) {
        setIsLoading(false);
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
          const depAirport = departureCode 
            ? data.find((a: Airport) => a.code === departureCode) 
            : null;
          
          const arrAirport = arrivalCode 
            ? data.find((a: Airport) => a.code === arrivalCode) 
            : null;
          
          // Update state if we found the airports
          if (depAirport) setDepartureAirport(depAirport);
          if (arrAirport) setArrivalAirport(arrAirport);
        }
      } catch (error) {
        console.error('Error fetching airport data:', error);
      } finally {
        setIsFetching(false);
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have at least one code
    if (departureCode || arrivalCode) {
      fetchAirportData();
    } else {
      setIsLoading(false);
    }
  }, [departureCode, arrivalCode]);

  // Helper to get image path for an airport
  const getAirportImagePath = (airport: Airport | null, code: string | null) => {
    if (!airport || !code) {
      return '/images/airports/placeholder_airport_map.png';
    }
    
    // Set of airport codes we know have image files
    const availableAirportImages = new Set(['KJFK', 'KFLL']);
    
    // Check if this airport code has an image file
    if (availableAirportImages.has(code.toUpperCase())) {
      return `/images/airports/${code.toLowerCase()}.png`;
    }
    
    // In other cases, use the placeholder
    return '/images/airports/placeholder_airport_map.png';
  };

  // Handle image loading errors
  const handleImageError = (code: string) => {
    // Only log once per code
    if (!imageError[code]) {
      console.log(`Image not found for ${code}, falling back to placeholder`);
      setImageError(prev => ({ ...prev, [code]: true }));
    }
  };

  // For debugging - log all state values
  useEffect(() => {
    console.log(`EnhancedAirportMap Component State:`, {
      departureCode,
      arrivalCode,
      departureAirport,
      arrivalAirport,
      imageError,
      isLoading,
      isFetching,
      hasDeparture: Boolean(departureCode),
      hasArrival: Boolean(arrivalCode),
      showBothAirports: compact ? false : Boolean(departureCode && arrivalCode)
    });
    
    if (departureCode) {
      const path = getAirportImagePath(departureAirport, departureCode);
      console.log(`Departure image path: ${path}`);
    }
    if (arrivalCode) {
      const path = getAirportImagePath(arrivalAirport, arrivalCode);
      console.log(`Arrival image path: ${path}`);
    }
  }, [departureCode, arrivalCode, departureAirport, arrivalAirport, imageError, isLoading, isFetching, compact]);

  // Get all airport data and image information
  const departureImage = getAirportImagePath(departureAirport, departureCode);
  const arrivalImage = getAirportImagePath(arrivalAirport, arrivalCode);
  const hasDeparture = Boolean(departureCode);
  const hasArrival = Boolean(arrivalCode);
  const hasBoth = hasDeparture && hasArrival;
  
  // Determine if we're showing one or two airports
  const showBothAirports = compact ? false : hasBoth;

  // Debug log for image paths that will be rendered
  useEffect(() => {
    console.log('FINAL IMAGE PATHS:', {
      departureCode,
      arrivalCode,
      departureImage: departureImage || 'Using fallback color',
      arrivalImage: arrivalImage || 'Using fallback color',
      showBothAirports
    });
  }, [departureCode, arrivalCode, departureImage, arrivalImage, showBothAirports]);

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/30",
        "transition-all duration-300",
        showBothAirports 
          ? "flex flex-col md:flex-row md:items-stretch" 
          : "flex items-center justify-center",
        className
      )}
      style={{ minHeight: '120px' }}
    >
      {/* Loading State */}
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 z-20">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 text-[#DAFF0D] animate-spin" />
            <span className="text-xs text-gray-300">Loading airports...</span>
          </div>
        </div>
      )}

      {/* When we have both airports and are showing them both */}
      {showBothAirports && (
        <>
          {/* Departure Airport */}
          <div className="relative flex-1 min-h-[120px] w-full md:w-1/2 overflow-hidden">
            {departureCode && (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30" style={{ minHeight: '120px', height: '100%' }}>
                  <div className="relative w-full h-full shadow-inner" style={{ 
                    minHeight: '120px',
                    backgroundColor: hideBackground ? 'transparent' : 'rgba(17, 24, 39, 0.7)'
                  }}>
                    {!hideBackground && (
                      <img 
                        src={imageError[departureCode] 
                          ? '/images/airports/placeholder_airport_map.png' 
                          : departureImage
                        }
                        alt={`${departureAirport?.city || departureCode} Airport`}
                        className="absolute inset-0 object-cover w-full h-full"
                        style={{ objectPosition: '50% 50%' }}
                        onError={() => handleImageError(departureCode)}
                        width={500}
                        height={300}
                        loading="eager"
                      />
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-900/90 text-white text-xs rounded-md border border-blue-700/50 font-medium shadow-lg">
                  {departureAirport?.city || 'Departure'} ({departureCode})
                </div>
              </>
            )}
          </div>

          {/* Route Visualization in the Middle */}
          <div className="hidden md:flex h-full items-center justify-center bg-black/40 px-3 z-10">
            <div className="h-16 flex flex-col items-center justify-center">
              <div className="w-0.5 h-12 bg-gradient-to-b from-blue-500 via-[#DAFF0D] to-amber-500"></div>
              <Plane className="h-6 w-6 text-[#DAFF0D] rotate-90 -mt-1 animate-pulse drop-shadow-glow" />
            </div>
          </div>
          
          {/* Mobile Route Visualization */}
          <div className="flex md:hidden w-full h-8 bg-black/40 items-center justify-center">
            <div className="w-24 flex items-center justify-center">
              <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 via-[#DAFF0D] to-amber-500"></div>
              <Plane className="h-5 w-5 text-[#DAFF0D] rotate-45 -ml-1 animate-pulse drop-shadow-glow" />
            </div>
          </div>

          {/* Arrival Airport */}
          <div className="relative flex-1 min-h-[120px] w-full md:w-1/2 overflow-hidden">
            {arrivalCode && (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30" style={{ minHeight: '120px', height: '100%' }}>
                  <div className="relative w-full h-full shadow-inner" style={{ 
                    minHeight: '120px',
                    backgroundColor: hideBackground ? 'transparent' : 'rgba(17, 24, 39, 0.7)'
                  }}>
                    {!hideBackground && (
                      <img 
                        src={imageError[arrivalCode] 
                          ? '/images/airports/placeholder_airport_map.png' 
                          : arrivalImage
                        }
                        alt={`${arrivalAirport?.city || arrivalCode} Airport`}
                        className="absolute inset-0 object-cover w-full h-full"
                        style={{ objectPosition: '50% 50%' }}
                        onError={() => handleImageError(arrivalCode)}
                        width={500}
                        height={300}
                        loading="eager"
                      />
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-amber-900/90 text-white text-xs rounded-md border border-amber-700/50 font-medium shadow-lg">
                  {arrivalAirport?.city || 'Arrival'} ({arrivalCode})
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* When showing just one airport or in compact mode */}
      {!showBothAirports && (
        <div className="relative w-full h-full overflow-hidden" 
          style={{ 
            minHeight: '120px',
            background: hideBackground ? 'linear-gradient(to right, rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.7))' : 'transparent' 
          }}>
          {(hasDeparture || hasArrival) && (
            <>
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30" style={{ minHeight: '120px', height: '100%' }}>
                <div className="relative w-full h-full shadow-inner" style={{ 
                  minHeight: '120px',
                  backgroundColor: hideBackground ? 'transparent' : 'rgba(17, 24, 39, 0.8)'
                }}>
                  {!hideBackground && (
                    <>
                      {hasDeparture && (
                        <img 
                          src={hasDeparture 
                            ? (imageError[departureCode!] ? '/images/airports/placeholder_airport_map.png' : departureImage)
                            : (imageError[arrivalCode!] ? '/images/airports/placeholder_airport_map.png' : arrivalImage)
                          }
                          alt={`${
                            hasDeparture 
                              ? (departureAirport?.city || departureCode) 
                              : (arrivalAirport?.city || arrivalCode)
                          } Airport`}
                          className="absolute inset-0 object-cover w-full h-full"
                          style={{ objectPosition: '50% 50%' }}
                          onError={() => hasDeparture
                            ? handleImageError(departureCode!)
                            : handleImageError(arrivalCode!)
                          }
                          width={500}
                          height={300}
                          loading="eager"
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              
              {/* Airport labels */}
              {hasBoth && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Route line */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-3/4 h-1 bg-gradient-to-r from-blue-500 via-[#DAFF0D] to-amber-500 relative z-10"
                      style={{
                        height: hideBackground ? '2px' : '1px',
                        boxShadow: hideBackground ? '0 0 8px rgba(218, 255, 13, 0.6)' : 'none'
                      }}>
                      {/* Animated plane along the route */}
                      <motion.div 
                        className="absolute -top-2.5 z-20"
                        initial={{ left: '0%' }}
                        animate={{ left: '100%' }}
                        transition={{ 
                          duration: animationDuration,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <Plane className={`${hideBackground ? 'h-6 w-6' : 'h-5 w-5'} text-[#DAFF0D] transform rotate-45 drop-shadow-glow`} />
                      </motion.div>
                      
                      {/* Origin marker */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-blue-600 shadow-lg z-10" />
                      
                      {/* Destination marker */}
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-amber-500 shadow-lg z-10" />
                    </div>
                  </div>
                  
                  {/* Airport names */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-900/80 text-blue-100 text-xs font-bold rounded shadow-md">
                    {departureAirport?.city || 'Departure'} ({departureCode})
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-amber-900/80 text-amber-100 text-xs font-bold rounded shadow-md">
                    {arrivalAirport?.city || 'Arrival'} ({arrivalCode})
                  </div>
                </div>
              )}
              
              {/* Single airport label */}
              {!hasBoth && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-xs font-bold rounded shadow-md">
                  {hasDeparture
                    ? `${departureAirport?.city || 'Departure'} (${departureCode})`
                    : `${arrivalAirport?.city || 'Arrival'} (${arrivalCode})`
                  }
                </div>
              )}
              
              {/* Private airport badge */}
              {((hasDeparture && departureAirport?.is_private) || 
                (hasArrival && arrivalAirport?.is_private)) && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-[#DAFF0D]/80 text-black text-xs font-bold rounded">
                  Private
                </div>
              )}
            </>
          )}
          
          {/* No airports selected */}
          {!hasDeparture && !hasArrival && (
            <div className="flex flex-col items-center justify-center h-full bg-gray-800/40 py-4" style={{ minHeight: '120px' }}>
              <Map className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-400">No airports selected</span>
            </div>
          )}
        </div>
      )}

      {/* Default fallback state when no images are available */}
      {!isLoading && !isFetching && ((showBothAirports && (!departureCode || !arrivalCode)) || (!showBothAirports && !hasDeparture && !hasArrival)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center space-y-3">
            <Plane className="w-10 h-10 text-[#DAFF0D] opacity-50" />
            <span className="text-sm text-gray-400">Route map will appear here</span>
          </div>
        </div>
      )}
    </div>
  );
} 