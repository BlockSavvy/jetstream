'use client';

import React from 'react';
import EnhancedGDYupDashboard from '@/app/gdyup/components/EnhancedGDYupDashboard';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';
import GdyupClientLayout from '../components/GdyupClientLayout';

export default function Dashboard() {
  const { 
    getThemedTextClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();

  return (
    <GdyupClientLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <div className={cn("border-b pb-4", "border-gdyup-border")}>
            <h1 className={cn("text-2xl font-semibold", getThemedTextClasses())}>Dashboard</h1>
            <p className={cn("mt-1 text-sm", getThemedTextClasses('muted'))}>
              Manage your jet shares, bookings, and account activity
            </p>
          </div>
          <EnhancedGDYupDashboard />
        </div>
      </div>
    </GdyupClientLayout>
  );
} 