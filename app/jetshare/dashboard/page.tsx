'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import JetShareDashboard from '../components/JetShareDashboard';
import { toast } from 'sonner';

// Prevent static generation of this page
export const dynamic = 'force-dynamic';

export default function JetShareDashboardPage() {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialTab, setInitialTab] = useState<'dashboard' | 'offers' | 'bookings' | 'transactions'>('dashboard');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  
  // Simplified loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Loading your dashboard...</h1>
        <p className="text-muted-foreground">Please wait while we retrieve your information.</p>
      </div>
    );
  }
  
  // User is authenticated, render dashboard
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <JetShareDashboard 
          initialTab={initialTab} 
          errorMessage={errorMessage} 
          successMessage={successMessage}
        />
      </div>
    );
  }

  // Final fallback
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[50vh]">
      <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
      <p className="text-muted-foreground mb-4">Please log in to view your dashboard.</p>
      <a 
        href="/auth/login?returnUrl=/jetshare/dashboard"
        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded"
      >
        Sign In
      </a>
    </div>
  );
} 