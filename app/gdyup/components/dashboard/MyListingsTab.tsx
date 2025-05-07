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

// Extended interface for our local component needs
interface ExtendedJetShareOfferWithUser extends JetShareOfferWithUser {
  cancelled?: boolean; // Add a cancelled flag since it's not in the official status enum
}

export default function MyListingsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeListings, setActiveListings] = useState<ExtendedJetShareOfferWithUser[]>([]);
  const [pastListings, setPastListings] = useState<ExtendedJetShareOfferWithUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { getThemeClasses } = useGdyupTheme();
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
        className={getThemeClasses({
          base: "border rounded-lg overflow-hidden mb-4",
          default: "bg-gray-900 border-gray-800",
          blue: "bg-blue-950 border-blue-900",
          pink: "bg-pink-950 border-pink-900"
        })}
      >
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div className="space-y-3">
              {/* Flight route */}
              <div className="flex items-center gap-2">
                <Plane className={getThemeClasses({
                  base: "h-4 w-4 rotate-90",
                  default: "text-gdyup-primary",
                  blue: "text-gdyup-primary",
                  pink: "text-gdyup-primary"
                })} />
                <h3 className="font-medium">{offer.departure_location} → {offer.arrival_location}</h3>
              </div>
              
              {/* Flight details */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 opacity-70" />
                  <span>{format(flightDate, 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 opacity-70" />
                  <span>{offer.available_seats || 0} available / {offer.total_seats || 0} total</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 opacity-70" />
                  <span>{formatCurrency(offer.requested_share_amount || 0)} per seat</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 opacity-70" />
                  <span>{offer.arrival_location}</span>
                </div>
              </div>
              
              {/* Listing status */}
              <div className="flex items-center gap-2">
                {offer.status === 'open' && (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-blue-900/40 text-blue-300 border-blue-800",
                    blue: "bg-blue-900/40 text-blue-300 border-blue-800",
                    pink: "bg-blue-900/40 text-blue-300 border-blue-800"
                  })}>
                    Active Listing
                  </Badge>
                )}
                
                {hasMatched && (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-amber-900/40 text-amber-300 border-amber-800",
                    blue: "bg-amber-900/40 text-amber-300 border-amber-800",
                    pink: "bg-amber-900/40 text-amber-300 border-amber-800"
                  })}>
                    Seat Reserved
                  </Badge>
                )}
                
                {offer.status === 'completed' && (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-green-900/40 text-green-300 border-green-800",
                    blue: "bg-green-900/40 text-green-300 border-green-800",
                    pink: "bg-green-900/40 text-green-300 border-green-800"
                  })}>
                    Completed
                  </Badge>
                )}
                
                {offer.cancelled && (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-red-900/40 text-red-300 border-red-800",
                    blue: "bg-red-900/40 text-red-300 border-red-800",
                    pink: "bg-red-900/40 text-red-300 border-red-800"
                  })}>
                    Cancelled
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 md:justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/gdyup/offer/${offer.id}`)}
                className={getThemeClasses({
                  base: "",
                  default: "border-gray-700 hover:bg-gray-800",
                  blue: "border-blue-700 hover:bg-blue-800",
                  pink: "border-pink-700 hover:bg-pink-800"
                })}
              >
                View Details
              </Button>
              
              {offer.status === 'open' && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/offer/${offer.id}/edit`)}
                  className={getThemeClasses({
                    base: "",
                    default: "border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10",
                    blue: "border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10",
                    pink: "border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10"
                  })}
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
          className={getThemeClasses({
            base: "border rounded-lg overflow-hidden mb-4 p-4",
            default: "bg-gray-900 border-gray-800",
            blue: "bg-blue-950 border-blue-900",
            pink: "bg-pink-950 border-pink-900"
          })}
        >
          <div className="space-y-3">
            <Skeleton className={getThemeClasses({
              base: "h-5 w-2/3",
              default: "bg-gray-800",
              blue: "bg-blue-900",
              pink: "bg-pink-900"
            })} />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className={getThemeClasses({
                base: "h-4 w-full",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
              <Skeleton className={getThemeClasses({
                base: "h-4 w-full",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
              <Skeleton className={getThemeClasses({
                base: "h-4 w-full",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
              <Skeleton className={getThemeClasses({
                base: "h-4 w-full",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
            </div>
            <Skeleton className={getThemeClasses({
              base: "h-6 w-20",
              default: "bg-gray-800",
              blue: "bg-blue-900",
              pink: "bg-pink-900"
            })} />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <Card className={getThemeClasses({
        base: "border",
        default: "bg-gray-900 border-gray-800",
        blue: "bg-blue-950 border-blue-900",
        pink: "bg-pink-950 border-pink-900"
      })}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className={getThemeClasses({
                base: "",
                default: "text-white",
                blue: "text-blue-50",
                pink: "text-pink-50"
              })}>
                My Listings
              </CardTitle>
              <CardDescription className={getThemeClasses({
                base: "",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                Jet shares you've posted for others
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/gdyup/create')}
              className={getThemeClasses({
                base: "",
                default: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
                blue: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
                pink: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90"
              })}
            >
              Create New Listing
            </Button>
          </div>
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
          ) : activeListings.length === 0 ? (
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
                  <Plane className="h-6 w-6" />
                </div>
              </div>
              <p className="mb-4">You haven't created any jet share listings yet.</p>
              <Button
                onClick={() => router.push('/gdyup/create')}
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
              Past Listings
            </CardTitle>
            <CardDescription className={getThemeClasses({
              base: "",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
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