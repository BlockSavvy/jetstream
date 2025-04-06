import { CohereEmbeddings } from '@langchain/cohere';
import { EnrichedProfile, TravelHistory, UserPreferences } from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import { JetShareOffer } from '@/types/jetshare';
import axios from 'axios';
import { PineconeRecord } from '@pinecone-database/pinecone';
import { createClient } from '@/lib/supabase-server';
import * as cohere from 'cohere-ai';

// Initialize Cohere embeddings with API key
const cohereApiKey = process.env.COHERE_API_KEY || '';

/**
 * Creates a CohereEmbeddings instance if not already created
 */
export function getCohereEmbeddings(): CohereEmbeddings {
  if (!cohereApiKey) {
    throw new Error("COHERE_API_KEY environment variable is not set");
  }
  
  return new CohereEmbeddings({ 
    apiKey: cohereApiKey,
    model: "embed-english-v3.0" // Using a high-quality embedding model
  });
}

/**
 * Generates a text representation of user profile for embedding
 */
export function generateUserProfileText(profile: any): string {
  // Check if this is an EnrichedProfile from the matching.types
  if (profile.preferences || profile.professionalDetails) {
    const preferences = profile.preferences || {};
    const professionalDetails = profile.professionalDetails || {};
    
    let profileText = `User ${profile.firstName || 'Anonymous'} ${profile.lastName || ''}`.trim() + '.';
    
    if (profile.bio) {
      profileText += ` Bio: ${profile.bio}.`;
    }
    
    if (professionalDetails.industry) {
      profileText += ` Works in ${professionalDetails.industry}`;
      if (professionalDetails.jobTitle) {
        profileText += ` as ${professionalDetails.jobTitle}`;
      }
      if (professionalDetails.company) {
        profileText += ` at ${professionalDetails.company}`;
      }
      profileText += `.`;
    }
    
    if (professionalDetails.expertise && professionalDetails.expertise.length > 0) {
      profileText += ` Has expertise in ${professionalDetails.expertise.join(', ')}.`;
    }
    
    if (profile.interestsAndHobbies && profile.interestsAndHobbies.length > 0) {
      profileText += ` Interests include ${profile.interestsAndHobbies.join(', ')}.`;
    }
    
    if (preferences.preferredDestinations && preferences.preferredDestinations.length > 0) {
      profileText += ` Prefers traveling to ${preferences.preferredDestinations.join(', ')}.`;
    }
    
    if (preferences.travelInterests && preferences.travelInterests.length > 0) {
      profileText += ` Interested in ${preferences.travelInterests.join(', ')} when traveling.`;
    }
    
    if (preferences.tripTypes && preferences.tripTypes.length > 0) {
      profileText += ` Usually travels for ${preferences.tripTypes.join(', ')}.`;
    }
    
    if (preferences.languages && preferences.languages.length > 0) {
      profileText += ` Speaks ${preferences.languages.join(', ')}.`;
    }
    
    // Add travel history if available
    if (profile.travelHistory && profile.travelHistory.length > 0) {
      profileText += ` Has traveled from ${Array.from(new Set(profile.travelHistory.map((h: any) => h.origin))).join(', ')} to ${Array.from(new Set(profile.travelHistory.map((h: any) => h.destination))).join(', ')}.`;
    }
    
    return profileText;
  } else {
    // Regular user profile format for the newer UI
    let text = `User Profile\n`;
    
    if (profile.firstName && profile.lastName) {
      text += `Name: ${profile.firstName} ${profile.lastName}\n`;
    } else if (profile.first_name && profile.last_name) {
      text += `Name: ${profile.first_name} ${profile.last_name}\n`;
    }
    
    if (profile.bio) {
      text += `Bio: ${profile.bio}\n`;
    }
    
    if (profile.role) {
      text += `Role: ${profile.role}\n`;
    }
    
    // Add preferences if available
    if (profile.preferences) {
      const prefs = profile.preferences;
      
      if (prefs.preferredDestinations && prefs.preferredDestinations.length > 0) {
        text += `Preferred Destinations: ${prefs.preferredDestinations.join(', ')}\n`;
      }
      
      if (prefs.travelInterests && prefs.travelInterests.length > 0) {
        text += `Travel Interests: ${prefs.travelInterests.join(', ')}\n`;
      }
      
      if (prefs.tripTypes && prefs.tripTypes.length > 0) {
        text += `Trip Types: ${prefs.tripTypes.join(', ')}\n`;
      }
      
      if (prefs.languages && prefs.languages.length > 0) {
        text += `Languages: ${prefs.languages.join(', ')}\n`;
      }
    }
    
    // Add professional details if available
    if (profile.professionalDetails) {
      const prof = profile.professionalDetails;
      
      if (prof.industry) {
        text += `Industry: ${prof.industry}\n`;
      }
      
      if (prof.jobTitle) {
        text += `Job Title: ${prof.jobTitle}\n`;
      }
      
      if (prof.company) {
        text += `Company: ${prof.company}\n`;
      }
      
      if (prof.expertise && prof.expertise.length > 0) {
        text += `Expertise: ${prof.expertise.join(', ')}\n`;
      }
    }
    
    // Add interests and hobbies if available
    if (profile.interestsAndHobbies && profile.interestsAndHobbies.length > 0) {
      text += `Interests and Hobbies: ${profile.interestsAndHobbies.join(', ')}\n`;
    }
    
    // Add travel history if available
    if (profile.travelHistory && profile.travelHistory.length > 0) {
      text += `Travel History:\n`;
      
      profile.travelHistory.forEach((trip: any) => {
        const date = trip.date ? new Date(trip.date).toLocaleDateString() : 'Unknown date';
        text += `- ${trip.origin || 'Unknown'} to ${trip.destination || 'Unknown'} (${date})\n`;
      });
    }
    
    return text;
  }
}

