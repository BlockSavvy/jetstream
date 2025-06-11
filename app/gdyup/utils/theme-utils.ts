/**
 * Theme utility functions for GDY·UP
 * Enhanced to prevent update loops with proper locking
 */

import type { GdyupTheme } from '../hooks/useGdyupTheme';

// Flag to prevent double-handling theme changes with timeout tracking
let isProcessingThemeChange = false;
let themeProcessingTimeout: NodeJS.Timeout | null = null;

/**
 * Apply a theme - optimized to avoid unnecessary DOM operations
 * Uses data attributes instead of classes to avoid hydration issues
 * 
 * @param theme - The theme to apply
 * @returns void
 */
export function applyTheme(theme: GdyupTheme): void {
  try {
    if (typeof document !== 'undefined') {
      // Prevent multiple rapid theme changes
      if (isProcessingThemeChange) {
        if (themeProcessingTimeout) {
          clearTimeout(themeProcessingTimeout);
        }
        themeProcessingTimeout = setTimeout(() => {
          isProcessingThemeChange = false;
          // Try again after the lock is released
          applyTheme(theme);
        }, 100);
        return;
      }
      
      isProcessingThemeChange = true;
      
      const htmlEl = document.documentElement;
      
      // Clear any existing theme classes first (defensive coding)
      htmlEl.classList.remove('gdyup-theme-default', 'gdyup-theme-luxury', 'gdyup-theme-bitcoin');
      
      // Set the theme as a data attribute 
      htmlEl.setAttribute('data-gdyup-theme', theme);
      
      // Also add as a class for legacy selectors that might still use it
      htmlEl.classList.add(`gdyup-theme-${theme}`);
      
      // Save to localStorage for persistence
      localStorage.setItem('gdyup-theme', theme);
      
      // Force a css variable recomputation by triggering a small layout change
      document.body.style.zoom = '0.99999';
      setTimeout(() => {
        document.body.style.zoom = '1';
        
        // Dispatch a custom event that components can listen for
        const event = new CustomEvent('gdyup-theme-changed', { 
          detail: { theme },
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(event);
        
        // Release lock after theme is fully applied
        isProcessingThemeChange = false;
        
        // Log success for debugging
        console.log(`Theme applied: ${theme}`);
      }, 50);
    }
  } catch (error) {
    console.error('Error applying theme:', error);
    isProcessingThemeChange = false;
  }
}

/**
 * Get the current theme from data attribute or localStorage
 */
export function getCurrentTheme(): GdyupTheme {
  try {
    // First check HTML element data attribute
    if (typeof document !== 'undefined') {
      const htmlEl = document.documentElement;
      const themeAttr = htmlEl.getAttribute('data-gdyup-theme') as GdyupTheme;
      if (themeAttr && ['default', 'luxury', 'bitcoin'].includes(themeAttr)) {
        return themeAttr;
      }
    }
    
    // Then check localStorage
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('gdyup-theme') as GdyupTheme;
      if (storedTheme && ['default', 'luxury', 'bitcoin'].includes(storedTheme)) {
        return storedTheme;
      }
    }
  } catch (error) {
    console.error('Error getting current theme:', error);
  }
  
  // Default theme
  return 'default';
}

/**
 * Add a listener for theme changes that prevents loops
 * 
 * @param callback - Function to call when theme changes
 * @returns Function to remove the listener
 */
export function addThemeChangeListener(callback: (theme: GdyupTheme) => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'gdyup-theme' && !isProcessingThemeChange) {
      const newTheme = event.newValue as GdyupTheme;
      
      // Validate theme value
      if (newTheme && ['default', 'luxury', 'bitcoin'].includes(newTheme)) {
        callback(newTheme);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Theme descriptions with display names and color information
 */
export const themeInfo = {
  default: {
    name: 'Default',
    gradient: 'linear-gradient(135deg, #DAFF0D 0%, #A5BF0C 100%)',
    glowColor: 'rgba(218, 255, 13, 0.5)',
    textColor: 'black'
  },
  luxury: {
    name: 'Luxury Black',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    textColor: 'white'
  },
  bitcoin: {
    name: 'BTC Orange',
    gradient: 'linear-gradient(135deg, #F7931A 0%, #F15A24 100%)',
    glowColor: 'rgba(236, 72, 153, 0.5)',
    textColor: 'white'
  }
};

/**
 * Safely toggles between dark and light mode
 * This is a separate function from the theme system
 */
export function toggleDarkMode(): void {
  try {
    if (typeof document !== 'undefined') {
      const htmlEl = document.documentElement;
      
      // Check current mode
      const isDarkMode = htmlEl.classList.contains('dark');
      
      // Toggle the class
      if (isDarkMode) {
        htmlEl.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
      } else {
        htmlEl.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
      }
    }
  } catch (error) {
    console.error('Error toggling dark mode:', error);
  }
} 