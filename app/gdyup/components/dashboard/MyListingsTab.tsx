'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Plane, 
  Users, 
  Calendar, 
  Loader2, 
  MapPin,
  CreditCard,
  Edit,
  AlertCircle
} from 'lucide-react';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Extended interface for our local component needs
interface ExtendedJetShareOfferWithUser extends JetShareOfferWithUser {
  cancelled?: boolean; // Add a cancelled flag since it's not in the official status enum
}

export default function MyListingsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeListings, setActiveListings] = useState<ExtendedJetShareOfferWithUser[]>([]);
  const [pastListings, setPastListings] = useState<ExtendedJetShareOfferWithUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses, getThemedBadgeClasses } = useGdyupTheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/jetshare/getOffers?viewMode=listings&user_id=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        
        const data = await response.json();
        
        // Process the offers and add the cancelled flag
        const processedOffers = data.offers.map((offer: JetShareOfferWithUser) => {
          // Check if offer has a metadata field that indicates cancellation
          const isCancelled = offer.status === 'available' && 
                             (offer.payment_details?.cancelled || 
                              offer.payment_status === 'failed');
          
          return {
            ...offer,
            cancelled: isCancelled
          };
        });
        
        // Separate active and past listings
        const active = processedOffers.filter((offer: ExtendedJetShareOfferWithUser) => 
          offer.status === 'open' || offer.status === 'accepted'
        ) || [];
        
        const past = processedOffers.filter((offer: ExtendedJetShareOfferWithUser) => 
          offer.status === 'completed' || offer.cancelled === true
        ) || [];
        
        setActiveListings(active);
        setPastListings(past);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError('Unable to load your listings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchListings();
  }, [user]);

  const renderListingCard = (offer: ExtendedJetShareOfferWithUser) => {
    const flightDate = offer.flight_date ? new Date(offer.flight_date) : new Date();
    const hasMatched = offer.status === 'accepted' && offer.matched_user_id;
    
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
                <Plane className="h-4 w-4 rotate-90 text-gdyup-primary" />
                <h3 className={cn("font-medium", getThemedTextClasses())}>{offer.departure_location} → {offer.arrival_location}</h3>
              </div>
              
              {/* Flight details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                  <span>{format(flightDate, 'MMM d, yyyy')}</span>
                </div>
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <Users className="h-3.5 w-3.5 opacity-70" />
                  <span>{offer.available_seats || 0} available / {offer.total_seats || 0} total</span>
                </div>
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <CreditCard className="h-3.5 w-3.5 opacity-70" />
                  <span>{formatCurrency(offer.requested_share_amount || 0)} per seat</span>
                </div>
                <div className={cn("flex items-center gap-1", getThemedTextClasses('muted'))}>
                  <MapPin className="h-3.5 w-3.5 opacity-70" />
                  <span>{offer.arrival_location}</span>
                </div>
              </div>
              
              {/* Listing status */}
              <div className="flex items-center gap-2">
                {offer.status === 'open' && (
                  <Badge className="bg-blue-900/40 text-blue-300 border-blue-800">
                    Active Listing
                  </Badge>
                )}
                
                {hasMatched && (
                  <Badge className="bg-amber-900/40 text-amber-300 border-amber-800">
                    Seat Reserved
                  </Badge>
                )}
                
                {offer.status === 'completed' && (
                  <Badge className="bg-green-900/40 text-green-300 border-green-800">
                    Completed
                  </Badge>
                )}
                
                {offer.cancelled && (
                  <Badge className="bg-red-900/40 text-red-300 border-red-800">
                    Cancelled
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 md:justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/gdyup/offer/${offer.id}`)}
                className="border-gdyup-border hover:bg-gdyup-bg-dark"
              >
                View Details
              </Button>
              
              {offer.status === 'open' && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/offer/${offer.id}/edit`)}
                  className="border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
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
            <Skeleton className="h-5 w-2/3 bg-gdyup-bg-dark" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-4 w-full bg-gdyup-bg-dark" />
              <Skeleton className="h-4 w-full bg-gdyup-bg-dark" />
              <Skeleton className="h-4 w-full bg-gdyup-bg-dark" />
              <Skeleton className="h-4 w-full bg-gdyup-bg-dark" />
            </div>
            <Skeleton className="h-6 w-20 bg-gdyup-bg-dark" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <Card className={cn(
        "border",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={getThemedTextClasses()}>
                My Listings
              </CardTitle>
              <CardDescription className={getThemedTextClasses('muted')}>
                Jet shares you've posted for others
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/gdyup/create')}
              className={getThemedButtonClasses('primary')}
            >
              Create New Listing
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
          ) : activeListings.length === 0 ? (
            <div className={cn("text-center py-10", getThemedTextClasses('muted'))}>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gdyup-bg-dark text-gdyup-primary">
                  <Plane className="h-6 w-6" />
                </div>
              </div>
              <p className="mb-4">You haven't created any jet share listings yet.</p>
              <Button
                onClick={() => router.push('/gdyup/create')}
                className={getThemedButtonClasses('primary')}
              >
                Create Your First Listing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeListings.map(renderListingCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && pastListings.length > 0 && (
        <Card className={cn(
          "border",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <CardHeader>
            <CardTitle className={getThemedTextClasses()}>
              Past Listings
            </CardTitle>
            <CardDescription className={getThemedTextClasses('muted')}>
              Your completed and cancelled listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastListings.map(renderListingCard)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 