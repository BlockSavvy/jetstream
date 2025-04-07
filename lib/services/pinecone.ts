/**
 * Pinecone Vector Database Service
 * 
 * This service provides functions for initializing, managing, and interacting with
 * the Pinecone vector database used for semantic search throughout JetStream.
 */

import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EnrichedProfile } from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import { v4 as uuidv4 } from 'uuid';
import * as embeddings from './embeddings';
import axios from 'axios';

// Initialize Pinecone client
const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || 'gcp-starter';
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'jetstream';

// Define collections (namespaces) for different entity types
const USERS_NAMESPACE = 'users';
const FLIGHTS_NAMESPACE = 'flights';
const OFFERS_NAMESPACE = 'offers';
const CREWS_NAMESPACE = 'crews';
const SIMULATIONS_NAMESPACE = 'simulations';

let pineconeInstance: Pinecone | null = null;
let indexCache: any = null;

/**
 * Get the Pinecone client instance
 * This function is used by the matching service
 */
export async function getPineconeClient(): Promise<Pinecone> {
  if (!pineconeInstance) {
    await initPinecone();
  }
  
  if (!pineconeInstance) {
    throw new Error('Failed to initialize Pinecone client');
  }
  
  return pineconeInstance;
}

/**
 * Initialize the Pinecone client if it doesn't exist
 */
export async function initPinecone(): Promise<Pinecone> {
  if (!pineconeInstance) {
    if (!PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }

    pineconeInstance = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
  }

  return pineconeInstance;
}

/**
 * Get the Pinecone index, creating it if it doesn't exist
 */
export async function getPineconeIndex() {
  // Return from cache if available
  if (indexCache) {
    return indexCache;
  }

  // Initialize Pinecone
  const pinecone = await initPinecone();

  // Check if the index exists
  const indexList = await pinecone.listIndexes();
  let indexExists = false;
  
  if (indexList.indexes) {
    for (const index of indexList.indexes) {
      if (index.name === PINECONE_INDEX_NAME) {
        indexExists = true;
        break;
      }
    }
  }

  // Create the index if it doesn't exist
  if (!indexExists) {
    // Using the standardized Pinecone API format
    // Check your Pinecone SDK version for the exact structure
    await pinecone.createIndex({
      name: PINECONE_INDEX_NAME,
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-west-2'
        }
      }
    });

    // Wait for the index to be ready
    console.log(`Creating Pinecone index ${PINECONE_INDEX_NAME}...`);
    let isReady = false;
    while (!isReady) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const indexDescription = await pinecone.describeIndex(PINECONE_INDEX_NAME);
      isReady = indexDescription.status.ready;
      
      if (!isReady) {
        console.log('Waiting for Pinecone index to be ready...');
      }
    }
    console.log(`Pinecone index ${PINECONE_INDEX_NAME} is ready.`);
  }

  // Get the index
  const index = pinecone.index(PINECONE_INDEX_NAME);
  indexCache = index;
  
  return index;
}

/**
 * Upsert a batch of records to Pinecone
 */
export async function upsertRecords(records: PineconeRecord[]): Promise<void> {
  // Ensure we're not trying to upsert an empty array
  if (records.length === 0) {
    return;
  }

  const index = await getPineconeIndex();
  
  // Pinecone has a limit of 100 vectors per upsert operation
  const batchSize = 100;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await index.upsert(batch);
  }
}

/**
 * Delete records from Pinecone by ID
 */
export async function deleteRecords(ids: string[]): Promise<void> {
  // Ensure we're not trying to delete an empty array
  if (ids.length === 0) {
    return;
  }

  const index = await getPineconeIndex();
  await index.deleteMany(ids);
}

/**
 * Clear all records from a namespace
 */
export async function clearNamespace(namespace: string): Promise<void> {
  const index = await getPineconeIndex();
  await index.deleteAll({ namespace });
}

/**
 * Perform a vector similarity search in Pinecone
 */
export async function vectorSearch(
  vector: number[],
  filter: Record<string, any> = {},
  topK: number = 10,
  includeMetadata: boolean = true
) {
  const index = await getPineconeIndex();
  
  return index.query({
    vector,
    filter,
    topK,
    includeMetadata
  });
}

/**
 * Get stats about the Pinecone index
 */
export async function getIndexStats() {
  const index = await getPineconeIndex();
  return index.describeIndexStats();
}

/**
 * Get a vector store for document storage and retrieval using LangChain
 */
export async function getVectorStore() {
  const index = await getPineconeIndex();
  return PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), { pineconeIndex: index });
}

/**
 * Add a document to the Pinecone vector store using LangChain
 */
export async function addDocuments(docs: Document[], namespace: string = '') {
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(docs, { namespace });
}

/**
 * Search for similar documents using text query
 */
export async function similaritySearch(query: string, k: number = 4, namespace: string = '') {
  const vectorStore = await getVectorStore();
  const results = await vectorStore.similaritySearch(query, k, { namespace });
  return results;
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
    jetModel: flight.jets?.model,
    type: 'flight',
  };
  
  return new Document({
    pageContent: JSON.stringify(flight),
    metadata,
  });
}

