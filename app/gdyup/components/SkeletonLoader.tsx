'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'flight' | 'nav';
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'card',
  count = 1 
}) => {
  const baseClasses = "animate-pulse bg-gdyup-border rounded";
  
  const variants = {
    card: "h-32 w-full",
    text: "h-4 w-3/4",
    circle: "h-12 w-12 rounded-full",
    flight: "h-40 w-full",
    nav: "h-10 w-16"
  };
  
  if (count > 1) {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index}
            className={cn(baseClasses, variants[variant], className)}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn(baseClasses, variants[variant], className)} />
  );
};

// Flight card skeleton
export const FlightCardSkeleton: React.FC = () => (
  <div className="elite-card p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="h-8 w-8" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    
    <div className="pt-4 border-t border-gdyup-border">
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

// List of flight cards skeleton
export const FlightListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <FlightCardSkeleton key={index} />
    ))}
  </div>
);

// Navigation skeleton
export const NavSkeleton: React.FC = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-gdyup-nav-bg border-t border-gdyup-nav-border backdrop-blur-xl">
    <div className="flex items-center justify-around px-4 py-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <Skeleton variant="circle" className="h-6 w-6" />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
    <div className="h-[env(safe-area-inset-bottom)]" />
  </div>
);

// Search/Filter skeleton
export const SearchSkeleton: React.FC = () => (
  <div className="px-6 mb-6">
    <div className="flex gap-3 mb-4">
      <Skeleton className="flex-1 h-12" />
      <Skeleton className="h-12 w-12" />
    </div>
  </div>
);

// Profile section skeleton
export const ProfileSkeleton: React.FC = () => (
  <div className="elite-card p-6">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circle" className="h-20 w-20" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export default Skeleton; 