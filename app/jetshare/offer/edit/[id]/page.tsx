import { createClient } from '@/lib/supabase-server';
import { getJetShareOfferById } from '@/lib/services/jetshare';
import { redirect } from 'next/navigation';
import JetShareOfferEditForm from '@/app/jetshare/components/JetShareOfferEditForm';

interface EditOfferPageProps {
  params: {
    id: string;
  };
}

export default async function EditOfferPage({ params }: EditOfferPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // If not logged in, redirect to sign-in
    redirect('/auth/signin?redirect=/jetshare/offer/edit/' + params.id);
  }
  
  try {
    // Get the offer details
    const offer = await getJetShareOfferById(params.id);
    
    // Ensure the user is the owner and the offer is editable (open)
    if (offer.user_id !== user.id) {
      // If not the owner, redirect to dashboard
      redirect('/jetshare/dashboard?error=unauthorized');
    }
    
    if (offer.status !== 'open') {
      // If offer is not in open state, it cannot be edited
      redirect(`/jetshare/offer/${params.id}?error=not-editable`);
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Your JetShare Offer</h1>
        <JetShareOfferEditForm offer={offer} userId={user.id} />
      </div>
    );
  } catch (error) {
    // If offer not found, redirect to dashboard
    redirect('/jetshare/dashboard?error=offer-not-found');
  }
} 