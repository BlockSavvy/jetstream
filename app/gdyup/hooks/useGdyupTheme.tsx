'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { applyTheme } from '@/app/gdyup/utils/theme-utils';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { cn } from '../../../lib/utils';

// Define available themes
export type GdyupTheme = 'default' | 'luxury' | 'bitcoin';

// Define the shape of our theme context
type ThemeContextType = {
  theme: GdyupTheme;
  changeTheme: (theme: GdyupTheme) => void;
  getThemeClasses: (options: ThemeClassOptions) => string;
  getThemedButtonClasses: (variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive', size?: 'sm' | 'md' | 'lg') => string;
  getThemedTextClasses: (variant?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'destructive' | 'success' | 'icon' | 'icon-default' | 'icon-primary' | 'icon-secondary' | 'icon-menu') => string;
  getThemedBadgeClasses: (variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning') => string;
  getThemedBackgroundClasses: (variant?: 'primary' | 'secondary' | 'card') => string;
  getThemeName: () => string;
  isMobile: boolean;
};

// Options type for theme-specific classes
type ThemeClassOptions = {
  base: string;
  default?: string;
  luxury?: string;
  bitcoin?: string;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  changeTheme: () => {}, // Empty function as placeholder
  getThemeClasses: () => '',
  getThemedButtonClasses: () => '',
  getThemedTextClasses: () => '',
  getThemedBadgeClasses: () => '',
  getThemedBackgroundClasses: () => '',
  getThemeName: () => 'Default',
  isMobile: false
});

// Provider component that wraps the app
export function GdyupThemeProvider({ children }: { children: ReactNode }) {
  // Initialize state with default theme
  const [currentTheme, setCurrentTheme] = useState<GdyupTheme>('default');
  // Track if component is mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  // Mobile detection for responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Helper function to create themed CSS classes
  const getThemeClasses = (options: ThemeClassOptions) => {
    const { base, default: defaultClass = '', luxury: luxuryClass = '', bitcoin: bitcoinClass = '' } = options;
    
    // Always include the base classes
    const classes = [base];
    
    // Add theme-specific classes based on current theme
    if (currentTheme === 'luxury' && luxuryClass) {
      classes.push(luxuryClass);
    } else if (currentTheme === 'bitcoin' && bitcoinClass) {
      classes.push(bitcoinClass);
    } else if (defaultClass) {
      classes.push(defaultClass);
    }
    
    // Combine all classes with tailwind's utility function
    return cn(...classes);
  };

  // Effect to load theme from localStorage on mount
  useEffect(() => {
    // Mark component as mounted
    setMounted(true);
    
    try {
      // Get stored theme from localStorage
      const storedTheme = localStorage.getItem('gdyup-theme') as GdyupTheme;
      
      // Check if theme is valid and apply it
      if (storedTheme && ['default', 'luxury', 'bitcoin'].includes(storedTheme)) {
        setCurrentTheme(storedTheme);
        applyTheme(storedTheme);
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
  }, []);

  // Handle theme change
  const changeTheme = (newTheme: GdyupTheme) => {
    try {
      // Update the state
      setCurrentTheme(newTheme);
      
      // Apply theme to the UI
      applyTheme(newTheme);
      
      // Save to localStorage
      localStorage.setItem('gdyup-theme', newTheme);
      
      // For debugging
      console.log(`Theme changed to: ${newTheme}`);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  // Helper function for button styling with consistent theming
  const getThemedButtonClasses = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg'
    }[size];
    
    const baseClasses = `rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeClasses}`;
    
    if (variant === 'destructive') {
      return getThemeClasses({
        base: baseClasses,
        default: 'bg-gdyup-secondary text-white hover:bg-gdyup-secondary/90 focus:ring-gdyup-secondary/40',
        luxury: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40',
        bitcoin: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/40'
      });
    }
    
    if (variant === 'ghost') {
      return getThemeClasses({
        base: `${baseClasses}`,
        default: 'text-white hover:bg-white/10 focus:ring-gdyup-primary/40',
        luxury: 'text-white hover:bg-white/10 focus:ring-gdyup-primary/40',
        bitcoin: 'text-white hover:bg-white/10 focus:ring-gdyup-primary/40'
      });
    }
    
    if (variant === 'outline') {
      return getThemeClasses({
        base: `${baseClasses} border`,
        default: 'border-gdyup-primary text-gdyup-primary hover:bg-gdyup-primary/10 focus:ring-gdyup-primary/40',
        luxury: 'border-gdyup-primary text-gdyup-primary hover:bg-gdyup-primary/10 focus:ring-gdyup-primary/40',
        bitcoin: 'border-gdyup-primary text-gdyup-primary hover:bg-gdyup-primary/10 focus:ring-gdyup-primary/40'
      });
    }
    
    if (variant === 'secondary') {
      return getThemeClasses({
        base: baseClasses,
        default: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500/40',
        luxury: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500/40',
        bitcoin: 'bg-gray-800 text-white hover:bg-gray-700 focus:ring-gray-500/40'
      });
    }
    
    // Primary button (default)
    return getThemeClasses({
      base: baseClasses,
      default: 'gdyup-button',
      luxury: 'gdyup-button',
      bitcoin: 'gdyup-button'
    });
  };

  // Helper function to get theme-specific text colors
  const getThemedTextClasses = (variant?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'destructive' | 'success' | 'icon' | 'icon-default' | 'icon-primary' | 'icon-secondary' | 'icon-menu') => {
    // Icon variants for different contexts
    if (variant === 'icon-menu') {
      // Special case for menu icons to ensure high contrast in dropdowns
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-text-medium', 
        luxury: 'text-gdyup-text-medium',
        bitcoin: 'text-gdyup-text-medium'
      });
    }
    
    if (variant === 'icon-primary') {
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-primary', 
        luxury: 'text-gdyup-primary',
        bitcoin: 'text-gdyup-primary'
      });
    }
    
    if (variant === 'icon-secondary') {
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-secondary', 
        luxury: 'text-gdyup-secondary',
        bitcoin: 'text-gdyup-secondary'
      });
    }
    
    if (variant === 'icon-default' || variant === 'icon') {
      // Default icon coloring that works across all themes
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-text', 
        luxury: 'text-gdyup-text',
        bitcoin: 'text-gdyup-text'
      });
    }
    
    if (variant === 'destructive') {
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-secondary hover:text-gdyup-secondary/80',
        luxury: 'text-gdyup-secondary hover:text-gdyup-secondary/80',
        bitcoin: 'text-gdyup-secondary hover:text-gdyup-secondary/80'
      });
    }
    
    if (variant === 'success') {
      return getThemeClasses({
        base: '',
        default: 'text-green-500 hover:text-green-600',
        luxury: 'text-green-400 hover:text-green-500',
        bitcoin: 'text-green-400 hover:text-green-500'
      });
    }
    
    if (variant === 'inverse') {
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-button-text',
        luxury: 'text-gdyup-button-text',
        bitcoin: 'text-gdyup-button-text'
      });
    }
    
    if (variant === 'muted') {
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-text-subtle',
        luxury: 'text-gdyup-text-subtle',
        bitcoin: 'text-gdyup-text-subtle'
      });
    }
    
    if (variant === 'secondary') {
      return getThemeClasses({
        base: '',
        default: 'text-gdyup-secondary',
        luxury: 'text-gdyup-secondary',
        bitcoin: 'text-gdyup-secondary'
      });
    }
    
    if (variant === 'primary') {
    return getThemeClasses({
      base: '',
      default: 'gdyup-primary', 
      luxury: 'gdyup-primary',
      bitcoin: 'gdyup-primary'
      });
    }
    
    // No variant specified - default to regular text color
    return getThemeClasses({
      base: '',
      default: 'text-gdyup-text', 
      luxury: 'text-gdyup-text',
      bitcoin: 'text-gdyup-text'
    });
  };

  // Helper function for badge styling
  const getThemedBadgeClasses = (variant: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' = 'primary') => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
    
    if (variant === 'success') {
      return getThemeClasses({
        base: baseClasses,
        default: 'badge-success',
        luxury: 'badge-success',
        bitcoin: 'badge-success'
      });
    }
    
    if (variant === 'warning') {
      return getThemeClasses({
        base: baseClasses,
        default: 'badge-warning',
        luxury: 'badge-warning',
        bitcoin: 'badge-warning'
      });
    }
    
    if (variant === 'outline') {
      return getThemeClasses({
        base: `${baseClasses} border`,
        default: 'border-gdyup-primary text-gdyup-primary bg-transparent',
        luxury: 'border-gdyup-primary text-gdyup-primary bg-transparent',
        bitcoin: 'border-gdyup-primary text-gdyup-primary bg-transparent'
      });
    }
    
    if (variant === 'secondary') {
      return getThemeClasses({
        base: baseClasses,
        default: 'bg-gray-800 text-white',
        luxury: 'bg-gray-800 text-white',
        bitcoin: 'bg-gray-800 text-white'
      });
    }
    
    // Primary badge (default)
    return getThemeClasses({
      base: baseClasses,
      default: 'gdyup-bg-primary',
      luxury: 'gdyup-bg-primary',
      bitcoin: 'gdyup-bg-primary'
    });
  };

  // Helper function for background panels
  const getThemedBackgroundClasses = (variant: 'primary' | 'secondary' | 'card' = 'primary') => {
    if (variant === 'card') {
      return getThemeClasses({
        base: 'rounded-lg border shadow-sm',
        default: 'gdyup-card',
        luxury: 'gdyup-card',
        bitcoin: 'gdyup-card'
      });
    }
    
    if (variant === 'secondary') {
      return getThemeClasses({
        base: '',
        default: 'bg-gray-800',
        luxury: 'bg-gray-800',
        bitcoin: 'bg-gray-800'
      });
    }
    
    // Primary background (default)
    return getThemeClasses({
      base: '',
      default: 'gdyup-bg-primary',
      luxury: 'gdyup-bg-primary',
      bitcoin: 'gdyup-bg-primary'
    });
  };

  // Human-readable theme names for UI display
  const getThemeName = () => {
    switch (currentTheme) {
      case 'luxury': return 'Luxury Black';
      case 'bitcoin': return 'Bitcoin Orange';
      default: return 'Lime';
    }
  };

  // Use the mounted state to decide what to render
  // This prevents hydration mismatches by ensuring client-side only values
  // don't get used during server-side rendering
  if (!mounted) {
    // During SSR or before hydration, use a default value that matches initial HTML
    return (
      <ThemeContext.Provider
        value={{
          theme: 'default',
          changeTheme: () => {}, // No-op during SSR
          getThemeClasses: () => '',
          getThemedButtonClasses: () => '',
          getThemedTextClasses: () => '',
          getThemedBadgeClasses: () => '',
          getThemedBackgroundClasses: () => '',
          getThemeName: () => 'Default',
          isMobile: false
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  // After hydration, provide the actual values
  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        changeTheme,
        getThemeClasses,
        getThemedButtonClasses,
        getThemedTextClasses,
        getThemedBadgeClasses,
        getThemedBackgroundClasses,
        getThemeName,
        isMobile
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use the theme context
export function useGdyupTheme() {
  return useContext(ThemeContext);
} 