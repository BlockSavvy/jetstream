import ClientRedirect from '../../../components/ClientRedirect';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';

interface RedirectPageProps {
  params: {
    id: string;
  };
  searchParams: {
    to?: string;
    t?: string;
  };
}

export default async function OfferRedirectPage({ params, searchParams }: RedirectPageProps) {
  const { id } = params;
  const { to, t = Date.now().toString() } = searchParams;
  
  // Keep a log of this redirect being used
  console.log(`Offer redirect page accessed: ID=${id}, to=${to || 'not specified'}`);
  
  // Validate that the offer exists before redirecting
  try {
    const supabase = await createClient();
    const { data: offer, error } = await supabase
      .from('jetshare_offers')
      .select('id, status')
      .eq('id', id)
      .single();
      
    if (error || !offer) {
      console.error(`Offer redirect failed: Offer ID ${id} not found. Error: ${error?.message || 'Record not found'}`);
      return notFound();
    }
    
    console.log(`Offer redirect verified: ID=${id}, status=${offer.status}`);
    
    // Determine where to redirect based on the 'to' parameter or offer status
    let redirectUrl = '';
    
    if (to === 'payment') {
      // Explicit redirect to payment
      redirectUrl = `/gdyup/payment/${id}?t=${t}&from=redirect`;
    } else if (to === 'view') {
      // Explicit redirect to offer view
      redirectUrl = `/gdyup/offer/${id}?t=${t}&from=redirect`;
    } else if (to === 'dashboard') {
      // Redirect to dashboard
      redirectUrl = `/gdyup/dashboard?highlight=${id}&t=${t}`;
    } else {
      // Automatic redirect based on offer status
      switch (offer.status) {
        case 'accepted':
          redirectUrl = `/gdyup/payment/${id}?t=${t}&from=auto_redirect`;
          break;
        case 'completed':
          redirectUrl = `/gdyup/transaction/${id}?t=${t}&from=auto_redirect`;
          break;
        default:
          redirectUrl = `/gdyup/offer/${id}?t=${t}&from=auto_redirect`;
          break;
      }
    }
    
    console.log(`Redirecting to: ${redirectUrl}`);
    
    return (
      <ClientRedirect url={redirectUrl} />
    );
  } catch (error) {
    console.error('Error in offer redirect page:', error);
    
    // Fallback to a safe redirect
    return (
      <ClientRedirect url={`/gdyup/dashboard?error=redirect_failed&offer_id=${id}&t=${t}`} />
    );
  }
} 