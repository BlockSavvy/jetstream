/**
 * Browser-compatible Pinecone service
 * 
 * This is a simplified version of the Pinecone service that works in the browser
 * by using API endpoints instead of the direct Pinecone SDK which has Node.js dependencies.
 */

import axios from 'axios';
import { EnrichedProfile } from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import * as embeddings from './embeddings';

// Define constants
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'jetstream';
const USERS_NAMESPACE = 'users';
const FLIGHTS_NAMESPACE = 'flights';
const OFFERS_NAMESPACE = 'offers';
const CREWS_NAMESPACE = 'crews';
const SIMULATIONS_NAMESPACE = 'simulations';

// Create a record interface to match the PineconeRecord type
export interface PineconeRecordBrowser {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

/**
 * Get the namespace for a specific entity type
 */
export function getNamespace(entityType: string): string {
  switch (entityType.toLowerCase()) {
    case 'user':
      return USERS_NAMESPACE;
    case 'flight':
      return FLIGHTS_NAMESPACE;
    case 'jetshare_offer':
      return OFFERS_NAMESPACE;
    case 'crew':
      return CREWS_NAMESPACE;
    case 'simulation':
      return SIMULATIONS_NAMESPACE;
    default:
      return '';
  }
}

/**
 * Upsert a record to Pinecone using the API endpoint
 * This avoids the Node.js dependencies in the Pinecone SDK
 */
export async function upsertRecord(record: {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
  namespace?: string;
}): Promise<void> {
  try {
    // Use the API endpoint to upsert the record
    const response = await axios.post('/api/embedding/upsert', {
      id: record.id,
      values: record.embedding,
      metadata: record.metadata,
      namespace: record.namespace || ''
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to upsert record: ${response.statusText}`);
    }
    
    console.log(`Upserted record ${record.id} to Pinecone`);
  } catch (error) {
    console.error('Error upserting record to Pinecone:', error);
    throw error;
  }
}

/**
 * Upsert a user profile to Pinecone via API
 */
export async function upsertUserProfile(profile: EnrichedProfile): Promise<void> {
  try {
    console.log(`Upserting user profile for user ${profile.id} to Pinecone`);
    
    // Generate embedding for the user profile
    const userEmbedding = await embeddings.generateUserEmbedding(profile);
    
    // Extract metadata
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    const industry = profile.professionalDetails?.industry || '';
    const jobTitle = profile.professionalDetails?.jobTitle || '';
    const interests = profile.interestsAndHobbies?.join(', ') || '';
    const tripTypes = profile.preferences?.tripTypes?.join(', ') || '';
    
    const metadata = {
      userId: profile.id,
      firstName,
      lastName,
      type: 'user',
      ...(industry && { industry }),
      ...(jobTitle && { jobTitle }),
      ...(interests && { interests }),
      ...(tripTypes && { tripTypes }),
      updatedAt: new Date().toISOString()
    };
    
    // Use the API to upsert the record
    await upsertRecord({
      id: `user-${profile.id}`,
      embedding: userEmbedding,
      metadata,
      namespace: USERS_NAMESPACE
    });
    
    console.log(`Successfully upserted user profile for ${profile.id}`);
    
    // Log to embedding_logs table
    try {
      await axios.post('/api/embedding/logging', {
        object_type: 'user',
        object_id: profile.id,
        status: 'success',
        embedding_model: 'openai:text-embedding-ada-002',
        token_count: JSON.stringify(profile).length / 4 // Rough estimate
      });
    } catch (logError) {
      console.error('Error logging embedding operation:', logError);
    }
  } catch (error) {
    console.error(`Error upserting user profile for ${profile.id}:`, error);
    throw error;
  }
}

/**
 * Upsert a flight to Pinecone via API
 */
export async function upsertFlight(flight: Flight): Promise<void> {
  try {
    console.log(`Upserting flight ${flight.id} to Pinecone`);
    
    // Generate embedding for the flight
    const flightEmbedding = await embeddings.generateFlightEmbedding(flight);
    
    // Extract metadata
    const metadata = {
      flightId: flight.id,
      origin: flight.origin_airport || '',
      destination: flight.destination_airport || '',
      departureTime: flight.departure_time,
      arrivalTime: flight.arrival_time,
      price: flight.base_price.toString(),
      seats: flight.available_seats.toString(),
      jetModel: flight.jets?.model,
      type: 'flight',
      updatedAt: new Date().toISOString()
    };
    
    // Use the API to upsert the record
    await upsertRecord({
      id: `flight-${flight.id}`,
      embedding: flightEmbedding,
      metadata,
      namespace: FLIGHTS_NAMESPACE
    });
    
    console.log(`Successfully upserted flight ${flight.id}`);
    
    // Log to embedding_logs table
    try {
      await axios.post('/api/embedding/logging', {
        object_type: 'flight',
        object_id: flight.id,
        status: 'success',
        embedding_model: 'openai:text-embedding-ada-002',
        token_count: JSON.stringify(flight).length / 4 // Rough estimate
      });
    } catch (logError) {
      console.error('Error logging embedding operation:', logError);
    }
  } catch (error) {
    console.error(`Error upserting flight ${flight.id}:`, error);
    throw error;
  }
}

/**
 * Find similar flights in Pinecone via API
 */
export async function findSimilarFlights(
  embedding: number[],
  limit: number = 10,
  filter: Record<string, any> = {}
): Promise<Array<{id: string; score: number; metadata: any}>> {
  try {
    console.log('Searching for similar flights in Pinecone');
    
    // Add namespace filter
    const pineconeFilter = {
      ...filter,
      type: 'flight' // Ensure we only get flights
    };
    
    // Use the API to query Pinecone
    const response = await axios.post('/api/embedding/query', {
      vector: embedding,
      filter: pineconeFilter,
      topK: limit,
      includeMetadata: true,
      namespace: FLIGHTS_NAMESPACE
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to query Pinecone: ${response.statusText}`);
    }
    
    // Process results
    const matches = response.data.matches || [];
    
    // Transform to consistently structured results
    const results = matches.map((match: { id: string; score: number; metadata?: Record<string, any> }) => {
      const flightId = match.metadata?.flightId || match.id.replace('flight-', '');
      return {
        id: flightId,
        score: match.score,
        metadata: match.metadata || {}
      };
    });
    
    console.log(`Found ${results.length} similar flights`);
    return results;
  } catch (error) {
    console.error('Error finding similar flights:', error);
    return [];
  }
}

/**
 * Find similar users in Pinecone via API
 */
export async function findSimilarUsers(
  embedding: number[],
  limit: number = 10,
  filter: Record<string, any> = {}
): Promise<Array<{id: string; score: number; metadata: any}>> {
  try {
    console.log('Searching for similar users in Pinecone');
    
    // Add namespace filter
    const pineconeFilter = {
      ...filter,
      type: 'user' // Ensure we only get users
    };
    
    // Use the API to query Pinecone
    const response = await axios.post('/api/embedding/query', {
      vector: embedding,
      filter: pineconeFilter,
      topK: limit,
      includeMetadata: true,
      namespace: USERS_NAMESPACE
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to query Pinecone: ${response.statusText}`);
    }
    
    // Process results
    const matches = response.data.matches || [];
    
    // Transform to consistently structured results
    const results = matches.map((match: { id: string; score: number; metadata?: Record<string, any> }) => {
      const userId = match.metadata?.userId || match.id.replace('user-', '');
      return {
        id: userId,
        score: match.score,
        metadata: match.metadata || {}
      };
    });
    
    console.log(`Found ${results.length} similar users`);
    return results;
  } catch (error) {
    console.error('Error finding similar users:', error);
    return [];
  }
}

/**
 * Delete a record from Pinecone by ID via API
 */
export async function deleteRecord(id: string, namespace?: string): Promise<void> {
  try {
    // Use the API to delete the record
    const response = await axios.post('/api/embedding/delete', {
      id,
      namespace
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to delete record: ${response.statusText}`);
    }
    
    console.log(`Deleted Pinecone record: ${id}`);
  } catch (error) {
    console.error('Error deleting record from Pinecone:', error);
    throw error;
  }
} 