import React from 'react';
import { Metadata } from 'next';
import EnhancedGDYupDashboard from '@/app/gdyup/components/EnhancedGDYupDashboard';

export const metadata: Metadata = {
  title: 'GDY·UP | Dashboard',
};

export default function Dashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your jet shares, bookings, and account activity
          </p>
        </div>
        <EnhancedGDYupDashboard />
      </div>
    </div>
  );
} 