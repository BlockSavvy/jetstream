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
  ExternalLink
} from 'lucide-react';
import { JetShareOfferWithUser } from '@/types/jetshare';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
  const { getThemeClasses } = useGdyupTheme();
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
                  <span>{offer.requested_seats || 1} {offer.requested_seats === 1 ? 'seat' : 'seats'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 opacity-70" />
                  <span>{formatCurrency(offer.requested_share_amount || 0)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 opacity-70" />
                  <span>{offer.arrival_location}</span>
                </div>
              </div>
              
              {/* Booking status */}
              <div>
                {offer.status === 'completed' ? (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-green-900/40 text-green-300 border-green-800",
                    blue: "bg-green-900/40 text-green-300 border-green-800",
                    pink: "bg-green-900/40 text-green-300 border-green-800"
                  })}>
                    Completed
                  </Badge>
                ) : isPendingPayment ? (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-amber-900/40 text-amber-300 border-amber-800",
                    blue: "bg-amber-900/40 text-amber-300 border-amber-800",
                    pink: "bg-amber-900/40 text-amber-300 border-amber-800"
                  })}>
                    Payment Required
                  </Badge>
                ) : (
                  <Badge className={getThemeClasses({
                    base: "",
                    default: "bg-blue-900/40 text-blue-300 border-blue-800",
                    blue: "bg-blue-900/40 text-blue-300 border-blue-800",
                    pink: "bg-blue-900/40 text-blue-300 border-blue-800"
                  })}>
                    Confirmed
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 md:justify-center">
              {isPendingPayment ? (
                <Button
                  onClick={() => router.push(`/gdyup/payment/${offer.id}`)}
                  className={getThemeClasses({
                    base: "",
                    default: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
                    blue: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
                    pink: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90"
                  })}
                >
                  Complete Payment
                </Button>
              ) : (
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
              )}
              
              {offer.status === 'completed' && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/gdyup/boardingpass/${offer.id}`)}
                  className={getThemeClasses({
                    base: "",
                    default: "border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10",
                    blue: "border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10",
                    pink: "border-gdyup-primary/50 text-gdyup-primary hover:bg-gdyup-primary/10"
                  })}
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
                Active Bookings
              </CardTitle>
              <CardDescription className={getThemeClasses({
                base: "",
                default: "text-gray-400",
                blue: "text-blue-400",
                pink: "text-pink-400"
              })}>
                Your current and upcoming flights
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/gdyup/browse')}
              className={getThemeClasses({
                base: "",
                default: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
                blue: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90",
                pink: "bg-gdyup-primary text-black hover:bg-gdyup-primary/90"
              })}
            >
              Browse Flights
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
          ) : activeBookings.length === 0 ? (
            <div className={getThemeClasses({
              base: "text-center py-10",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              <p>You don't have any active bookings.</p>
              <Button
                onClick={() => router.push('/gdyup/browse')}
                className="mt-4"
              >
                Browse Available Flights
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map(renderBookingCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && completedBookings.length > 0 && (
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
              Past Bookings
            </CardTitle>
            <CardDescription className={getThemeClasses({
              base: "",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
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
    </div>
  );
} 