'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PaintBucket, Check } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import { ThemedIcon } from './core';

interface GdyupThemeSwitcherProps {
  showLabels?: boolean;
  alignDropdown?: 'start' | 'end' | 'center';
  sideOffset?: number;
}

export default function GdyupThemeSwitcher({ 
  showLabels = true, 
  alignDropdown = 'end',
  sideOffset = 4
}: GdyupThemeSwitcherProps) {
  const { theme, changeTheme, isMobile, getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);
    
    // Listen for theme change events
    const handleThemeChange = () => {
      // Force rerender when theme changes
      setMounted(false);
      setTimeout(() => setMounted(true), 10);
    };
    
    document.addEventListener('gdyup-theme-changed', handleThemeChange);
    return () => document.removeEventListener('gdyup-theme-changed', handleThemeChange);
  }, []);
  
  const themes = [
    { id: 'default', name: 'Default', description: 'The default GDY·UP theme' },
    { id: 'luxury', name: 'Luxury Black', description: 'Premium dark blue theme' },
    { id: 'bitcoin', name: 'BTC Orange', description: 'Bitcoin-inspired theme' },
  ];
  
  const getThemeColorClass = (themeId: string) => {
    switch (themeId) {
      case 'default':
        return 'bg-gradient-to-r from-amber-400 to-lime-400';
      case 'luxury':
        return 'bg-gradient-to-r from-blue-900 to-blue-600';
      case 'bitcoin':
        return 'bg-gradient-to-r from-[#F7931A] to-amber-500';
      default:
        return 'bg-gradient-to-r from-gray-200 to-gray-300';
    }
  };
  
  const handleThemeChange = (value: string) => {
    console.log(`Changing theme to: ${value}`);
    changeTheme(value as 'default' | 'luxury' | 'bitcoin');
    setOpen(false); // Close menu after selection
  };
  
  if (!mounted) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 gap-2 text-gray-400"
      >
        <ThemedIcon icon={PaintBucket} size={14} className="theme-switcher-icon" />
        {showLabels && <span className="text-xs">Theme</span>}
      </Button>
    );
  }

  return (
    <div className="theme-switcher-container z-[500]" ref={containerRef}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "h-7 gap-2 theme-switcher-button",
              getThemedTextClasses()
            )}
          >
            <ThemedIcon icon={PaintBucket} size={14} className="theme-switcher-icon" />
            {showLabels && <span className="text-xs">Theme</span>}
          </Button>
        </DropdownMenuTrigger>
        
        {open && (
          <div className="fixed inset-0 bg-transparent z-[499]" onClick={() => setOpen(false)}>
            <div 
              className="gdyup-theme-menu-container absolute"
              style={{
                top: isMobile ? '50%' : '4rem',
                left: isMobile ? '50%' : 'auto',
                right: isMobile ? 'auto' : '2rem',
                transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                width: '240px',
                zIndex: 500,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="gdyup-theme-menu rounded-xl shadow-lg p-3"
                style={{
                  backgroundColor: '#121212',
                  border: `1px solid ${theme === 'default' ? '#DAFF0D' : theme === 'luxury' ? '#39FF14' : '#F7931A'}`,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div className="text-center mb-2">
                  <h3 className="text-base font-semibold text-white">Select Theme</h3>
                </div>
                
                <div className="w-full flex flex-col gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg transition-colors"
                      style={{
                        backgroundColor: theme === t.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleThemeChange(t.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full border border-white/20 flex-shrink-0",
                          getThemeColorClass(t.id)
                        )}></div>
                        <span className="font-medium text-sm text-white">
                          {t.name}
                        </span>
                      </div>
                      
                      {theme === t.id && (
                        <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--gdyup-primary)' }}>
                          <Check size={14} className="text-black flex-shrink-0" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DropdownMenu>
    </div>
  );
} 