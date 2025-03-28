import { createClient } from '@/lib/supabase-server';
import { redirect, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Plane, Download, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import TransactionClient from '@/app/jetshare/components/TransactionClient';

interface TransactionPageProps {
  params: { id: string };
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const { id } = params;

  if (!id) {
    return notFound();
  }

  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/signin?redirect=/jetshare/transaction/' + id);
  }
  
  // First get the offer details
  const { data: offer, error: offerError } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (*),
      matched_user:matched_user_id (*)
    `)
    .eq('id', id)
    .single();
    
  if (offerError || !offer) {
    console.error('Error fetching offer:', offerError);
    return notFound();
  }
  
  // Check if the user is authorized to view this transaction
  if (offer.user_id !== user.id && offer.matched_user_id !== user.id) {
    console.error('User not authorized to view this transaction:', user.id);
    redirect('/jetshare/dashboard?error=not-authorized');
  }
  
  // Only allow viewing completed transactions
  if (offer.status !== 'completed') {
    redirect(`/jetshare/offer/${id}`);
  }
  
  // Get the transaction details
  const { data: transactions, error: txError } = await supabase
    .from('jetshare_transactions')
    .select(`
      *,
      payer:payer_user_id (*),
      recipient:recipient_user_id (*)
    `)
    .eq('offer_id', id)
    .eq('payment_status', 'completed')
    .order('transaction_date', { ascending: false });
    
  if (txError) {
    console.error('Error fetching transactions:', txError);
  }
  
  // Now pass the data to the client component
  return (
    <TransactionClient 
      offer={offer} 
      transactions={transactions || []} 
      user={user}
      isOriginalOfferer={user.id === offer.user_id}
    />
  );
} 