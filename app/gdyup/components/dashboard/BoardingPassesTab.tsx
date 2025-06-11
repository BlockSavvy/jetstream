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
import { DashboardWrapper } from './index';
import { ThemedIcon } from '../core/ThemedIcon';

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
  const { getThemedTextClasses, getThemedButtonClasses, getThemedBackgroundClasses } = useGdyupTheme();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const fetchBoardingPasses = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Add a timeout to handle stalled requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(`/api/gdyup/boardingpasses?userId=${user.id}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
            }
          });
          
          clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`Boarding passes API returned status: ${response.status}`);
            setUpcomingPasses([]);
            setPastPasses([]);
            return;
        }
        
        const data = await response.json();
          
          // Check if API returned the expected data structure
          if (!data || !Array.isArray(data.boardingPasses)) {
            console.warn('Boarding passes API returned unexpected data format', data);
            setUpcomingPasses([]);
            setPastPasses([]);
            return;
          }
        
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
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            console.warn('Boarding passes API request timed out');
          } else {
            console.error('Error fetching boarding passes:', fetchError);
          }
          // Set empty arrays to show empty state instead of loading indefinitely
          setUpcomingPasses([]);
          setPastPasses([]);
        }
      } catch (error) {
        console.error('Error in boarding passes tab:', error);
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
        className={cn(
          "border rounded-lg overflow-hidden mb-4",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}
      >
        {/* Flight status bar */}
        <div className={cn(
          "h-1.5 w-full",
          isUpcoming ? 
            "bg-gdyup-primary" : 
            "bg-gdyup-border"
        )}></div>
        
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Flight info */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-gdyup-bg-dark">
                    <ThemedIcon 
                      icon={Plane} 
                      className={isUpcoming ? "text-gdyup-primary" : "text-gdyup-text-muted"} 
                    />
                  </div>
                  <div className={getThemedTextClasses('muted')}>
                    Flight {pass.flightNumber}
                  </div>
                </div>
                <h3 className={cn("text-lg font-medium mt-2", getThemedTextClasses())}>{pass.departureLocation} → {pass.arrivalLocation}</h3>
                <div className={cn("flex items-center gap-2 mt-1 text-sm", getThemedTextClasses('muted'))}>
                  <ThemedIcon 
                    icon={Calendar} 
                    className="text-gdyup-text-muted" 
                  />
                  <span>{format(departureTime, 'MMMM d, yyyy')}</span>
                  <span className="mx-1">•</span>
                  <span>{format(departureTime, 'h:mm a')}</span>
                </div>
              </div>
              
              <div className="p-2 rounded-lg text-center bg-gdyup-bg-dark/50 border border-gdyup-border">
                <div className={cn("text-xs font-medium mb-1", getThemedTextClasses('muted'))}>Seat</div>
                <div className="text-xl font-mono">{pass.seatNumber || 'TBA'}</div>
              </div>
            </div>
            
            {/* Passenger info */}
            <div className="p-3 rounded-md text-sm grid grid-cols-2 gap-4 bg-gdyup-bg-dark/50">
              <div>
                <div className={cn("text-xs mb-1", getThemedTextClasses('muted'))}>
                  Passenger
                </div>
                <div className="font-medium">{pass.passengerName}</div>
              </div>
              
              <div>
                <div className={cn("text-xs mb-1", getThemedTextClasses('muted'))}>
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
                      "border-gdyup-border hover:bg-gdyup-bg-dark"
                    )}
                  >
                    <ThemedIcon 
                      icon={MessageSquare} 
                      className="text-gdyup-text-muted mr-2" 
                    />
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
          className={cn(
            "border rounded-lg overflow-hidden mb-6",
            getThemedBackgroundClasses('card'),
            "border-gdyup-border"
          )}
        >
          <div className="h-1.5 w-full bg-gdyup-border"></div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 bg-gdyup-bg-dark" />
                <Skeleton className="h-7 w-60 bg-gdyup-bg-dark" />
                <Skeleton className="h-5 w-32 bg-gdyup-bg-dark" />
              </div>
              <Skeleton className="h-16 w-16 rounded-lg bg-gdyup-bg-dark" />
            </div>
            
            <Skeleton className="h-20 w-full rounded-md bg-gdyup-bg-dark" />
            
            <Skeleton className="h-24 w-full rounded-md bg-gdyup-bg-dark" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <DashboardWrapper className="space-y-6">
      <Card className={cn(
        "border",
        getThemedBackgroundClasses('card'),
        "border-gdyup-border"
      )}>
        <CardHeader>
          <CardTitle className={getThemedTextClasses()}>
            Upcoming Boarding Passes
          </CardTitle>
          <CardDescription className={getThemedTextClasses('muted')}>
            Download or view your boarding passes for upcoming flights
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
          ) : upcomingPasses.length === 0 ? (
            <div className={cn("text-center py-10", getThemedTextClasses('muted'))}>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gdyup-bg-dark text-gdyup-primary">
                  <ThemedIcon 
                    icon={Ticket} 
                    className="text-gdyup-primary" 
                  />
                </div>
              </div>
              <p className="mb-4">You don't have any upcoming boarding passes.</p>
              <Button
                onClick={() => router.push('/gdyup/browse')}
                className={getThemedButtonClasses('primary')}
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
        <Card className={cn(
          "border",
          getThemedBackgroundClasses('card'),
          "border-gdyup-border"
        )}>
          <CardHeader>
            <CardTitle className={getThemedTextClasses()}>
              Past Boarding Passes
            </CardTitle>
            <CardDescription className={getThemedTextClasses('muted')}>
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
    </DashboardWrapper>
  );
} 