/**
 * Generates a text representation of flight for embedding
 */
export function generateFlightText(flight: any): string {
  // Check if this is a Flight from the flights.types
  if (flight.origin && flight.destination) {
    const origin = flight.origin || { code: flight.origin_airport, name: flight.origin_airport };
    const destination = flight.destination || { code: flight.destination_airport, name: flight.destination_airport };
    
    let flightText = `Flight from ${origin.name || origin.code} to ${destination.name || destination.code}.`;
    flightText += ` Departure: ${flight.departure_time}. Arrival: ${flight.arrival_time}.`;
    flightText += ` Available seats: ${flight.available_seats}. Price: ${flight.base_price}.`;
    
    if (flight.jets) {
      flightText += ` Jet: ${flight.jets.manufacturer} ${flight.jets.model}, capacity: ${flight.jets.capacity}.`;
      
      if (flight.jets.amenities) {
        const amenities = Array.isArray(flight.jets.amenities) 
          ? flight.jets.amenities.join(', ')
          : typeof flight.jets.amenities === 'object' && flight.jets.amenities !== null
            ? Object.keys(flight.jets.amenities).join(', ')
            : String(flight.jets.amenities);
            
        flightText += ` Amenities: ${amenities}.`;
      }
    }
    
    return flightText;
  } else {
    // Format for the newer UI
    // Format dates if available
    const departureTime = flight.departure_time 
      ? new Date(flight.departure_time).toLocaleString()
      : 'Unknown';
    
    const arrivalTime = flight.arrival_time
      ? new Date(flight.arrival_time).toLocaleString()
      : 'Unknown';
    
    let text = `Flight\n`;
    text += `From: ${flight.origin_airport || 'Unknown'}\n`;
    text += `To: ${flight.destination_airport || 'Unknown'}\n`;
    text += `Departure: ${departureTime}\n`;
    text += `Arrival: ${arrivalTime}\n`;
    
    if (flight.jets) {
      text += `Aircraft: ${flight.jets.manufacturer} ${flight.jets.model}\n`;
      
      if (flight.jets.seat_capacity) {
        text += `Capacity: ${flight.jets.seat_capacity} seats\n`;
      }
    }
    
    if (flight.base_price) {
      text += `Base Price: $${flight.base_price.toLocaleString()}\n`;
    }
    
    if (flight.available_seats !== undefined) {
      text += `Available Seats: ${flight.available_seats}\n`;
    }
    
    if (flight.flight_number) {
      text += `Flight Number: ${flight.flight_number}\n`;
    }
    
    if (flight.amenities && flight.amenities.length > 0) {
      text += `Amenities: ${flight.amenities.join(', ')}\n`;
    }
    
    if (flight.status) {
      text += `Status: ${flight.status}\n`;
    }
    
    return text;
  }
}

/**
 * Generate a text representation of a JetShare offer for embedding
 */
