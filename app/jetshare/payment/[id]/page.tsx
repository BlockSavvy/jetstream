import React from 'react';
import { Suspense } from 'react';
import PaymentContent from './PaymentContent';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
  params: {
    id: string;
  };
}

// Page component is now a Server Component (no 'use client')
export default async function PaymentPage(props: PageProps) {
  // Simple access of params, no destructuring which causes the warning
  const offerId = props.params.id;

  // Perform initial server-side validation if needed
  if (!offerId || offerId === 'undefined' || offerId.length < 10) {
    console.error(`Invalid offer ID: ${offerId}`);
    notFound();
  }

  // Optional: Check if offer exists before rendering client component
  const supabase = await createClient();
  const { data: offerExists, error } = await supabase
    .from('jetshare_offers')
    .select('id')
    .eq('id', offerId)
    .maybeSingle();

  if (error || !offerExists) {
    console.error(`Server check failed for offer ${offerId}:`, error);
    notFound();
  }

  // Render the Client Component PaymentContent, passing the validated offerId as a prop
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