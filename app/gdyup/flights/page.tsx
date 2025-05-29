'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plane, DollarSign, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGdyupTheme } from '../hooks/useGdyupTheme';
import { useAuth } from '@/lib/auth-provider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import EliteZapSheet from '../components/EliteZapSheet';
import { useNostr } from '../contexts/NostrContext';

interface JetShareOffer {
  id: string;
  departure_location: string;
  arrival_location: string;
  flight_date: string;
  departure_time?: string;
  aircraft_model?: string;
  total_seats?: number;
  available_seats?: number;
  total_flight_cost: number;
  requested_share_amount: number;
  status: 'open' | 'accepted' | 'completed' | 'cancelled';
  matched_user_id?: string;
  created_at: string;
  updated_at: string;
}

interface FlightBooking {
  id: string;
  flight_id: string;
  seats_booked: number;
  total_amount: number;
  booking_status: string;
  created_at: string;
  flights: {
    id: string;
    origin_airport: string;
    destination_airport: string;
    departure_time: string;
    arrival_time: string;
    jets: {
      manufacturer: string;
      model: string;
    };
    origin: {
      code: string;
      city: string;
      country: string;
    };
    destination: {
      code: string;
      city: string;
      country: string;
    };
  };
}

type CombinedFlight = {
  id: string;
  type: 'listed' | 'booked';
  from: string;
  to: string;
  date: string;
  time: string;
  aircraft: string;
  seats: number;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  originalData: JetShareOffer | FlightBooking;
};

