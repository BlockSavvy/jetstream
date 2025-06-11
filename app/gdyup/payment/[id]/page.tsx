import React from 'react';
import { Suspense } from 'react';
import PaymentContent from './PaymentContent';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientIdParams } from '@/lib/types/route-types';
import { cn } from '@/lib/utils';

// Page component is now a Server Component (no 'use client')
export default function GdyupPaymentPage({ params }: ClientIdParams) {
  // Get the params to properly handle dynamic route parameters
  const { id } = params;
  const offerId = id;
  
  // Add detailed logging for debugging
  console.log(`Payment page accessed for offer ID: ${offerId}`);
  
  // Handle server-side validation with more detailed error messages
  if (!offerId || offerId === 'undefined' || offerId.length < 10) {
    console.error(`Invalid offer ID format: ${offerId} - does not meet minimum requirements`);
    // Return a more user-friendly error instead of notFound()
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-red-800 bg-red-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-red-500">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error - Invalid Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 mb-4">
              The payment request contains an invalid or missing offer ID. Please try selecting a flight again from the listings page.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              variant="default"
              onClick={() => window.location.href = "/gdyup/listings"}
            >
              Browse Available Flights
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-gdyup-border bg-gdyup-bg-card">
          <CardHeader>
            <CardTitle className="text-center text-gdyup-text">Loading Payment Details...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-gdyup-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentContent offerId={offerId} />
    </Suspense>
  );
} 