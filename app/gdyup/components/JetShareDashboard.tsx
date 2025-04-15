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
import { CheckCircle, Clock, AlertCircle, Plane, Users, CreditCard, Ticket, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { v4 as uuidv4 } from 'uuid';

// Add props interface
interface JetShareDashboardProps {
  initialTab?: 'dashboard' | 'offers' | 'bookings' | 'transactions';
  errorMessage?: string;
  successMessage?: string;
}

// Define type for stats
interface JetShareStats {
  totalOffers: number;
  totalBookings: number;
  totalSpent: number;
  totalEarned: number;
}

export default function JetShareDashboard({ initialTab = 'dashboard', errorMessage, successMessage }: JetShareDashboardProps) {
  const router = useRouter();
  const { refreshSession, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [myOffers, setMyOffers] = useState<JetShareOfferWithUser[]>([]);
  const [myBookings, setMyBookings] = useState<JetShareOfferWithUser[]>([]);
  const [completedFlights, setCompletedFlights] = useState<JetShareOfferWithUser[]>([]);
  const [transactions, setTransactions] = useState<JetShareTransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(errorMessage || null);
  const [stats, setStats] = useState<JetShareStats>({
    totalOffers: 0,
    totalBookings: 0, 
    totalSpent: 0,
    totalEarned: 0
  });

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
        setIsLoading(true);
        
        // Generate unique request identifiers
        const timestamp = Date.now();
        const requestId = Math.random().toString(36).substring(2, 10);
        const instanceId = uuidv4();
        
        // Get the user's token for authenticated requests
        const supabase = createClient();
        let session = null;
        let userId = null;
        
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
          } else if (sessionData?.session) {
            session = sessionData.session;
            userId = sessionData.session.user?.id;
            if (userId) {
              console.log('Dashboard: Using authenticated session for user', userId);
            } else {
              console.log('Dashboard: Session found but user ID is missing');
            }
          } else {
            console.log('Dashboard: No valid session found');
          }
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
        }
        
        // If no session, try to get user ID from localStorage
        if (!userId) {
          try {
            userId = localStorage.getItem('jetstream_user_id');
            if (userId) {
              console.log('Dashboard: Using user ID from localStorage:', userId);
            }
          } catch (storageError) {
            console.error('Error accessing localStorage:', storageError);
          }
        }
        
        // If still no user ID, use the user from the auth context
        if (!userId && user) {
          userId = user.id;
          console.log('Dashboard: Using user ID from auth context:', userId);
        }
        
        // If we still don't have a user ID at this point, we're in trouble
        if (!userId) {
          console.error('Unable to determine user ID for dashboard');
          setError('Authentication issue occurred. Please refresh the page or sign in again.');
          setIsLoading(false);
          
          // Still show empty state rather than throwing
          setMyOffers([]);
          setMyBookings([]);
          setCompletedFlights([]);
          setTransactions([]);
          setStats({
            totalOffers: 0,
            totalBookings: 0,
            totalSpent: 0,
            totalEarned: 0,
          });
          return;
        }
        
        // Prepare headers with auth token and cache control
        const headers: Record<string, string> = {
          'Cache-Control': 'no-cache',
        };
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        // Log the dashboard request
        console.log(`Dashboard fetch for user ${userId} at ${new Date().toISOString()}`);
        
        try {
          // Fetch offers (this may fail, which is ok)
          let postedOffers = [];
          let acceptedOffers = [];
          let completedOffers = [];
          
          try {
            const offersResponse = await fetch(`/api/jetshare/getOffers?viewMode=dashboard&user_id=${userId}&t=${timestamp}&rid=${requestId}&instance_id=${instanceId}`, {
          headers,
          credentials: 'include',
        });
        
            if (!offersResponse.ok) {
              console.error('Error fetching offers:', offersResponse.status);
              console.warn('Unable to fetch offers, will display empty offers');
            } else {
              // Process offers normally
              const offersData = await offersResponse.json();
              
              if (offersData.offers && Array.isArray(offersData.offers)) {
                // Separate offers by status
                postedOffers = offersData.offers.filter((offer: any) => offer.status === 'open') || [];
                acceptedOffers = offersData.offers.filter((offer: any) => offer.status === 'accepted') || [];
                completedOffers = offersData.offers.filter((offer: any) => offer.status === 'completed') || [];
                console.log(`Found ${offersData.offers.length} offers: ${postedOffers.length} open, ${acceptedOffers.length} accepted, ${completedOffers.length} completed`);
              } else {
                console.warn('Offers data is not in expected format:', offersData);
              }
            }
          } catch (offersError) {
            console.error('Error fetching offers:', offersError);
            console.warn('Will display empty offers');
          }
          
          // Set offer state with whatever we got, even if empty
          setMyOffers(postedOffers);
          setMyBookings(acceptedOffers);
          setCompletedFlights(completedOffers);
          
          // Continue with stats regardless of offers success
          await proceedWithStats(headers, userId, timestamp, requestId, instanceId);
        } catch (fetchError) {
          console.error('Error in main fetch operation:', fetchError);
          setError('Unable to load your dashboard data. Please try again later.');
          
          // Set empty data to avoid crashes
          setMyOffers([]);
          setMyBookings([]);
          setCompletedFlights([]);
          setStats({
            totalOffers: 0,
            totalBookings: 0,
            totalSpent: 0,
            totalEarned: 0,
          });
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Dashboard error:', error);
        setError('An unexpected error occurred. Please refresh the page.');
        setIsLoading(false);
      }
    };

    // Setup instance ID if not present
    if (typeof window !== 'undefined' && !localStorage.getItem('jetstream_instance_id')) {
      // Generate a UUID for instance tracking
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('jetstream_instance_id', uuid);
      console.log('Created new instance ID for session tracking:', uuid);
    }

    fetchData();
  }, [refreshSession]);

  // Helper function to fetch stats to avoid code duplication
  const proceedWithStats = async (headers: Record<string, string>, userId: string, timestamp: number, requestId: string, instanceId: string) => {
    try {
      // 1. First fetch transactions
      let transactions = [];
      try {
        const transactionsResponse = await fetch(`/api/jetshare/getTransactions?user_id=${userId}&t=${timestamp}&rid=${requestId}&instance_id=${instanceId}`, {
          headers,
          credentials: 'include',
        });
        
        if (!transactionsResponse.ok) {
          console.error('Error fetching transactions:', transactionsResponse.status);
          console.warn('Will continue with empty transactions data');
        } else {
          const transactionsData = await transactionsResponse.json();
          transactions = transactionsData.transactions || [];
        }
      } catch (txError) {
        console.error('Transaction fetch failed:', txError);
        console.warn('Will continue with empty transactions data');
      }
      
      // Set transactions regardless of success/failure
      setTransactions(transactions);
      
      // 2. Fetch user stats (or use default values if this fails)
      let stats = {
        totalOffers: 0,
        totalBookings: 0,
        totalSpent: 0,
        totalEarned: 0,
      };
      
      try {
        const statsResponse = await fetch(`/api/jetshare/stats?user_id=${userId}&t=${timestamp}&rid=${requestId}&instance_id=${instanceId}`, {
          headers,
          credentials: 'include',
        });
        
        if (!statsResponse.ok) {
          console.error('Error fetching stats:', statsResponse.status);
          console.warn('Will use default stats values');
        } else {
          const statsData = await statsResponse.json();
          if (statsData.stats) {
            stats = statsData.stats;
          }
        }
      } catch (statsError) {
        console.error('Stats fetch failed:', statsError);
        console.warn('Will use default stats values');
      }
      
      // Set stats regardless of success/failure
      setStats(stats);
      
      // Done loading
      setIsLoading(false);
    } catch (error) {
      console.error('Error in stats/transactions fetching:', error);
      // Set default values
      setTransactions([]);
      setStats({
          totalOffers: 0,
          totalBookings: 0,
          totalSpent: 0,
          totalEarned: 0,
        });
        setIsLoading(false);
      }
    };

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

  const renderOffer = (offer: JetShareOfferWithUser & { isOwnOffer?: boolean }) => {
    if (!offer) {
      return null;
    }
    
    // Ensure we have valid dates and amounts
    const flightDate = offer.flight_date ? new Date(offer.flight_date) : new Date();
    const totalFlightCost = typeof offer.total_flight_cost === 'number' ? offer.total_flight_cost : 0;
    const requestedShareAmount = typeof offer.requested_share_amount === 'number' ? offer.requested_share_amount : 0;
    
    // Safe status with default
    const status = offer.status || 'unknown';
    
    // Safe locations with defaults
    const departureLocation = offer.departure_location || 'Unknown';
    const arrivalLocation = offer.arrival_location || 'Unknown';
    
    return (
    <Card 
        key={offer.id || `offer-${Math.random().toString(36).substring(2, 10)}`} 
      className={`mb-4 hover:shadow-md transition-shadow relative overflow-hidden ${
          status === 'completed' ? 'border-green-200' : 
          status === 'accepted' ? 'border-amber-200' : 
        'border-blue-200'
      }`}
    >
      {/* Status indicator bar at the top */}
      <div 
        className={`h-1.5 w-full absolute top-0 left-0 ${
            status === 'completed' ? 'bg-green-500' : 
            status === 'accepted' ? 'bg-amber-500' : 
          'bg-blue-500'
        }`}
      />
      
      <div 
        className="cursor-pointer"
        onClick={() => {
            if (!offer.id) return;
            
            if (status === 'completed') {
            router.push(`/jetshare/transaction/${offer.id}`);
            } else if (status === 'accepted') {
            // If this is a booking we made (we are the matched_user)
            if (offer.matched_user_id && offer.matched_user?.id === offer.matched_user_id) {
              router.push(`/jetshare/payment/${offer.id}`);
            } else {
              // If we created this offer and it's accepted but not paid for
              router.push(`/jetshare/offer/${offer.id}`);
            }
            } else if (status === 'open') {
            // For open offers, navigate to the offer detail page
            router.push(`/jetshare/offer/${offer.id}`);
          }
        }}
      >
        <CardHeader className="pb-2 pt-6">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-medium flex items-center">
              <Plane className="h-4 w-4 mr-2 rotate-90" />
                {departureLocation} → {arrivalLocation}
            </CardTitle>
              {getStatusBadge(status)}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
                {format(flightDate, 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              Flight #{offer.id?.toString().substring(0, 6)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center text-sm">
                <CreditCard className="h-4 w-4 mr-1 text-gray-500" />
                Total Cost
              </span>
                <span className="font-medium">{formatCurrency(totalFlightCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-1 text-gray-500" />
                Share Amount
              </span>
                <span className="font-medium">{formatCurrency(requestedShareAmount)}</span>
            </div>
            
            {/* Show additional information based on status */}
              {status === 'accepted' && (
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
            
              {status === 'completed' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-sm text-green-700 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Payment completed
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/jetshare/transaction/${offer.id}`);
                    }}>
                      View Details
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/jetshare/boardingpass/${offer.id}`);
                    }}>
                      <Ticket className="h-3 w-3 mr-1" />
                      Boarding Pass
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
  };
  
  const renderTransaction = (transaction: JetShareTransactionWithDetails, currentUserId?: string) => {
    if (!transaction) {
      return null;
    }
    
    // Safely access properties - updated to match the schema
    const isPayer = transaction.payer_user_id === currentUserId; 
    const isRecipient = transaction.recipient_user_id === currentUserId;
    
    // Ensure we have valid dates and amounts
    const transactionDate = transaction.transaction_date ? new Date(transaction.transaction_date) : new Date();
    const amount = typeof transaction.amount === 'number' ? transaction.amount : 0;
    const handlingFee = typeof transaction.handling_fee === 'number' ? transaction.handling_fee : 0;
    
    return (
      <Card key={transaction.id || `tx-${Math.random().toString(36).substring(2, 10)}`} className="mb-4 hover:shadow-md transition-shadow">
        <div className="cursor-pointer" onClick={() => transaction.offer_id ? router.push(`/jetshare/transaction/${transaction.offer_id}`) : null}>
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
              <div className="flex justify-between items-center">
                <div className="text-sm mt-1">
                  {format(transactionDate, 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  Txn #{transaction.id?.toString().substring(0, 6)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transaction Amount:</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Handling Fee:</span>
                <span className="text-sm">{formatCurrency(handlingFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-sm font-medium">
                  {isPayer ? 'Total Paid:' : isRecipient ? 'Total Received:' : 'Total:'}
                </span>
                <span className={`font-semibold ${isPayer ? 'text-amber-600' : isRecipient ? 'text-green-600' : ''}`}>
                  {formatCurrency(amount)}
                </span>
              </div>
              
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  {isPayer ? (
                    <>
                      <span>To: </span>
                      <span className="ml-1 font-medium">
                        {transaction.recipient_user?.first_name || 'Recipient'} {transaction.recipient_user?.last_name || ''}
                      </span>
                    </>
                  ) : isRecipient ? (
                    <>
                      <span>From: </span>
                      <span className="ml-1 font-medium">
                        {transaction.payer_user?.first_name || 'Payer'} {transaction.payer_user?.last_name || ''}
                      </span>
                    </>
                  ) : (
                    <span>Transaction ID: {transaction.id?.substring(0, 8) || 'Unknown'}...</span>
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
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );

  // Add a minimum timeout to prevent endless loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Dashboard: Forcing loading to complete after timeout');
        setIsLoading(false);
      }
    }, 10000); // 10 seconds max loading time
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className="container mx-auto py-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="offers">My Offers</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Offers Created</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">{stats.totalOffers}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalEarned)}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  renderSkeleton()
                ) : transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 3).map(transaction => renderTransaction(transaction, user?.id))}
                    {transactions.length > 3 && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setActiveTab('transactions')}
                      >
                        View All Transactions
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>My Posted Offers</CardTitle>
                <Button 
                  onClick={() => router.push('/jetshare/create')}
                  variant="outline"
                  size="sm"
                >
                  Create New Offer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeleton()
              ) : myOffers.length > 0 ? (
                <div className="space-y-4">
                  {myOffers.map(offer => renderOffer({...offer, isOwnOffer: true}))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  You haven't posted any offers yet
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/jetshare/create')}
                      variant="default"
                    >
                      Create Your First Offer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeleton()
              ) : myBookings.length > 0 ? (
                <div className="space-y-4">
                  {myBookings.map(offer => renderOffer(offer))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  You haven't booked any flights yet
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/jetshare/browse')}
                      variant="default"
                    >
                      Browse Available Flights
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {completedFlights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Flights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedFlights.map(offer => renderOffer(offer))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeleton()
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map(transaction => renderTransaction(transaction, user?.id))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}