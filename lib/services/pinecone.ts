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
import { PineconeClient } from '@pinecone-database/pinecone';
import { EnrichedProfile } from '../types/matching.types';
import { Flight } from '@/app/flights/types';
import { v4 as uuidv4 } from 'uuid';
import { getCohereEmbeddings, generateUserEmbedding, generateFlightEmbedding } from './embeddings';
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
    await pinecone.createIndex({
      name: PINECONE_INDEX_NAME,
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-west-2'
        },
        dimension: 1024, // Cohere embed-english-v3.0 dimensions
        metric: 'cosine',
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