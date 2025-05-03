'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plane, Calendar, AlertCircle, Download, ArrowLeft, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BoardingPassPageProps {
  params: {
    id: string;
  };
}

export default function BoardingPassPage({ params }: BoardingPassPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offerData, setOfferData] = useState<any>(null);
  const [boardingPassData, setBoardingPassData] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        if (!user) {
          // If no user, redirect to login
          router.push(`/auth/login?returnUrl=${encodeURIComponent(`/gdyup/boardingpass/${params.id}`)}`);
          return;
        }
        
        const supabase = createClient();
        
        // First fetch the offer
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
          throw new Error('Offer not found');
        }
        
        // Check if the user has access to this offer
        if (offer.user_id !== user.id && offer.matched_user_id !== user.id) {
          throw new Error('You do not have access to this boarding pass');
        }
        
        // Check if the offer is paid
        if (offer.status !== 'completed' && offer.status !== 'paid' && offer.payment_status !== 'paid') {
          throw new Error('Booking is not complete - payment required');
        }
        
        setOfferData(offer);
        
        // Check if there's a boarding pass already
        const { data: boardingPass, error: boardingPassError } = await supabase
          .from('jetshare_tickets')
          .select('*')
          .eq('offer_id', params.id)
          .eq('user_id', user.id)
          .single();
          
        if (boardingPass) {
          setBoardingPassData(boardingPass);
        } else {
          // Generate a boarding pass
          // In a real app, this would be a more complex process with seat assignment
          const seatNumber = user.id === offer.user_id ? '1A' : '1B';
          const ticketCode = `JS-${Math.floor(1000 + Math.random() * 9000)}`;
          
          const newBoardingPass = {
            offer_id: params.id,
            user_id: user.id,
            passenger_name: user.user_metadata?.full_name || 'GDY·UP Traveler',
            ticket_code: ticketCode,
            seat_number: seatNumber,
            boarding_time: new Date(offer.flight_date).toISOString(),
            gate: `A${Math.floor(1 + Math.random() * 20)}`,
            status: 'active',
            created_at: new Date().toISOString(),
            metadata: {
              departure_location: offer.departure_location,
              arrival_location: offer.arrival_location,
              flight_date: offer.flight_date,
              aircraft_model: offer.aircraft_model
            }
          };
          
          const { data: insertedPass, error: insertError } = await supabase
            .from('jetshare_tickets')
            .insert([newBoardingPass])
            .select()
            .single();
            
          if (insertError) {
            console.error('Error creating boarding pass:', insertError);
            // Continue with the data we have
            setBoardingPassData(newBoardingPass);
          } else {
            setBoardingPassData(insertedPass);
          }
        }
        
      } catch (error) {
        console.error('Error loading boarding pass:', error);
        setError(error instanceof Error ? error.message : 'Failed to load boarding pass');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id, router, user]);
  
  const handleDownloadPass = () => {
    toast.info('Boarding pass download will be available soon');
    // In a real implementation, this would generate a downloadable boarding pass
  };
  
  const handleAppleWallet = () => {
    toast.info('Apple Wallet integration coming soon');
    // In a real implementation, this would create a .pkpass file
  };
  
  const handleGoBack = () => {
    router.push('/gdyup/dashboard');
  };
  
  const handleSeatSelection = () => {
    toast.info('Seat selection is coming soon!');
    // Future feature for selecting seats
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading Boarding Pass...</CardTitle>
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
  
  if (error || !offerData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <CardTitle>Error Loading Boarding Pass</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleGoBack}
            >
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Button 
        variant="ghost" 
        className="mb-4 p-0" 
        onClick={handleGoBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <Card className="border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-950 overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500 transform rotate-45 translate-x-8 -translate-y-8"></div>
        
        <CardHeader className="pb-2 relative">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">Boarding Pass</CardTitle>
              <p className="text-sm text-muted-foreground">GDY·UP Private Jet</p>
            </div>
            <Plane className="h-8 w-8 text-amber-500" />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold tracking-wide text-amber-600">{boardingPassData?.ticket_code || 'GDY-0000'}</p>
          </div>
        </CardHeader>
        
        <CardContent className="pb-0">
          <div className="mb-6">
            <div className="flex items-center justify-between my-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="text-lg font-semibold">{offerData.departure_location}</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full border-t border-dashed border-amber-300"></div>
                <Plane className="mx-2 h-4 w-4 text-amber-500 transform rotate-90" />
                <div className="w-full border-t border-dashed border-amber-300"></div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">To</p>
                <p className="text-lg font-semibold">{offerData.arrival_location}</p>
              </div>
            </div>
            
            <div className="h-px bg-gray-200 my-6"></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(new Date(offerData.flight_date), 'MMM d, yyyy')}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Seat</p>
                <p className="font-medium">{boardingPassData?.seat_number || 'TBD'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Passenger</p>
                <p className="font-medium">{boardingPassData?.passenger_name || 'GDY·UP Traveler'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Gate</p>
                <p className="font-medium">{boardingPassData?.gate || 'A1'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className="border border-amber-200 p-4 rounded-md bg-white">
              <QrCode className="h-32 w-32 text-slate-900" />
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground mb-4">
            <p>Scan this QR code at the airport</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full bg-black hover:bg-slate-800 text-white" 
            onClick={handleAppleWallet}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.0413 12.5046C17.0043 9.5333 19.5226 8.06973 19.6473 7.9947C18.2863 5.9574 16.1643 5.77427 15.4223 5.74753C13.6203 5.5574 11.8583 6.8414 10.9296 6.8414C10.0276 6.8414 8.50963 5.7624 7.01863 5.79507C5.05697 5.828 3.26897 6.93547 2.27697 8.67747C0.289633 12.1788 1.74297 17.3494 3.6683 20.2614C4.6323 21.6907 5.7423 23.3001 7.22097 23.2481C8.66363 23.1921 9.17763 22.3468 10.9083 22.3468C12.6123 22.3468 13.0856 23.2481 14.599 23.2188C16.151 23.1921 17.1096 21.7494 18.0396 20.3161C19.1563 18.6748 19.6296 17.0694 19.651 17.0001C19.609 16.9961 17.0816 16.0401 17.0413 12.5046Z" />
              <path d="M14.1283 4.68C14.919 3.71627 15.4583 2.39493 15.3203 1.06667C14.1763 1.1154 12.731 1.8494 11.9043 2.79894C11.1703 3.6334 10.5236 4.9974 10.683 6.29627C11.967 6.3914 13.315 5.6414 14.1283 4.68Z" />
            </svg>
            Add to Apple Wallet
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleDownloadPass}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Boarding Pass
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-amber-600" 
            onClick={handleSeatSelection}
          >
            Change Seat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 