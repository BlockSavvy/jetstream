import React from 'react';
import { Suspense } from 'react';
import PaymentContent from './PaymentContent';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientIdParams } from '@/lib/types/route-types'

// Page component is now a Server Component (no 'use client')
export default function JetSharePaymentPage({ params }: ClientIdParams) {
  const offerId = params?.id;
  
  // Handle server-side validation
  if (!offerId || offerId === 'undefined' || offerId.length < 10) {
    console.error(`Invalid offer ID: ${offerId}`);
    notFound();
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