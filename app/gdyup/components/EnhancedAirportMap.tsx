'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Map, Plane, Loader2, MapPin } from 'lucide-react';
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
  animationDuration = 5
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
    <div className={cn("w-full relative overflow-hidden rounded-lg", className)} style={{ minHeight: compact ? '100px' : '140px' }}>
      {departureCode && arrivalCode ? (
        <>
          {/* Route map visualization */}
          <div className="gdyup-map-overlay">
            <div className="gdyup-map-inner">
              {/* World map backdrop */}
              <Image
                src="/images/airports/world_map_dark.jpg"
                alt="World Map"
                fill
                className="gdyup-map-image"
                unoptimized={true}
              />
            </div>
          </div>
        </>
      ) : departureCode ? (
        <>
          {/* Single location - Departure airport */}
          <div className="gdyup-map-overlay">
            <div className="gdyup-map-inner">
              {departureImage ? (
                <Image
                  src={imageError[departureCode] ? '/images/airports/placeholder_airport_map.png' : departureImage}
                  alt={`${departureCode} Airport`}
                  fill
                  className="gdyup-map-image"
                  unoptimized={true}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <MapPin className="h-8 w-8 mb-2 text-gray-400" />
                    <span className="text-gray-300 text-sm">{departureCode}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : arrivalCode ? (
        <>
          {/* Single location - Arrival airport */}
          <div className="gdyup-map-overlay">
            <div className="gdyup-map-inner">
              {arrivalImage ? (
                <Image
                  src={imageError[arrivalCode] ? '/images/airports/placeholder_airport_map.png' : arrivalImage}
                  alt={`${arrivalCode} Airport`}
                  fill
                  className="gdyup-map-image"
                  unoptimized={true}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <MapPin className="h-8 w-8 mb-2 text-gray-400" />
                    <span className="text-gray-300 text-sm">{arrivalCode}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Placeholder when no airport is selected
        <div className="flex flex-col items-center justify-center h-full bg-gray-800/40 py-3 gdyup-map-container">
          <MapPin className="h-8 w-8 mb-2 text-gray-400" />
          <p className="text-sm text-gray-300">Select airports to see the route</p>
        </div>
      )}
    </div>
  );
} 