"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { JetShareOfferWithUser, JetShareTransactionWithDetails } from '@/types/jetshare';
import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle, Clock, AlertCircle, Plane, Users, CreditCard, Ticket, Wallet, MapPin, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

// GDYup theme colors
const PRIMARY_COLOR = "#DAFF0D";
const SECONDARY_COLOR = "#FF4B47";

// Add props interface
interface GDYupDashboardProps {
  initialTab?: 'dashboard' | 'offers' | 'bookings' | 'transactions' | 'messages';
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

// Define type for messages
interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export default function GDYupDashboard({ initialTab = 'dashboard', errorMessage, successMessage }: GDYupDashboardProps) {
  const router = useRouter();
  const { refreshSession, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [myOffers, setMyOffers] = useState<JetShareOfferWithUser[]>([]);
  const [myBookings, setMyBookings] = useState<JetShareOfferWithUser[]>([]);
  const [completedFlights, setCompletedFlights] = useState<JetShareOfferWithUser[]>([]);
  const [transactions, setTransactions] = useState<JetShareTransactionWithDetails[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
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
          setRecentMessages([]);
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
          
          // Fetch messages
          try {
            const messagesResponse = await fetch(`/api/jetshare/messages?limit=5&t=${timestamp}`, {
              headers,
              credentials: 'include',
            });
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              if (messagesData.messages && Array.isArray(messagesData.messages)) {
                setRecentMessages(messagesData.messages);
              }
            }
          } catch (messagesError) {
            console.error('Error fetching messages:', messagesError);
            setRecentMessages([]);
          }
          
          // Continue with stats regardless of offers success
          await proceedWithStats(headers, userId, timestamp, requestId, instanceId);
        } catch (fetchError) {
          console.error('Error in main fetch operation:', fetchError);
          setError('Unable to load your dashboard data. Please try again later.');
          
          // Set empty data to avoid crashes
          setMyOffers([]);
          setMyBookings([]);
          setCompletedFlights([]);
          setRecentMessages([]);
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
  }, [refreshSession, user]);

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
        return <Badge className="bg-blue-900/40 text-blue-300 border-blue-800">Open</Badge>;
      case 'accepted':
        return <Badge className="bg-amber-900/40 text-amber-300 border-amber-800">Accepted</Badge>;
      case 'completed':
        return <Badge className="bg-green-900/40 text-green-300 border-green-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-900/40 text-gray-300 border-gray-800">{status}</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-900/40 text-amber-300 border-amber-800">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>;
      case 'completed':
        return <Badge className="bg-green-900/40 text-green-300 border-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-900/40 text-red-300 border-red-800">
          <AlertCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>;
      default:
        return <Badge className="bg-gray-900/40 text-gray-300 border-gray-800">{status}</Badge>;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "Recently";
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
      <div 
        key={offer.id || `offer-${Math.random().toString(36).substring(2, 10)}`} 
        className="relative overflow-hidden rounded-lg border border-gray-800 mb-4 bg-gray-900 cursor-pointer"
        onClick={() => {
          if (!offer.id) return;
          
          if (status === 'completed') {
            router.push(`/gdyup/transaction/${offer.id}`);
          } else if (status === 'accepted') {
            // If this is a booking we made (we are the matched_user)
            if (offer.matched_user_id && offer.matched_user?.id === offer.matched_user_id) {
              router.push(`/gdyup/payment/${offer.id}`);
            } else {
              // If we created this offer and it's accepted but not paid for
              router.push(`/gdyup/offer/${offer.id}`);
            }
          } else if (status === 'open') {
            // For open offers, navigate to the offer detail page
            router.push(`/gdyup/offer/${offer.id}`);
          }
        }}
      >
        {/* Status indicator */}
        <div 
          className={`h-1 w-full absolute top-0 left-0 ${
            status === 'completed' ? 'bg-green-500' : 
            status === 'accepted' ? 'bg-amber-500' : 
            `bg-[${PRIMARY_COLOR}]`
          }`}
        />
        
        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              {/* Flight info */}
              <div className="flex items-center mb-1">
                <Plane className="h-4 w-4 mr-2 rotate-90" style={{ color: PRIMARY_COLOR }} />
                <p className="font-medium text-white">{departureLocation} → {arrivalLocation}</p>
              </div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm text-gray-400">{format(flightDate, 'MMM d, yyyy')}</p>
                <div className="text-xs text-gray-500 font-mono">
                  #{offer.id?.toString().substring(0, 6)}
                </div>
              </div>
              
