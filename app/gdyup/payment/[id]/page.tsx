import React from 'react';
import { Suspense } from 'react';
import PaymentContent from './PaymentContent';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientIdParams } from '@/lib/types/route-types'

// Page component is now a Server Component (no 'use client')
export default async function JetSharePaymentPage({ params }: ClientIdParams) {
  // Await the params to properly handle dynamic route parameters
  const { id } = params;
  const offerId = id;
  
  // Add detailed logging for debugging
  console.log(`Payment page accessed for offer ID: ${offerId}`);
  
  // Handle server-side validation with more detailed error messages
  if (!offerId || offerId === 'undefined' || offerId.length < 10) {
    console.error(`Invalid offer ID format: ${offerId} - does not meet minimum requirements`);
    // Return a more graceful 404 rather than crashing
    return notFound();
  }

  // Additional validation - attempt to check if the offer exists
  try {
    const supabase = await createClient();
    const { data: offer, error } = await supabase
      .from('jetshare_offers')
      .select('id')
      .eq('id', offerId)
      .single();
      
    if (error || !offer) {
      console.error(`Offer ID ${offerId} not found in database: ${error?.message || 'Record not found'}`);
      // If offer doesn't exist, return not found
      return notFound();
    }
    
    console.log(`Offer ID ${offerId} validated, proceeding to payment`);
  } catch (err) {
    console.error(`Error validating offer ID ${offerId}:`, err);
    // In case of any other error, allow the client to handle it
    // This prevents unnecessary 404s when we can't check the database
  }

  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading Payment Details...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentContent offerId={offerId} />
    </Suspense>
  );
} 