'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting if a media query matches
 * 
 * @param query The media query to check
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false on server, check immediately on client
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Create the media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Handler function to update state when match status changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener
    mediaQueryList.addEventListener('change', handleChange);
    
    // Clean up by removing event listener
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
} 