              {/* Price info */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-400">
                    <CreditCard className="h-4 w-4 mr-1 text-gray-500" />
                    Total Cost
                  </span>
                  <span className="font-medium text-white">{formatCurrency(totalFlightCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-sm text-gray-400">
                    <Users className="h-4 w-4 mr-1 text-gray-500" />
                    Share Amount
                  </span>
                  <span className="font-medium text-white">{formatCurrency(requestedShareAmount)}</span>
                </div>
              </div>
              
              {/* Status badge */}
              <div className="flex items-center">
                {getStatusBadge(status)}
              </div>
            </div>
            
            {/* Action buttons based on status */}
            <div className="flex flex-col gap-2 justify-end">
              {status === 'accepted' && (
                offer.isOwnOffer ? (
                  // If this is my offer and someone accepted it
                  <div className="text-sm text-amber-300 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Awaiting payment
                  </div>
                ) : (
                  // If I accepted someone else's offer
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/gdyup/payment/${offer.id}`);
                    }}
                    className="w-full bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]"
                  >
                    Complete Payment
                  </Button>
                )
              )}
              
              {status === 'completed' && (
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/gdyup/transaction/${offer.id}`);
                    }}
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/gdyup/boardingpass/${offer.id}`);
                    }}
                    className="bg-gray-800 text-[#DAFF0D] border border-[#DAFF0D]/40 hover:bg-gray-700"
                  >
                    <Ticket className="h-3 w-3 mr-1" />
                    Boarding Pass
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTransaction = (transaction: JetShareTransactionWithDetails, currentUserId?: string) => {
    if (!transaction) {
      return null;
    }
    
    // Safely access properties
    const isPayer = transaction.payer_user_id === currentUserId; 
    const isRecipient = transaction.recipient_user_id === currentUserId;
    
    // Ensure we have valid dates and amounts
    const transactionDate = transaction.transaction_date ? new Date(transaction.transaction_date) : new Date();
    const amount = typeof transaction.amount === 'number' ? transaction.amount : 0;
    const handlingFee = typeof transaction.handling_fee === 'number' ? transaction.handling_fee : 0;
    
    return (
      <div 
        key={transaction.id || `tx-${Math.random().toString(36).substring(2, 10)}`} 
        className="relative overflow-hidden rounded-lg border border-gray-800 mb-4 bg-gray-900 p-4 cursor-pointer"
        onClick={() => transaction.offer_id ? router.push(`/gdyup/transaction/${transaction.offer_id}`) : null}
      >
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div>
            {/* Transaction type */}
            <div className="flex items-center mb-1">
              {isPayer ? (
                <span className="flex items-center text-amber-400">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Sent
                </span>
              ) : isRecipient ? (
                <span className="flex items-center text-green-400">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Received
                </span>
              ) : (
                <span className="flex items-center text-white">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Transaction
                </span>
              )}
            </div>
            
            {/* Flight info if available */}
            {transaction.offer && (
              <div className="flex items-center mb-1 text-sm text-gray-400">
                <Plane className="h-3 w-3 mr-1 rotate-90" />
                <span>{transaction.offer.departure_location} → {transaction.offer.arrival_location}</span>
              </div>
            )}
            
            {/* Date and ID */}
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-400">
                {format(transactionDate, 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                #{transaction.id?.toString().substring(0, 6)}
              </div>
            </div>
            
            {/* Payment info */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Amount:</span>
                <span className="font-medium text-white">{formatCurrency(amount)}</span>
              </div>
              {handlingFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Fee:</span>
                  <span className="text-sm text-gray-300">{formatCurrency(handlingFee)}</span>
                </div>
              )}
            </div>
            
            {/* Status */}
            <div className="flex items-center justify-between">
              {getPaymentStatusBadge(transaction.payment_status)}
              <span className="text-xs text-gray-400">{transaction.payment_method === 'crypto' ? 'Crypto' : 'Credit Card'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderMessagePreview = (message: Message) => {
    return (
      <div key={message.id} className="flex gap-3 p-3 rounded-lg bg-gray-850 border border-gray-800">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center">
          {message.sender?.first_name?.[0] || 'U'}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-start mb-1">
            <p className="font-medium text-white">{message.sender?.first_name || 'User'}</p>
            <span className="text-xs text-gray-400">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2">{message.message}</p>
        </div>
      </div>
    );
  };
  
  const renderSkeleton = () => (
    <>
      {[1, 2].map((i) => (
        <div key={`skeleton-${i}`} className="rounded-lg border border-gray-800 mb-4 p-4 bg-gray-900">
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4 bg-gray-800" />
            <Skeleton className="h-4 w-1/2 bg-gray-800" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-gray-800" />
              <Skeleton className="h-4 w-full bg-gray-800" />
              <Skeleton className="h-4 w-3/4 bg-gray-800" />
            </div>
          </div>
        </div>
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
    <div className="container mx-auto py-6 text-white">
      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6">
        <div className="bg-gray-900 rounded-md p-1 grid grid-cols-5 gap-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3 rounded-md text-center text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#DAFF0D] text-black' : 'text-white hover:bg-gray-800'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('offers')}
            className={`py-2 px-3 rounded-md text-center text-sm font-medium transition-colors ${
              activeTab === 'offers' ? 'bg-[#DAFF0D] text-black' : 'text-white hover:bg-gray-800'
            }`}
          >
            Offers
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-3 rounded-md text-center text-sm font-medium transition-colors ${
              activeTab === 'bookings' ? 'bg-[#DAFF0D] text-black' : 'text-white hover:bg-gray-800'
            }`}
          >
            Bookings
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-3 rounded-md text-center text-sm font-medium transition-colors ${
              activeTab === 'transactions' ? 'bg-[#DAFF0D] text-black' : 'text-white hover:bg-gray-800'
            }`}
          >
            Payments
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-3 rounded-md text-center text-sm font-medium transition-colors ${
              activeTab === 'messages' ? 'bg-[#DAFF0D] text-black' : 'text-white hover:bg-gray-800'
            }`}
          >
            Messages
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Offers</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2 bg-gray-800" />
                ) : (
                  <div className="text-2xl font-bold text-white">{stats.totalOffers}</div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">My Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2 bg-gray-800" />
                ) : (
                  <div className="text-2xl font-bold text-white">{stats.totalBookings}</div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2 bg-gray-800" />
                ) : (
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalSpent)}</div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-300">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-7 w-1/2 bg-gray-800" />
                ) : (
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalEarned)}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
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
                      className="w-full border-gray-700 text-white hover:bg-gray-800" 
                      onClick={() => setActiveTab('transactions')}
                    >
                      View All Transactions
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>No recent activity</p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/gdyup/browse')}
                      className="bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]"
                    >
                      Browse Flights
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">My Posted Offers</CardTitle>
                <Button 
                  onClick={() => router.push('/gdyup/create')}
                  className="bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]"
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
                <div className="text-center py-6 text-gray-400">
                  <p>You haven't posted any offers yet</p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/gdyup/create')}
                      className="bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]"
                    >
                      Create Your First Offer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Active Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeleton()
              ) : myBookings.length > 0 ? (
                <div className="space-y-4">
                  {myBookings.map(offer => renderOffer(offer))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>You haven't booked any flights yet</p>
                  <div className="mt-4">
                    <Button 
                      onClick={() => router.push('/gdyup/browse')}
                      className="bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]"
                    >
                      Browse Available Flights
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {completedFlights.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Completed Flights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedFlights.map(offer => renderOffer(offer))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeleton()
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map(transaction => renderTransaction(transaction, user?.id))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>No payment history yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Messages</CardTitle>
                <Button 
                  onClick={() => router.push('/gdyup/messages')}
                  className="bg-[#DAFF0D] text-black hover:bg-[#C8EA0C]"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  All Messages
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                renderSkeleton()
              ) : recentMessages.length > 0 ? (
                <div className="space-y-3">
                  {recentMessages.map(message => renderMessagePreview(message))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => router.push('/gdyup/messages')}
                  >
                    View All Messages
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p>You don't have any messages yet.</p>
                  <p className="mt-2 text-sm">Messages will appear here when you communicate with other users.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 