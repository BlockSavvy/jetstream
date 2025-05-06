'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from '@/components/ui/dropdown-menu';
import { PaintBucket, Check } from 'lucide-react';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

interface GdyupThemeSwitcherProps {
  showLabels?: boolean;
}

export default function GdyupThemeSwitcher({ showLabels = true }: GdyupThemeSwitcherProps) {
  const { theme, changeTheme, isMobile, getThemeClasses } = useGdyupTheme();
  const [open, setOpen] = useState(false);
  
  const themes = [
    { id: 'default', name: 'Default', description: 'The default GDY·UP theme' },
    { id: 'blue', name: 'Luxury Black', description: 'Premium dark blue theme' },
    { id: 'pink', name: 'BTC Orange', description: 'Bitcoin-inspired theme' },
  ];
  
  const getThemeColorClass = (themeId: string) => {
    switch (themeId) {
      case 'default':
        return 'bg-gradient-to-r from-amber-400 to-lime-400';
      case 'blue':
        return 'bg-gradient-to-r from-blue-900 to-blue-600';
      case 'pink':
        return 'bg-gradient-to-r from-[#F7931A] to-amber-500';
      default:
        return 'bg-gradient-to-r from-gray-200 to-gray-300';
    }
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-7 gap-2",
            getThemeClasses({
              base: "",
              default: "text-gray-800 hover:text-black hover:bg-gray-100",
              blue: "text-blue-100 hover:text-white hover:bg-blue-800",
              pink: "text-pink-100 hover:text-white hover:bg-pink-800"
            })
          )}
        >
          <PaintBucket className="h-3.5 w-3.5" />
          {showLabels && <span className="text-xs">Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end"
        className={getThemeClasses({
          base: "w-48",
          default: "bg-white border-gray-200",
          blue: "bg-blue-950 border-blue-900 text-blue-50",
          pink: "bg-pink-950 border-pink-900 text-pink-50"
        })}
      >
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => changeTheme(value as 'default' | 'blue' | 'pink')}>
          {themes.map((t) => (
            <DropdownMenuRadioItem 
              key={t.id} 
              value={t.id}
              className={cn(
                "cursor-pointer hover:cursor-pointer flex items-center py-1.5",
                getThemeClasses({
                  base: "gap-2",
                  default: "text-gray-900 focus:bg-gray-100 focus:text-gray-900",
                  blue: "text-blue-50 focus:bg-blue-900/60 focus:text-blue-50",
                  pink: "text-pink-50 focus:bg-pink-900/60 focus:text-pink-50"
                })
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  getThemeColorClass(t.id)
                )}></div>
                <span>{t.name}</span>
              </div>
              
              {theme === t.id && (
                <Check className={cn(
                  "h-3.5 w-3.5 ml-auto",
                  getThemeClasses({
                    base: "",
                    default: "text-amber-500",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })
                )} />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 