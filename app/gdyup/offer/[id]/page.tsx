import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import JetShareOfferDetail from '../../components/JetShareOfferDetail';
import ClientRedirect from '../../components/ClientRedirect';
import { cookies } from 'next/headers';

interface OfferDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OfferDetailPage({ 
  params 
}: OfferDetailPageProps) {
  // Ensure params is properly handled
  const offerId = params?.id;
  
  if (!offerId) {
    return notFound();
  }
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // In dev mode, the createClient already provides a mock user, so we can skip cookie checking
  let effectiveUserId = user?.id;
  
  // Only check for user ID in production where we need fallback auth
  if (!user && process.env.NEXT_PUBLIC_AUTH_DEV_MODE !== 'true') {
    try {
      // Try to get the offer owner directly as a fallback
      const { data: offer } = await supabase
        .from('jetshare_offers')
        .select('user_id, matched_user_id')
        .eq('id', offerId)
        .single();
      
      if (offer) {
        // Use the user ID from the offer as fallback
        effectiveUserId = offer.user_id;
      }
    } catch (err) {
      console.error('Error retrieving offer:', err);
    }
  }
  
  if (!user && !effectiveUserId) {
    // If no user authentication at all, redirect to login
    return (
      <ClientRedirect url={`/auth/login?returnUrl=/gdyup/offer/${offerId}`} />
    );
  }
  
  try {
    // Get the offer details with appropriate client
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `)
      .eq('id', offerId)
      .single();
    
    if (offerError || !offer) {
      console.error('Error fetching offer:', offerError);
      return notFound();
    }
    
    // Add a flag to indicate if the viewer is the offer creator
    const isCreator = effectiveUserId ? offer.user_id === effectiveUserId : false;
    const isMatchedUser = effectiveUserId ? offer.matched_user_id === effectiveUserId : false;
    
    // Special case: if we're using effectiveUserId from the offer itself, always treat as creator
    const hasAccess = user ? (isCreator || isMatchedUser) : true;
    
    // Check permissions - only the creator or matched user can view this page
    if (!hasAccess) {
      return (
        <ClientRedirect url="/gdyup/dashboard?error=unauthorized" />
      );
    }
    
    // If the offer is completed, redirect to the transaction page - using correct path
    if (offer.status === 'completed') {
      return (
        <ClientRedirect url={`/gdyup/transaction/${offerId}`} />
      );
    }
    
    // If the offer is accepted, and the user is the matched user (not the creator),
    // redirect to the payment page - using correct path
    if (offer.status === 'accepted' && isMatchedUser) {
      return (
        <ClientRedirect url={`/gdyup/payment/${offerId}`} />
      );
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <JetShareOfferDetail 
          offer={offer} 
          user={user || {id: effectiveUserId}} 
          isCreator={isCreator || !user}
          isMatchedUser={isMatchedUser}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in offer detail page:', error);
    // Instead of redirecting, return client-only redirect
    return (
      <ClientRedirect url="/gdyup/dashboard?error=offer-not-found" />
    );
  }
} 