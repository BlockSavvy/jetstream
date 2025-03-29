"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { JetShareOfferWithUser, JetShareTransactionWithDetails } from '@/types/jetshare';
import { format } from 'date-fns';
import { CheckCircle, Clock, AlertCircle, Plane, Users, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Add props interface
interface JetShareDashboardProps {
  initialTab?: 'dashboard' | 'offers' | 'bookings' | 'transactions';
  errorMessage?: string;
  successMessage?: string;
}

export default function JetShareDashboard({ initialTab = 'dashboard', errorMessage, successMessage }: JetShareDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [myOffers, setMyOffers] = useState<JetShareOfferWithUser[]>([]);
  const [myBookings, setMyBookings] = useState<JetShareOfferWithUser[]>([]);
  const [completedFlights, setCompletedFlights] = useState<JetShareOfferWithUser[]>([]);
  const [transactions, setTransactions] = useState<JetShareTransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(errorMessage || null);

  // Display success message if provided
  useEffect(() => {
    if (successMessage) {
      toast.success(
        successMessage === 'already-paid' 
          ? 'This offer has already been paid for.' 
          : successMessage
      );
    }
    
    if (errorMessage && !error) {
      setError(
        errorMessage === 'unauthorized' 
          ? 'You are not authorized to view this offer.' 
          : errorMessage === 'offer-not-found'
          ? 'The requested offer could not be found.'
          : errorMessage === 'not-matched-user'
          ? 'You are not the matched user for this offer.'
          : errorMessage === 'invalid-offer-state'
          ? 'The offer is not in a valid state for this action.'
          : errorMessage
      );
    }
  }, [successMessage, errorMessage, error]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching JetShare dashboard data...');
        setError(null);
        setIsLoading(true);
        
        // Fetch my open offers - using userId=current and viewMode=dashboard ensures we only get the current user's offers
        console.log('Fetching open offers...');
        const offersRes = await fetch('/api/jetshare/getOffers?status=open&userId=current&viewMode=dashboard', {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!offersRes.ok) {
          console.error('Error fetching open offers:', await offersRes.text());
          if (offersRes.status === 401) {
            setError('Authentication required. Please sign in to view your dashboard.');
            setIsLoading(false);
            return;
          }
          setMyOffers([]);
        } else {
          const offersData = await offersRes.json();
          console.log('Open offers fetched:', offersData.offers?.length || 0);
          setMyOffers(offersData.offers || []);
        }

        // Fetch my bookings - focusing on offers where I am the matched_user (accepted and completed)
        console.log('Fetching bookings (offers where I am matched_user)...');
        const bookingsRes = await fetch('/api/jetshare/getOffers?matchedUserId=current&viewMode=dashboard', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache', 
            'Pragma': 'no-cache'
          }
        });
        
        if (!bookingsRes.ok) {
          console.error('Error fetching bookings:', await bookingsRes.text());
          setMyBookings([]);
        } else {
          const bookingsData = await bookingsRes.json();
          console.log('Bookings API response:', bookingsData);
          
          if (bookingsData.offers && Array.isArray(bookingsData.offers)) {
            console.log('Found bookings:', bookingsData.offers.length);
            
            // For the bookings tab, include both accepted and completed where user is matched_user
            const myBookingsData = bookingsData.offers;
            console.log('Setting my bookings to:', myBookingsData.length, 'items');
            setMyBookings(myBookingsData);
            
            // For completed flights, filter only completed status
            const completedBookings = bookingsData.offers.filter(
              (offer: JetShareOfferWithUser) => offer.status === 'completed'
            );
            
            console.log('Setting completed flights to:', completedBookings.length, 'items');
            setCompletedFlights(completedBookings);
          } else {
            console.log('No bookings found for current user');
            setMyBookings([]);
            setCompletedFlights([]);
          }
        }
        
        // Fetch all my offers that are in accepted or completed status
        console.log('Fetching my accepted & completed offers...');
        const acceptedOffersRes = await fetch('/api/jetshare/getOffers?userId=current&status=accepted,completed&viewMode=dashboard', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (acceptedOffersRes.ok) {
          const acceptedOffersData = await acceptedOffersRes.json();
          console.log('My accepted/completed offers found:', acceptedOffersData.offers?.length || 0);
          
          // Add these to completed flights if they're in completed status
          if (acceptedOffersData.offers && Array.isArray(acceptedOffersData.offers)) {
            const myCompletedOffers = acceptedOffersData.offers.filter(
              (offer: JetShareOfferWithUser) => offer.status === 'completed'
            );
            
            // Combine with existing completed flights
            const combinedCompleted = [...completedFlights, ...myCompletedOffers];
            // Remove duplicates
            const uniqueCompleted = combinedCompleted.filter((offer, index, self) =>
              index === self.findIndex((o) => o.id === offer.id)
            );
            
            setCompletedFlights(uniqueCompleted);
          }
        }
        
        // Fetch transactions
        console.log('Fetching transactions...');
        const transactionsRes = await fetch('/api/jetshare/getTransactions?limit=10', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!transactionsRes.ok) {
          console.error('Error fetching transactions:', await transactionsRes.text());
          setTransactions([]);
        } else {
          const transactionsData = await transactionsRes.json();
          console.log('Transactions fetched:', transactionsData.transactions?.length || 0);
          if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
            setTransactions(transactionsData.transactions);
          } else {
            console.log('No transactions found or invalid response format');
            setTransactions([]);
          }
        }
        
        console.log('JetShare dashboard data fetched successfully');
      } catch (error) {
        console.error('Error fetching JetShare data:', error);
        // Set empty arrays for any data that might not have been fetched
        setMyOffers([]);
        setMyBookings([]);
        setCompletedFlights([]);
        setTransactions([]);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up an interval to refresh data every 30 seconds
    const refreshInterval = setInterval(fetchData, 30000);
    
    // Clear the interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [activeTab]); // Add activeTab as a dependency to refresh when tab changes

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Open</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Accepted</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <AlertCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderOffer = (offer: JetShareOfferWithUser & { isOwnOffer?: boolean }) => (
    <Card 
      key={offer.id} 
      className={`mb-4 hover:shadow-md transition-shadow relative overflow-hidden ${
        offer.status === 'completed' ? 'border-green-200' : 
        offer.status === 'accepted' ? 'border-amber-200' : 
        'border-blue-200'
      }`}
    >
      {/* Status indicator bar at the top */}
      <div 
        className={`h-1.5 w-full absolute top-0 left-0 ${
          offer.status === 'completed' ? 'bg-green-500' : 
          offer.status === 'accepted' ? 'bg-amber-500' : 
          'bg-blue-500'
        }`}
      />
      
      <div 
        className="cursor-pointer"
        onClick={() => {
          if (offer.status === 'completed') {
            router.push(`/jetshare/transaction/${offer.id}`);
          } else if (offer.status === 'accepted') {
            // If this is a booking we made (we are the matched_user)
            if (offer.matched_user_id && offer.matched_user?.id === offer.matched_user_id) {
              router.push(`/jetshare/payment/${offer.id}`);
            } else {
              // If we created this offer and it's accepted but not paid for
              router.push(`/jetshare/offer/${offer.id}`);
            }
          } else if (offer.status === 'open') {
            // For open offers, navigate to the offer detail page
            router.push(`/jetshare/offer/${offer.id}`);
          }
        }}
      >
        <CardHeader className="pb-2 pt-6">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium flex items-center">
              <Plane className="h-4 w-4 mr-2 rotate-90" />
              {offer.departure_location} → {offer.arrival_location}
            </CardTitle>
            {getStatusBadge(offer.status)}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(offer.flight_date), 'MMM d, yyyy')}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center text-sm">
                <CreditCard className="h-4 w-4 mr-1 text-gray-500" />
                Total Cost
              </span>
              <span className="font-medium">{formatCurrency(offer.total_flight_cost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                Share Amount
              </span>
              <span className="font-medium">{formatCurrency(offer.requested_share_amount)}</span>
            </div>
            
            {/* Show additional information based on status */}
            {offer.status === 'accepted' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {offer.isOwnOffer ? (
                  // If this is my offer and someone accepted it
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Awaiting payment from {offer.matched_user?.first_name || 'Traveler'}
                    </span>
                  </div>
                ) : (
                  // If I accepted someone else's offer
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Payment required
                    </span>
                    <Button size="sm" variant="outline" className="text-xs" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/jetshare/payment/${offer.id}`);
                    }}>
                      Complete Payment
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {offer.status === 'completed' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-700 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Payment completed
                  </span>
                  <Button size="sm" variant="outline" className="text-xs" onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/jetshare/transaction/${offer.id}`);
                  }}>
                    View Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
  
  const renderTransaction = (transaction: JetShareTransactionWithDetails) => {
    const isPayer = transaction.payer_user?.id === transaction.user?.id;
    const isRecipient = transaction.recipient_user?.id === transaction.user?.id;
    
    return (
      <Card key={transaction.id} className="mb-4 hover:shadow-md transition-shadow">
        <div className="cursor-pointer" onClick={() => router.push(`/jetshare/transaction/${transaction.offer_id}`)}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-medium">
                {isPayer ? (
                  <span className="flex items-center text-amber-600">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Sent
                  </span>
                ) : isRecipient ? (
                  <span className="flex items-center text-green-600">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Received
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Transaction
                  </span>
                )}
              </CardTitle>
              {getPaymentStatusBadge(transaction.payment_status)}
            </div>
            <div className="text-sm text-muted-foreground">
              {transaction.offer && (
                <div className="flex items-center">
                  <Plane className="h-3 w-3 mr-1 rotate-90" />
                  <span>{transaction.offer.departure_location} → {transaction.offer.arrival_location}</span>
                </div>
              )}
              <div className="text-sm mt-1">
                {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction Amount:</span>
                <span className="font-medium">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Handling Fee:</span>
                <span className="text-sm">{formatCurrency(transaction.handling_fee)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-sm font-medium">
                  {isPayer ? 'Total Paid:' : isRecipient ? 'Total Received:' : 'Total:'}
                </span>
                <span className={`font-semibold ${isPayer ? 'text-amber-600' : isRecipient ? 'text-green-600' : ''}`}>
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  {isPayer ? (
                    <>
                      <span>To: </span>
                      <span className="ml-1 font-medium">
                        {transaction.recipient_user?.first_name} {transaction.recipient_user?.last_name}
                      </span>
                    </>
                  ) : isRecipient ? (
                    <>
                      <span>From: </span>
                      <span className="ml-1 font-medium">
                        {transaction.payer_user?.first_name} {transaction.payer_user?.last_name}
                      </span>
                    </>
                  ) : (
                    <span>Transaction ID: {transaction.id.substring(0, 8)}...</span>
                  )}
                </div>
                <span className="text-xs">{transaction.payment_method === 'crypto' ? 'Crypto' : 'Credit Card'}</span>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };
  
  const renderSkeleton = () => (
    <>
      {[1, 2].map((i) => (
        <Card key={`skeleton-${i}`} className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-24 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );

  // If there's an authentication error, show a sign-in prompt
  if (error && error.includes('Authentication required')) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-6">Please sign in to access your JetShare dashboard</p>
          <Button 
            onClick={() => router.push('/auth/signin')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My JetShare</h1>
        <Button onClick={() => router.push('/jetshare/offer')} className="bg-blue-600 hover:bg-blue-700">
          Create Offer
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => router.push('/auth/signin?redirect=/jetshare/dashboard')}
          >
            Sign In
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="offers">My Offers</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <h2 className="text-xl font-semibold">JetShare Overview</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Open Offers</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : myOffers.length > 0 ? (
                  <div className="text-2xl font-bold">{myOffers.length}</div>
                ) : (
                  <div className="text-muted-foreground">No open offers</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Flights</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : myBookings.length > 0 ? (
                  <div className="text-2xl font-bold">{myBookings.length}</div>
                ) : (
                  <div className="text-muted-foreground">No upcoming flights</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Completed Flights</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : completedFlights.length > 0 ? (
                  <div className="text-2xl font-bold">{completedFlights.length}</div>
                ) : (
                  <div className="text-muted-foreground">No completed flights</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Offers</h3>
              {isLoading ? (
                Array(2).fill(0).map((_, i) => <div key={`dashboard-offers-skeleton-${i}`}>{renderSkeleton()}</div>)
              ) : myOffers.length > 0 ? (
                myOffers.slice(0, 2).map(offer => renderOffer(offer))
              ) : (
                <Card className="mb-4 p-4 text-center">
                  <p className="text-muted-foreground">No open offers found</p>
                  <Button 
                    onClick={() => router.push('/jetshare/offer')} 
                    className="mt-4"
                  >
                    Create an Offer
                  </Button>
                </Card>
              )}
              
              {myOffers.length > 2 && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setActiveTab('offers')}
                >
                  View All Offers
                </Button>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              {isLoading ? (
                Array(2).fill(0).map((_, i) => <div key={`dashboard-transactions-skeleton-${i}`}>{renderSkeleton()}</div>)
              ) : transactions.length > 0 ? (
                transactions.slice(0, 2).map(tx => renderTransaction(tx))
              ) : (
                <Card className="mb-4 p-4 text-center">
                  <p className="text-muted-foreground">No transactions yet</p>
                  <Button 
                    onClick={() => router.push('/jetshare/listings')} 
                    className="mt-4"
                  >
                    Browse Flight Shares
                  </Button>
                </Card>
              )}
              
              {transactions.length > 2 && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setActiveTab('transactions')}
                >
                  View All Transactions
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Offers</h2>
            <Button onClick={() => router.push('/jetshare/offer')}>
              Create New Offer
            </Button>
          </div>
          
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <div key={`offers-skeleton-${i}`}>{renderSkeleton()}</div>)
          ) : myOffers.length > 0 ? (
            <div className="space-y-4">
              {myOffers.map(offer => renderOffer(offer))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Open Offers</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any flight share offers yet. Create an offer to share your flight costs.
              </p>
              <Button onClick={() => router.push('/jetshare/offer')}>
                Create an Offer
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My Bookings</h2>
            <Button onClick={() => router.push('/jetshare/listings')}>
              Find Available Shares
            </Button>
          </div>
          
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <div key={`bookings-skeleton-${i}`}>{renderSkeleton()}</div>)
          ) : myBookings.length > 0 ? (
            <div className="space-y-4">
              {myBookings.map(booking => renderOffer(booking))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Active Bookings</h3>
              <p className="text-muted-foreground mb-4">
                You haven't booked any flight shares yet. Browse available listings to find your next flight.
              </p>
              <Button onClick={() => router.push('/jetshare/listings')}>
                Browse Flight Shares
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <h2 className="text-xl font-semibold">Transactions</h2>
          
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <div key={`transactions-skeleton-${i}`}>{renderSkeleton()}</div>)
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map(tx => renderTransaction(tx))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Once you book or sell flight shares, your transactions will appear here.
              </p>
              <Button onClick={() => router.push('/jetshare/listings')}>
                Browse Flight Shares
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 