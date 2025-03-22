import { 
  CompanionMatch, 
  EnrichedProfile, 
  FlightMatchResult, 
  MatchQuery, 
  MatchingResponse,
  UserPreferences,
  TravelHistory,
  FlightMatch as FlightMatchType
} from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import { createClient } from '@/lib/supabase-server';
import { findSimilarFlights, findSimilarUsers, getPineconeIndex, upsertFlight, upsertUserProfile } from './pinecone';
import { calculateSimilarity, generateQueryEmbedding, generateUserEmbedding } from './embeddings';

// Define a type for the booking with flights
interface BookingWithFlight {
  id: string;
  flight_id: string;
  flights: {
    id: string;
    origin_airport: string | null;
    destination_airport: string | null;
    departure_time: string;
    arrival_time: string;
    // other flight properties...
  };
  // other booking properties...
}

/**
 * Converts raw database profile to enriched profile
 */
export async function getEnrichedUserProfile(userId: string): Promise<EnrichedProfile | null> {
  try {
    const supabase = await createClient();
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    // Fetch user's travel history from bookings and flights
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        flight_id,
        seats_booked,
        created_at,
        total_price,
        booking_status,
        flights(
          id,
          origin_airport,
          destination_airport,
          departure_time,
          arrival_time,
          base_price,
          available_seats,
          jet_id,
          jets(
            id,
            model,
            manufacturer,
            capacity,
            amenities
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (bookingsError) {
      console.error('Error fetching user bookings:', bookingsError);
    }
    
    // Create enriched profile object
    const preferences = profile.preferences || {};
    
    // Map travel history from bookings, properly handling the flights relationship
    const travelHistory: TravelHistory[] = [];
    
    if (bookings && bookings.length > 0) {
      // Instead of type casting, we'll manually map the data to ensure type safety
      bookings.forEach(booking => {
        if (booking?.flights && Array.isArray(booking.flights) && booking.flights.length > 0) {
          const flightData = booking.flights[0];
          if (flightData) {
            travelHistory.push({
              id: booking.id,
              userId: userId,
              flightId: booking.flight_id,
              departureDate: flightData.departure_time || '',
              date: flightData.departure_time || '',
              origin: flightData.origin_airport || '',
              destination: flightData.destination_airport || '',
            });
          }
        }
      });
    }
    
    // Extract professional details from preferences if available
    const professionalDetails = {
      industry: preferences.industry || '',
      jobTitle: preferences.jobTitle || '',
      company: preferences.company || '',
      expertise: preferences.expertise || [],
    };
    
    // Extract interests from preferences if available
    const interestsAndHobbies = preferences.interests || [];
    
    return {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatarUrl: profile.avatar_url || undefined,
      bio: profile.bio || undefined,
      preferences: preferences as UserPreferences,
      travelHistory,
      professionalDetails,
      interestsAndHobbies,
    };
  } catch (error) {
    console.error('Error getting enriched user profile:', error);
    return null;
  }
}

/**
 * Gets detailed flight information
 */
export async function getFlightDetails(flightId: string): Promise<Flight | null> {
  try {
    const supabase = await createClient();
    
    const { data: flight, error } = await supabase
      .from('flights')
      .select(`
        *,
        jets(*),
        airports!flights_origin_airport_fkey(*),
        airports!flights_destination_airport_fkey(*)
      `)
      .eq('id', flightId)
      .single();
    
    if (error || !flight) {
      console.error('Error fetching flight details:', error);
      return null;
    }
    
    // Map the relationships to the correct fields
    const mappedFlight: Flight = {
      ...flight,
      origin: flight['airports!flights_origin_airport_fkey'],
      destination: flight['airports!flights_destination_airport_fkey'],
    };
    
    return mappedFlight;
  } catch (error) {
    console.error('Error getting flight details:', error);
    return null;
  }
}

/**
 * Syncs user profile to Pinecone for matching
 */
export async function syncUserToVectorDB(userId: string): Promise<boolean> {
  try {
    // Get enriched user profile
    const profile = await getEnrichedUserProfile(userId);
    if (!profile) {
      return false;
    }
    
    // Upsert to Pinecone
    await upsertUserProfile(profile);
    return true;
  } catch (error) {
    console.error('Error syncing user to vector DB:', error);
    return false;
  }
}

/**
 * Syncs flight to Pinecone for matching
 */
export async function syncFlightToVectorDB(flightId: string): Promise<boolean> {
  try {
    // Get flight details
    const flight = await getFlightDetails(flightId);
    if (!flight) {
      return false;
    }
    
    // Upsert to Pinecone
    await upsertFlight(flight);
    return true;
  } catch (error) {
    console.error('Error syncing flight to vector DB:', error);
    return false;
  }
}

/**
 * Finds matching flights based on user preferences
 */
export async function findMatchingFlights(
  userId: string, 
  filter?: {
    origin?: string;
    destination?: string;
    departure_after?: string;
    departure_before?: string;
    min_seats?: number;
  },
  limit: number = 10
): Promise<FlightMatchResult[]> {
  try {
    // Get user profile and generate embedding
    const userProfile = await getEnrichedUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    // Prepare query string from user profile
    const preferences = userProfile.preferences || {};
    
    let queryString = `Find flights`;
    
    if (preferences.preferredDestinations && preferences.preferredDestinations.length > 0) {
      queryString += ` to ${preferences.preferredDestinations.join(' or ')}`;
    }
    
    if (preferences.tripTypes && preferences.tripTypes.length > 0) {
      queryString += ` for ${preferences.tripTypes.join(' or ')} travel`;
    }
    
    if (preferences.amenityPreferences && preferences.amenityPreferences.length > 0) {
      queryString += ` with ${preferences.amenityPreferences.join(', ')}`;
    }
    
    // Add filter constraints to query if provided
    if (filter) {
      if (filter.origin) {
        queryString += ` from ${filter.origin}`;
      }
      
      if (filter.destination) {
        queryString += ` to ${filter.destination}`;
      }
      
      if (filter.departure_after) {
        queryString += ` departing after ${filter.departure_after}`;
      }
      
      if (filter.departure_before) {
        queryString += ` departing before ${filter.departure_before}`;
      }
      
      if (filter.min_seats) {
        queryString += ` with at least ${filter.min_seats} seats`;
      }
    }
    
    // Generate embedding for query
    const queryEmbedding = await generateQueryEmbedding(queryString);
    
    // Build filter for Pinecone query
    const pineconeFilter: any = {
      type: 'flight',
    };
    
    if (filter) {
      if (filter.origin) {
        pineconeFilter.origin = filter.origin;
      }
      
      if (filter.destination) {
        pineconeFilter.destination = filter.destination;
      }
    }
    
    // Query Pinecone
    const matches = await findSimilarFlights(queryEmbedding, limit * 2, pineconeFilter);
    
    // Process and filter results
    const flightMatches: FlightMatchResult[] = [];
    
    for (const match of matches) {
      const flightId = match.id;
      const flight = await getFlightDetails(flightId);
      
      if (flight) {
        // Apply additional client-side filtering
        let isValid = true;
        
        if (filter) {
          if (filter.departure_after && new Date(flight.departure_time) < new Date(filter.departure_after)) {
            isValid = false;
          }
          
          if (filter.departure_before && new Date(flight.departure_time) > new Date(filter.departure_before)) {
            isValid = false;
          }
          
          if (filter.min_seats && flight.available_seats < filter.min_seats) {
            isValid = false;
          }
        }
        
        if (isValid) {
          // Calculate match reasons
          const matchReasons: string[] = [];
          
          // Check if destination matches user preferences
          if (
            preferences.preferredDestinations && 
            preferences.preferredDestinations.includes(flight.destination_airport || '')
          ) {
            matchReasons.push(`Matches your preferred destination`);
          }
          
          // Check for amenities match
          if (
            preferences.amenityPreferences && 
            flight.jets.amenities
          ) {
            const flightAmenities = Array.isArray(flight.jets.amenities) 
              ? flight.jets.amenities 
              : typeof flight.jets.amenities === 'object' && flight.jets.amenities !== null
                ? Object.keys(flight.jets.amenities)
                : [];
            
            const matchingAmenities = preferences.amenityPreferences.filter(
              (amenity: string) => flightAmenities.includes(amenity)
            );
            
            if (matchingAmenities.length > 0) {
              matchReasons.push(`Offers ${matchingAmenities.length} amenities you prefer`);
            }
          }
          
          // Default reason if no specific reasons found
          if (matchReasons.length === 0) {
            matchReasons.push('Matches your general preferences');
          }
          
          flightMatches.push({
            flight,
            matchScore: match.score || 0,
            matchReasons,
          });
        }
      }
    }
    
    // Sort by match score and limit results
    return flightMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
    
  } catch (error) {
    console.error('Error finding matching flights:', error);
    return [];
  }
}

/**
 * Finds matching travel companions based on user profile
 */
export async function findMatchingCompanions(
  userId: string,
  flightId?: string,
  limit: number = 10
): Promise<CompanionMatch[]> {
  try {
    // Get user profile and generate embedding
    const userProfile = await getEnrichedUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    const userEmbedding = await generateUserEmbedding(userProfile);
    
    // Build filter for Pinecone query
    const pineconeFilter: any = {
      type: 'user',
      $not: {
        userId: userId // Exclude the current user
      }
    };
    
    // Query Pinecone for similar users
    const matches = await findSimilarUsers(userEmbedding, limit * 2, pineconeFilter);
    
    // Process and enrich results
    const companionMatches: CompanionMatch[] = [];
    
    for (const match of matches) {
      const matchUserId = match.metadata.userId;
      const matchProfile = await getEnrichedUserProfile(matchUserId);
      
      if (matchProfile) {
        // Calculate match reasons
        const matchReasons: string[] = [];
        
        // Professional background similarity
        if (
          userProfile.professionalDetails?.industry && 
          matchProfile.professionalDetails?.industry &&
          userProfile.professionalDetails.industry === matchProfile.professionalDetails.industry
        ) {
          matchReasons.push(`Works in the same industry (${matchProfile.professionalDetails.industry})`);
        }
        
        // Interests similarity
        if (userProfile.interestsAndHobbies && matchProfile.interestsAndHobbies) {
          const commonInterests = userProfile.interestsAndHobbies.filter(
            (interest: string) => matchProfile.interestsAndHobbies?.includes(interest)
          );
          
          if (commonInterests.length > 0) {
            matchReasons.push(`Shares ${commonInterests.length} common interests with you`);
          }
        }
        
        // Travel preferences similarity
        if (
          userProfile.preferences?.preferredDestinations && 
          matchProfile.preferences?.preferredDestinations
        ) {
          const commonDestinations = userProfile.preferences.preferredDestinations.filter(
            (dest: string) => matchProfile.preferences?.preferredDestinations?.includes(dest)
          );
          
          if (commonDestinations.length > 0) {
            matchReasons.push(`Likes traveling to similar destinations`);
          }
        }
        
        // Default reason if no specific reasons found
        if (matchReasons.length === 0) {
          matchReasons.push('Similar travel profile');
        }
        
        // Find compatible flights if requested and if this is a good match
        let compatibleFlights: string[] | undefined = undefined;
        
        if (flightId && match.score > 0.7) {
          // In a real implementation, we would search for flights that both users would be interested in
          // For simplicity, we'll just use the provided flightId
          compatibleFlights = [flightId];
        }
        
        companionMatches.push({
          user: {
            id: matchProfile.id,
            name: `${matchProfile.firstName || ''} ${matchProfile.lastName || ''}`.trim(),
            avatarUrl: matchProfile.avatarUrl,
          },
          matchScore: match.score || 0,
          matchReasons,
          compatibleFlights,
        });
      }
    }
    
    // Sort by match score and limit results
    return companionMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
    
  } catch (error) {
    console.error('Error finding matching companions:', error);
    return [];
  }
}

/**
 * Main function to match flights and travel companions
 */
export async function findMatches(query: MatchQuery): Promise<MatchingResponse> {
  try {
    const { 
      userId, 
      includeFlights = true, 
      includeCompanions = true,
      destinationPreference,
      dateRange,
      tripPurpose,
      maxResults = 10
    } = query;
    
    // Prepare filter based on query parameters
    const flightFilter: any = {};
    
    if (destinationPreference) {
      flightFilter.destination = destinationPreference;
    }
    
    if (dateRange) {
      flightFilter.departure_after = dateRange.start;
      flightFilter.departure_before = dateRange.end;
    }
    
    // Execute matches in parallel for better performance
    const [flightMatches, companionMatches] = await Promise.all([
      includeFlights ? findMatchingFlights(userId, flightFilter, maxResults) : Promise.resolve([]),
      includeCompanions ? findMatchingCompanions(userId, undefined, maxResults) : Promise.resolve([])
    ]);
    
    return {
      userId,
      recommendedFlights: includeFlights ? flightMatches : undefined,
      recommendedCompanions: includeCompanions ? companionMatches : undefined,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error finding matches:', error);
    throw error;
  }
} 