export default function FlightsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [offers, setOffers] = useState<JetShareOffer[]>([]);
  const [bookings, setBookings] = useState<FlightBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZapSheet, setShowZapSheet] = useState(false);
  const [selectedZapRecipient, setSelectedZapRecipient] = useState<{
    pubkey: string;
    name: string;
    nip05?: string;
    context: string;
  } | null>(null);
  
  const { getThemedTextClasses } = useGdyupTheme();
  const { user } = useAuth();
  const { isConnected } = useNostr();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUserFlights();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserFlights = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch user's jetshare offers
      const offersResponse = await fetch(`/api/jetshare/getOffers?userId=${user.id}`);
      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setOffers(offersData.offers || []);
      }

      // Fetch user's flight bookings
      const bookingsResponse = await fetch(`/api/flights/tickets?userId=${user.id}`);
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        // Extract bookings from tickets data
        const userBookings = bookingsData.tickets?.map((ticket: any) => ({
          id: ticket.booking_id || ticket.id,
          flight_id: ticket.bookings?.flight_id,
          seats_booked: ticket.bookings?.seats_booked || 1,
          total_amount: ticket.bookings?.total_amount || 0,
          booking_status: ticket.status || 'confirmed',
          created_at: ticket.created_at,
          flights: ticket.flights
        })) || [];
        setBookings(userBookings);
      }
    } catch (error) {
      console.error('Error fetching user flights:', error);
      toast.error('Failed to load your flights');
    } finally {
      setLoading(false);
    }
  };

  // Combine and transform offers and bookings into a unified format
  const combinedFlights: CombinedFlight[] = [
    // Transform jetshare offers
    ...offers.map((offer): CombinedFlight => {
      const flightDate = new Date(offer.flight_date);
      const isUpcoming = flightDate > new Date();
      
      return {
        id: offer.id,
        type: 'listed',
        from: offer.departure_location,
        to: offer.arrival_location,
        date: offer.flight_date,
        time: offer.departure_time ? new Date(offer.departure_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'TBD',
        aircraft: offer.aircraft_model || 'Private Jet',
        seats: offer.available_seats || 0,
        price: offer.total_flight_cost,
        status: offer.status === 'completed' ? 'completed' : 
                offer.status === 'cancelled' ? 'cancelled' : 
                isUpcoming ? 'upcoming' : 'completed',
        originalData: offer
      };
    }),
    
    // Transform flight bookings
    ...bookings.map((booking): CombinedFlight => {
      const flightDate = new Date(booking.flights?.departure_time || '');
      const isUpcoming = flightDate > new Date();
      
      return {
        id: booking.id,
        type: 'booked',
        from: `${booking.flights?.origin?.city || booking.flights?.origin_airport} (${booking.flights?.origin?.code || booking.flights?.origin_airport})`,
        to: `${booking.flights?.destination?.city || booking.flights?.destination_airport} (${booking.flights?.destination?.code || booking.flights?.destination_airport})`,
        date: booking.flights?.departure_time || '',
        time: booking.flights?.departure_time ? new Date(booking.flights.departure_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) : 'TBD',
        aircraft: booking.flights?.jets ? `${booking.flights.jets.manufacturer} ${booking.flights.jets.model}` : 'Private Jet',
        seats: booking.seats_booked,
        price: booking.total_amount,
        status: booking.booking_status === 'cancelled' ? 'cancelled' :
                isUpcoming ? 'upcoming' : 'completed',
        originalData: booking
      };
    })
  ];

  // Filter flights based on active tab
  const filteredFlights = combinedFlights.filter(flight => 
    activeTab === 'upcoming' ? flight.status === 'upcoming' : flight.status !== 'upcoming'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-gdyup-primary';
      case 'completed': return 'text-gdyup-success';
      case 'cancelled': return 'text-gdyup-error';
      default: return 'text-gdyup-text-subtle';
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'booked' ? 'Booked' : 'Listed';
  };

  const getTypeColor = (type: string) => {
    return type === 'booked' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (departureTime: string, arrivalTime: string) => {
    if (!departureTime || !arrivalTime) return 'TBD';
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleTipHost = (flight: CombinedFlight) => {
    // For demo purposes, using mock data. In real app, fetch from flight/offer data
    const mockHostPubkey = 'npub1234567890abcdef'; // This would come from the flight host's profile
    
    setSelectedZapRecipient({
      pubkey: mockHostPubkey,
      name: flight.type === 'listed' ? 'You (Host)' : 'Flight Host',
      nip05: 'host@gdyup.xyz',
      context: `tip_host_${flight.id}`
    });
    setShowZapSheet(true);
  };

  const handleZapComplete = (zapId: string, amount: number) => {
    console.log('Zap completed:', { zapId, amount, recipient: selectedZapRecipient });
    toast.success(`⚡ Sent ${amount} sats tip!`);
    setShowZapSheet(false);
    setSelectedZapRecipient(null);
  };

  if (!user) {
    return (
      <div className="main-content min-h-screen bg-gdyup-bg-dark flex items-center justify-center">
        <div className="text-center">
          <Plane className="text-gdyup-text-subtle mx-auto mb-4" size={48} />
          <h3 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
            Sign in to view your flights
          </h3>
          <button 
            onClick={() => router.push('/gdyup/auth/login')}
            className="btn-primary-elite"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="main-content min-h-screen bg-gdyup-bg-dark">
        {/* Header */}
        <div className="px-6 py-6">
          <h1 className="gdyup-title text-3xl font-bold mb-2">
            My Flights
          </h1>
          <p className={cn("text-lg", getThemedTextClasses('secondary'))}>
            Manage your bookings and listings
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-6">
          <div className="flex bg-gdyup-bg-elevated rounded-xl p-1">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg font-medium transition-all",
                activeTab === 'upcoming'
                  ? "bg-gdyup-primary text-gdyup-button-text"
                  : getThemedTextClasses('muted')
              )}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={cn(
                "flex-1 py-3 px-4 rounded-lg font-medium transition-all",
                activeTab === 'completed'
                  ? "bg-gdyup-primary text-gdyup-button-text"
                  : getThemedTextClasses('muted')
              )}
            >
              History
            </button>
          </div>
        </div>

        {/* Flight List */}
        <div className="px-6 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-gdyup-primary border-t-transparent rounded-full animate-spin"></div>
              <span className={cn("ml-3", getThemedTextClasses())}>Loading your flights...</span>
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="elite-card p-8 text-center">
              <Plane className="text-gdyup-text-subtle mx-auto mb-4" size={48} />
              <h3 className={cn("text-xl font-bold mb-2", getThemedTextClasses())}>
                No {activeTab} flights
              </h3>
              <p className={cn("text-base mb-6", getThemedTextClasses('muted'))}>
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming flights yet."
                  : "You haven't completed any flights yet."
                }
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => router.push('/gdyup/browse')}
                  className="btn-primary-elite"
                >
                  Browse Flights
                </button>
                <button 
                  onClick={() => router.push('/gdyup/list')}
                  className="btn-secondary-elite"
                >
                  List a Flight
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFlights.map((flight) => (
                <div key={flight.id} className="elite-card p-6">
                  {/* Flight Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        getTypeColor(flight.type)
                      )}>
                        {getTypeLabel(flight.type)}
                      </span>
                      <span className={cn(
                        "text-sm font-medium capitalize",
                        getStatusColor(flight.status)
                      )}>
                        {flight.status}
                      </span>
                    </div>
                    
                    <button className="p-2 hover:bg-gdyup-bg-elevated rounded-lg transition-colors">
                      <MoreVertical size={20} className="text-gdyup-text-subtle" />
                    </button>
                  </div>

                  {/* Flight Route */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gdyup-text">
                          {flight.from.split('(')[1]?.replace(')', '') || flight.from.split(' ')[0]}
                        </div>
                        <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                          {flight.time}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-4">
                        <div className="h-px bg-gdyup-border flex-1"></div>
                        <Plane className="text-gdyup-primary" size={20} />
                        <div className="h-px bg-gdyup-border flex-1"></div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gdyup-text">
                          {flight.to.split('(')[1]?.replace(')', '') || flight.to.split(' ')[0]}
                        </div>
                        <div className={cn("text-sm", getThemedTextClasses('muted'))}>
                          {formatDate(flight.date)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Plane size={16} className="text-gdyup-text-subtle" />
                      <span className={cn("text-sm", getThemedTextClasses('secondary'))}>
                        {flight.aircraft}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gdyup-text-subtle" />
                      <span className={cn("text-sm", getThemedTextClasses('secondary'))}>
                        {flight.seats} seat{flight.seats > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gdyup-text-subtle" />
                      <span className={cn("text-sm", getThemedTextClasses('secondary'))}>
                        {flight.from.split('(')[0].trim()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-gdyup-text-subtle" />
                      <span className={cn("text-sm font-medium", getThemedTextClasses('primary'))}>
                        ${flight.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gdyup-border">
                    {flight.type === 'booked' ? (
                      <>
                        <button 
                          className="btn-primary-elite flex-1"
                          onClick={() => {
                            // TODO: Navigate to boarding pass
                            toast.info('Boarding pass feature coming soon!');
                          }}
                        >
                          View Boarding Pass
                        </button>
                        <button 
                          className="btn-secondary-elite px-6"
                          onClick={() => handleTipHost(flight)}
                          disabled={!isConnected}
                        >
                          ⚡ Tip Host
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="btn-primary-elite flex-1"
                          onClick={() => {
                            // TODO: Navigate to manage listing
                            toast.info('Manage listing feature coming soon!');
                          }}
                        >
                          Manage Listing
                        </button>
                        <button 
                          className="btn-secondary-elite px-6"
                          onClick={() => {
                            // TODO: View bookings functionality
                            toast.info('View bookings feature coming soon!');
                          }}
                        >
                          View Bookings
                        </button>
                      </>
                    )}
                  </div>

                  {/* Nostr Connection Status for Zaps */}
                  {!isConnected && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className={cn("text-xs text-center", getThemedTextClasses('muted'))}>
                        Connect your Nostr identity to send Lightning tips ⚡
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button 
              className="elite-card p-4 text-center"
              onClick={() => router.push('/gdyup/browse')}
            >
              <Calendar className="text-gdyup-primary mx-auto mb-2" size={24} />
              <div className={cn("font-medium", getThemedTextClasses())}>
                Book Flight
              </div>
            </button>
            
            <button 
              className="elite-card p-4 text-center"
              onClick={() => router.push('/gdyup/list')}
            >
              <Plane className="text-gdyup-primary mx-auto mb-2" size={24} />
              <div className={cn("font-medium", getThemedTextClasses())}>
                List Flight
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Elite Zap Sheet */}
      <EliteZapSheet
        isOpen={showZapSheet}
        onClose={() => {
          setShowZapSheet(false);
          setSelectedZapRecipient(null);
        }}
        recipientPubkey={selectedZapRecipient?.pubkey || ''}
        recipientName={selectedZapRecipient?.name}
        recipientNip05={selectedZapRecipient?.nip05}
        defaultAmount={5000}
        context={selectedZapRecipient?.context || 'flight_tip'}
        onZapComplete={handleZapComplete}
      />
    </>
  );
} 