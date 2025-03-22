import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { EnrichedProfile } from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import { v4 as uuidv4 } from 'uuid';
import { getCohereEmbeddings, generateUserEmbedding, generateFlightEmbedding } from './embeddings';

// Initialize Pinecone client
const pineconeApiKey = process.env.PINECONE_API_KEY || 'pcsk_43YvfP_PE6WWpZHaoxvznfduXY3S9nRoXqghCaKhm2T2W6SiGmHq91jsvunDhQswMnvm6g';
const pineconeCloud = process.env.PINECONE_CLOUD || 'gcp';
const pineconeRegion = process.env.PINECONE_REGION || 'us-central1';
const pineconeIndex = process.env.PINECONE_INDEX || 'jetstream';

// Define collections (namespaces) for different entity types
const USERS_NAMESPACE = 'users';
const FLIGHTS_NAMESPACE = 'flights';

/**
 * Gets a Pinecone client instance
 */
export function getPineconeClient(): Pinecone {
  if (!pineconeApiKey) {
    throw new Error('PINECONE_API_KEY environment variable is not set');
  }
  
  return new Pinecone({
    apiKey: pineconeApiKey,
  });
}

/**
 * Gets the Pinecone index
 */
export async function getPineconeIndex() {
  const client = getPineconeClient();
  return client.index(pineconeIndex);
}

/**
 * Creates a document for Langchain from a user profile
 */
export function createUserDocument(profile: EnrichedProfile, embedding: number[]): Document {
  // Extract needed properties safely using optional chaining
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
  };
  
  return new Document({
    pageContent: JSON.stringify(profile),
    metadata,
  });
}

/**
 * Creates a document for Langchain from a flight
 */
export function createFlightDocument(flight: Flight, embedding: number[]): Document {
  const metadata = {
    flightId: flight.id,
    origin: flight.origin_airport || '',
    destination: flight.destination_airport || '',
    departureTime: flight.departure_time,
    arrivalTime: flight.arrival_time,
    price: flight.base_price.toString(),
    seats: flight.available_seats.toString(),
    jetModel: flight.jets.model,
    type: 'flight',
  };
  
  return new Document({
    pageContent: JSON.stringify(flight),
    metadata,
  });
}

/**
 * Upserts a user profile to Pinecone
 */
export async function upsertUserProfile(profile: EnrichedProfile): Promise<string> {
  try {
    const index = await getPineconeIndex();
    const embedding = await generateUserEmbedding(profile);
    const document = createUserDocument(profile, embedding);
    
    // Use user ID as the vector ID
    const id = profile.id;
    
    // Upsert vector to Pinecone
    await index.upsert([{
      id: id,
      values: embedding,
      metadata: document.metadata,
    }]);
    
    return id;
  } catch (error) {
    console.error('Error upserting user profile to Pinecone:', error);
    throw error;
  }
}

/**
 * Upserts a flight to Pinecone
 */
export async function upsertFlight(flight: Flight): Promise<string> {
  try {
    const index = await getPineconeIndex();
    const embedding = await generateFlightEmbedding(flight);
    const document = createFlightDocument(flight, embedding);
    
    // Use flight ID as the vector ID
    const id = flight.id;
    
    // Upsert vector to Pinecone
    await index.upsert([{
      id: id,
      values: embedding,
      metadata: document.metadata,
    }]);
    
    return id;
  } catch (error) {
    console.error('Error upserting flight to Pinecone:', error);
    throw error;
  }
}

/**
 * Finds similar users based on an embedding query
 */
export async function findSimilarUsers(
  queryEmbedding: number[], 
  topK: number = 10, 
  filter?: object
): Promise<any[]> {
  try {
    const index = await getPineconeIndex();
    
    const queryRequest = {
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      includeValues: false,
      namespace: USERS_NAMESPACE,
      ...(filter && { filter }),
    };
    
    const results = await index.query(queryRequest);
    return results.matches || [];
  } catch (error) {
    console.error('Error querying similar users from Pinecone:', error);
    throw error;
  }
}

/**
 * Finds similar flights based on an embedding query
 */
export async function findSimilarFlights(
  queryEmbedding: number[], 
  topK: number = 10, 
  filter?: object
): Promise<any[]> {
  try {
    const index = await getPineconeIndex();
    
    const queryRequest = {
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      includeValues: false,
      namespace: FLIGHTS_NAMESPACE,
      ...(filter && { filter }),
    };
    
    const results = await index.query(queryRequest);
    return results.matches || [];
  } catch (error) {
    console.error('Error querying similar flights from Pinecone:', error);
    throw error;
  }
}

/**
 * Removes a user profile from the vector database
 */
export async function removeUserProfile(userId: string): Promise<void> {
  try {
    const index = await getPineconeIndex();
    await index.deleteMany([userId]); // Delete the vector by ID
  } catch (error) {
    console.error('Error removing user profile from Pinecone:', error);
    throw error;
  }
}

/**
 * Removes a flight from the vector database
 */
export async function removeFlight(flightId: string): Promise<void> {
  try {
    const index = await getPineconeIndex();
    await index.deleteMany([flightId]); // Delete the vector by ID
  } catch (error) {
    console.error('Error removing flight from Pinecone:', error);
    throw error;
  }
} 