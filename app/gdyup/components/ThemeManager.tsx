'use client';

import { useEffect, useRef } from 'react';
import { getCurrentTheme, applyTheme } from '../utils/theme-utils';

/**
 * ThemeManager - A minimal client component that ensures theme is properly initialized
 * Extremely simplified to prevent any update loops
 */
export default function ThemeManager() {
  // Use ref to track if we've initialized
  const initialized = useRef(false);
  
  useEffect(() => {
    // Skip if already initialized to prevent loops
    if (initialized.current) return;
    initialized.current = true;
    
    // Apply the theme once on mount - that's it
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    
    // No event listeners here - they're handled by individual components that need them
  }, []); // Empty dependency array - only run once
  
  // This component doesn't render anything
  return null;
} 