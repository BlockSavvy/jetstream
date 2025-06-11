'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { getCurrentTheme, applyTheme } from '../utils/theme-utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';

interface ThemeManagerProps {
  children: ReactNode;
}

/**
 * ThemeManager - A client component that ensures theme is properly initialized and wrapped around content
 */
export default function ThemeManager({ children }: ThemeManagerProps) {
  // Use ref to track if we've initialized
  const initialized = useRef(false);
  // Get theme from the hook - helps ensure theme context is available to all child components
  const { theme } = useGdyupTheme();
  
  useEffect(() => {
    // Skip if already initialized to prevent loops
    if (initialized.current) return;
    initialized.current = true;
    
    // Apply the theme once on mount - that's it
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    
    // No event listeners here - they're handled by individual components that need them
  }, []); // Empty dependency array - only run once
  
  // Return children to allow wrapping
  return children;
} 