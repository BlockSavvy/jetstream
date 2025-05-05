'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

// Define the possible theme types
export type GdyupTheme = 'default' | 'blue' | 'pink';

// Define the theme classes configuration type
interface ThemeClasses {
  base: string;
  default: string;
  blue: string;
  pink: string;
}

/**
 * Custom hook for GDYUP theme management
 * Provides functionality for:
 * - Getting and setting the current theme
 * - Generating theme-specific class names
 * - Detecting mobile devices
 */
export function useGdyupTheme() {
  // Initialize with default theme and try to load from localStorage if available
  const [theme, setTheme] = useState<GdyupTheme>('default');
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Load theme from localStorage on initial mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('gdyup-theme') as GdyupTheme;
      if (savedTheme && ['default', 'blue', 'pink'].includes(savedTheme)) {
        setTheme(savedTheme);
        // Also add theme class to document body for global CSS variables
        document.body.classList.remove('gdyup-theme-default', 'gdyup-theme-blue', 'gdyup-theme-pink');
        document.body.classList.add(`gdyup-theme-${savedTheme}`);
      }
    } catch (e) {
      console.error('Error loading theme from localStorage:', e);
    }
  }, []);
  
  // Function to change theme and save to localStorage
  const changeTheme = useCallback((newTheme: GdyupTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('gdyup-theme', newTheme);
      // Update body class for global CSS variables
      document.body.classList.remove('gdyup-theme-default', 'gdyup-theme-blue', 'gdyup-theme-pink');
      document.body.classList.add(`gdyup-theme-${newTheme}`);
    } catch (e) {
      console.error('Error saving theme to localStorage:', e);
    }
  }, []);
  
  // Function to get combined class names based on current theme
  const getThemeClasses = useCallback(
    ({ base, default: defaultClass, blue: blueClass, pink: pinkClass }: ThemeClasses): string => {
      let themeClass = '';
      
      // Determine the theme-specific class
      switch (theme) {
        case 'blue':
          themeClass = blueClass;
          break;
        case 'pink':
          themeClass = pinkClass;
          break;
        case 'default':
        default:
          themeClass = defaultClass;
          break;
      }
      
      // Combine base and theme classes
      return `${base} ${themeClass}`.trim();
    },
    [theme]
  );
  
  // Helper function for button styling with consistent theming
  const getThemedButtonClasses = useCallback(
    (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
      const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
      }[size];
      
      const baseClasses = `rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeClasses}`;
      
      if (variant === 'ghost') {
        return getThemeClasses({
          base: `${baseClasses}`,
          default: 'text-white hover:bg-white/10 focus:ring-gdyup-primary/40',
          blue: 'text-blue-100 hover:bg-blue-500/10 focus:ring-blue-500/40',
          pink: 'text-pink-100 hover:bg-pink-500/10 focus:ring-pink-500/40'
        });
      }
      
      if (variant === 'outline') {
        return getThemeClasses({
          base: `${baseClasses} border`,
          default: 'border-gdyup-primary text-gdyup-primary hover:bg-gdyup-primary/10 focus:ring-gdyup-primary/40',
          blue: 'border-blue-500 text-blue-500 hover:bg-blue-500/10 focus:ring-blue-500/40',
          pink: 'border-pink-500 text-pink-500 hover:bg-pink-500/10 focus:ring-pink-500/40'
        });
      }
      
      if (variant === 'secondary') {
        return getThemeClasses({
          base: baseClasses,
          default: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500/40',
          blue: 'bg-blue-800 text-white hover:bg-blue-700 focus:ring-blue-500/40',
          pink: 'bg-pink-800 text-white hover:bg-pink-700 focus:ring-pink-500/40'
        });
      }
      
      // Primary button (default)
      return getThemeClasses({
        base: baseClasses,
        default: 'bg-gdyup-primary text-black hover:bg-gdyup-primary/90 focus:ring-gdyup-primary/40',
        blue: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500/40',
        pink: 'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-500/40'
      });
    },
    [getThemeClasses, theme]
  );
  
  // Helper function to get theme-specific text colors
  const getThemedTextClasses = useCallback(
    (variant: 'primary' | 'secondary' | 'muted' | 'inverse' = 'primary') => {
      if (variant === 'inverse') {
        return getThemeClasses({
          base: '',
          default: 'text-black',
          blue: 'text-white',
          pink: 'text-white'
        });
      }
      
      if (variant === 'muted') {
        return getThemeClasses({
          base: 'text-opacity-60',
          default: 'text-white',
          blue: 'text-blue-100',
          pink: 'text-pink-100'
        });
      }
      
      if (variant === 'secondary') {
        return getThemeClasses({
          base: '',
          default: 'text-gdyup-secondary',
          blue: 'text-blue-300',
          pink: 'text-pink-300'
        });
      }
      
      // Primary text color (default)
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-primary',
        blue: 'text-blue-500',
        pink: 'text-pink-500'
      });
    },
    [getThemeClasses, theme]
  );
  
  // Helper function for badge styling
  const getThemedBadgeClasses = useCallback(
    (variant: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' = 'primary') => {
      const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
      
      if (variant === 'success') {
        return getThemeClasses({
          base: baseClasses,
          default: 'bg-green-500/20 text-green-500 border border-green-500/30',
          blue: 'bg-green-500/20 text-green-400 border border-green-500/30',
          pink: 'bg-green-500/20 text-green-400 border border-green-500/30'
        });
      }
      
      if (variant === 'warning') {
        return getThemeClasses({
          base: baseClasses,
          default: 'bg-amber-500/20 text-amber-500 border border-amber-500/30',
          blue: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          pink: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        });
      }
      
      if (variant === 'outline') {
        return getThemeClasses({
          base: `${baseClasses} border`,
          default: 'border-gdyup-primary text-gdyup-primary bg-transparent',
          blue: 'border-blue-500 text-blue-500 bg-transparent',
          pink: 'border-pink-500 text-pink-500 bg-transparent'
        });
      }
      
      if (variant === 'secondary') {
        return getThemeClasses({
          base: baseClasses,
          default: 'bg-gray-800 text-white',
          blue: 'bg-blue-800 text-white',
          pink: 'bg-pink-800 text-white'
        });
      }
      
      // Primary badge (default)
      return getThemeClasses({
        base: baseClasses,
        default: 'bg-gdyup-primary text-black',
        blue: 'bg-blue-500 text-white',
        pink: 'bg-pink-500 text-white'
      });
    },
    [getThemeClasses, theme]
  );
  
  // Helper function for background panels
  const getThemedBackgroundClasses = useCallback(
    (variant: 'primary' | 'secondary' | 'card' = 'primary') => {
      if (variant === 'card') {
        return getThemeClasses({
          base: 'rounded-lg border shadow-sm',
          default: 'bg-gray-900/80 border-gray-800',
          blue: 'bg-blue-950/80 border-blue-900',
          pink: 'bg-pink-950/80 border-pink-900'
        });
      }
      
      if (variant === 'secondary') {
        return getThemeClasses({
          base: '',
          default: 'bg-gray-800',
          blue: 'bg-blue-900',
          pink: 'bg-pink-900'
        });
      }
      
      // Primary background (default)
      return getThemeClasses({
        base: '',
        default: 'bg-gray-900',
        blue: 'bg-blue-950',
        pink: 'bg-pink-950'
      });
    },
    [getThemeClasses, theme]
  );
  
  // Human-readable theme names for UI display
  const getThemeName = useCallback(() => {
    switch (theme) {
      case 'blue': return 'Luxury Black';
      case 'pink': return 'BTC Orange';
      default: return 'Default';
    }
  }, [theme]);
  
  return {
    theme,
    changeTheme,
    getThemeClasses,
    getThemedButtonClasses,
    getThemedTextClasses,
    getThemedBadgeClasses,
    getThemedBackgroundClasses,
    getThemeName,
    isMobile
  };
} 