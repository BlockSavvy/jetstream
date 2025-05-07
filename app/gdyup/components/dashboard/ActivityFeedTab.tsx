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
  const { getThemeClasses } = useGdyupTheme();
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/gdyup/activity?userId=${user.id}&page=1&limit=10`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch activity feed');
        }
        
        const data = await response.json();
        setActivities(data.activities || []);
        setHasMore(data.hasMore || false);
      } catch (error) {
        console.error('Error fetching activity feed:', error);
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
      
      const nextPage = page + 1;
      const response = await fetch(`/api/gdyup/activity?userId=${user.id}&page=${nextPage}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more activities');
      }
      
      const data = await response.json();
      setActivities([...activities, ...(data.activities || [])]);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
    } catch (error) {
      console.error('Error fetching more activities:', error);
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
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-amber-900/20 text-amber-500",
            blue: "bg-amber-900/20 text-amber-500",
            pink: "bg-amber-900/20 text-amber-500"
          })}>
            <Zap className="h-4 w-4" />
          </div>
        );
      case 'zap_received':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-amber-900/20 text-amber-500",
            blue: "bg-amber-900/20 text-amber-500",
            pink: "bg-amber-900/20 text-amber-500"
          })}>
            <Zap className="h-4 w-4" />
          </div>
        );
      case 'offer_accepted':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-green-900/20 text-green-500",
            blue: "bg-green-900/20 text-green-500",
            pink: "bg-green-900/20 text-green-500"
          })}>
            <CheckCircle className="h-4 w-4" />
          </div>
        );
      case 'boarding_pass_downloaded':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-blue-900/20 text-blue-500",
            blue: "bg-blue-900/20 text-blue-500",
            pink: "bg-blue-900/20 text-blue-500"
          })}>
            <Download className="h-4 w-4" />
          </div>
        );
      case 'wallet_connected':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-green-900/20 text-green-500",
            blue: "bg-green-900/20 text-green-500",
            pink: "bg-green-900/20 text-green-500"
          })}>
            <Wallet className="h-4 w-4" />
          </div>
        );
      case 'wallet_disconnected':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-red-900/20 text-red-500",
            blue: "bg-red-900/20 text-red-500",
            pink: "bg-red-900/20 text-red-500"
          })}>
            <Wallet className="h-4 w-4" />
          </div>
        );
      case 'message_received':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-blue-900/20 text-blue-500",
            blue: "bg-blue-900/20 text-blue-500",
            pink: "bg-blue-900/20 text-blue-500"
          })}>
            <MessageSquare className="h-4 w-4" />
          </div>
        );
      case 'offer_created':
      case 'offer_updated':
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-gdyup-primary/20 text-gdyup-primary",
            blue: "bg-gdyup-primary/20 text-gdyup-primary",
            pink: "bg-gdyup-primary/20 text-gdyup-primary"
          })}>
            <Plane className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className={getThemeClasses({
            base: "rounded-full p-2 flex-shrink-0",
            default: "bg-gray-800 text-gray-400",
            blue: "bg-blue-900 text-blue-400",
            pink: "bg-pink-900 text-pink-400"
          })}>
            <Clock className="h-4 w-4" />
          </div>
        );
    }
  };

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'zap_sent':
        return (
          <>
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              You sent a {activity.amount && formatAmount(activity.amount)} sats zap
            </div>
            <div className={getThemeClasses({
              base: "text-sm",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              {activity.recipient && `To: ${activity.recipient}`}
            </div>
          </>
        );
      case 'zap_received':
        return (
          <>
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              You received a {activity.amount && formatAmount(activity.amount)} sats zap
            </div>
            <div className={getThemeClasses({
              base: "text-sm",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              {activity.sender && `From: ${activity.sender}`}
            </div>
          </>
        );
      case 'offer_accepted':
        return (
          <>
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              Your offer was accepted
            </div>
            {activity.offerDetails && (
              <div className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
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
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              Boarding pass downloaded
            </div>
            {activity.offerDetails && (
              <div className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation}
              </div>
            )}
          </>
        );
      case 'wallet_connected':
        return (
          <div className={getThemeClasses({
            base: "font-medium",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            Bitcoin wallet connected
          </div>
        );
      case 'wallet_disconnected':
        return (
          <div className={getThemeClasses({
            base: "font-medium",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            Bitcoin wallet disconnected
          </div>
        );
      case 'message_received':
        return (
          <>
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              New message received
            </div>
            {activity.messagePreview && (
              <div className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
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
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              You created a new jet share offer
            </div>
            {activity.offerDetails && (
              <div className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation}
              </div>
            )}
          </>
        );
      case 'offer_updated':
        return (
          <>
            <div className={getThemeClasses({
              base: "font-medium",
              default: "text-white",
              blue: "text-blue-50",
              pink: "text-pink-50"
            })}>
              You updated your jet share offer
            </div>
            {activity.offerDetails && (
              <div className={getThemeClasses({
                base: "text-sm",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                {activity.offerDetails.departureLocation} → {activity.offerDetails.arrivalLocation}
              </div>
            )}
          </>
        );
      default:
        return (
          <div className={getThemeClasses({
            base: "font-medium",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
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
          <Skeleton className={getThemeClasses({
            base: "h-8 w-8 rounded-full",
            default: "bg-gray-800",
            blue: "bg-blue-900",
            pink: "bg-pink-900"
          })} />
          <div className="space-y-2 flex-1">
            <Skeleton className={getThemeClasses({
              base: "h-5 w-3/4",
              default: "bg-gray-800",
              blue: "bg-blue-900",
              pink: "bg-pink-900"
            })} />
            <Skeleton className={getThemeClasses({
              base: "h-4 w-1/2",
              default: "bg-gray-800",
              blue: "bg-blue-900",
              pink: "bg-pink-900"
            })} />
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
    <div className="space-y-6">
      <Card className={getThemeClasses({
        base: "border",
        default: "bg-gray-900 border-gray-800",
        blue: "bg-blue-950 border-blue-900",
        pink: "bg-pink-950 border-pink-900"
      })}>
        <CardHeader>
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            Recent Activity
          </CardTitle>
          <CardDescription className={getThemeClasses({
            base: "",
            default: "text-gray-400",
            blue: "text-blue-400",
            pink: "text-pink-400"
          })}>
            Your recent actions and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeletons()
          ) : error ? (
            <div className={getThemeClasses({
              base: "text-center py-10",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
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
            <div className={getThemeClasses({
              base: "text-center py-10",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              <div className="flex justify-center mb-2">
                <div className={getThemeClasses({
                  base: "w-12 h-12 rounded-full flex items-center justify-center",
                  default: "bg-gray-800 text-gdyup-primary",
                  blue: "bg-blue-900 text-gdyup-primary",
                  pink: "bg-pink-900 text-gdyup-primary"
                })}>
                  <Clock className="h-6 w-6" />
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
                    <div className={getThemeClasses({
                      base: "text-sm font-medium sticky top-0 py-1 z-10",
                      default: "bg-gray-900 text-gray-400",
                      blue: "bg-blue-950 text-blue-400",
                      pink: "bg-pink-950 text-pink-400"
                    })}>
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
                            <div className={getThemeClasses({
                              base: "text-xs mt-1",
                              default: "text-gray-500",
                              blue: "text-blue-500",
                              pink: "text-pink-500"
                            })}>
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </div>
                          </div>
                          
                          {activity.offerId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={getThemeClasses({
                                base: "flex-shrink-0",
                                default: "text-gray-400 hover:text-white",
                                blue: "text-blue-400 hover:text-blue-100",
                                pink: "text-pink-400 hover:text-pink-100"
                              })}
                              onClick={() => window.open(`/gdyup/offer/${activity.offerId}`, '_blank')}
                            >
                              <MoreHorizontal className="h-4 w-4" />
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
                      className={getThemeClasses({
                        base: "",
                        default: "border-gray-700 hover:bg-gray-800",
                        blue: "border-blue-700 hover:bg-blue-800",
                        pink: "border-pink-700 hover:bg-pink-800"
                      })}
                    >
                      {isLoadingMore ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
    </div>
  );
} 