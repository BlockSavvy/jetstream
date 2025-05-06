import React from 'react';
import { Suspense } from 'react';
import PaymentContent from './PaymentContent';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientIdParams } from '@/lib/types/route-types';

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
    // Return a more user-friendly error instead of notFound()
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border border-red-800 bg-red-900/20">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = "/gdyup/listings"}
            >
              Browse Available Flights
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Additional validation - attempt to check if the offer exists
  try {
    const supabase = await createClient();
    const { data: offer, error } = await supabase
      .from('jetshare_offers')
      .select('id, status, matched_user_id')
      .eq('id', offerId)
      .single();
      
    if (error) {
      console.error(`Database error for offer ID ${offerId}: ${error.message}`);
      // Continue to client component - it will handle errors with more context
    } else if (!offer) {
      console.error(`Offer ID ${offerId} not found in database`);
      // Return a more user-friendly error
      return (
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card className="border border-red-800 bg-red-900/20">
            <CardHeader>
              <CardTitle className="flex items-center text-red-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                Offer Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 mb-4">
                We couldn't find the flight offer you're looking for. It may have expired or been removed.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => window.location.href = "/gdyup/listings"}
              >
                Browse Available Flights
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    } else if (offer.status === 'completed' || offer.status === 'paid') {
      console.log(`Offer ID ${offerId} is already paid, redirecting to boarding pass`);
      // Redirect to boarding pass directly - this is a more helpful UX
      return (
        <div className="container mx-auto px-4 py-12 max-w-md">
          <Card className="border border-green-800 bg-green-900/20">
            <CardHeader>
              <CardTitle className="flex items-center text-green-500">
                Payment Already Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 mb-4">
                This flight has already been paid for. You can view your boarding pass now.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = `/gdyup/boardingpass/${offerId}`}
              >
                View Boarding Pass
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
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