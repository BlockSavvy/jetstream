'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Haptic feedback function
  const triggerHaptic = useCallback((type: 'light' | 'medium' = 'light') => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Haptics } = (window as any).Capacitor.Plugins || {};
      if (Haptics) {
        if (type === 'light') {
          Haptics.selectionStart?.();
        } else {
          Haptics.impact?.({ style: 'MEDIUM' });
        }
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      const dampened = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(dampened);
      
      const shouldRefresh = dampened >= threshold;
      if (shouldRefresh !== canRefresh) {
        setCanRefresh(shouldRefresh);
        triggerHaptic(shouldRefresh ? 'medium' : 'light');
      }
    }
  }, [disabled, isRefreshing, threshold, canRefresh, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('medium');
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setCanRefresh(false);
        setPullDistance(0);
      }
    } else {
      setCanRefresh(false);
      setPullDistance(0);
    }
  }, [canRefresh, isRefreshing, onRefresh, triggerHaptic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const refreshIconRotation = isRefreshing ? 'animate-spin' : 
    canRefresh ? 'rotate-180' : 
    `rotate-${Math.min(180, (pullDistance / threshold) * 180)}`;

  const refreshOpacity = Math.min(1, pullDistance / threshold);

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      style={{ 
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10"
        style={{
          transform: `translateY(-100%)`,
          opacity: refreshOpacity
        }}
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "bg-gdyup-bg-elevated border border-gdyup-border",
          "backdrop-blur-md shadow-lg",
          canRefresh ? "bg-gdyup-primary/20 border-gdyup-primary" : ""
        )}>
          <RotateCw 
            size={16} 
            className={cn(
              "transition-all duration-300",
              refreshIconRotation,
              canRefresh ? "text-gdyup-primary" : "text-gdyup-text-subtle"
            )}
          />
          <span className={cn(
            "text-sm font-medium transition-colors",
            canRefresh ? "text-gdyup-primary" : "text-gdyup-text-subtle"
          )}>
            {isRefreshing ? 'Refreshing...' : 
             canRefresh ? 'Release to refresh' : 
             'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh; 