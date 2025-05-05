/**
 * Theme utility functions for GDY·UP
 * Enhanced to prevent update loops with proper locking
 */

export type GdyupTheme = 'default' | 'blue' | 'pink';

// Flag to prevent double-handling theme changes with timeout tracking
let isProcessingThemeChange = false;
let themeProcessingTimeout: NodeJS.Timeout | null = null;

/**
 * Apply a theme - optimized to avoid unnecessary DOM operations
 * 
 * @param theme - The theme to apply
 * @returns void
 */
export function applyTheme(theme: GdyupTheme): void {
  // Skip if already processing to prevent loops
  if (isProcessingThemeChange) return;
  
  try {
    isProcessingThemeChange = true;
    
    // Clear any pending timeout
    if (themeProcessingTimeout) {
      clearTimeout(themeProcessingTimeout);
    }
    
    // Check if theme is already applied to avoid DOM updates
    const currentThemeClass = Array.from(document.documentElement.classList)
      .find(cls => cls.startsWith('gdyup-theme-'));
    
    if (currentThemeClass === `gdyup-theme-${theme}`) {
      return; // Theme is already applied, no need to change
    }
    
    // Remove all theme classes once
    document.documentElement.classList.remove(
      'gdyup-theme-default',
      'gdyup-theme-blue',
      'gdyup-theme-pink'
    );
    
    // Add the new theme class
    document.documentElement.classList.add(`gdyup-theme-${theme}`);
    
    // Store in localStorage without triggering a loop
    const currentStoredTheme = localStorage.getItem('gdyup-theme');
    if (currentStoredTheme !== theme) {
      localStorage.setItem('gdyup-theme', theme);
    }
  } finally {
    // Always reset flag after a short delay
    themeProcessingTimeout = setTimeout(() => {
      isProcessingThemeChange = false;
      themeProcessingTimeout = null;
    }, 100);
  }
}

/**
 * Get the current theme from localStorage or use default
 * 
 * @returns The current theme
 */
export function getCurrentTheme(): GdyupTheme {
  if (typeof window === 'undefined') {
    return 'default';
  }
  
  try {
    const storedTheme = localStorage.getItem('gdyup-theme') as GdyupTheme | null;
    
    if (storedTheme && ['default', 'blue', 'pink'].includes(storedTheme)) {
      return storedTheme;
    }
  } catch (e) {
    console.warn('Error reading theme from localStorage:', e);
  }
  
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
      if (newTheme && ['default', 'blue', 'pink'].includes(newTheme)) {
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
    name: 'Lime Green',
    gradient: 'linear-gradient(145deg, #DAFF0D, #C8EA00)',
    glowColor: 'rgba(218, 255, 13, 0.6)',
    textColor: 'black'
  },
  blue: {
    name: 'Luxury Black',
    gradient: 'linear-gradient(145deg, #F25C05, #D04A04)',
    glowColor: 'rgba(242, 92, 5, 0.6)',
    textColor: 'white'
  },
  pink: {
    name: 'Bitcoin Orange',
    gradient: 'linear-gradient(145deg, #F7931A, #D67908)',
    glowColor: 'rgba(247, 147, 26, 0.6)',
    textColor: 'black'
  }
}; 