import { createClient } from '@/lib/supabase-server';
import { getJetShareOfferById } from '@/lib/services/jetshare';
import { redirect, notFound } from 'next/navigation';
import JetShareOfferDetail from '../../components/JetShareOfferDetail';

interface OfferDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (!user) {
    // If not logged in, redirect to sign-in
    redirect('/auth/signin?redirect=/jetshare/offer/' + params.id);
  }
  
  try {
    // Get the offer details directly from Supabase for better error handling
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `)
      .eq('id', params.id)
      .single();
    
    if (offerError || !offer) {
      console.error('Error fetching offer:', offerError);
      return notFound();
    }
    
    // Add a flag to indicate if the viewer is the offer creator
    const isCreator = offer.user_id === user.id;
    const isMatchedUser = offer.matched_user_id === user.id;
    
    // Check permissions - only the creator or matched user can view this page
    if (!isCreator && !isMatchedUser) {
      // If not the owner or matched user, redirect to dashboard
      console.log('User not authorized to view this offer:', {
        userId: user.id,
        offerUserId: offer.user_id,
        offerMatchedUserId: offer.matched_user_id
      });
      redirect('/jetshare/dashboard?error=unauthorized');
    }
    
    // If the offer is completed, redirect to the transaction page
    if (offer.status === 'completed') {
      redirect(`/jetshare/transaction/${params.id}`);
    }
    
    // If the offer is accepted, and the user is the matched user (not the creator),
    // redirect to the payment page
    if (offer.status === 'accepted' && isMatchedUser) {
      redirect(`/jetshare/payment/${params.id}`);
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <JetShareOfferDetail 
          offer={offer} 
          user={user} 
          isCreator={isCreator}
          isMatchedUser={isMatchedUser}
        />
      </div>
    );
  } catch (error) {
    console.error('Error in offer detail page:', error);
    // If offer not found, redirect to dashboard
    redirect('/jetshare/dashboard?error=offer-not-found');
  }
} 