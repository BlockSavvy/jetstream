import { Flight as AppFlight } from '@/app/flights/types';
import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

/**
 * Types for AI Matching System
 */

// User profile for matching
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  profession?: string;
  industry?: string;
  interests?: string[];
  travelPreferences?: UserPreferences;
  travelHistory?: TravelHistory[];
}

// User travel preferences
export interface UserPreferences {
  preferredDestinations?: string[];
  preferredJetModels?: string[];
  preferredAmenities?: string[];
  preferredTravelTimes?: string[];
  tripPurposes?: string[];
  companionPreferences?: CompanionPreferences;
  budgetRange?: {
    min: number;
    max: number;
  };
  travelInterests?: string[];
  industry?: string;
  jobTitle?: string;
  company?: string;
  expertise?: string[];
  tripTypes?: string[];
  languages?: string[];
  dietaryRestrictions?: string[];
  amenityPreferences?: string[];
}

// Companion preferences for matching
export interface CompanionPreferences {
  professions?: string[];
  industries?: string[];
  interests?: string[];
  maxCompanions?: number;
  familyFriendly?: boolean;
  businessNetworking?: boolean;
}

// User's travel history
export interface TravelHistory {
  id?: string;
  userId?: string;
  flightId?: string;
  departureDate: string;
  date?: string; // For backward compatibility
  returnDate?: string;
  origin: string;
  destination: string;
  purpose?: string;
  companions?: number;
  rating?: number;
}

// Enriched profile with embeddings
export interface EnrichedProfile extends UserProfile {
  embedding?: number[];
  lastUpdated?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: UserPreferences;
  professionalDetails?: {
    industry?: string;
    jobTitle?: string;
    company?: string;
    expertise?: string[];
  };
  interestsAndHobbies?: string[];
}

// Flight data for matching
export interface FlightMatch {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  jetModel: string;
  availableSeats: number;
  amenities: string[];
  price: number;
}

// Enriched flight with embeddings
export interface EnrichedFlight extends FlightMatch {
  embedding?: number[];
  lastUpdated?: string;
}

// Match query parameters
export interface MatchQuery {
  userId: string;
  includeFlights?: boolean;
  includeCompanions?: boolean;
  destinationPreference?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tripPurpose?: string;
  maxResults?: number;
}

// Match query natural language parameters
export interface NaturalLanguageQuery {
  query: string;
  filters?: {
    origin?: string;
    destination?: string;
    minScore?: number;
    travelPurpose?: string;
    departureDate?: string;
    returnDate?: string;
  };
}

// Match result
export interface MatchResult {
  id: string;
  route: string;
  departure: string;
  matchScore: number;
  reasons: string[];
  price: number;
  companions: number;
  metadata?: {
    origin: string;
    destination: string;
    departureTime: string;
    jetModel?: string;
    amenities?: string;
    professionals?: Professional[];
  };
}

// Professional companion for networking matches
export interface Professional {
  jobTitle: string;
  industry: string;
  company?: string;
  expertise?: string[];
}

// API response for matching
export interface MatchResponse {
  query: string;
  results: MatchResult[];
  isBackupData?: boolean;
}

// Index record for vector database
export interface IndexRecord {
  id: string;
  vector: number[];
  metadata: {
    [key: string]: any;
  };
}

// For compatibility with existing code
export interface FlightMatchResult {
  flight: AppFlight;
  matchScore: number;
  matchReasons: string[];
}

export interface CompanionMatch {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  matchScore: number;
  matchReasons: string[];
  compatibleFlights?: string[]; // IDs of flights that both users would be compatible with
}

export interface MatchingResponse {
  userId: string;
  recommendedFlights?: FlightMatchResult[];
  recommendedCompanions?: CompanionMatch[];
  timestamp: string;
} 