'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

// Define the variant type
type IconVariant = 'default' | 'primary' | 'secondary' | 'inverse' | 'destructive';

interface ThemedIconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  // Add variant and color props to fix type errors
  variant?: IconVariant | string;
  color?: string;
}

/**
 * A component that renders a Lucide icon with theme-aware styles
 */
export function ThemedIcon({ 
  icon: Icon, 
  size = 24, 
  className,
  variant,
  color
}: ThemedIconProps) {
  const { theme, getThemedTextClasses } = useGdyupTheme();
  
  // Process variant to get appropriate classes
  const getVariantClasses = () => {
    if (!variant) return '';
    
    switch (variant) {
      case 'primary':
        return 'text-gdyup-primary';
      case 'secondary':
        return 'text-gdyup-secondary';
      case 'inverse':
        return 'text-gdyup-button-text';
      case 'destructive':
        return 'text-red-500';
      default:
        return '';
    }
  };
  
  // Direct color property takes precedence over variant
  const colorStyle = color ? { color } : {};
  
  return (
    <Icon 
      size={size}
      className={cn(
        "transition-all duration-200",
        theme === 'luxury' && !variant && !color && "text-blue-50",
        theme === 'bitcoin' && !variant && !color && "text-pink-50",
        variant && getVariantClasses(),
        className
      )}
      style={colorStyle}
    />
  );
} 