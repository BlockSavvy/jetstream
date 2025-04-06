/**
 * Embedding Utilities for JetStream
 *
 * This module provides standardized functions for:
 * 1. Generating embedding inputs for various entity types
 * 2. Performing vector searches across the JetStream database
 * 3. Helper functions for the AI concierge and agent systems
 */

import { createClient } from '@/lib/supabase-server';
import * as pinecone from '@/lib/services/pinecone';
import * as embeddings from '@/lib/services/embeddings';

// Define interface types locally to avoid import errors
interface JetShareOffer {
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

interface Flight {
  id: string;
  flight_number?: string;
  origin_airport: string;
  destination_airport: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  available_seats: number;
  status?: string;
  created_at: string;
  updated_at?: string;
  jets?: any;
  amenities?: string[];
}

interface Crew {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  role?: string;
  average_rating?: number;
  reviews_count?: number;
  availability_status?: string;
  certifications?: string[];
  created_at: string;
  updated_at?: string;
  crew_specializations?: any[];
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  role?: string;
  created_at: string;
  updated_at?: string;
}

interface SimulationLog {
  id: string;
  sim_type: string;
  start_date: string;
  end_date: string;
  virtual_users: number;
  ai_matching_enabled: boolean;
  input_parameters?: any;
  results_summary?: any;
  triggered_by_user_id?: string;
  agent_instruction_summary?: string;
  created_at: string;
  updated_at?: string;
}

interface PineconeMatch {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Search for similar JetShare offers based on a natural language query
 */
export async function getSimilarOffers(query: string, limit: number = 5): Promise<JetShareOffer[]> {
  try {
    // Convert the query to a vector
    const queryVector = await embeddings.encode(query);
    
    // Search Pinecone
    const index = await pinecone.getPineconeIndex();
    const results = await index.query({
      vector: queryVector,
      filter: { object_type: 'jetshare_offer' },
      topK: limit,
      includeMetadata: true
    });
    
    if (!results.matches || results.matches.length === 0) {
      return [];
    }
    
    // Extract the offer IDs from the results
    const offerIds = results.matches.map((match: PineconeMatch) => match.id);
    
    // Fetch the full offer details from Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('jetshare_offers')
      .select('*')
      .in('id', offerIds);
    
    if (error || !data) {
      console.error('Error fetching offers from Supabase:', error);
      return [];
    }
    
    // Sort the offers to match the order of the search results
    const offersMap = new Map(data.map(offer => [offer.id, offer]));
    const sortedOffers = offerIds
      .map((id: string) => offersMap.get(id))
      .filter(Boolean) as JetShareOffer[];
    
    return sortedOffers;
  } catch (error) {
    console.error('Error in getSimilarOffers:', error);
    return [];
  }
}

/**
 * Find matching crew members based on a natural language query
 */
export async function findMatchingCrews(query: string, limit: number = 5): Promise<Crew[]> {
  try {
    // Convert the query to a vector
    const queryVector = await embeddings.encode(query);
    
    // Search Pinecone
    const index = await pinecone.getPineconeIndex();
    const results = await index.query({
      vector: queryVector,
      filter: { object_type: 'crew' },
      topK: limit,
      includeMetadata: true
    });
    
    if (!results.matches || results.matches.length === 0) {
      return [];
    }
    
    // Extract the crew IDs from the results
    const crewIds = results.matches.map((match: PineconeMatch) => match.id);
    
    // Fetch the full crew details from Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('crew')
      .select(`
        *,
        crew_specializations (*)
      `)
      .in('id', crewIds);
    
    if (error || !data) {
      console.error('Error fetching crews from Supabase:', error);
      return [];
    }
    
    // Sort the crews to match the order of the search results
    const crewsMap = new Map(data.map(crew => [crew.id, crew]));
    const sortedCrews = crewIds
      .map((id: string) => crewsMap.get(id))
      .filter(Boolean) as Crew[];
    
    return sortedCrews;
  } catch (error) {
    console.error('Error in findMatchingCrews:', error);
    return [];
  }
}

/**
 * Suggest JetShare offers that match a user's preferences
 */
export async function suggestPulseMatches(userId: string, limit: number = 5): Promise<JetShareOffer[]> {
  try {
    const supabase = await createClient();
    
    // Fetch the user's profile
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userProfile) {
      console.error('Error fetching user profile:', userError);
      return [];
    }
    
    // Enrich the user profile with preferences and history
    const enrichedProfile = await enrichUserProfile(supabase, userProfile);
    
    // Generate a query based on the user's profile
    const userText = embeddings.generateUserProfileText(enrichedProfile);
    
    // Use the profile text to find matching offers
    return getSimilarOffers(userText, limit);
  } catch (error) {
    console.error('Error in suggestPulseMatches:', error);
    return [];
  }
}

/**
 * Find related simulation logs based on a natural language query
 */
export async function findRelatedSimulations(query: string, limit: number = 5): Promise<SimulationLog[]> {
  try {
    // Convert the query to a vector
    const queryVector = await embeddings.encode(query);
    
    // Search Pinecone
    const index = await pinecone.getPineconeIndex();
    const results = await index.query({
      vector: queryVector,
      filter: { object_type: 'simulation' },
      topK: limit,
      includeMetadata: true
    });
    
    if (!results.matches || results.matches.length === 0) {
      return [];
    }
    
    // Extract the simulation IDs from the results
    const simulationIds = results.matches.map((match: PineconeMatch) => match.id);
    
    // Fetch the full simulation details from Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('simulation_logs')
      .select('*')
      .in('id', simulationIds);
    
    if (error || !data) {
      console.error('Error fetching simulations from Supabase:', error);
      return [];
    }
    
    // Sort the simulations to match the order of the search results
    const simulationsMap = new Map(data.map(sim => [sim.id, sim]));
    const sortedSimulations = simulationIds
      .map((id: string) => simulationsMap.get(id))
      .filter(Boolean) as SimulationLog[];
    
    return sortedSimulations;
  } catch (error) {
    console.error('Error in findRelatedSimulations:', error);
    return [];
  }
}

/**
 * Find flights based on a natural language query
 */
export async function findFlights(query: string, limit: number = 5): Promise<Flight[]> {
  try {
    // Convert the query to a vector
    const queryVector = await embeddings.encode(query);
    
    // Search Pinecone
    const index = await pinecone.getPineconeIndex();
    const results = await index.query({
      vector: queryVector,
      filter: { object_type: 'flight' },
      topK: limit,
      includeMetadata: true
    });
    
    if (!results.matches || results.matches.length === 0) {
      return [];
    }
    
    // Extract the flight IDs from the results
    const flightIds = results.matches.map((match: PineconeMatch) => match.id);
    
    // Fetch the full flight details from Supabase
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        jets (*)
      `)
      .in('id', flightIds);
    
    if (error || !data) {
      console.error('Error fetching flights from Supabase:', error);
      return [];
    }
    
    // Sort the flights to match the order of the search results
    const flightsMap = new Map(data.map(flight => [flight.id, flight]));
    const sortedFlights = flightIds
      .map((id: string) => flightsMap.get(id))
      .filter(Boolean) as Flight[];
    
    return sortedFlights;
  } catch (error) {
    console.error('Error in findFlights:', error);
    return [];
  }
}

/**
 * Helper function to enrich a user profile with additional data for better vector search
 */
async function enrichUserProfile(supabase: any, profile: any): Promise<any> {
  // Start with basic profile info
  const enriched = {
    id: profile.id,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email || '',
    bio: profile.bio || '',
    role: profile.role || 'user',
    preferences: {} as any,
    professionalDetails: {} as any,
    interestsAndHobbies: [] as string[],
    travelHistory: [] as any[]
  };
  
  // Try to load travel preferences
  try {
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    if (prefs) {
      enriched.preferences = {
        preferredDestinations: prefs.preferred_destinations || [],
        travelInterests: prefs.travel_interests || [],
        tripTypes: prefs.trip_types || [],
        languages: prefs.languages || []
      };
    }
  } catch (e) {
    // Silent catch - not all users have preferences
  }
  
  // Try to load professional details
  try {
    const { data: prof } = await supabase
      .from('professional_details')
      .select('*')
      .eq('user_id', profile.id)
      .single();
    
    if (prof) {
      enriched.professionalDetails = {
        industry: prof.industry || '',
        jobTitle: prof.job_title || '',
        company: prof.company || '',
        expertise: prof.expertise || []
      };
    }
  } catch (e) {
    // Silent catch - not all users have professional details
  }
  
  // Try to load interests and hobbies
  try {
    const { data: interests } = await supabase
      .from('user_interests')
      .select('interest')
      .eq('user_id', profile.id);
    
    if (interests && interests.length > 0) {
      enriched.interestsAndHobbies = interests.map((i: any) => i.interest);
    }
  } catch (e) {
    // Silent catch - not all users have interests
  }
  
  // Try to load travel history
  try {
    const { data: history } = await supabase
      .from('travel_history')
      .select('*')
      .eq('user_id', profile.id);
    
    if (history && history.length > 0) {
      enriched.travelHistory = history.map((h: any) => ({
        origin: h.origin,
        destination: h.destination,
        date: h.travel_date
      }));
    }
  } catch (e) {
    // Silent catch - not all users have travel history
  }
  
  return enriched;
}

/**
 * Create a vector_search_logs table entry for tracking search queries
 */
export async function logVectorSearch(
  query: string,
  userId: string | null,
  objectType: string,
  resultsCount: number
): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from('vector_search_logs').insert({
      query_text: query,
      user_id: userId,
      object_type: objectType,
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging vector search:', error);
  }
}

/**
 * Get similar content across all data types
 */
export async function searchAcrossAllTypes(
  query: string,
  limit: number = 5
): Promise<Array<{ type: string; id: string; score: number; metadata: any }>> {
  try {
    // Convert the query to a vector
    const queryVector = await embeddings.encode(query);
    
    // Search Pinecone across all types
    const index = await pinecone.getPineconeIndex();
    const results = await index.query({
      vector: queryVector,
      topK: limit * 2, // Fetch more to ensure diversity
      includeMetadata: true
    });
    
    if (!results.matches || results.matches.length === 0) {
      return [];
    }
    
    // Process and diversify results
    const typeGroups = new Map<string, Array<any>>();
    
    results.matches.forEach((match: PineconeMatch) => {
      const objectType = match.metadata?.object_type || 'unknown';
      
      if (!typeGroups.has(objectType)) {
        typeGroups.set(objectType, []);
      }
      
      typeGroups.get(objectType)?.push({
        type: objectType,
        id: match.id,
        score: match.score,
        metadata: match.metadata
      });
    });
    
    // Take top results from each type to ensure diversity
    const diverseResults = Array.from(typeGroups.values())
      .flatMap(group => group.slice(0, limit))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return diverseResults;
  } catch (error) {
    console.error('Error in searchAcrossAllTypes:', error);
    return [];
  }
} 