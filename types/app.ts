/**
 * JetStream Core Type Definitions
 * 
 * This file contains type definitions for the core entities in the JetStream application.
 * These types are used throughout the application for type safety and consistency.
 */

/**
 * JetShare Offer Type Definition
 */
export interface JetShareOffer {
  id: string;
  created_by: string;
  departure_location: string;
  arrival_location: string;
  flight_date: string;
  departure_time?: string;
  aircraft_model?: string;
  total_seats?: number;
  available_seats: number;
  total_flight_cost: number;
  requested_share_amount: number;
  has_ai_matching?: boolean;
  details?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Flight Type Definition
 */
export interface Flight {
  id: string;
  flight_number?: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  available_seats: number;
  status?: 'scheduled' | 'in-flight' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  jets?: Jet;
  amenities?: string[];
}

/**
 * Jet Type Definition
 */
export interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  year?: number;
  seat_capacity: number;
  range_nm?: number;
  max_speed_kts?: number;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Crew Member Type Definition
 */
export interface Crew {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  role?: 'captain' | 'first-officer' | 'flight-attendant';
  average_rating?: number;
  reviews_count?: number;
  availability_status?: 'available' | 'unavailable' | 'limited';
  certifications?: string[];
  created_at: string;
  updated_at?: string;
  crew_specializations?: CrewSpecialization[];
}

/**
 * Crew Specialization Type Definition
 */
export interface CrewSpecialization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * User Profile Type Definition
 */
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  role?: 'user' | 'admin' | 'captain' | 'crew';
  created_at: string;
  updated_at?: string;
}

/**
 * Enriched User Profile for Embedding
 */
export interface EnrichedUserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  role?: string;
  preferences?: {
    preferredDestinations?: string[];
    travelInterests?: string[];
    tripTypes?: string[];
    languages?: string[];
  };
  professionalDetails?: {
    industry?: string;
    jobTitle?: string;
    company?: string;
    expertise?: string[];
  };
  interestsAndHobbies?: string[];
  travelHistory?: Array<{
    origin?: string;
    destination?: string;
    date?: string;
  }>;
}

/**
 * Simulation Log Type Definition
 */
export interface SimulationLog {
  id: string;
  sim_type: 'JetShare' | 'PulseFlights' | 'MarketplaceFlights';
  start_date: string;
  end_date: string;
  virtual_users: number;
  ai_matching_enabled: boolean;
  input_parameters?: {
    origin?: string;
    destination?: string;
    [key: string]: any;
  };
  results_summary?: {
    metrics?: {
      offerFillRate?: number;
      revenue?: number;
      maxRevenue?: number;
      acceptedFlights?: number;
      unfilledFlights?: number;
      [key: string]: any;
    };
    summaryText?: string;
    [key: string]: any;
  };
  triggered_by_user_id?: string;
  agent_instruction_summary?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Vector Search Log Type Definition
 */
export interface VectorSearchLog {
  id: string;
  query_text: string;
  user_id?: string;
  object_type: string;
  results_count: number;
  timestamp: string;
  created_at: string;
}

/**
 * Search Result Type with Metadata
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Entity Type Union for Embedding Functions
 */
export type EmbeddableEntity = 
  | JetShareOffer 
  | Flight 
  | Crew 
  | User 
  | EnrichedUserProfile 
  | SimulationLog; 