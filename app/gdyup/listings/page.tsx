'use client';

import { useEffect, useState } from 'react';
import JetShareListingsContent from '../components/JetShareListingsContent';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export default function JetShareListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for a pending offer after login
  useEffect(() => {
    // Only run this once auth is loaded and user is authenticated
    if (!authLoading && user) {
      try {
        const pendingOfferId = sessionStorage.getItem('jetshare_pending_offer');
        if (pendingOfferId) {
          console.log('Found pending offer after login:', pendingOfferId);
          // Clear it from session storage
          sessionStorage.removeItem('jetshare_pending_offer');
          
          // This will trigger a confirmation dialog in the JetShareListingsContent component
          sessionStorage.setItem('jetshare_resume_offer_acceptance', pendingOfferId);
        }
      } catch (e) {
        console.warn('Could not access sessionStorage:', e);
      }
    }
  }, [user, authLoading]);
  
  // After auth is determined, finish loading
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
      
      // Log user state for debugging (don't throw errors)
      if (user) {
        console.log('User authenticated for JetShare listings:', user.id, user.email);
      } else {
        console.log('No authenticated user for JetShare listings, allowing public access');
      }
    }
  }, [user, authLoading]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 gdyup-title">Find Available Flight Shares</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="gdyup-card bg-gray-900 border-[#DAFF0D]">
          <CardHeader>
            <CardTitle className="text-white">Find Your Perfect Flight Share</CardTitle>
            <CardDescription className="text-gray-100">Browse available flight shares and connect with fellow travelers.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">Use filters and search to find the ideal flight share that matches your travel plans.</p>
          </CardContent>
        </Card>

        <Card className="gdyup-card bg-gray-900 border-[#DAFF0D]">
          <CardHeader>
            <CardTitle className="text-white">Secure Booking</CardTitle>
            <CardDescription className="text-gray-100">Safe and transparent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">Book with confidence using our secure payment system and verified user profiles.</p>
          </CardContent>
        </Card>

        <Card className="gdyup-card bg-gray-900 border-[#DAFF0D]">
          <CardHeader>
            <CardTitle className="text-white">Instant Confirmation</CardTitle>
            <CardDescription className="text-gray-100">Quick and seamless process.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200">Get instant confirmation and connect with the flight organizer right away.</p>
          </CardContent>
        </Card>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#DAFF0D]" />
          <span className="ml-3 text-lg text-gray-100">Loading flight listings...</span>
        </div>
      ) : (
        <JetShareListingsContent />
      )}
    </div>
  );
} 