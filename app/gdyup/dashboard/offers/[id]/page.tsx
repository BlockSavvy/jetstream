'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JetShareOfferWithUser, JetShareOfferStatus, JetSharePaymentStatus, JetSharePaymentMethod } from '@/types/jetshare';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, Clock, Check, ArrowRight, AlertCircle, Plane, Calendar, DollarSign, CreditCard, Bitcoin } from 'lucide-react';
import { toast } from 'sonner';

interface OfferDetailPageProps {
  params: {
    id: string;
  };
}

// Extend the JetShareOfferWithUser type to include payment fields
interface ExtendedJetShareOffer extends JetShareOfferWithUser {
  payment_status?: JetSharePaymentStatus;
  payment_method?: JetSharePaymentMethod;
}

export default function OfferDetailPage({ params }: OfferDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [offer, setOffer] = useState<ExtendedJetShareOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expirationTime, setExpirationTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    // If no user, redirect to auth
    if (!user && !isLoading) {
      router.push('/auth/login?returnUrl=' + encodeURIComponent(`/gdyup/dashboard/offers/${params.id}`));
      return;
    }
    
    const fetchOffer = async () => {
      setIsLoading(true);
      
      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('jetshare_offers')
          .select(`
            *,
            user:user_id (*),
            matched_user:matched_user_id (*)
          `)
          .eq('id', params.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Offer not found');
        }
        
        setOffer(data as ExtendedJetShareOffer);
        
        // If the offer has an expiration time, set it
        if (data.expires_at) {
          setExpirationTime(new Date(data.expires_at));
        }
        
      } catch (error) {
        console.error('Error fetching offer:', error);
        setError('Failed to load offer details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOffer();
  }, [params.id, router, user, isLoading]);
  
  // Update the time left for offers with an expiration
  useEffect(() => {
    if (!expirationTime) return;
    
    const updateTimeLeft = () => {
      const now = new Date();
      const difference = expirationTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }
      
      const minutes = Math.floor(difference / 60000);
      const seconds = Math.floor((difference % 60000) / 1000);
      
      setTimeLeft(`${minutes}m ${seconds}s`);
    };
    
    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [expirationTime]);
  
  const handleCompletePayment = () => {
    router.push(`/gdyup/payment/${params.id}`);
  };
  
  const handleViewBoardingPass = () => {
    router.push(`/gdyup/boardingpass/${params.id}`);
  };
  
  const handleViewMessages = () => {
    router.push(`/gdyup/messages?offer=${params.id}`);
  };
  
  const handleReturnToDashboard = () => {
    router.push('/gdyup/dashboard');
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading Offer...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !offer) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <CardTitle>Error Loading Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error || 'Offer not found'}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleReturnToDashboard} 
              autoFocus
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const isAcceptedButUnpaid = offer?.status === 'accepted_but_unpaid' as JetShareOfferStatus;
  const isPaid = offer?.status === 'completed' || offer?.status === 'paid' as JetShareOfferStatus || offer?.payment_status === 'paid';
  const isExpired = expirationTime && expirationTime < new Date();
  const isCreator = user?.id === offer?.user_id;
  const isPassenger = user?.id === offer?.matched_user_id;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader>
          <Button 
            variant="ghost" 
            className="mb-2 p-0" 
            onClick={handleReturnToDashboard}
          >
            ← Back to Dashboard
          </Button>
          <CardTitle className="font-bold text-xl">
            {offer.departure_location} → {offer.arrival_location}
          </CardTitle>
          <div className="text-muted-foreground">
            {format(new Date(offer.flight_date), 'MMMM d, yyyy')}
          </div>
          
          {/* Status indicator */}
          <div className={`mt-4 p-3 rounded-md ${
            isPaid ? 'bg-green-50 border border-green-200' :
            isAcceptedButUnpaid ? 'bg-amber-50 border border-amber-200' :
            isExpired ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center">
              {isPaid && <Check className="h-5 w-5 text-green-600 mr-2" />}
              {isAcceptedButUnpaid && <Clock className="h-5 w-5 text-amber-600 mr-2" />}
              {isExpired && <AlertCircle className="h-5 w-5 text-red-600 mr-2" />}
              {!isPaid && !isAcceptedButUnpaid && !isExpired && <Plane className="h-5 w-5 text-blue-600 mr-2" />}
              
              <span className="font-medium">
                {isPaid ? 'Payment Complete' :
                 isAcceptedButUnpaid ? 'Payment Required' :
                 isExpired ? 'Offer Expired' :
                 'Offer ' + offer.status}
              </span>
            </div>
            
            {isAcceptedButUnpaid && expirationTime && (
              <div className="mt-1 text-sm">
                <p className="text-amber-700">
                  {isExpired ? 
                    'This offer has expired. The seat is no longer reserved.' :
                    `Time remaining: ${timeLeft}`
                  }
                </p>
              </div>
            )}
            
            {isPaid && (
              <div className="mt-1 text-sm">
                <p className="text-green-700">
                  Your seat is confirmed. Access your boarding pass below.
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Flight Date</span>
              </div>
              <p className="font-medium">{format(new Date(offer.flight_date), 'MMMM d, yyyy')}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Price</span>
              </div>
              <p className="font-medium">${offer.requested_share_amount.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Payment method if paid */}
          {isPaid && (
            <div className="mt-2">
              <div className="flex items-center">
                {offer?.payment_method === 'btcpay' ? (
                  <Bitcoin className="h-4 w-4 mr-2 text-amber-500" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">Payment Method</span>
              </div>
              <p className="font-medium">
                {offer?.payment_method === 'btcpay' ? 'Bitcoin' : 'Credit Card'}
              </p>
            </div>
          )}
          
          {/* Aircraft model if available */}
          {offer.aircraft_model && (
            <div className="mt-2">
              <div className="flex items-center">
                <Plane className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Aircraft</span>
              </div>
              <p className="font-medium">{offer.aircraft_model}</p>
            </div>
          )}
          
          {/* Action buttons based on status */}
          <div className="space-y-3 mt-6">
            {isAcceptedButUnpaid && !isExpired && (
              <Button
                className="w-full"
                onClick={handleCompletePayment}
              >
                Complete Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {isPaid && (
              <>
                <Button
                  className="w-full"
                  onClick={handleViewBoardingPass}
                >
                  View Boarding Pass
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleViewMessages}
                >
                  Message {isCreator ? 'Passenger' : 'Jet Owner'}
                </Button>
              </>
            )}
            
            {isExpired && (
              <div className="text-center text-red-600 mb-4">
                This offer has expired. The seat is no longer reserved.
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleReturnToDashboard}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 