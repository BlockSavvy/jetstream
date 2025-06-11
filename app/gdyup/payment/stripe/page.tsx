"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance } from '@stripe/stripe-js';
import PaymentConfirmation from '../../components/PaymentConfirmation';
import StripeTestHelper from '../../components/StripeTestHelper';
import { useEffect, useState } from 'react';

// Make sure to use the test mode publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Set appearance options for Stripe Elements
const appearance: Appearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#f5b13a',
  },
};

export default function StripePaymentPage({
  searchParams,
}: {
  searchParams: { intent: string; offer_id?: string };
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  // Validate the client secret
  useEffect(() => {
    console.log('Stripe payment page mount with params:', searchParams);
    
    if (!searchParams.intent) {
      console.error('No payment intent provided');
      redirect('/jetshare/dashboard');
    }
    
    // Extract payment intent ID from client secret
    if (searchParams.intent.includes('_secret_')) {
      const extractedId = searchParams.intent.split('_secret_')[0];
      console.log('Extracted payment intent ID:', extractedId);
      setPaymentIntentId(extractedId);
    } else {
      console.log('Using provided intent directly as ID:', searchParams.intent);
      setPaymentIntentId(searchParams.intent);
    }
    
    // Check if the intent looks like a valid client secret
    if (!searchParams.intent.includes('_secret_')) {
      console.error('Invalid client secret format');
      setError('Invalid payment information. Please try again.');
    } else {
      console.log('Client secret validated successfully');
      setIsLoading(false);
    }
    
    if (!searchParams.offer_id) {
      console.warn('No offer ID provided in URL parameters');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Payment Error</h2>
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.href = '/jetshare/dashboard'} 
            className="mt-4 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  // Prepare options for Stripe Elements
  const options = {
    clientSecret: searchParams.intent,
    appearance,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your JetShare Payment</h1>
        
        <Elements stripe={stripePromise} options={options}>
          <PaymentConfirmation clientSecret={searchParams.intent} />
        </Elements>
        
        {process.env.NODE_ENV !== 'production' && (
          <StripeTestHelper 
            offerId={searchParams.offer_id || ''} 
            paymentIntentId={paymentIntentId}
          />
        )}
        
        <div className="mt-8 text-center">
          <button 
            onClick={() => window.location.href = '/jetshare/dashboard'} 
            className="text-amber-600 hover:text-amber-800 text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 