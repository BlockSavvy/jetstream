import { CohereEmbeddings } from '@langchain/cohere';
import { EnrichedProfile, TravelHistory, UserPreferences } from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import axios from 'axios';

// Initialize Cohere embeddings with API key
const cohereApiKey = process.env.COHERE_API_KEY || 'gjiwLcvAkdZkvSVgMAG4OP4lQC1klq86nDEZ0vZa';

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
export function generateUserProfileText(profile: EnrichedProfile): string {
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
    profileText += ` Has traveled from ${Array.from(new Set(profile.travelHistory.map(h => h.origin))).join(', ')} to ${Array.from(new Set(profile.travelHistory.map(h => h.destination))).join(', ')}.`;
  }
  
  return profileText;
}

/**
 * Generates a text representation of flight for embedding
 */
export function generateFlightText(flight: Flight): string {
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
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += Math.pow(embedding1[i], 2);
    magnitude2 += Math.pow(embedding2[i], 2);
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Embeddings service for JetStream
 * Handles generation of vector embeddings for AI matching using Cohere.ai
 */

// Cohere API endpoint for embeddings
const COHERE_API_ENDPOINT = 'https://api.cohere.ai/v1/embed';

/**
 * Generate embeddings for a text using Cohere API
 * @param text The text to generate embeddings for
 * @returns Promise<number[]> The embedding vector
 */
export async function encode(text: string): Promise<number[]> {
  try {
    // Prepare the request to Cohere API
    const response = await axios.post(
      COHERE_API_ENDPOINT,
      {
        texts: [text],
        model: 'embed-english-v3.0',
        truncate: 'END'
      },
      {
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the embedding vector from the response
    if (response.data && response.data.embeddings && response.data.embeddings.length > 0) {
      return response.data.embeddings[0];
    }

    throw new Error('Failed to generate embeddings');
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
}

/**
 * Batch encode multiple texts at once for efficiency
 * @param texts Array of texts to encode
 * @returns Promise<number[][]> Array of embedding vectors
 */
export async function batchEncode(texts: string[]): Promise<number[][]> {
  try {
    // Handle empty array case
    if (!texts || texts.length === 0) {
      return [];
    }

    // Prepare the request to Cohere API
    const response = await axios.post(
      COHERE_API_ENDPOINT,
      {
        texts: texts,
        model: 'embed-english-v3.0',
        truncate: 'END'
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
    console.error('Error generating batch embeddings:', error);
    throw new Error('Failed to generate batch embeddings');
  }
}

/**
 * Generates a text representation of JetShare offer for embedding
 */
export function generateJetShareOfferText(offer: any): string {
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

/**
 * Generates embeddings for a JetShare offer
 */
export async function generateJetShareOfferEmbedding(offer: any): Promise<number[]> {
  const embeddings = getCohereEmbeddings();
  const offerText = generateJetShareOfferText(offer);
  const result = await embeddings.embedDocuments([offerText]);
  return result[0];
} 