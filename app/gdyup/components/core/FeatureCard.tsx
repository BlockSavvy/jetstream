'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { ClientOnly, useClientStyle } from '../../utils/hydration-utils';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  onClick,
  className,
  iconClassName
}: FeatureCardProps) {
  const { 
    getThemedTextClasses, 
    getThemedBackgroundClasses, 
    getThemedButtonClasses 
  } = useGdyupTheme();
  
  // Use client style for safe post-hydration styling
  const iconContainerStyle = useClientStyle({
    borderLeftColor: 'var(--gdyup-primary)'
  });

  return (
    <ClientOnly fallback={
      <div className="border rounded-lg shadow-sm transition-colors gdyup-card bg-gray-900 border-gray-800">
        <div className="p-2 flex flex-col items-center text-center">
          <div className="w-8 h-8 flex items-center justify-center mb-1 mt-1 border rounded-lg shadow-sm border-gray-700 bg-gray-900">
            {/* Icon placeholder */}
            <div className="h-4 w-4 bg-gray-700 rounded-full" />
          </div>
          <div className="h-4 w-16 bg-gray-800 rounded-md mb-1" /> {/* Title placeholder */}
          <div className="h-3 w-20 bg-gray-800 rounded-md hidden md:block" /> {/* Description placeholder */}
        </div>
      </div>
    }>
      <div 
        className={cn(
          "border rounded-lg shadow-sm transition-colors", 
          getThemedBackgroundClasses('card'),
          "border-gdyup-border hover:border-gdyup-primary",
          "gdyup-card",
          onClick ? "cursor-pointer" : "",
          className
        )}
        onClick={onClick}
      >
        <div className="p-2 flex flex-col items-center text-center">
          <div className={cn(
            "w-8 h-8 flex items-center justify-center mb-1 mt-1",
            "border rounded-lg",
            "border-gdyup-border border-l-gdyup-primary",
            "gdyup-feature-icon-container",
            getThemedBackgroundClasses('card'),
            iconClassName
          )}
          style={iconContainerStyle}
          >
            {icon}
          </div>
          
          <h3 className={cn(
            "font-bold text-xs",
            getThemedTextClasses()
          )}>
            {title}
          </h3>
          
          {description && (
            <p className={cn(
              "text-[10px] mt-0.5 hidden md:block",
              getThemedTextClasses('muted')
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}

export function FeatureCardGrid({ 
  children, 
  columns = 3,
  className
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const columnsClasses = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4"
  };
  
  return (
    <div className={cn(
      "grid gap-2 mb-4",
      columnsClasses[columns],
      className
    )}>
      {children}
    </div>
  );
}

// Helper component for standard feature icon
export function FeatureIcon({ 
  children, 
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const { getThemedTextClasses } = useGdyupTheme();
  
  return (
    <div className={cn(
      "text-gdyup-primary",
      getThemedTextClasses('primary'),
      className
    )}>
      {children}
    </div>
  );
} 