export function generateJetShareOfferText(offer: any): string {
  // Determine which format to use based on the offer's properties
  if (offer.departure_location && offer.arrival_location) {
    // Format the flight date and time if available
    let formattedDate = 'Unknown date and time';
    if (offer.flight_date) {
      const date = new Date(offer.flight_date);
      formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    }

    // Format departure time if available
    if (offer.departure_time) {
      const departureTime = new Date(offer.departure_time);
      formattedDate += ` at ${departureTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }

    let text = `JetShare Flight Offer\n`;
    text += `From: ${offer.departure_location || 'Unknown'}\n`;
    text += `To: ${offer.arrival_location || 'Unknown'}\n`;
    text += `Date and Time: ${formattedDate}\n`;
    
    if (offer.aircraft_model) {
      text += `Aircraft: ${offer.aircraft_model}\n`;
    }
    
    if (offer.total_flight_cost) {
      text += `Total Cost: $${offer.total_flight_cost.toLocaleString()}\n`;
    }
    
    if (offer.requested_share_amount) {
      text += `Share Cost: $${offer.requested_share_amount.toLocaleString()}\n`;
    }
    
    if (offer.total_seats !== undefined && offer.available_seats !== undefined) {
      text += `Seats: ${offer.available_seats} available out of ${offer.total_seats} total\n`;
    } else if (offer.available_seats !== undefined) {
      text += `Available Seats: ${offer.available_seats}\n`;
    }
    
    if (offer.details) {
      text += `Additional Details: ${offer.details}\n`;
    }
    
    if (offer.has_ai_matching) {
      text += `AI Matching: Enabled\n`;
    }

    return text;
  } else {
    // Original format (not expected anymore)
    let offerText = `JetShare offer from ${offer.departure_location} to ${offer.arrival_location}.`;
    offerText += ` Flight date: ${new Date(offer.flight_date).toLocaleDateString()}.`;
    
    // Include departure time information
    if (offer.departure_time) {
      const departureTime = new Date(offer.departure_time);
      offerText += ` Departure time: ${departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${departureTime.toLocaleDateString()}.`;
      offerText += ` Readable departure: ${departureTime.toLocaleString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      })}.`;
    }
    
    offerText += ` Total cost: $${offer.total_flight_cost}. Share amount: $${offer.requested_share_amount}.`;
    
    if (offer.aircraft_model) {
      offerText += ` Aircraft: ${offer.aircraft_model}.`;
    }
    
    if (offer.total_seats && offer.available_seats) {
      offerText += ` ${offer.available_seats} of ${offer.total_seats} seats available.`;
    }
    
    return offerText;
  }
}

/**
 * Generate a text representation of a crew member for embedding
 */
export function generateCrewText(crew: any): string {
  let text = `Crew Member: ${crew.name || 'Unknown'}\n`;
  
  if (crew.bio) {
    text += `Bio: ${crew.bio}\n`;
  }
  
  if (crew.crew_specializations && crew.crew_specializations.length > 0) {
    const specializations = crew.crew_specializations.map((spec: any) => spec.name).join(', ');
    text += `Specializations: ${specializations}\n`;
    
    // Add more details from specializations
    crew.crew_specializations.forEach((spec: any) => {
      if (spec.description) {
        text += `${spec.name}: ${spec.description}\n`;
      }
    });
  }
  
  if (crew.average_rating) {
    text += `Average Rating: ${crew.average_rating}/5\n`;
  }
  
  if (crew.reviews_count) {
    text += `Number of Reviews: ${crew.reviews_count}\n`;
  }
  
  if (crew.availability_status) {
    text += `Availability: ${crew.availability_status}\n`;
  }
  
  if (crew.certifications && crew.certifications.length > 0) {
    text += `Certifications: ${crew.certifications.join(', ')}\n`;
  }
  
  return text;
}

/**
 * Generate a text representation of a simulation log for embedding
 */
export function generateSimulationText(simulation: any): string {
  const simType = (simulation.sim_type || '').toUpperCase();
  let startDate = 'Unknown';
  let endDate = 'Unknown';
  
  if (simulation.start_date) {
    startDate = new Date(simulation.start_date).toLocaleDateString();
  }
  
  if (simulation.end_date) {
    endDate = new Date(simulation.end_date).toLocaleDateString();
  }
  
  let text = `${simType} Simulation\n`;
  text += `Date Range: ${startDate} to ${endDate}\n`;
  text += `Virtual Users: ${simulation.virtual_users || 'Unknown'}\n`;
  
  // Add metrics if available
  if (simulation.results_summary && simulation.results_summary.metrics) {
    const metrics = simulation.results_summary.metrics;
    
    if (metrics.offerFillRate !== undefined) {
      text += `Fill Rate: ${Math.round(metrics.offerFillRate * 100)}%\n`;
    }
    
    if (metrics.revenue !== undefined && metrics.maxRevenue !== undefined) {
      const recoveryRate = Math.round((metrics.revenue / metrics.maxRevenue) * 100);
      text += `Cost Recovery: ${recoveryRate}%\n`;
    }
    
    if (metrics.acceptedFlights !== undefined) {
      text += `Accepted Flights: ${metrics.acceptedFlights}\n`;
    }
    
    if (metrics.unfilledFlights !== undefined) {
      text += `Unfilled Flights: ${metrics.unfilledFlights}\n`;
    }
  }
  
  // Add information from input parameters
  if (simulation.input_parameters) {
    const params = simulation.input_parameters;
    
    if (params.origin) {
      text += `Origin: ${params.origin}\n`;
    }
    
    if (params.destination) {
      text += `Destination: ${params.destination}\n`;
    }
  }
  
  text += `AI Matching: ${simulation.ai_matching_enabled ? 'Enabled' : 'Disabled'}\n`;
  
  // Add summary if available
  if (simulation.agent_instruction_summary) {
    text += `Summary: ${simulation.agent_instruction_summary}\n`;
  } else if (simulation.results_summary && simulation.results_summary.summaryText) {
    text += `Summary: ${simulation.results_summary.summaryText}\n`;
  }
  
  return text;
}

/**
 * Generates embeddings for a JetShare offer
 */
export async function generateJetShareOfferEmbedding(offer: JetShareOffer): Promise<number[]> {
  const embeddings = getCohereEmbeddings();
  const offerText = generateJetShareOfferText(offer);
  const result = await embeddings.embedDocuments([offerText]);
  return result[0];
}

/**
 * Generates embeddings for a user profile
 */
export async function generateUserEmbedding(profile: EnrichedProfile): Promise<number[]> {
  const embeddings = getCohereEmbeddings();
  const profileText = generateUserProfileText(profile);
  const result = await embeddings.embedDocuments([profileText]);
  return result[0];
}

/**
 * Generates embeddings for a flight
 */
export async function generateFlightEmbedding(flight: Flight): Promise<number[]> {
  const embeddings = getCohereEmbeddings();
  const flightText = generateFlightText(flight);
  const result = await embeddings.embedDocuments([flightText]);
  return result[0];
}

/**
 * Generates embeddings for a travel query
 */
export async function generateQueryEmbedding(queryText: string): Promise<number[]> {
  const embeddings = getCohereEmbeddings();
  const result = await embeddings.embedDocuments([queryText]);
  return result[0];
}

/**
 * Calculates cosine similarity between two embeddings
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  let dotProduct = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
  }
  
  const norm1 = Math.sqrt(embedding1.reduce((sum, x) => sum + x * x, 0));
  const norm2 = Math.sqrt(embedding2.reduce((sum, x) => sum + x * x, 0));
  
  return dotProduct / (norm1 * norm2);
}

/**
 * Generic embedding input generator for any entity type
 */
export function generateEmbeddingInput(entity: any, entityType: string): string {
  switch (entityType.toLowerCase()) {
    case 'jetshare_offer':
      return generateJetShareOfferText(entity);
    case 'flight':
      return generateFlightText(entity);
    case 'crew':
      return generateCrewText(entity);
    case 'user':
      return generateUserProfileText(entity);
    case 'simulation':
      return generateSimulationText(entity);
    default:
      // For unknown types, try to create a generic representation
      return JSON.stringify(entity, null, 2);
  }
}

/**
 * Create an embedding vector from text using Cohere
 */
export async function encode(text: string): Promise<number[]> {
  try {
    // Use axios directly since cohere-ai package might not have the right methods
    const response = await axios.post(
      'https://api.cohere.ai/v1/embed',
      {
        texts: [text],
        model: 'embed-english-v3.0',
        truncate: 'END',
        input_type: 'search_query'
      },
      {
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.embeddings && response.data.embeddings.length > 0) {
      return response.data.embeddings[0];
    }
    
    throw new Error('No embeddings returned from Cohere');
  } catch (error) {
    // Fall back to OpenAI embeddings if Cohere fails
    try {
      return await encodeWithOpenAI(text);
    } catch (fallbackError) {
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }
}

/**
 * Create an embedding vector from text using OpenAI (fallback option)
 */
export async function encodeWithOpenAI(text: string): Promise<number[]> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-large'
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.length > 0 && data.data[0].embedding) {
      return data.data[0].embedding;
    }
    
    throw new Error('No embeddings returned from OpenAI');
  } catch (error) {
    throw new Error(`OpenAI embedding failed: ${error}`);
  }
}

/**
 * Batch encode multiple texts at once for efficiency
 */
export async function batchEncode(texts: string[]): Promise<number[][]> {
  try {
    // Handle empty array case
    if (!texts || texts.length === 0) {
      return [];
    }

    if (!cohereApiKey) {
      throw new Error('COHERE_API_KEY environment variable is not set');
    }

    // Use axios directly for the Cohere API
    const response = await axios.post(
      'https://api.cohere.ai/v1/embed',
      {
        texts: texts,
        model: 'embed-english-v3.0',
        truncate: 'END',
        input_type: 'search_query'
      },
      {
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the embedding vectors from the response
    if (response.data && response.data.embeddings) {
      return response.data.embeddings;
    }

    throw new Error('Failed to generate batch embeddings');
  } catch (error) {
    throw new Error(`Failed to generate batch embeddings: ${error}`);
  }
}

/**
 * Prepare a record for Pinecone upsert with all necessary metadata
 */
export function preparePineconeRecord(
  id: string,
  vector: number[],
  entityType: string,
  entity: any,
  text: string
): PineconeRecord {
  // Base metadata that should be included for all types
  const baseMetadata = {
    object_type: entityType,
    object_id: id,
    created_at: entity.created_at || new Date().toISOString(),
    input_text: text
  };
  
  // Add type-specific metadata
  let metadata: any = { ...baseMetadata };
  
  switch (entityType) {
    case 'jetshare_offer':
      metadata = {
        ...metadata,
        user_id: entity.created_by,
        departure_location: entity.departure_location,
        arrival_location: entity.arrival_location,
        flight_date: entity.flight_date,
        departure_time: entity.departure_time,
        total_flight_cost: entity.total_flight_cost,
        requested_share_amount: entity.requested_share_amount,
        available_seats: entity.available_seats,
        has_ai_matching: entity.has_ai_matching || false
      };
      break;
      
    case 'flight':
      metadata = {
        ...metadata,
        origin: entity.origin_airport,
        destination: entity.destination_airport,
        departure_time: entity.departure_time,
        arrival_time: entity.arrival_time,
        available_seats: entity.available_seats,
        price: entity.base_price,
        jet_model: entity.jets?.model || 'Unknown',
        jet_manufacturer: entity.jets?.manufacturer || 'Unknown'
      };
      break;
      
    case 'crew':
      metadata = {
        ...metadata,
        name: entity.name,
        bio: entity.bio,
        specializations: Array.isArray(entity.crew_specializations) 
          ? entity.crew_specializations.map((spec: any) => spec.name).join(', ') 
          : '',
        image_url: entity.image_url,
        rating: entity.average_rating
      };
      break;
      
    case 'user':
      metadata = {
        ...metadata,
        email: entity.email,
        full_name: typeof entity.firstName === 'string' && typeof entity.lastName === 'string'
          ? `${entity.firstName} ${entity.lastName}`.trim()
          : typeof entity.first_name === 'string' && typeof entity.last_name === 'string'
            ? `${entity.first_name} ${entity.last_name}`.trim()
            : '',
        role: entity.role || 'user',
        interests: Array.isArray(entity.interestsAndHobbies) 
          ? entity.interestsAndHobbies.join(', ') 
          : ''
      };
      break;
      
    case 'simulation':
      metadata = {
        ...metadata,
        sim_type: entity.sim_type,
        start_date: entity.start_date,
        end_date: entity.end_date,
        virtual_users: entity.virtual_users,
        ai_matching_enabled: entity.ai_matching_enabled,
        user_id: entity.triggered_by_user_id
      };
      break;
  }
  
  // Ensure all metadata values are strings for Pinecone compatibility
  Object.keys(metadata).forEach(key => {
    if (metadata[key] !== null && metadata[key] !== undefined && typeof metadata[key] !== 'string') {
      metadata[key] = String(metadata[key]);
    }
  });
  
  return {
    id,
    values: vector,
    metadata
  };
} 