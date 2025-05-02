'use client';

import React, { useState, useEffect } from 'react';
import JetShareListingsContent from '../components/JetShareListingsContent';
import { Loader2, Plane } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';

export default function JetShareListingsPage() {
  const [loading, setLoading] = useState(true);
  
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
  
  return (
    <div className="min-h-screen bg-black gdyup-section">
      <main className="container mx-auto px-3 py-4 md:py-6">
        <h1 className="text-2xl font-bold mb-4 text-[#DAFF0D] drop-shadow-[0_0_10px_rgba(218,255,13,0.3)]">
          Browse Flight Shares
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 text-[#DAFF0D] animate-spin" />
          </div>
        ) : (
          <div>
            {/* Info Cards - condensed for mobile */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Card 1 */}
              <Card className="bg-black border-gray-800 hover:border-[#DAFF0D] transition-colors">
                <CardContent className="p-2 flex flex-col items-center text-center">
                  <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center mb-1 mt-1 border-2 border-[#DAFF0D] shadow-[0_0_10px_rgba(218,255,13,0.3)]">
                    <Plane className="h-4 w-4 text-[#DAFF0D]" />
                  </div>
                  <h3 className="font-bold text-white text-xs">Find Flights</h3>
                  <p className="text-white text-[10px] hidden md:block">
                    Browse available shared flights
                  </p>
                </CardContent>
              </Card>
              
              {/* Card 2 */}
              <Card className="bg-black border-gray-800 hover:border-[#DAFF0D] transition-colors">
                <CardContent className="p-2 flex flex-col items-center text-center">
                  <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center mb-1 mt-1 border-2 border-[#DAFF0D] shadow-[0_0_10px_rgba(218,255,13,0.3)]">
                    <svg className="h-4 w-4 text-[#DAFF0D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{filter: 'drop-shadow(0 0 3px rgba(218,255,13,0.6))'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white text-xs">Secure</h3>
                  <p className="text-white text-[10px] hidden md:block">
                    Fully verified flights
                  </p>
                </CardContent>
              </Card>
              
              {/* Card 3 */}
              <Card className="bg-black border-gray-800 hover:border-[#DAFF0D] transition-colors">
                <CardContent className="p-2 flex flex-col items-center text-center">
                  <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center mb-1 mt-1 border-2 border-[#DAFF0D] shadow-[0_0_10px_rgba(218,255,13,0.3)]">
                    <svg className="h-4 w-4 text-[#DAFF0D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{filter: 'drop-shadow(0 0 3px rgba(218,255,13,0.6))'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white text-xs">Instant</h3>
                  <p className="text-white text-[10px] hidden md:block">
                    Immediate booking
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* JetShare Listings Content */}
            <JetShareListingsContent />
          </div>
        )}
      </main>
    </div>
  );
} 