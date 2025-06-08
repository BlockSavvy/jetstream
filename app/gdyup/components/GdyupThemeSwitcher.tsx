'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  gradient: string;
  textColor: string;
}

const themes: ThemeOption[] = [
  {
    id: 'luxury',
    name: 'Luxury Crimson',
    description: 'Elite crimson red with white text',
    gradient: 'linear-gradient(135deg, #DC143C, #B91C3C)',
    textColor: '#FFFFFF'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin Orange',
    description: 'Satoshi orange with white text',
    gradient: 'linear-gradient(135deg, #FF6B00, #E55A00)',
    textColor: '#FFFFFF'
  },
  {
    id: 'classic',
    name: 'Classic Lime',
    description: 'Original neon lime with black text',
    gradient: 'linear-gradient(135deg, #DAFF0D, #C5E60A)',
    textColor: '#000000'
  }
];

export default function GdyupThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<string>('luxury');
  const [isOpen, setIsOpen] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('gdyup-theme') || 'luxury';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    console.log(`[Theme] Applying theme: ${themeId}`);
    
    // Remove all existing theme classes
    document.documentElement.removeAttribute('data-gdyup-theme');
    
    // Apply new theme
    document.documentElement.setAttribute('data-gdyup-theme', themeId);
    
    // Force CSS recomputation
    document.documentElement.style.display = 'none';
    document.documentElement.offsetHeight; // Trigger reflow
    document.documentElement.style.display = '';
    
    console.log(`[Theme] Theme applied: ${themeId}, attribute set: ${document.documentElement.getAttribute('data-gdyup-theme')}`);
  };

  const handleThemeChange = (themeId: string) => {
    console.log(`[Theme] Changing theme to: ${themeId}`);
    setCurrentTheme(themeId);
    localStorage.setItem('gdyup-theme', themeId);
    applyTheme(themeId);
    setIsOpen(false);
    
    // Trigger haptic feedback if available
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Haptics } = (window as any).Capacitor?.Plugins || {};
      if (Haptics) {
        Haptics.impact({ style: 'MEDIUM' });
      }
    }
  };

  const currentThemeObj = themes.find(t => t.id === currentTheme) || themes[0];

  return (
    <div className="fixed top-4 right-4 z-[200]">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-10 h-10 p-0 border-2 border-white/20 backdrop-blur-md",
              "hover:border-white/40 transition-all duration-200",
              "bg-black/60"
            )}
            style={{
              background: `${currentThemeObj.gradient}, rgba(0, 0, 0, 0.6)`,
              backgroundBlendMode: 'overlay'
            }}
          >
            <Palette className="h-4 w-4 text-white" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className={cn(
            "gdyup-theme-menu w-64 p-2",
            "bg-black/95 border-2 border-gray-600 backdrop-blur-xl",
            "shadow-2xl rounded-xl"
          )}
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-white font-semibold text-center py-2">
            Choose Theme
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-600" />
          
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                "hover:bg-white/10 transition-colors duration-200",
                "focus:bg-white/10 focus:outline-none",
                currentTheme === theme.id && "bg-white/20"
              )}
              onClick={() => handleThemeChange(theme.id)}
            >
              {/* Theme Color Preview */}
              <div
                className="w-8 h-8 rounded-lg border-2 border-white/30 flex-shrink-0"
                style={{
                  background: theme.gradient,
                }}
              />
              
              {/* Theme Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">
                  {theme.name}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {theme.description}
                </div>
              </div>
              
              {/* Current Theme Indicator */}
              {currentTheme === theme.id && (
                <Check className="h-4 w-4 text-white flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 