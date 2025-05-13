'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { FaPlaneDeparture, FaPlaneArrival } from 'react-icons/fa';
import { RiFlightTakeoffLine } from 'react-icons/ri';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

// Simple airport coordinates interface
interface AirportCoordinates {
  lat: number;
  lng: number;
}

interface EnhancedAirportMapProps {
  departure: string;
  arrival: string;
  departureCoordinates?: AirportCoordinates;
  arrivalCoordinates?: AirportCoordinates;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showAnimation?: boolean;
}

/**
 * Enhanced Airport Map Component - Version 2
 * Visualizes flight routes between airports, with optional animations
 * Supports all three GDY·UP themes
 */
export default function EnhancedAirportMap({
  departure,
  arrival,
  departureCoordinates,
  arrivalCoordinates,
  className,
  size = 'md',
  showLabels = true,
  showAnimation = true,
}: EnhancedAirportMapProps) {
  const { 
    theme, 
    getThemedTextClasses,
    getThemedBackgroundClasses,
  } = useGdyupTheme();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const planeControls = useAnimationControls();
  
  // Extract airport codes for display
  const extractAirportCode = (airport: string): string => {
    // Match 3-letter code in parentheses e.g. "New York (JFK)"
    const match = airport.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : airport.slice(0, 3);
  };
  
  const departureCode = extractAirportCode(departure);
  const arrivalCode = extractAirportCode(arrival);
  
  // Animate the plane along the route
  useEffect(() => {
    if (showAnimation && isLoaded) {
      const animatePlane = async () => {
        await planeControls.start({
          pathOffset: 1,
          transition: { duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }
        });
      };
      
      animatePlane();
    }
  }, [planeControls, showAnimation, isLoaded]);
  
  // Set loaded state after component mounts
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  // Determine size class
  const sizeClass = {
    sm: "h-32",
    md: "h-48",
    lg: "h-64"
  }[size];

  // Theme-specific map backgrounds
  const mapBackground = {
    default: "bg-[url('/images/world-map-dark.png')]",
    luxury: "bg-[url('/images/world-map-blue.png')]",
    bitcoin: "bg-[url('/images/world-map-pink.png')]"
  }[theme || 'default'];

  // Theme-specific background colors
  const bgColor = {
    default: "bg-gdyup-accent/30 border-gdyup-border/50",
    luxury: "bg-blue-900/30 border-blue-700/50",
    bitcoin: "bg-pink-900/30 border-pink-700/50"
  }[theme || 'default'];
  
  return (
    <div 
      ref={mapContainerRef}
      className={cn(
        "relative overflow-hidden rounded-lg border shadow-inner",
        bgColor,
        sizeClass,
        className
      )}
    >
      {/* World map backdrop with theme-specific styling */}
      <div className={cn(
        "absolute inset-0 opacity-40 bg-cover bg-center",
        mapBackground
      )} />
      
      {/* Route visualization */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="relative w-full flex items-center justify-between">
          {/* Departure airport */}
          <div className="flex flex-col items-center">
            {showLabels && (
              <div className={cn(
                "text-xs uppercase font-semibold mb-1",
                theme === 'default' ? "text-white/80" : 
                theme === 'luxury' ? "text-blue-200/80" : 
                "text-pink-200/80"
              )}>
                From
              </div>
            )}
            <div className="flex items-center">
              <FaPlaneDeparture className={cn(
                "h-4 w-4 mr-1", 
                theme === 'default' ? "text-white" : 
                theme === 'luxury' ? "text-blue-300" : 
                "text-pink-300"
              )} />
              <div className={cn(
                "text-lg font-bold", 
                getThemedTextClasses()
              )}>
                {departureCode}
              </div>
            </div>
          </div>
          
          {/* Flight path */}
          <div className="flex-1 mx-4 relative">
            <motion.div 
              className={cn(
                "h-0.5 w-full absolute top-1/2 transform -translate-y-1/2",
                theme === 'default' ? "bg-white" : 
                theme === 'luxury' ? "bg-blue-300" : 
                "bg-pink-300"
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8 }}
            />
            
            {showAnimation && (
              <motion.div
                className="absolute top-1/2 transform -translate-y-1/2"
                style={{ left: 0 }}
                animate={planeControls}
                initial={{ pathOffset: 0 }}
                custom={1}
              >
                <motion.div
                  className="relative"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
                >
                  <RiFlightTakeoffLine className={cn(
                    "h-6 w-6",
                    theme === 'default' ? "text-white" : 
                    theme === 'luxury' ? "text-blue-300" : 
                    "text-pink-300"
                  )} />
                </motion.div>
              </motion.div>
            )}
          </div>
          
          {/* Arrival airport */}
          <div className="flex flex-col items-center">
            {showLabels && (
              <div className={cn(
                "text-xs uppercase font-semibold mb-1",
                theme === 'default' ? "text-white/80" : 
                theme === 'luxury' ? "text-blue-200/80" : 
                "text-pink-200/80"
              )}>
                To
              </div>
            )}
            <div className="flex items-center">
              <div className={cn(
                "text-lg font-bold",
                getThemedTextClasses()
              )}>
                {arrivalCode}
              </div>
              <FaPlaneArrival className={cn(
                "h-4 w-4 ml-1",
                theme === 'default' ? "text-white" : 
                theme === 'luxury' ? "text-blue-300" : 
                "text-pink-300"
              )} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Optional flight details overlay */}
      {size === 'lg' && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-2 text-xs",
          theme === 'default' ? "bg-black/50 text-white/70" : 
          theme === 'luxury' ? "bg-blue-950/50 text-blue-200/70" : 
          "bg-pink-950/50 text-pink-200/70"
        )}>
          <div className="flex justify-between">
            <span>Distance: ~1,200 miles</span>
            <span>Est. flight time: 2h 45m</span>
          </div>
        </div>
      )}
    </div>
  );
} 