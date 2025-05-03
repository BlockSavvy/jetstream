'use client';

import { useEffect } from 'react';
import { getCurrentTheme, addThemeChangeListener, forceThemeRefresh, applyTheme, GdyupTheme } from '../utils/theme-utils';

/**
 * ThemeManager - A client component that ensures theme changes are properly applied
 * 
 * This component will:
 * 1. Apply the current theme on mount
 * 2. Listen for theme changes across browser tabs/windows
 * 3. Provide a way to force theme refreshes when navigating between pages
 */
export default function ThemeManager() {
  useEffect(() => {
    // Apply the current theme on mount
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    
    // Add listener for theme changes (from other tabs/windows)
    const removeListener = addThemeChangeListener((newTheme: GdyupTheme) => {
      applyTheme(newTheme);
    });
    
    // Force a theme refresh when the component mounts
    forceThemeRefresh();
    
    // Add listener for navigation events
    const handleRouteChange = () => {
      // Force a theme refresh after navigation
      setTimeout(() => {
        forceThemeRefresh();
      }, 100); // Slight delay to ensure the DOM has updated
    };
    
    // Add listener for the popstate event (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    // Clean up event listeners
    return () => {
      removeListener();
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 