/**
 * Theme utility functions for GDY·UP
 * 
 * Provides functions to handle theme changes, refreshes, and transitions
 */

export type GdyupTheme = 'default' | 'blue' | 'pink';

/**
 * Apply a theme and handle theme transitions
 * 
 * @param theme - The theme to apply
 * @returns void
 */
export function applyTheme(theme: GdyupTheme): void {
  // Remove all theme classes
  document.documentElement.classList.remove(
    'gdyup-theme-default',
    'gdyup-theme-blue',
    'gdyup-theme-pink'
  );
  
  // Add the selected theme class with transition class
  document.documentElement.classList.add(`gdyup-theme-${theme}`, 'gdyup-theme-transition');
  
  // Add the refresh class to trigger a repaint
  document.documentElement.classList.add('gdyup-theme-refresh');
  
  // Store in localStorage
  localStorage.setItem('gdyup-theme', theme);
  
  // Remove the refresh class after animation completes
  setTimeout(() => {
    document.documentElement.classList.remove('gdyup-theme-refresh');
  }, 50);
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
  
  const storedTheme = localStorage.getItem('gdyup-theme') as GdyupTheme | null;
  
  if (storedTheme && ['default', 'blue', 'pink'].includes(storedTheme)) {
    return storedTheme;
  }
  
  return 'default';
}

/**
 * Force a theme refresh by triggering a repaint
 * Useful when theme changes don't fully apply
 * 
 * @returns void
 */
export function forceThemeRefresh(): void {
  // Add and remove the refresh class to trigger a repaint
  document.documentElement.classList.add('gdyup-theme-refresh');
  
  // Force a reflow
  void document.documentElement.offsetHeight;
  
  // Remove after a short delay
  setTimeout(() => {
    document.documentElement.classList.remove('gdyup-theme-refresh');
  }, 50);
}

/**
 * Add a listener for theme changes
 * 
 * @param callback - Function to call when theme changes
 * @returns Function to remove the listener
 */
export function addThemeChangeListener(callback: (theme: GdyupTheme) => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'gdyup-theme') {
      const newTheme = event.newValue as GdyupTheme;
      callback(newTheme);
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