/**
 * Create a pinecone store for OpenAI embeddings
 */
export async function createPineconeVectorStore(texts: string[]) {
  const docs = texts.map(
    (pageContent) =>
      new Document({
        pageContent,
        metadata: {
          source: 'local',
          created_at: new Date().toISOString(),
        },
      })
  );

  const embeddings = new OpenAIEmbeddings();
  return PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex: await getPineconeIndex(),
    maxConcurrency: 5, // Maximum number of batch requests to make simultaneously
  });
}

/**
 * Upsert a user profile to Pinecone
 * @param profile The enriched user profile to upsert
 * @returns A promise that resolves when the operation is complete
 */
export async function upsertUserProfile(profile: EnrichedProfile): Promise<void> {
  try {
    console.log(`Upserting user profile for user ${profile.id} to Pinecone`);
    
    // Generate embedding for the user profile
    const userEmbedding = await embeddings.generateUserEmbedding(profile);
    
    // Create a document for the user
    const userDocument = createUserDocument(profile, userEmbedding);
    
    // Create record for Pinecone
    const record: PineconeRecord = {
      id: `user-${profile.id}`,
      values: userEmbedding,
      metadata: {
        ...userDocument.metadata,
        type: 'user',
        userId: profile.id,
        updatedAt: new Date().toISOString()
      }
    };
    
    // Upsert to Pinecone
    const index = await getPineconeIndex();
    await index.upsert([record], { namespace: USERS_NAMESPACE });
    
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
    
    // Log failure to embedding_logs table
    try {
      await axios.post('/api/embedding/logging', {
        object_type: 'user',
        object_id: profile.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        embedding_model: 'openai:text-embedding-ada-002'
      });
    } catch (logError) {
      console.error('Error logging embedding failure:', logError);
    }
    
    throw error;
  }
}

/**
 * Upsert a flight to Pinecone
 * @param flight The flight to upsert
 * @returns A promise that resolves when the operation is complete
 */
export async function upsertFlight(flight: Flight): Promise<void> {
  try {
    console.log(`Upserting flight ${flight.id} to Pinecone`);
    
    // Generate embedding for the flight
    const flightEmbedding = await embeddings.generateFlightEmbedding(flight);
    
    // Create a document for the flight
    const flightDocument = createFlightDocument(flight, flightEmbedding);
    
    // Create record for Pinecone
    const record: PineconeRecord = {
      id: `flight-${flight.id}`,
      values: flightEmbedding,
      metadata: {
        ...flightDocument.metadata,
        type: 'flight',
        flightId: flight.id,
        updatedAt: new Date().toISOString()
      }
    };
    
    // Upsert to Pinecone
    const index = await getPineconeIndex();
    await index.upsert([record], { namespace: FLIGHTS_NAMESPACE });
    
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
    
    // Log failure to embedding_logs table
    try {
      await axios.post('/api/embedding/logging', {
        object_type: 'flight',
        object_id: flight.id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        embedding_model: 'openai:text-embedding-ada-002'
      });
    } catch (logError) {
      console.error('Error logging embedding failure:', logError);
    }
    
    throw error;
  }
}

/**
 * Find similar flights in Pinecone based on embedding
 * @param embedding The embedding to search with
 * @param limit The maximum number of results to return
 * @param filter Optional filter for the search
 * @returns Array of matching flights with scores
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
    
    // Query Pinecone
    const index = await getPineconeIndex();
    const searchResults = await index.query({
      vector: embedding,
      filter: pineconeFilter,
      topK: limit,
      includeMetadata: true,
      namespace: FLIGHTS_NAMESPACE
    });
    
    // Process results
    const matches = searchResults.matches || [];
    
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
 * Find similar users in Pinecone based on embedding
 * @param embedding The embedding to search with
 * @param limit The maximum number of results to return
 * @param filter Optional filter for the search
 * @returns Array of matching users with scores
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
    
    // Query Pinecone
    const index = await getPineconeIndex();
    const searchResults = await index.query({
      vector: embedding,
      filter: pineconeFilter,
      topK: limit,
      includeMetadata: true,
      namespace: USERS_NAMESPACE
    });
    
    // Process results
    const matches = searchResults.matches || [];
    
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
 * Delete a record from Pinecone by ID
 * @param id - The record ID to delete
 * @returns Promise that resolves when the record is deleted
 */
export async function deleteRecord(id: string): Promise<void> {
  const client = await getPineconeClient();
  const index = client.index(PINECONE_INDEX_NAME);
  
  await index.deleteOne(id);
  console.log(`Deleted Pinecone record: ${id}`);
}

/**
 * Upsert a single record to Pinecone
 * @param record - The record to upsert
 * @returns Promise that resolves when the record is upserted
 */
export async function upsertRecord(record: {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}): Promise<void> {
  const client = await getPineconeClient();
  const index = client.index(PINECONE_INDEX_NAME);
  
  await index.upsert([{
    id: record.id,
    values: record.embedding,
    metadata: record.metadata
  }]);
  
  console.log(`Upserted record to Pinecone: ${record.id}`);
} 