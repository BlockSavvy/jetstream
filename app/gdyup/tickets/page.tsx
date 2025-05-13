'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  Ticket, 
  Calendar, 
  Clock, 
  User, 
  Users,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Zap
} from 'lucide-react';
import { useGdyupTheme } from '@/app/gdyup/hooks/useGdyupTheme';
import { format, isPast, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import NostrVerificationBadge from '@/app/gdyup/components/NostrVerificationBadge';
import NostrZapButton from '@/app/gdyup/components/NostrZapButton';
import FlightNostrGroup from '@/app/gdyup/components/FlightNostrGroup';
import { useNostr } from '@/app/gdyup/contexts/NostrContext';
import { createClient } from '@/lib/supabase';

export default function TicketsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getThemeClasses, theme } = useGdyupTheme();
  const { isEnabled: isNostrEnabled, pubkey } = useNostr();
  
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('upcoming');
  
  // Fetch user's tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        const supabase = createClient();
        
        // Fetch user's tickets
        const { data: ticketData, error } = await supabase
          .from('tickets')
          .select(`
            id,
            flight_id,
            user_id,
            created_at,
            status,
            ticket_code,
            seat,
            boarding_time,
            metadata,
            jetshare_offers (
              id,
              departure_location,
              departure_location_code,
              arrival_location,
              arrival_location_code,
              flight_date,
              aircraft_type,
              user_id,
              creator: user_profiles!creator (
                full_name,
                npub,
                nostr_pubkey,
                nip05
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching tickets:', error);
          
          // For demo purposes, if we can't fetch real tickets, use mock data
          const mockTickets = [
            {
              id: 'ticket-123',
              flight_id: 'flight-123',
              user_id: user.id,
              created_at: '2023-06-15T12:00:00Z',
              status: 'active',
              ticket_code: 'GDYUP1234',
              seat: '1A',
              boarding_time: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
              metadata: {
                departure_location: 'New York',
                arrival_location: 'Los Angeles',
                aircraft_model: 'Gulfstream G650'
              },
              jetshare_offers: {
                id: 'offer-123',
                departure_location: 'New York',
                departure_location_code: 'NYC',
                arrival_location: 'Los Angeles',
                arrival_location_code: 'LAX',
                flight_date: new Date(Date.now() - 86400000 * 30).toISOString(),
                aircraft_type: 'Gulfstream G650',
                user_id: 'creator-123',
                creator: {
                  full_name: 'John Doe',
                  npub: 'npub1abc123def456',
                  nostr_pubkey: '0abc123def456',
                  nip05: 'john@example.com'
                }
              }
            },
            {
              id: 'ticket-456',
              flight_id: 'flight-456',
              user_id: user.id,
              created_at: '2023-09-20T15:30:00Z',
              status: 'active',
              ticket_code: 'GDYUP5678',
              seat: '3C',
              boarding_time: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
              metadata: {
                departure_location: 'Miami',
                arrival_location: 'Las Vegas',
                aircraft_model: 'Citation X'
              },
              jetshare_offers: {
                id: 'offer-456',
                departure_location: 'Miami',
                departure_location_code: 'MIA',
                arrival_location: 'Las Vegas',
                arrival_location_code: 'LAS',
                flight_date: new Date(Date.now() + 86400000 * 14).toISOString(),
                aircraft_type: 'Citation X',
                user_id: 'creator-456',
                creator: {
                  full_name: 'Jane Smith',
                  npub: 'npub9xyz789abc',
                  nostr_pubkey: '9xyz789abc',
                  nip05: 'jane@example.com'
                }
              }
            }
          ];
          
          setTickets(mockTickets);
        } else {
          // Format tickets with necessary data
          const formattedTickets = ticketData.map((ticket: any) => ({
            ...ticket,
            departure_location: ticket.jetshare_offers?.departure_location || ticket.metadata?.departure_location,
            departure_location_code: ticket.jetshare_offers?.departure_location_code || 
              (ticket.metadata?.departure_location ? ticket.metadata.departure_location.substring(0, 3).toUpperCase() : ""),
            arrival_location: ticket.jetshare_offers?.arrival_location || ticket.metadata?.arrival_location,
            arrival_location_code: ticket.jetshare_offers?.arrival_location_code || 
              (ticket.metadata?.arrival_location ? ticket.metadata.arrival_location.substring(0, 3).toUpperCase() : ""),
            flight_date: ticket.jetshare_offers?.flight_date || ticket.boarding_time,
            aircraft_type: ticket.jetshare_offers?.aircraft_type || ticket.metadata?.aircraft_model,
          }));
          
          setTickets(formattedTickets);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
        
        // Show toast or error message to user
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, [user]);
  
  const upcomingTickets = tickets.filter(ticket => 
    !isPast(parseISO(ticket.flight_date || ticket.boarding_time))
  );
  
  const pastTickets = tickets.filter(ticket => 
    isPast(parseISO(ticket.flight_date || ticket.boarding_time))
  );
  
  const handleViewBoardingPass = (ticketId: string) => {
    router.push(`/gdyup/boardingpass/${ticketId}`);
  };
  
  const renderTicketCard = (ticket: any) => {
    const isPastFlight = isPast(parseISO(ticket.flight_date || ticket.boarding_time));
    const creator = ticket.jetshare_offers?.creator;
    
    return (
      <motion.div
        key={ticket.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <Card className={cn(
          getThemeClasses({
            base: "overflow-hidden border",
            default: "bg-gray-900 border-gray-800",
            luxury: "bg-blue-950 border-blue-900",
            bitcoin: "bg-pink-950 border-pink-900"
          }),
          isPastFlight && "opacity-80"
        )}>
          <div className={getThemeClasses({
            base: "h-2 w-full",
            default: "bg-gdyup-primary",
            luxury: "bg-gdyup-primary",
            bitcoin: "bg-gdyup-primary"
          })}></div>
          
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className={getThemeClasses({
                  base: "text-xl flex items-center",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  <Plane className="h-5 w-5 mr-2 rotate-90" />
                  {ticket.departure_location_code} to {ticket.arrival_location_code}
                </CardTitle>
                <CardDescription className={getThemeClasses({
                  base: "",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>
                  {format(parseISO(ticket.flight_date || ticket.boarding_time), 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </div>
              
              <div className={getThemeClasses({
                base: "px-2 py-1 rounded-full text-xs font-medium",
                default: isPastFlight ? "bg-gray-800 text-gray-300" : "bg-green-900/30 text-green-300 border border-green-800",
                luxury: isPastFlight ? "bg-blue-900 text-blue-300" : "bg-green-900/30 text-green-300 border border-green-800",
                bitcoin: isPastFlight ? "bg-pink-900 text-pink-300" : "bg-green-900/30 text-green-300 border border-green-800"
              })}>
                {isPastFlight ? 'Completed' : 'Confirmed'}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className={getThemeClasses({
              base: "flex items-center justify-between p-3 rounded-lg",
              default: "bg-black/30 border border-gray-800",
              luxury: "bg-blue-950/30 border border-blue-900",
              bitcoin: "bg-pink-950/30 border border-pink-900"
            })}>
              <div className="text-center">
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>From</p>
                <p className={getThemeClasses({
                  base: "font-bold text-lg",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>{ticket.departure_location_code}</p>
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>{ticket.departure_location}</p>
              </div>
              
              <div className="flex-1 flex items-center justify-center px-4">
                <div className={getThemeClasses({
                  base: "h-0.5 flex-1",
                  default: "bg-gray-700",
                  luxury: "bg-blue-700",
                  bitcoin: "bg-pink-700"
                })}></div>
                <Plane className={cn(
                  "mx-2 h-5 w-5 flex-shrink-0 rotate-90",
                  getThemeClasses({
                    base: "",
                    default: "text-gdyup-primary",
                    luxury: "text-gdyup-primary",
                    bitcoin: "text-gdyup-primary"
                  })
                )} />
                <div className={getThemeClasses({
                  base: "h-0.5 flex-1",
                  default: "bg-gray-700",
                  luxury: "bg-blue-700",
                  bitcoin: "bg-pink-700"
                })}></div>
              </div>
              
              <div className="text-center">
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>To</p>
                <p className={getThemeClasses({
                  base: "font-bold text-lg",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>{ticket.arrival_location_code}</p>
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>{ticket.arrival_location}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>
                  <Clock className="h-3 w-3 inline mr-1" />
                  Departure
                </p>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  {format(parseISO(ticket.boarding_time), 'h:mm a')}
                </p>
              </div>
              
              <div>
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Date
                </p>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  {format(parseISO(ticket.flight_date || ticket.boarding_time), 'MMM d, yyyy')}
                </p>
              </div>
              
              <div>
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>
                  <User className="h-3 w-3 inline mr-1" />
                  Seat
                </p>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  {ticket.seat || 'TBD'}
                </p>
              </div>
              
              <div>
                <p className={getThemeClasses({
                  base: "text-xs",
                  default: "text-gray-400",
                  luxury: "text-blue-400",
                  bitcoin: "text-pink-400"
                })}>
                  <Plane className="h-3 w-3 inline mr-1" />
                  Aircraft
                </p>
                <p className={getThemeClasses({
                  base: "font-medium",
                  default: "text-white",
                  luxury: "text-blue-50",
                  bitcoin: "text-pink-50"
                })}>
                  {ticket.aircraft_type || ticket.metadata?.aircraft_model || 'Private Jet'}
                </p>
              </div>
            </div>
            
            {creator && isNostrEnabled && (
              <div className={getThemeClasses({
                base: "flex items-center justify-between p-3 rounded-lg",
                default: "bg-black/20 border border-gray-800",
                luxury: "bg-blue-950/20 border border-blue-900",
                bitcoin: "bg-pink-950/20 border border-pink-900"
              })}>
                <div className="flex items-center gap-2">
                  <p className={getThemeClasses({
                    base: "text-sm font-medium",
                    default: "text-white",
                    luxury: "text-blue-50",
                    bitcoin: "text-pink-50"
                  })}>
                    {creator.full_name}
                  </p>
                  
                  {creator.nip05 && (
                    <NostrVerificationBadge
                      nip05={creator.nip05}
                      pubkey={creator.nostr_pubkey}
                      size="sm"
                    />
                  )}
                </div>
                
                {creator.nostr_pubkey && (
                  <NostrZapButton
                    recipientPubkey={creator.nostr_pubkey}
                    recipientNip05={creator.nip05}
                    size="sm"
                    showAmount={false}
                  />
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className={getThemeClasses({
            base: "flex justify-between gap-3 pt-0",
            default: "",
            luxury: "",
            bitcoin: ""
          })}>
            <Button
              variant="outline"
              size="sm"
              className={getThemeClasses({
                base: "flex-1",
                default: "border-gray-700 hover:bg-gray-800 hover:text-gdyup-primary",
                luxury: "border-blue-700 hover:bg-blue-800 hover:text-gdyup-primary",
                bitcoin: "border-pink-700 hover:bg-pink-800 hover:text-gdyup-primary"
              })}
              onClick={() => handleViewBoardingPass(ticket.id)}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {isPastFlight ? 'View Receipt' : 'Boarding Pass'}
            </Button>
            
            {!isPastFlight && isNostrEnabled && (
              <Button
                variant="secondary"
                size="sm"
                className={getThemeClasses({
                  base: "flex-1",
                  default: "bg-gdyup-secondary/10 hover:bg-gdyup-secondary/20 text-gdyup-secondary",
                  luxury: "bg-gdyup-secondary/10 hover:bg-gdyup-secondary/20 text-gdyup-secondary",
                  bitcoin: "bg-gdyup-secondary/10 hover:bg-gdyup-secondary/20 text-gdyup-secondary"
                })}
                onClick={() => router.push(`/gdyup/boardingpass/${ticket.id}#group`)}
              >
                <Users className="h-4 w-4 mr-2" />
                Flight Group
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {isNostrEnabled && !isPastFlight && (
          <div className="mt-2 mb-6">
            <FlightNostrGroup 
              offerId={ticket.id} 
              flightTitle={`Flight Group: ${ticket.departure_location_code} → ${ticket.arrival_location_code}`} 
              initialCollapsed={true}
            />
          </div>
        )}
      </motion.div>
    );
  };
  
  const handleNavigateBack = () => {
    router.push('/gdyup/dashboard');
  };
  
  return (
    <div className="container px-4 py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={handleNavigateBack}
          className={getThemeClasses({
            base: "mr-2 p-2",
            default: "text-gray-400 hover:text-white",
            luxury: "text-blue-400 hover:text-blue-50",
            bitcoin: "text-pink-400 hover:text-pink-50"
          })}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <h1 className={getThemeClasses({
          base: "text-2xl font-bold",
          default: "text-white",
          luxury: "text-blue-50",
          bitcoin: "text-pink-50"
        })}>
          Your Flight Tickets
        </h1>
      </div>
      
      <Tabs 
        defaultValue="upcoming" 
        value={currentTab}
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <TabsList className={getThemeClasses({
          base: "w-full mb-6",
          default: "bg-gray-900 border-b border-gray-800",
          luxury: "bg-blue-950 border-b border-blue-900",
          bitcoin: "bg-pink-950 border-b border-pink-900"
        })}>
          <TabsTrigger 
            value="upcoming"
            className={currentTab === 'upcoming' ? 
              getThemeClasses({
                base: "flex-1",
                default: "data-[state=active]:bg-gray-800 data-[state=active]:text-white",
                luxury: "data-[state=active]:bg-blue-900 data-[state=active]:text-blue-50",
                bitcoin: "data-[state=active]:bg-pink-900 data-[state=active]:text-pink-50"
              }) : 
              getThemeClasses({
                base: "flex-1",
                default: "text-gray-400",
                luxury: "text-blue-400",
                bitcoin: "text-pink-400"
              })
            }
          >
            Upcoming Flights ({upcomingTickets.length})
          </TabsTrigger>
          
          <TabsTrigger 
            value="past"
            className={currentTab === 'past' ? 
              getThemeClasses({
                base: "flex-1",
                default: "data-[state=active]:bg-gray-800 data-[state=active]:text-white",
                luxury: "data-[state=active]:bg-blue-900 data-[state=active]:text-blue-50",
                bitcoin: "data-[state=active]:bg-pink-900 data-[state=active]:text-pink-50"
              }) : 
              getThemeClasses({
                base: "flex-1",
                default: "text-gray-400",
                luxury: "text-blue-400",
                bitcoin: "text-pink-400"
              })
            }
          >
            Past Flights ({pastTickets.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gdyup-primary" />
            </div>
          ) : upcomingTickets.length === 0 ? (
            <div className={getThemeClasses({
              base: "text-center py-12",
              default: "text-gray-400",
              luxury: "text-blue-400",
              bitcoin: "text-pink-400"
            })}>
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Upcoming Flights</h3>
              <p className="max-w-sm mx-auto">
                You don't have any upcoming flights. Browse available flights and book your next journey.
              </p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/gdyup/browse')}
              >
                Browse Flights
              </Button>
            </div>
          ) : (
            <div>
              {upcomingTickets.map(renderTicketCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gdyup-primary" />
            </div>
          ) : pastTickets.length === 0 ? (
            <div className={getThemeClasses({
              base: "text-center py-12",
              default: "text-gray-400",
              luxury: "text-blue-400",
              bitcoin: "text-pink-400"
            })}>
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Past Flights</h3>
              <p>You haven't taken any flights with us yet.</p>
            </div>
          ) : (
            <div>
              {pastTickets.map(renderTicketCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 