'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Plane, 
  Users, 
  Calendar, 
  Loader2, 
  MapPin,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ThemedIcon } from '../core/ThemedIcon';
import { DashboardWrapper, DashboardCard, DashboardHeader, DashboardText } from './index';

// Extended interface for our local component needs
interface ExtendedJetShareOfferWithUser extends JetShareOfferWithUser {
  payment_completed?: boolean;
  requested_seats?: number;
}

export default function MyBookingsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeBookings, setActiveBookings] = useState<ExtendedJetShareOfferWithUser[]>([]);
  const [completedBookings, setCompletedBookings] = useState<ExtendedJetShareOfferWithUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses } = useGdyupTheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/jetshare/getOffers?viewMode=bookings&user_id=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        
        const data = await response.json();
        
        // Separate active and completed bookings
        const active = data.offers.filter((offer: ExtendedJetShareOfferWithUser) => 
          offer.status === 'accepted' || offer.status === 'accepted_but_unpaid'
        ) || [];
        
        const completed = data.offers.filter((offer: ExtendedJetShareOfferWithUser) => 
          offer.status === 'completed'
        ) || [];
        
        setActiveBookings(active);
        setCompletedBookings(completed);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Unable to load your bookings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [user]);

  const renderBookingCard = (offer: ExtendedJetShareOfferWithUser) => {
    const isPendingPayment = offer.status === 'accepted_but_unpaid' || (offer.status === 'accepted' && !offer.payment_completed);
    const flightDate = offer.flight_date ? new Date(offer.flight_date) : new Date();
    
    return (
      <motion.div
        key={offer.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "border rounded-lg overflow-hidden mb-4",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}
      >
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div className="space-y-3">
              {/* Flight route */}
              <div className="flex items-center gap-2">
                <ThemedIcon 
                  icon={Plane} 
                  size={16} 
                  className={cn("rotate-90", "text-gdyup-primary")} 
                />
                <h3 className={cn(getThemedTextClasses(), "font-medium")}>{offer.departure_location} → {offer.arrival_location}</h3>
              </div>
              
              {/* Flight details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <ThemedIcon icon={Calendar} size={14} />
                  <span>{format(flightDate, 'MMM d, yyyy')}</span>
                </div>
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <ThemedIcon icon={Users} size={14} />
                  <span>{offer.requested_seats || 1} {offer.requested_seats === 1 ? 'seat' : 'seats'}</span>
                </div>
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <ThemedIcon icon={CreditCard} size={14} />
                  <span>{formatCurrency(offer.requested_share_amount || 0)}</span>
                </div>
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <ThemedIcon icon={MapPin} size={14} />
                  <span>{offer.arrival_location}</span>
                </div>
              </div>
              
              {/* Booking status */}
              <div>
                {offer.status === 'completed' ? (
                  <Badge className="bg-green-900/40 text-green-300 border-green-800">
                    Completed
                  </Badge>
                ) : isPendingPayment ? (
                  <Badge className="bg-amber-900/40 text-amber-300 border-amber-800">
                    Payment Required
                  </Badge>
                ) : (
                  <Badge className="bg-blue-900/40 text-blue-300 border-blue-800">
                    Confirmed
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 md:justify-center">
              {isPendingPayment ? (
                <Button
                  onClick={() => router.push(`/gdyup/payment/${offer.id}`)}
                  className={getThemedButtonClasses('primary')}
                >
                  Complete Payment
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/offer/${offer.id}`)}
                  className="border-gdyup-border hover:bg-gdyup-bg-card"
                >
                  View Details
                </Button>
              )}
              
              {offer.status === 'completed' && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/boardingpass/${offer.id}`)}
                  className="border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10"
                >
                  Boarding Pass
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div 
          key={`skeleton-${i}`}
          className={cn(
            "border rounded-lg overflow-hidden mb-4 p-4",
            getThemedBackgroundClasses('card'),
            "border-gdyup-border"
          )}
        >
          <div className="space-y-3">
            <Skeleton className={cn("h-5 w-2/3 bg-gdyup-bg-dark")} />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className={cn("h-4 w-full bg-gdyup-bg-dark")} />
              <Skeleton className={cn("h-4 w-full bg-gdyup-bg-dark")} />
              <Skeleton className={cn("h-4 w-full bg-gdyup-bg-dark")} />
              <Skeleton className={cn("h-4 w-full bg-gdyup-bg-dark")} />
            </div>
            <Skeleton className={cn("h-6 w-20 bg-gdyup-bg-dark")} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <DashboardWrapper className="space-y-6">
      <Card className={cn(
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={getThemedTextClasses()}>
                Active Bookings
              </CardTitle>
              <CardDescription className={getThemedTextClasses('muted')}>
                Your current and upcoming flights
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/gdyup/browse')}
              className={getThemedButtonClasses('primary')}
            >
              Browse Flights
            </Button>
          </div>
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
          ) : activeBookings.length === 0 ? (
            <div className={cn("text-center py-10", getThemedTextClasses('muted'))}>
              <p>You don't have any active bookings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map(renderBookingCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && completedBookings.length > 0 && (
        <Card className={cn(
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <CardHeader>
            <CardTitle className={getThemedTextClasses()}>
              Past Bookings
            </CardTitle>
            <CardDescription className={getThemedTextClasses('muted')}>
              Your completed flights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedBookings.map(renderBookingCard)}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardWrapper>
  );
} 