import React from 'react';
import TransactionClient from '@/app/jetshare/components/TransactionClient';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { JetShareTransaction, JetShareOfferWithUser } from '@/types/jetshare';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

interface TransactionPageProps {
  params: {
    id: string;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

export default async function TransactionPage({ params, searchParams }: TransactionPageProps) {
  // Wait for params to be available (fixes Next.js error)
  const id = await Promise.resolve(params.id);
  
  if (!id) {
    return notFound();
  }

  // Get cookies and detect post-payment state
  const cookieStore = await cookies();
  const hasPendingPaymentCookie = cookieStore.has('pending_payment_offer_id');
  
  // Await searchParams to fix Next.js error
  const searchParamsResolved = await Promise.resolve(searchParams);
  
  // Check for test mode from URL parameters only
  // Never set test mode for real transactions
  const isExplicitTestMode = 
    (searchParamsResolved?.test === 'true' || 
     searchParamsResolved?.test_mode === 'true');
  
  // Check if this is a post-payment view
  const isPostPayment = 
    searchParamsResolved?.from === 'payment' || 
    searchParamsResolved?.payment_complete === 'true';
  
  // Create server client
  const supabase = await createClient();
  
  try {
    // Get transaction data from API
    const { data: transactionData, error: transactionError } = await supabase
      .from('jetshare_transactions')
      .select(`
        *,
        offer:offer_id(*)
      `)
      .eq('offer_id', id)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    // Get authenticated user (if available)
    const { data: userData } = await supabase.auth.getUser();
    const hasUserAuth = !!userData?.user;
      
    // Handle error cases with appropriate fallbacks
    if (transactionError) {
      console.error('Error fetching transaction:', transactionError);
      
      // Only allow test mode if explicitly requested
      if (isExplicitTestMode) {
        console.log('Explicit test mode active, proceeding with dummy data');
        
        // Create dummy offer data to satisfy type constraints
        const dummyOffer: JetShareOfferWithUser = {
          id: id,
          user_id: 'test-user-2',
          flight_date: new Date().toISOString(),
          departure_location: 'Test Origin',
          arrival_location: 'Test Destination',
          total_flight_cost: 10000,
          requested_share_amount: 5000,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'test-user-2',
            email: 'test@example.com'
          }
        };
        
        // Create minimal dummy data for test mode
        const dummyTransaction = {
          id: `test-txn-${Date.now()}`,
          offer_id: id,
          amount: 5000,
          handling_fee: 0,
          payment_method: 'fiat',
          payment_status: 'completed',
          transaction_date: new Date().toISOString(),
          payer_user_id: 'test-user',
          recipient_user_id: 'test-user-2'
        };
        
        console.log('Using test mode transaction data');
        
        return (
          <TransactionClient 
            transactions={[dummyTransaction as any]} 
            offer={dummyOffer}
            user={userData?.user || undefined}
            isOriginalOfferer={false}
            isTestMode={true}
          />
        );
      }
      
      // Handle post-payment flow specially
      if (isPostPayment || hasPendingPaymentCookie) {
        console.log('Post-payment flow detected, showing transaction page without auth requirement');
        
        // Create dummy offer data to satisfy type constraints
        const dummyOffer: JetShareOfferWithUser = {
          id: id,
          user_id: 'pending-user',
          flight_date: new Date().toISOString(),
          departure_location: 'Payment Origin',
          arrival_location: 'Payment Destination',
          total_flight_cost: 0,
          requested_share_amount: 0,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'pending-user',
            email: 'pending@example.com'
          }
        };
        
        // For post-payment flows, create a simple transaction record to avoid auth errors
        const paymentTransaction = {
          id: `temp-txn-${Date.now()}`,
          offer_id: id,
          amount: 0,
          handling_fee: 0,
          payment_method: 'fiat',
          payment_status: 'pending',
          transaction_date: new Date().toISOString(),
          payer_user_id: '',
          recipient_user_id: ''
        };
        
        return (
          <TransactionClient 
            transactions={[paymentTransaction as any]}
            offer={dummyOffer}
            user={userData?.user || undefined}
            isOriginalOfferer={false}
            isTestMode={false}
          />
        );
      }
      
      return notFound();
    }
    
    // If no transaction was found but we're in certain states
    if (!transactionData) {
      // Only allow test mode if explicitly requested or for post-payment
      if (isExplicitTestMode || isPostPayment) {
        console.log('No transaction found, but allowing explicit test/post-payment mode');
        
        // Create dummy offer data to satisfy type constraints
        const dummyOffer: JetShareOfferWithUser = {
          id: id,
          user_id: 'test-user-2',
          flight_date: new Date().toISOString(),
          departure_location: 'Test Origin',
          arrival_location: 'Test Destination',
          total_flight_cost: 10000,
          requested_share_amount: 5000,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'test-user-2',
            email: 'test@example.com'
          }
        };
        
        const dummyTransaction = {
          id: `test-txn-${Date.now()}`,
          offer_id: id,
          amount: 5000,
          handling_fee: 0,
          payment_method: 'fiat',
          payment_status: 'completed',
          transaction_date: new Date().toISOString(),
          payer_user_id: 'test-user',
          recipient_user_id: 'test-user-2'
        };
        
        return (
          <TransactionClient 
            transactions={[dummyTransaction as any]}
            offer={dummyOffer}
            user={userData?.user || undefined}
            isOriginalOfferer={false}
            isTestMode={isExplicitTestMode}
          />
        );
      }
      
      return notFound();
    }
    
