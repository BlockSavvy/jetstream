'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import { applyTheme, getCurrentTheme, themeInfo, GdyupTheme } from '../utils/theme-utils';

export default function GdyupThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<GdyupTheme>('default');
  const isInitialized = useRef(false);
  const currentThemeRef = useRef<GdyupTheme>('default');
  
  // On mount, check localStorage for theme - only once
  useEffect(() => {
    if (isInitialized.current) return;
    
    isInitialized.current = true;
    const theme = getCurrentTheme();
    currentThemeRef.current = theme;
    setActiveTheme(theme);
    
    // Listen for external theme changes (from other components)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'gdyup-theme') {
        const newTheme = e.newValue as GdyupTheme || 'default';
        
        // Only update if different from what we're tracking
        if (newTheme !== currentThemeRef.current) {
          currentThemeRef.current = newTheme;
          setActiveTheme(newTheme);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Handle theme button click
  const handleThemeClick = (theme: GdyupTheme) => {
    // If already active, no change needed
    if (theme === currentThemeRef.current) return;
    
    // Update our refs and state
    currentThemeRef.current = theme;
    setActiveTheme(theme);
    
    // Apply the theme using the utility function - this also updates localStorage
    applyTheme(theme);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center gap-5 px-2 py-4">
        {Object.entries(themeInfo).map(([id, theme]) => (
          <button
            key={id}
            onClick={() => handleThemeClick(id as GdyupTheme)}
            className="relative group"
            aria-label={`${theme.name} theme`}
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 border-2
              ${activeTheme === id 
                ? `border-white shadow-[0_0_15px_${theme.glowColor}]` 
                : 'border-gray-700 group-hover:border-gray-400'
              }
            `}>
              {/* Color swatch with gradient */}
              <div 
                className="w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-full"
                style={{
                  background: theme.gradient,
                  position: 'relative'
                }}
              >
                {/* Carbon fiber overlay effect for luxury black theme */}
                {id === 'blue' && (
                  <div 
                    className="absolute inset-0 rounded-full opacity-30"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h6v6H0V0zm6 6h6v6H6V6z\' fill=\'%23000000\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                      backgroundSize: '4px 4px'
                    }}
                  />
                )}
              </div>

              {/* Checkmark indicator */}
              {activeTheme === id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className={`w-6 h-6 text-${theme.textColor} drop-shadow-md`} />
                </div>
              )}
            </div>
            <span className={`
              block text-center mt-2 text-xs font-medium
              ${activeTheme === id ? 'text-white' : 'text-gray-400 group-hover:text-white'}
            `}>
              {theme.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 