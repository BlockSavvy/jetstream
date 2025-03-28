export type CrewSpecialization = 
  | 'Comedy' 
  | 'TED-talks' 
  | 'Live Podcasts' 
  | 'Wellness Sessions' 
  | 'Business Networking' 
  | 'Family-friendly Activities' 
  | 'Musical Performances' 
  | 'Interactive Mystery Events'
  | 'Culinary Experiences'
  | 'Wine Tasting'
  | 'Sports Commentary'
  | 'Tech Demos'
  | 'Creative Workshops'
  | 'Executive Coaching';

export type CaptainSpecialization =
  | 'Luxury' 
  | 'Business' 
  | 'Family-oriented' 
  | 'Entertainment-focused'
  | 'Adventure'
  | 'VIP Service'
  | 'International Flights'
  | 'Long-haul Expert'
  | 'Private Events'
  | 'Sports Team Transport';

export interface CrewMember {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  profileImageUrl: string | null;
  ratingsAvg: number;
  specializations: CrewSpecialization[] | CaptainSpecialization[];
  isCaptain: boolean;
  dedicatedJetOwnerId: string | null;
  yearsOfExperience: number | null;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
  } | null;
  availability: any[] | null;
  reviews?: CrewReview[];
  specializedFlights?: SpecializedFlight[];
  reviewCount?: number;
}

export interface CrewReview {
  id: string;
  crewId: string;
  userId: string;
  flightId: string | null;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  user?: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface SpecializedFlight {
  id: string;
  flightId: string;
  title: string;
  theme: string;
  description: string | null;
  crewId: string | null;
  nftTicketed: boolean | null;
  seatsAvailable: number;
  createdAt: string;
  updatedAt: string;
  flight?: any;
  crew?: CrewMember;
}

export interface CustomItineraryRequest {
  id: string;
  requestingUserId: string;
  destination: string | null;
  origin: string | null;
  dateTime: string | null;
  requestedSpecializations: CrewSpecialization[] | null;
  description: string | null;
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  matchesFound: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrewFilter {
  specializations?: string[];
  minRating?: number;
  available?: boolean;
  searchTerm?: string;
  isCaptain?: boolean;
  dedicatedOnly?: boolean;
  minYearsExperience?: number;
}

export interface SpecializedFlightFilter {
  theme?: string;
  crewId?: string;
  dateFrom?: string;
  dateTo?: string;
  origin?: string;
  destination?: string;
  minSeats?: number;
}

// Extended Flight type to include crew information
export interface FlightWithCrew extends Flight {
  crew?: CrewMember;
  specializedEvent?: SpecializedFlight;
}

// Types for custom itinerary matching
export interface ItineraryMatch {
  matchId: string;
  matchScore: number;
  matchType: 'flight' | 'crew' | 'companion';
  flight?: Flight;
  crew?: CrewMember;
  companion?: {
    userId: string;
    name: string;
    avatarUrl?: string;
  };
  reasons: string[];
}

// For flight filtering with crew specializations
export interface ExtendedFlightFilters extends FlightFilters {
  crewSpecializations?: string[];
  minCrewRating?: string;
  specializedEventOnly?: boolean;
}

// Import needed types from existing app
import { Flight, FlightFilters } from '@/app/flights/types'; 