import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import JetSharePaymentForm from '../../components/JetSharePaymentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  // Get the offer ID from URL params
  const { id } = params;
  
  if (!id) {
    return (
      <ErrorDisplay 
        title="Missing Offer ID" 
        message="No offer ID was provided. Please return to the dashboard and try again."
      />
    );
  }
  
  // Initialize Supabase client
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    // Redirect to login if not authenticated
    return redirect('/auth/signin?redirect=/jetshare/payment/' + id);
  }
  
  // Fetch the offer directly from database
  const { data: offer, error: offerError } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (id, email, first_name, last_name),
      matched_user:matched_user_id (id, email, first_name, last_name)
    `)
    .eq('id', id)
    .single();
  
  // Handle database errors
  if (offerError) {
    console.error('Database error fetching offer:', offerError);
    return (
      <ErrorDisplay 
        title="Database Error" 
        message="There was an error fetching the offer details. Please try again later."
      />
    );
  }
  
  // Handle case where offer doesn't exist
  if (!offer) {
    return (
      <ErrorDisplay 
        title="Offer Not Found" 
        message="The requested offer could not be found. It may have been removed or completed."
      />
    );
  }
  
  // Check if the user is authorized to view this payment page
  const userIsCreator = offer.user_id === user.id;
  let userIsMatched = offer.matched_user_id === user.id;
  const offerIsOpen = offer.status === 'open';
  
  // If user is the creator, they shouldn't pay - show appropriate message
  if (userIsCreator) {
    return (
      <ErrorDisplay 
        title="Awaiting Payment" 
        message="As the creator of this offer, you don't need to make a payment. Wait for someone to accept and pay for your offer."
        returnUrl="/jetshare/dashboard?tab=offers"
        returnText="Return to Your Offers"
      />
    );
  }
  
  // If offer is completed, show appropriate message
  if (offer.status === 'completed') {
    return (
      <ErrorDisplay 
        title="Already Paid" 
        message="This offer has already been paid for. You can view the details in your transactions."
        returnUrl="/jetshare/dashboard?tab=transactions"
        returnText="View Transactions"
      />
    );
  }
  
  // If offer is open or user is matched, proceed to accept/update the offer
  if (offerIsOpen || userIsMatched) {
    // If offer is open and user is not matched, update the offer
    if (offerIsOpen && !userIsMatched) {
      try {
        console.log('Attempting to update offer status to accepted with user as matched user...');
        
        // Add logging of user and offer details
        console.log('User details:', {
          id: user.id,
          email: user.email || 'no email'
        });
        
        console.log('Offer details before update:', {
          id: offer.id,
          status: offer.status,
          user_id: offer.user_id,
          matched_user_id: offer.matched_user_id || 'none'
        });
        
        // Update offer to accepted with this user as matched user
        const { error: updateError } = await supabase
          .from('jetshare_offers')
          .update({ 
            status: 'accepted',
            matched_user_id: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('status', 'open'); // Only update if still open
        
        if (updateError) {
          console.error('Error updating offer:', updateError);
          
          // Check if the offer is still available or if it was taken by someone else
          const { data: checkOffer } = await supabase
            .from('jetshare_offers')
            .select('status, matched_user_id, user_id')
            .eq('id', id)
            .single();
          
          console.log('Current offer state after failed update:', checkOffer);
          
          if (checkOffer?.matched_user_id && checkOffer.matched_user_id !== user.id) {
            console.error('Offer was taken by another user:', checkOffer.matched_user_id);
            return (
              <ErrorDisplay 
                title="Offer No Longer Available" 
                message="This offer has been accepted by another user while you were browsing. Please check other available offers."
                returnUrl="/jetshare/listings"
                returnText="Return to Listings"
              />
            );
          }
          
          // If the offer was already accepted by this user, that's fine
          if (checkOffer?.status === 'accepted' && checkOffer.matched_user_id === user.id) {
            console.log('Offer was already accepted by this user, continuing with payment');
            userIsMatched = true;
          }
        } else {
          console.log('Successfully updated offer to accepted state');
          userIsMatched = true;
          
          // Refresh the offer data after update
          const { data: refreshedOffer } = await supabase
            .from('jetshare_offers')
            .select(`
              *,
              user:user_id (id, email, first_name, last_name),
              matched_user:matched_user_id (id, email, first_name, last_name)
            `)
            .eq('id', id)
            .single();
            
          if (refreshedOffer) {
            console.log('Refreshed offer data after update:', {
              id: refreshedOffer.id,
              status: refreshedOffer.status,
              matched_user_id: refreshedOffer.matched_user_id || 'none'
            });
            Object.assign(offer, refreshedOffer); // Update the offer object
          }
        }
      } catch (updateError) {
        console.error('Exception during offer update:', updateError);
      }
    }
    
    // Now display the payment form
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
        <JetSharePaymentForm offer={offer} user={user} />
      </div>
    );
  }
  
  // If we reach here, user is not authorized
  return (
    <ErrorDisplay 
      title="Not Authorized" 
      message="You are not authorized to view this payment page. This may be because the offer is no longer available or has been accepted by another user."
      returnUrl="/jetshare/listings"
      returnText="Browse Available Offers"
    />
  );
}

// Helper component to display error messages
function ErrorDisplay({ 
  title, 
  message, 
  returnUrl = "/jetshare/dashboard", 
  returnText = "Return to Dashboard" 
}: { 
  title: string, 
  message: string, 
  returnUrl?: string, 
  returnText?: string 
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="text-red-600 h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-center">{title}</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href={returnUrl}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {returnText}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 