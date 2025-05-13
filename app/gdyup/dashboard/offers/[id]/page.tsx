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
import { useGdyupTheme } from '../../../hooks/useGdyupTheme';
import { cn } from '@/lib/utils';

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
  
  const { 
    getThemedTextClasses, 
    getThemedButtonClasses, 
    getThemedBackgroundClasses
  } = useGdyupTheme();
  
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
        <Card className={cn(
          getThemedBackgroundClasses('card'),
          "border border-gdyup-border"
        )}>
          <CardHeader>
            <CardTitle className={cn("text-center", getThemedTextClasses())}>Loading Offer...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-10">
              <Loader2 className={cn("h-12 w-12 animate-spin", getThemedTextClasses('primary'))} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !offer) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className={cn(
          getThemedBackgroundClasses('card'),
          "border border-gdyup-border"
        )}>
          <CardHeader className="text-center">
            <AlertCircle className={cn("h-10 w-10 mx-auto mb-4", getThemedTextClasses('destructive'))} />
            <CardTitle className={getThemedTextClasses()}>Error Loading Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-center mb-4", getThemedTextClasses('muted'))}>{error || 'Offer not found'}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className={cn("w-full", getThemedButtonClasses())}
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
      <Card className={cn(
        getThemedBackgroundClasses('card'),
        "border border-gdyup-border"
      )}>
        <CardHeader>
          <Button 
            variant="ghost" 
            className={cn("mb-2 p-0", getThemedButtonClasses('ghost'))} 
            onClick={handleReturnToDashboard}
          >
            ← Back to Dashboard
          </Button>
          <CardTitle className={cn("font-bold text-xl", getThemedTextClasses())}>
            {offer.departure_location} → {offer.arrival_location}
          </CardTitle>
          <div className={getThemedTextClasses('muted')}>
            {format(new Date(offer.flight_date), 'MMMM d, yyyy')}
          </div>
          
          {/* Status indicator */}
          <div className={cn(
            "mt-4 p-3 rounded-md",
            isPaid ? "border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900" :
            isAcceptedButUnpaid ? "border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900" :
            isExpired ? "border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900" :
            "border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900"
          )}>
            <div className="flex items-center">
              {isPaid && <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />}
              {isAcceptedButUnpaid && <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />}
              {isExpired && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />}
              {!isPaid && !isAcceptedButUnpaid && !isExpired && <Plane className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />}
              
              <span className={cn("font-medium", getThemedTextClasses())}>
                {isPaid ? 'Payment Complete' :
                 isAcceptedButUnpaid ? 'Payment Required' :
                 isExpired ? 'Offer Expired' :
                 'Offer ' + offer.status}
              </span>
            </div>
            
            {isAcceptedButUnpaid && expirationTime && (
              <div className="mt-1 text-sm">
                <p className={cn(
                  isExpired ? getThemedTextClasses('destructive') : getThemedTextClasses('secondary')
                )}>
                  {isExpired ? 
                    'This offer has expired. The seat is no longer reserved.' :
                    `Time remaining: ${timeLeft}`
                  }
                </p>
              </div>
            )}
            
            {isPaid && (
              <div className="mt-1 text-sm">
                <p className={getThemedTextClasses('success')}>
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
                <Calendar className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                <span className={cn("text-sm", getThemedTextClasses('muted'))}>Flight Date</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>{format(new Date(offer.flight_date), 'MMMM d, yyyy')}</p>
            </div>
            
            <div>
              <div className="flex items-center">
                <DollarSign className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                <span className={cn("text-sm", getThemedTextClasses('muted'))}>Price</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>${offer.requested_share_amount.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Payment method if paid */}
          {isPaid && (
            <div className="mt-2">
              <div className="flex items-center">
                {offer?.payment_method === 'btcpay' ? (
                  <Bitcoin className="h-4 w-4 mr-2 text-amber-500" />
                ) : (
                  <CreditCard className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                )}
                <span className={cn("text-sm", getThemedTextClasses('muted'))}>Payment Method</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>
                {offer?.payment_method === 'btcpay' ? 'Bitcoin' : 'Credit Card'}
              </p>
            </div>
          )}
          
          {/* Aircraft model if available */}
          {offer.aircraft_model && (
            <div className="mt-2">
              <div className="flex items-center">
                <Plane className={cn("h-4 w-4 mr-2", getThemedTextClasses('muted'))} />
                <span className={cn("text-sm", getThemedTextClasses('muted'))}>Aircraft</span>
              </div>
              <p className={cn("font-medium", getThemedTextClasses())}>{offer.aircraft_model}</p>
            </div>
          )}
          
          {/* Action buttons based on status */}
          <div className="space-y-3 mt-6">
            {isAcceptedButUnpaid && !isExpired && (
              <Button
                className={cn("w-full", getThemedButtonClasses())}
                onClick={handleCompletePayment}
              >
                Complete Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            
            {isPaid && (
              <>
                <Button
                  className={cn("w-full", getThemedButtonClasses())}
                  onClick={handleViewBoardingPass}
                >
                  View Boarding Pass
                </Button>
                <Button
                  variant="outline"
                  className={cn("w-full", getThemedButtonClasses('outline'))}
                  onClick={handleViewMessages}
                >
                  Message {isCreator ? 'Passenger' : 'Jet Owner'}
                </Button>
              </>
            )}
            
            {isExpired && (
              <div className={cn("text-center mb-4", getThemedTextClasses('destructive'))}>
                This offer has expired. The seat is no longer reserved.
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            className={cn("w-full", getThemedButtonClasses('outline'))}
            onClick={handleReturnToDashboard}
          >
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 