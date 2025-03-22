import { Json } from '@/lib/types/database.types';

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  is_private?: boolean;
}

export interface Jet {
  id: string;
  model: string;
  manufacturer: string;
  tail_number: string;
  capacity: number;
  images: string[] | null;
  amenities: Json | null;
  hourly_rate: number | null;
}

export interface Flight {
  id: string;
  jet_id: string;
  origin_airport: string | null;
  destination_airport: string | null;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  base_price: number;
  status: 'scheduled' | 'boarding' | 'in_air' | 'completed' | 'cancelled';
  created_at: string;
  jets: Jet;
  airports?: Airport;  // Origin airport
  origin?: Airport;    // Alternative origin airport property
  "airports!flights_destination_airport_fkey"?: Airport;  // Destination airport
  destination?: Airport;  // Alternative destination airport property
}

export interface FlightFilters {
  origin?: string;
  destination?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: string;
  maxPrice?: string;
  minSeats?: string;
  hasFractionalTokens?: boolean;
}

export interface BookingFormData {
  flightId: string;
  userId: string;
  seatsBooked: number;
  totalPrice: number;
  specialRequests?: string;
  paymentMethod?: PaymentMethod;
  tokenId?: string;
}

export type PaymentMethod = 'stripe' | 'coinbase' | 'token';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface CoinbaseCheckout {
  id: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

export interface FractionalToken {
  id: string;
  user_id: string;
  token_amount: number;
  jet_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Ticket {
  id: string;
  booking_id: string;
  user_id: string;
  flight_id: string;
  ticket_code: string;
  passenger_name: string;
  seat_number: string;
  boarding_time: string;
  gate: string;
  qr_code_url: string;
  status: 'active' | 'used' | 'cancelled';
  created_at: string;
  apple_wallet_url?: string;
  google_wallet_url?: string;
}

export interface BoardingPass {
  ticket: Ticket;
  flight: Flight;
  passenger: {
    name: string;
    email?: string;
    phone?: string;
  };
  qrCodeData: string;
  walletOptions: {
    appleWalletAvailable: boolean;
    googleWalletAvailable: boolean;
  };
} 