    console.log(hasUserAuth ? `Authenticated as user: ${userData.user.id}` : 'No authenticated user');
    
    // Special case: Allow viewing transaction page after payment even if not authenticated
    if (!hasUserAuth && (isPostPayment || hasPendingPaymentCookie || isExplicitTestMode)) {
      console.log('No authenticated user but allowing access due to special conditions');
    } else if (!hasUserAuth) {
      // For normal cases where auth is required but missing
      console.log('No authenticated user, redirecting to login');
      // We'll let the client component handle the redirect
    }
    
    // Check if the current user is the original offerer
    const isOriginalOfferer = hasUserAuth && transactionData.offer ? 
      userData.user.id === transactionData.offer.user_id : 
      false;
    
    // Pass data to client component - NEVER show test mode for real transactions
    return (
      <TransactionClient 
        transactions={[transactionData]} 
        offer={transactionData.offer as JetShareOfferWithUser}
        user={userData?.user || undefined}
        isOriginalOfferer={isOriginalOfferer}
        isTestMode={false}
      />
    );
  } catch (error) {
    console.error('Error in transaction page:', error);
    
    // For explicit test mode, still show the page
    if (isExplicitTestMode) {
      console.log('Error in transaction page but showing test view');
      
      // Create dummy offer data to satisfy type constraints
      const dummyOffer: JetShareOfferWithUser = {
        id: id,
        user_id: 'test-user-2',
        flight_date: new Date().toISOString(),
        departure_location: 'Error Origin',
        arrival_location: 'Error Destination',
        total_flight_cost: 10000,
        requested_share_amount: 5000,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: 'test-user-2',
          email: 'test@example.com'
        }
      };
      
      const dummyTransaction = {
        id: `test-txn-error-${Date.now()}`,
        offer_id: id,
        amount: 5000,
        handling_fee: 0,
        payment_method: 'fiat',
        payment_status: 'pending',
        transaction_date: new Date().toISOString(),
        payer_user_id: 'test-user',
        recipient_user_id: 'test-user-2'
      };
      
      return (
        <TransactionClient 
          transactions={[dummyTransaction as any]}
          offer={dummyOffer}
          user={{} as User}
          isOriginalOfferer={false}
          isTestMode={true}
        />
      );
    }
    
    return notFound();
  }
} 