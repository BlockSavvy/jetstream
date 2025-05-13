'use client';

import React, { useState, useEffect } from 'react';
import JetShareListingsContent from '../components/JetShareListingsContent';
import { Loader2, Plane, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { FeatureCard, FeatureCardGrid, FeatureIcon } from '../components/core/FeatureCard';
import { ClientOnly } from '../utils/hydration-utils';
import { ClientLayoutWrapper } from '../client-layout-wrapper';

export default function JetShareListingsPage() {
  const [loading, setLoading] = useState(true);
  const { getThemedTextClasses, getThemedBackgroundClasses } = useGdyupTheme();
  
  useEffect(() => {
    // Initialize - check for pending offer from session after redirect from login
    const checkForPendingOffer = () => {
      try {
        const pendingOfferId = sessionStorage.getItem('jetshare_resume_offer_acceptance');
        if (pendingOfferId) {
          console.log('Found pending offer acceptance after login:', pendingOfferId);
        }
      } catch (e) {
        console.warn('Error accessing sessionStorage:', e);
      }
    };
    
    const checkAuthStatus = async () => {
      try {
        // Check if user is authenticated
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          console.log('User is authenticated:', data.session.user.id);
          checkForPendingOffer();
        } else {
          console.log('User is not authenticated');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        // Always allow page to load regardless of auth status
        setLoading(false);
      }
    };
    
    checkAuthStatus();
    
    // Set a timeout to hide loader even if auth check takes too long
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Wrap the content with the ClientLayoutWrapper to include navigation header
  return (
    <ClientLayoutWrapper>
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
    </ClientLayoutWrapper>
  );
} 