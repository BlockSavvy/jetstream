'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { ClientOnly } from '../utils/hydration-utils';
import GdyupClientLayout from '../components/GdyupClientLayout';

// Mock data for development
import JetShareListingsContent from '../components/JetShareListingsContent';

export default function JetShareListingsPage() {
  const [loading, setLoading] = useState(true);
  const { getThemedTextClasses } = useGdyupTheme();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  
  return (
    <GdyupClientLayout>
      <div className="min-h-screen bg-black gdyup-section">
        <main className="container mx-auto px-3 py-4 md:py-6">
          <h1 className="text-2xl font-bold mb-4 text-gdyup-primary drop-shadow-[0_0_10px_rgba(var(--gdyup-primary-rgb),0.3)]">
            Browse Flight Shares
          </h1>
          
          <ClientOnly
            fallback={
              <div className="flex justify-center items-center py-20">
                <div className="h-10 w-10 rounded-full border-4 border-gray-600 border-t-gray-300 animate-spin" />
              </div>
            }
          >
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className={cn("h-10 w-10", getThemedTextClasses('primary'), "animate-spin")} />
              </div>
            ) : (
              <div>
                {/* JetShare Listings Content */}
                <JetShareListingsContent />
              </div>
            )}
          </ClientOnly>
        </main>
      </div>
    </GdyupClientLayout>
  );
} 