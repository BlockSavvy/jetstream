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
  const { id } = params;

  if (!id) {
    return (
      <ErrorDisplay 
        title="Missing Offer ID" 
        message="No offer ID was provided. Please return to the dashboard and try again."
      />
    );
  }
  
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return redirect('/auth/signin?redirect=/jetshare/payment/' + id);
  }
  
  console.log(`PaymentPage: Fetching offer details for ID: ${id}`);
  const { data: offer, error: offerError } = await supabase
    .from('jetshare_offers')
    .select(`
      *,
      user:user_id (id, email, first_name, last_name),
      matched_user:matched_user_id (id, email, first_name, last_name)
    `)
    .eq('id', id)
    .single();
  
  if (offerError) {
    console.error('Database error fetching offer:', offerError);
    return (
      <ErrorDisplay 
        title="Database Error" 
        message="There was an error fetching the offer details. Please try again later."
      />
    );
  }
  
  if (!offer) {
    return (
      <ErrorDisplay 
        title="Offer Not Found" 
        message="The requested offer could not be found. It may have been removed or completed."
      />
    );
  }
  
  console.log(`PaymentPage: Offer data fetched. Status: ${offer.status}, Matched User: ${offer.matched_user_id}`);
  
  const userIsCreator = offer.user_id === user.id;
  const userIsMatched = offer.matched_user_id === user.id;
  const offerIsAccepted = offer.status === 'accepted';
  const offerIsCompleted = offer.status === 'completed';
  
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
  
  if (offerIsCompleted) {
    return (
      <ErrorDisplay 
        title="Already Paid" 
        message="This offer has already been paid for. You can view the details in your transactions."
        returnUrl="/jetshare/dashboard?tab=transactions"
        returnText="View Transactions"
      />
    );
  }
  
  if (offerIsAccepted && userIsMatched) {
    console.log(`PaymentPage: Offer ${id} is accepted and user ${user.id} is matched. Proceeding to payment form.`);
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
        <JetSharePaymentForm offer={offer} user={user} />
      </div>
    );
  } else {
    console.warn(`PaymentPage: Cannot proceed. Offer Status: ${offer.status}, User Matched: ${userIsMatched}`);
    let title = "Payment Not Available";
    let message = "Payment cannot be completed for this offer at this time.";
    let returnUrl = "/jetshare/listings";
    let returnText = "Browse Available Offers";

    if (!offerIsAccepted) {
      message = `The offer status is currently '${offer.status}'. Payment can only be made once an offer is accepted.`;
    } else if (!userIsMatched) {
      message = "You are not the user who accepted this offer. Payment cannot be completed.";
      returnUrl = "/jetshare/dashboard?tab=bookings";
      returnText = "Return to Your Bookings";
    }

    return (
      <ErrorDisplay 
        title={title}
        message={message}
        returnUrl={returnUrl}
        returnText={returnText}
      />
    );
  }
}

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