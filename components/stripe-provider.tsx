'use client';

import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Get the stripe key from env
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Only initialize Stripe if we have a valid key
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface StripeProviderProps {
  children: ReactNode;
  options?: any;
}

/**
 * Provider component that wraps the app with Stripe Elements
 * This should be used sparingly and only in components that actually need Stripe functionality
 */
export function StripeProvider({ children, options = {} }: StripeProviderProps) {
  // If Stripe isn't initialized, just render children without the Stripe wrapper
  if (!stripePromise) {
    console.warn('Stripe publishable key not found. Stripe functionality will be disabled.');
    return <>{children}</>;
  }
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
} 