'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plane, Calendar, DollarSign, Loader2, BadgeCheck, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SkeletonCard = () => (
  <Card className="overflow-hidden">
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full rounded-md" />
    </CardFooter>
  </Card>
);

export default function JetShareOffers() {
  const [isLoading, setIsLoading] = useState(true);
  const [offers, setOffers] = useState<JetShareOfferWithUser[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<JetShareOfferWithUser | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/jetshare/getOffers?userId=current');
        
        if (!response.ok) {
          throw new Error('Failed to fetch offers');
        }
        
        const data = await response.json();
        setOffers(data.offers || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
        toast.error('Failed to load your flight share offers');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch the offers
    fetchOffers();
  }, []);
  
  const cancelOffer = async (offerId: string) => {
    setIsCancelling(true);
    
    try {
      const response = await fetch(`/api/jetshare/cancelOffer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offer_id: offerId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel offer');
      }
      
      // Update the offers list
      setOffers(offers.filter(offer => offer.id !== offerId));
      toast.success('Flight share offer cancelled successfully');
    } catch (error) {
      console.error('Error cancelling offer:', error);
      toast.error('Failed to cancel flight share offer');
    } finally {
      setIsCancelling(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Accepted</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }
  
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6">
          <Plane className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold mb-3">No Flight Shares Yet</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't created any flight share offers yet. Share your next private jet flight to offset your costs.
        </p>
        <Button asChild>
          <Link href="/jetshare/offer">Create Flight Share Offer</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold tracking-tight">Your Flight Share Offers</h2>
        <Button asChild>
          <Link href="/jetshare/offer">Create New Offer</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <Card key={offer.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {offer.departure_location} to {offer.arrival_location}
                </CardTitle>
                {getStatusBadge(offer.status)}
              </div>
              <CardDescription>
                {format(new Date(offer.flight_date), 'EEE, MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(offer.flight_date), 'h:mm a')}
                  </span>
                </div>
                
                {offer.matched_user && (
                  <div className="flex items-center">
                    <BadgeCheck className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm">
                      Matched with {offer.matched_user.first_name} {offer.matched_user.last_name?.[0]}.
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    ${offer.requested_share_amount.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({Math.round((offer.requested_share_amount / offer.total_flight_cost) * 100)}% share)
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {offer.status === 'open' ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View Details</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Flight Share Details</DialogTitle>
                        <DialogDescription>
                          Review the details of your flight share offer.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Flight Route</h4>
                          <p className="text-lg font-semibold">{offer.departure_location} to {offer.arrival_location}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Date & Time</h4>
                          <p>{format(new Date(offer.flight_date), 'EEEE, MMMM d, yyyy')}</p>
                          <p>{format(new Date(offer.flight_date), 'h:mm a')}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Cost Details</h4>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                            <div className="flex justify-between mb-1">
                              <span>Total Flight Cost:</span>
                              <span className="font-medium">${offer.total_flight_cost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between mb-1">
                              <span>Requested Share Amount:</span>
                              <span className="font-medium">${offer.requested_share_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Percentage:</span>
                              <span>{Math.round((offer.requested_share_amount / offer.total_flight_cost) * 100)}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                          <div className="flex items-center">
                            {getStatusBadge(offer.status)}
                            <span className="ml-2">
                              {offer.status === 'open' ? 'Waiting for someone to accept your offer' : 
                               offer.status === 'accepted' ? 'Offer has been accepted' : 'Flight share completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={() => cancelOffer(offer.id)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Cancel Offer
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/jetshare/offer/${offer.id}/edit`}>
                      Edit Offer
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/jetshare/offers/${offer.id}`}>
                      View Details
                    </Link>
                  </Button>
                  
                  {offer.status === 'accepted' && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-amber-500 hover:text-amber-600"
                      asChild
                    >
                      <Link href="/jetshare">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in JetShare
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 