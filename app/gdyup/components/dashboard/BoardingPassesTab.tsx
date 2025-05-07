'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useGdyupTheme } from '../../hooks/useGdyupTheme';
import { useAuth } from '@/components/auth-provider';
import { formatCurrency } from '@/lib/utils';
import { format, isFuture, isPast, compareAsc } from 'date-fns';
import { 
  Plane, 
  Ticket,
  Calendar, 
  Loader2, 
  MapPin,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import EnhancedBoardingPassButton from '../EnhancedBoardingPassButton';
import NostrZapButton from '../NostrZapButton';
import { cn } from '@/lib/utils';

interface BoardingPass {
  id: string;
  offerId: string;
  flightNumber: string;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string;
  arrivalTime?: string;
  seatNumber?: string;
  passengerName: string;
  jetModel?: string;
  hostId?: string;
  hostName?: string;
  hostNip05?: string;
}

export default function BoardingPassesTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingPasses, setUpcomingPasses] = useState<BoardingPass[]>([]);
  const [pastPasses, setPastPasses] = useState<BoardingPass[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { getThemeClasses } = useGdyupTheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBoardingPasses = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/gdyup/boardingpasses?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch boarding passes');
        }
        
        const data = await response.json();
        
        // Sort boarding passes by departure time
        const sortedPasses = data.boardingPasses.sort((a: BoardingPass, b: BoardingPass) => {
          return compareAsc(new Date(a.departureTime), new Date(b.departureTime));
        });
        
        // Separate upcoming and past passes
        const upcoming = sortedPasses.filter((pass: BoardingPass) => 
          isFuture(new Date(pass.departureTime))
        );
        
        const past = sortedPasses.filter((pass: BoardingPass) => 
          isPast(new Date(pass.departureTime))
        );
        
        setUpcomingPasses(upcoming);
        setPastPasses(past);
      } catch (error) {
        console.error('Error fetching boarding passes:', error);
        setError('Unable to load your boarding passes. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBoardingPasses();
  }, [user]);

  const renderBoardingPassCard = (pass: BoardingPass) => {
    const departureTime = new Date(pass.departureTime);
    const isUpcoming = isFuture(departureTime);
    
    return (
      <motion.div
        key={pass.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={getThemeClasses({
          base: "border rounded-lg overflow-hidden mb-6",
          default: "bg-gray-900 border-gray-800",
          blue: "bg-blue-950 border-blue-900",
          pink: "bg-pink-950 border-pink-900"
        })}
      >
        {/* Flight status bar */}
        <div className={cn(
          "h-1.5 w-full",
          isUpcoming ? 
            "bg-gdyup-primary" : 
            getThemeClasses({
              base: "",
              default: "bg-gray-700",
              blue: "bg-blue-800",
              pink: "bg-pink-800"
            })
        )}></div>
        
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Flight info */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className={getThemeClasses({
                    base: "p-1.5 rounded",
                    default: "bg-gray-800",
                    blue: "bg-blue-900",
                    pink: "bg-pink-900"
                  })}>
                    <Plane className={cn("h-4 w-4", isUpcoming ? "text-gdyup-primary" : "text-gray-400")} />
                  </div>
                  <div className={getThemeClasses({
                    base: "text-xs",
                    default: "text-gray-400",
                    blue: "text-blue-400",
                    pink: "text-pink-400"
                  })}>
                    Flight {pass.flightNumber}
                  </div>
                </div>
                <h3 className="text-lg font-medium mt-2">{pass.departureLocation} → {pass.arrivalLocation}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <Calendar className="h-4 w-4 opacity-70" />
                  <span>{format(departureTime, 'MMMM d, yyyy')}</span>
                  <span className="mx-1">•</span>
                  <span>{format(departureTime, 'h:mm a')}</span>
                </div>
              </div>
              
              <div className={getThemeClasses({
                base: "p-2 rounded-lg text-center",
                default: "bg-black/20 border border-gray-800",
                blue: "bg-blue-900/20 border border-blue-800",
                pink: "bg-pink-900/20 border border-pink-800"
              })}>
                <div className="text-xs font-medium mb-1">Seat</div>
                <div className="text-xl font-mono">{pass.seatNumber || 'TBA'}</div>
              </div>
            </div>
            
            {/* Passenger info */}
            <div className={getThemeClasses({
              base: "p-3 rounded-md text-sm grid grid-cols-2 gap-4",
              default: "bg-gray-800/50",
              blue: "bg-blue-900/50",
              pink: "bg-pink-900/50"
            })}>
              <div>
                <div className={getThemeClasses({
                  base: "text-xs mb-1",
                  default: "text-gray-400",
                  blue: "text-blue-400",
                  pink: "text-pink-400"
                })}>
                  Passenger
                </div>
                <div className="font-medium">{pass.passengerName}</div>
              </div>
              
              <div>
                <div className={getThemeClasses({
                  base: "text-xs mb-1",
                  default: "text-gray-400",
                  blue: "text-blue-400",
                  pink: "text-pink-400"
                })}>
                  Aircraft
                </div>
                <div className="font-medium">{pass.jetModel || 'Private Jet'}</div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <EnhancedBoardingPassButton 
                offerId={pass.offerId}
                variant="expanded"
                flightData={{
                  flightNumber: pass.flightNumber,
                  departureLocation: pass.departureLocation,
                  arrivalLocation: pass.arrivalLocation,
                  departureTime: pass.departureTime,
                  arrivalTime: pass.arrivalTime,
                  aircraft: pass.jetModel,
                  seat: pass.seatNumber
                }}
                className="w-full"
              />
              
              <div className="flex gap-2">
                {isUpcoming && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/gdyup/chats/${pass.offerId}`)}
                    className={cn(
                      "flex-1",
                      getThemeClasses({
                        base: "",
                        default: "border-gray-700 hover:bg-gray-800",
                        blue: "border-blue-700 hover:bg-blue-800",
                        pink: "border-pink-700 hover:bg-pink-800"
                      })
                    )}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Join Group Chat
                  </Button>
                )}
                
                {pass.hostId && pass.hostNip05 && (
                  <NostrZapButton
                    recipientPubkey={pass.hostId}
                    recipientNip05={pass.hostNip05}
                    className="flex-1"
                    note={`Thanks for the flight to ${pass.arrivalLocation}!`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSkeletons = () => (
    <>
      {[1, 2].map((i) => (
        <div 
          key={`skeleton-${i}`}
          className={getThemeClasses({
            base: "border rounded-lg overflow-hidden mb-6",
            default: "bg-gray-900 border-gray-800",
            blue: "bg-blue-950 border-blue-900",
            pink: "bg-pink-950 border-pink-900"
          })}
        >
          <div className="h-1.5 w-full bg-gray-800"></div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className={getThemeClasses({
                  base: "h-5 w-40",
                  default: "bg-gray-800",
                  blue: "bg-blue-900",
                  pink: "bg-pink-900"
                })} />
                <Skeleton className={getThemeClasses({
                  base: "h-7 w-60",
                  default: "bg-gray-800",
                  blue: "bg-blue-900",
                  pink: "bg-pink-900"
                })} />
                <Skeleton className={getThemeClasses({
                  base: "h-5 w-32",
                  default: "bg-gray-800",
                  blue: "bg-blue-900",
                  pink: "bg-pink-900"
                })} />
              </div>
              <Skeleton className={getThemeClasses({
                base: "h-16 w-16 rounded-lg",
                default: "bg-gray-800",
                blue: "bg-blue-900",
                pink: "bg-pink-900"
              })} />
            </div>
            
            <Skeleton className={getThemeClasses({
              base: "h-20 w-full rounded-md",
              default: "bg-gray-800",
              blue: "bg-blue-900",
              pink: "bg-pink-900"
            })} />
            
            <Skeleton className={getThemeClasses({
              base: "h-24 w-full rounded-md",
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
          <CardTitle className={getThemeClasses({
            base: "",
            default: "text-white",
            blue: "text-blue-50",
            pink: "text-pink-50"
          })}>
            Upcoming Boarding Passes
          </CardTitle>
          <CardDescription className={getThemeClasses({
            base: "",
            default: "text-gray-400",
            blue: "text-blue-400",
            pink: "text-pink-400"
          })}>
            Download or view your boarding passes for upcoming flights
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
          ) : upcomingPasses.length === 0 ? (
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
                  <Ticket className="h-6 w-6" />
                </div>
              </div>
              <p className="mb-4">You don't have any upcoming boarding passes.</p>
              <Button
                onClick={() => router.push('/gdyup/browse')}
              >
                Browse Available Flights
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingPasses.map(renderBoardingPassCard)}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && pastPasses.length > 0 && (
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
              Past Boarding Passes
            </CardTitle>
            <CardDescription className={getThemeClasses({
              base: "",
              default: "text-gray-400",
              blue: "text-blue-400",
              pink: "text-pink-400"
            })}>
              Your boarding passes for completed flights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastPasses.map(renderBoardingPassCard)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 