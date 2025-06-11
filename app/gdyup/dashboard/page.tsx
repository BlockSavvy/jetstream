'use client';

import React from 'react';
import EnhancedGDYupDashboard from '@/app/gdyup/components/EnhancedGDYupDashboard';
import EliteMobileDashboard from '@/app/gdyup/components/EliteMobileDashboard';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import GdyupClientLayout from '../components/GdyupClientLayout';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { 
    getThemedTextClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      // Check for mobile screen size or Capacitor environment
      const isCapacitor = !!(window as any).Capacitor;
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isCapacitor || isMobileScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return (
      <GdyupClientLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gdyup-bg-dark rounded w-1/3"></div>
            <div className="h-32 bg-gdyup-bg-dark rounded-xl"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gdyup-bg-dark rounded-lg"></div>
              <div className="h-24 bg-gdyup-bg-dark rounded-lg"></div>
            </div>
          </div>
        </div>
      </GdyupClientLayout>
    );
  }

  return (
    <GdyupClientLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <div className={cn("border-b pb-4", "border-gdyup-border")}>
            <h1 className={cn("text-2xl font-semibold", getThemedTextClasses())}>Dashboard</h1>
            <p className={cn("mt-1 text-sm", getThemedTextClasses('muted'))}>
              {isMobile 
                ? "Manage your wallet, bookings, and account activity"
                : "Manage your jet shares, bookings, and account activity"
              }
            </p>
          </div>
          
          {/* Conditional rendering: Elite Mobile Dashboard for mobile, Enhanced for desktop */}
          {isMobile ? (
            <EliteMobileDashboard />
          ) : (
            <EnhancedGDYupDashboard />
          )}
        </div>
      </div>
    </GdyupClientLayout>
  );
} 