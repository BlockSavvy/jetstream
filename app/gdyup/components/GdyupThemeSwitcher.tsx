'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

type Theme = 'default' | 'blue' | 'pink';

export default function GdyupThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<Theme>('default');
  
  // On mount, check localStorage for theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('gdyup-theme') as Theme | null;
    
    if (storedTheme && ['default', 'blue', 'pink'].includes(storedTheme)) {
      setActiveTheme(storedTheme);
    }
  }, []);

  // Handle theme button click
  const handleThemeClick = (theme: Theme) => {
    // If already active, no change needed
    if (theme === activeTheme) return;
    
    // Update state
    setActiveTheme(theme);
    
    // Store in localStorage (this will trigger storage event for other components)
    localStorage.setItem('gdyup-theme', theme);
    
    // Remove all theme classes
    document.documentElement.classList.remove(
      'gdyup-theme-default',
      'gdyup-theme-blue',
      'gdyup-theme-pink'
    );
    
    // Add the selected theme class
    document.documentElement.classList.add(`gdyup-theme-${theme}`);
    
    console.log(`Theme switched to: ${theme}`);
  };

  // Theme data for better visualization
  const themes = [
    {
      id: 'default',
      name: 'Lime Green',
      gradient: 'linear-gradient(145deg, #DAFF0D, #C8EA00)',
      glowColor: 'rgba(218, 255, 13, 0.6)',
      textColor: 'black'
    },
    {
      id: 'blue',
      name: 'Luxury Black',
      gradient: 'linear-gradient(145deg, #F25C05, #D04A04)',
      glowColor: 'rgba(242, 92, 5, 0.6)',
      textColor: 'white'
    },
    {
      id: 'pink',
      name: 'Bitcoin Orange',
      gradient: 'linear-gradient(145deg, #F7931A, #D67908)',
      glowColor: 'rgba(247, 147, 26, 0.6)',
      textColor: 'black'
    }
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center gap-5 px-2 py-4">
        {themes.map(theme => (
          <button
            key={theme.id}
            onClick={() => handleThemeClick(theme.id as Theme)}
            className="relative group"
            aria-label={`${theme.name} theme`}
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 border-2
              ${activeTheme === theme.id 
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
                {theme.id === 'blue' && (
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
              {activeTheme === theme.id && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className={`w-6 h-6 text-${theme.textColor} drop-shadow-md`} />
                </div>
              )}
            </div>
            <span className={`
              block text-center mt-2 text-xs font-medium
              ${activeTheme === theme.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}
            `}>
              {theme.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 