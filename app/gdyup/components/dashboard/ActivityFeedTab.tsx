'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Zap, 
  Clock,
  Download,
  Loader2,
  Wallet,
  Radio,
  User,
  CheckCircle,
  Plane,
  MessageSquare,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DashboardWrapper } from './index';
import { ThemedIcon } from '../core/ThemedIcon';

interface ActivityItem {
  id: string;
  type: 'zap_sent' | 'zap_received' | 'offer_accepted' | 'boarding_pass_downloaded' | 
        'wallet_connected' | 'wallet_disconnected' | 'message_received' | 'offer_created' | 'offer_updated';
  timestamp: string;
  amount?: number;
  sender?: string;
  recipient?: string;
  offerId?: string;
  offerDetails?: {
    departureLocation: string;
    arrivalLocation: string;
    flightDate: string;
  };
  messagePreview?: string;
}

export default function ActivityFeedTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Add a timeout to handle stalled requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(`/api/gdyup/activity?userId=${user.id}&page=1&limit=10`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
            }
          });
          
          clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`Activity feed API returned status: ${response.status}`);
            setActivities([]);
            setHasMore(false);
            return;
        }
        
        const data = await response.json();
          
          // Check if API returned the expected data structure
          if (!data || !Array.isArray(data.activities)) {
            console.warn('Activity feed API returned unexpected data format', data);
            setActivities([]);
            setHasMore(false);
            return;
          }
          
        setActivities(data.activities || []);
        setHasMore(data.hasMore || false);
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            console.warn('Activity feed API request timed out');
          } else {
            console.error('Error fetching activity feed:', fetchError);
          }
          // Set empty arrays to show empty state instead of loading indefinitely
          setActivities([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error in activity feed tab:', error);
        setError('Unable to load your activity feed. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, [user]);

  const loadMoreActivities = async () => {
    if (!user || isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      
      // Add timeout and proper error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const nextPage = page + 1;
        const response = await fetch(`/api/gdyup/activity?userId=${user.id}&page=${nextPage}&limit=10`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        clearTimeout(timeoutId);
      
      if (!response.ok) {
          console.warn(`Activity feed load more API returned status: ${response.status}`);
          // Don't modify the activities array on error, just return
          return;
      }
      
      const data = await response.json();
        
        // Check if API returned the expected data structure
        if (!data || !Array.isArray(data.activities)) {
          console.warn('Activity feed load more API returned unexpected data format', data);
          return;
        }
        
      setActivities([...activities, ...(data.activities || [])]);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          console.warn('Activity feed load more API request timed out');
        } else {
          console.error('Error fetching more activities:', fetchError);
        }
        // Don't display an error message for this failure
      }
    } catch (error) {
      console.error('Error in activity feed load more:', error);
      setError('Unable to load more activities. Please try again later.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderActivityIcon = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'zap_sent':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-amber-900/20 text-amber-500">
            <ThemedIcon icon={Zap} size={16} className="text-amber-500" />
          </div>
        );
      case 'zap_received':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-amber-900/20 text-amber-500">
            <ThemedIcon icon={Zap} size={16} className="text-amber-500" />
          </div>
        );
      case 'offer_accepted':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-green-900/20 text-green-500">
            <ThemedIcon icon={CheckCircle} size={16} className="text-green-500" />
          </div>
        );
      case 'boarding_pass_downloaded':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-blue-900/20 text-blue-500">
            <ThemedIcon icon={Download} size={16} className="text-blue-500" />
          </div>
        );
      case 'wallet_connected':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-green-900/20 text-green-500">
            <ThemedIcon icon={Wallet} size={16} className="text-green-500" />
          </div>
        );
      case 'wallet_disconnected':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-red-900/20 text-red-500">
            <ThemedIcon icon={Wallet} size={16} className="text-red-500" />
          </div>
        );
      case 'message_received':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-blue-900/20 text-blue-500">
            <ThemedIcon icon={MessageSquare} size={16} className="text-blue-500" />
          </div>
        );
      case 'offer_created':
      case 'offer_updated':
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-gdyup-primary/20 text-gdyup-primary">
            <ThemedIcon icon={Plane} size={16} className="text-gdyup-primary" />
          </div>
        );
      default:
        return (
          <div className="rounded-full p-2 flex-shrink-0 bg-gray-800 text-gray-400">
            <ThemedIcon icon={Clock} size={16} className="text-gray-400" />
          </div>
        );
    }
  };

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'zap_sent':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              You sent a {activity.amount && formatAmount(activity.amount)} sats zap
            </div>
            <div className={cn("text-sm", getThemedTextClasses('muted'))}>
              {activity.recipient && `To: ${activity.recipient}`}
            </div>
          </>
        );
      case 'zap_received':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              You received a {activity.amount && formatAmount(activity.amount)} sats zap
            </div>
            <div className={cn("text-sm", getThemedTextClasses('muted'))}>
              {activity.sender && `From: ${activity.sender}`}
            </div>
          </>
        );
      case 'offer_accepted':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              Your offer was accepted
            </div>
            {activity.offerDetails && (
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation} on {
                  format(new Date(activity.offerDetails.flightDate), 'MMM d, yyyy')
                }
              </div>
            )}
          </>
        );
      case 'boarding_pass_downloaded':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              Boarding pass downloaded
            </div>
            {activity.offerDetails && (
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation}
              </div>
            )}
          </>
        );
      case 'wallet_connected':
        return (
          <div className={cn("font-medium", getThemedTextClasses())}>
            Bitcoin wallet connected
          </div>
        );
      case 'wallet_disconnected':
        return (
          <div className={cn("font-medium", getThemedTextClasses())}>
            Bitcoin wallet disconnected
          </div>
        );
      case 'message_received':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              New message received
            </div>
            {activity.messagePreview && (
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                {activity.messagePreview.length > 35 
                  ? `${activity.messagePreview.substring(0, 35)}...` 
                  : activity.messagePreview}
              </div>
            )}
          </>
        );
      case 'offer_created':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              You created a new jet share offer
            </div>
            {activity.offerDetails && (
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation}
              </div>
            )}
          </>
        );
      case 'offer_updated':
        return (
          <>
            <div className={cn("font-medium", getThemedTextClasses())}>
              You updated your jet share offer
            </div>
            {activity.offerDetails && (
              <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation}
              </div>
            )}
          </>
        );
      default:
        return (
          <div className={cn("font-medium", getThemedTextClasses())}>
            Unknown activity
          </div>
        );
    }
  };

  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={`skeleton-${i}`}
          className="flex items-start gap-3 mb-4"
        >
          <Skeleton className="h-8 w-8 rounded-full bg-gdyup-bg-dark" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4 bg-gdyup-bg-dark" />
            <Skeleton className="h-4 w-1/2 bg-gdyup-bg-dark" />
          </div>
        </div>
      ))}
    </>
  );

  // Group activities by date
  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: { [key: string]: ActivityItem[] } = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(activity);
    });
    
    return Object.entries(groups).map(([dateKey, activities]) => ({
      date: dateKey,
      displayDate: format(new Date(dateKey), 'MMMM d, yyyy'),
      activities
    }));
  };

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <DashboardWrapper className="space-y-6">
      <Card className={cn(
        "border",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <CardHeader>
          <CardTitle className={getThemedTextClasses()}>
            Recent Activity
          </CardTitle>
          <CardDescription className={getThemedTextClasses('muted')}>
            Your recent actions and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className={cn("text-center py-10", getThemedTextClasses('muted'))}>
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : activities.length === 0 ? (
            <div className={cn("text-center py-10", getThemedTextClasses('muted'))}>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gdyup-bg-dark text-gdyup-primary">
                  <ThemedIcon icon={Clock} size={24} className="text-gdyup-primary" />
                </div>
              </div>
              <p className="mb-4">No recent activity to display.</p>
              <p className="text-sm max-w-md mx-auto">
                Your recent actions like booking flights, downloading boarding passes, and receiving zaps will appear here.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px] pr-4">
              <div className="space-y-6">
                {groupedActivities.map(group => (
                  <div key={group.date} className="space-y-3">
                    <div className={cn(
                      "text-sm font-medium sticky top-0 py-1 z-10",
                      getThemedBackgroundClasses('card'),
                      getThemedTextClasses('muted')
                    )}>
                      {group.displayDate}
                    </div>
                    <AnimatePresence>
                      {group.activities.map(activity => (
                        <motion.div 
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-3 mb-4"
                        >
                          {renderActivityIcon(activity)}
                          
                          <div className="flex-1 min-w-0">
                            {renderActivityContent(activity)}
                            <div className="text-xs mt-1 text-gdyup-text-muted">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                          
                          {activity.offerId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gdyup-text-muted hover:text-gdyup-text flex-shrink-0"
                              onClick={() => window.open(`/gdyup/offer/${activity.offerId}`, '_blank')}
                            >
                              <ThemedIcon icon={MoreHorizontal} size={16} />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={loadMoreActivities}
                      disabled={isLoadingMore}
                      className="border-gdyup-border hover:bg-gdyup-bg-dark"
                    >
                      {isLoadingMore ? (
                        <>
                          <ThemedIcon icon={RefreshCw} size={16} className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </DashboardWrapper>
  );
} 