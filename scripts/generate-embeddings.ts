/**
 * Generate Embeddings for Database Entries
 * 
 * This script generates embeddings for database entries using Cohere's API
 * and stores them in the database for vector search.
 * 
 * Usage: 
 *   npx tsx scripts/generate-embeddings.ts airports
 *   npx tsx scripts/generate-embeddings.ts flights
 *   npx tsx scripts/generate-embeddings.ts jets
 *   npx tsx scripts/generate-embeddings.ts jetshare_offers
 */

import { createClient } from '@supabase/supabase-js';
import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Cohere client
const cohereApiKey = process.env.COHERE_API_KEY || '';
if (!cohereApiKey) {
  console.error('Error: COHERE_API_KEY environment variable must be set');
  process.exit(1);
}

const cohere = new CohereClient({
  token: cohereApiKey,
});

// Define types for database entries
interface Airport {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  facilities?: string;
  description?: string;
  embedding?: number[];
}

interface Flight {
  id: string;
  departure_location: string;
  arrival_location: string;
  flight_date: string;
  aircraft_model: string;
  total_flight_cost: number;
  available_seats: number;
  status?: string;
  embedding?: number[];
}

interface Jet {
  id: string;
  model: string;
  manufacturer: string;
  range: number;
  passenger_capacity: number;
  cruise_speed: number;
  features?: string;
  embedding?: number[];
}

interface JetShareOffer {
  id: string;
  user_id: string;
  departure_location: string;
  arrival_location: string;
  flight_date: string;
  aircraft_model: string;
  total_flight_cost: number;
  available_seats: number;
  status: 'open' | 'booked' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  embedding?: number[];
}

type TableEntry = Airport | Flight | Jet | JetShareOffer;

// Process command-line arguments
const [,, tableName = 'airports'] = process.argv;

// Validate table name
const validTables = ['airports', 'flights', 'jets', 'jetshare_offers'];
if (!validTables.includes(tableName)) {
  console.error(`Error: Invalid table name. Must be one of: ${validTables.join(', ')}`);
  process.exit(1);
}

/**
 * Generate embedding and update database entry
 */
async function updateEmbedding(id: string, text: string, table: string): Promise<void> {
  try {
    // Generate embedding with Cohere
    const response = await cohere.embed({ 
      texts: [text],
      model: 'embed-english-v3.0',
      inputType: 'search_document'
    });
    
    const embedding = Array.isArray(response.embeddings) ? 
      response.embeddings[0] : 
      response.embeddings;
    
    // Update the database entry with the new embedding
    if (table === 'jetshare_offers') {
      // Direct update for jetshare_offers (may not have a specific function)
      const { error } = await supabase
        .from(table)
        .update({ embedding })
        .eq('id', id);
        
      if (error) {
        throw new Error(`Error updating embedding: ${error.message}`);
      }
    } else {
      // Use the update functions for other tables
      const { error } = await supabase.rpc(
        `update_${table.slice(0, -1)}_embedding`,
        { 
          [`${table.slice(0, -1)}_id`]: id, 
          new_embedding: embedding 
        }
      );
      
      if (error) {
        throw new Error(`Error updating embedding: ${error.message}`);
      }
    }
    
    console.log(`Updated embedding for ${table} entry ${id}`);
  } catch (error) {
    console.error(`Error updating embedding for ${table} entry ${id}:`, error);
  }
}

/**
 * Generate airport embedding text for vector search
 */
function generateAirportEmbeddingText(airport: Airport): string {
  return `
Airport Information:
Name: ${airport.name}
IATA Code: ${airport.code}
Location: ${airport.city}, ${airport.country}
Facilities: ${airport.facilities || 'Not specified'}
Description: ${airport.description || `${airport.name} airport located in ${airport.city}, ${airport.country}`}
  `.trim();
}

/**
 * Generate flight embedding text for vector search
 */
function generateFlightEmbeddingText(flight: Flight): string {
  return `
Flight Information:
From: ${flight.departure_location}
To: ${flight.arrival_location}
Date: ${flight.flight_date}
Aircraft: ${flight.aircraft_model}
Total Cost: $${flight.total_flight_cost}
Available Seats: ${flight.available_seats}
Status: ${flight.status || 'Available'}
  `.trim();
}

/**
 * Generate jet embedding text for vector search
 */
function generateJetEmbeddingText(jet: Jet): string {
  return `
Jet Information:
Model: ${jet.model}
Manufacturer: ${jet.manufacturer}
Range: ${jet.range} miles
Passenger Capacity: ${jet.passenger_capacity} passengers
Cruise Speed: ${jet.cruise_speed} mph
Features: ${jet.features || 'Not specified'}
  `.trim();
}

/**
 * Generate JetShare offer embedding text for vector search
 */
function generateJetShareOfferEmbeddingText(offer: JetShareOffer): string {
  return `
JetShare Offer:
From: ${offer.departure_location}
To: ${offer.arrival_location}
Date: ${offer.flight_date}
Aircraft: ${offer.aircraft_model}
Total Cost: $${offer.total_flight_cost}
Available Seats: ${offer.available_seats}
Status: ${offer.status}
Created: ${offer.created_at}
  `.trim();
}

/**
 * Process entries in batches to generate embeddings
 */
async function processEntries(table: string, status?: string): Promise<void> {
  console.log(`Processing ${table}...`);
  
  // Build query for entries without embeddings
  let query = supabase
    .from(table)
    .select('*')
    .is('embedding', null);
  
  // Add status filter for jetshare_offers if specified
  if (table === 'jetshare_offers' && status) {
    query = query.eq('status', status);
  }
  
  // Limit to 100 records at a time
  query = query.limit(100);
  
  // Execute query
  const { data: entries, error } = await query;
  
  if (error) {
    console.error(`Error fetching ${table}:`, error);
    return;
  }
  
  console.log(`Found ${entries?.length || 0} ${table} entries without embeddings`);
  
  if (!entries || entries.length === 0) {
    return;
  }
  
  // Process entries in batches of 10 to avoid rate limiting
  for (let i = 0; i < entries.length; i += 10) {
    const batch = entries.slice(i, i + 10);
    console.log(`Processing batch ${i / 10 + 1} of ${Math.ceil(entries.length / 10)}`);
    
    await Promise.all(
      batch.map((entry: TableEntry) => {
        let text = '';
        
        // Generate appropriate text based on table
        switch (table) {
          case 'airports':
            text = generateAirportEmbeddingText(entry as Airport);
            break;
          case 'flights':
            text = generateFlightEmbeddingText(entry as Flight);
            break;
          case 'jets':
            text = generateJetEmbeddingText(entry as Jet);
            break;
          case 'jetshare_offers':
            text = generateJetShareOfferEmbeddingText(entry as JetShareOffer);
            break;
        }
        
        return updateEmbedding(entry.id, text, table);
      })
    );
    
    // Wait a bit between batches to avoid rate limiting
    if (i + 10 < entries.length) {
      console.log('Waiting before next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Completed processing ${entries.length} ${table} entries`);
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(`Starting embedding generation for ${tableName}`);
    
    // If processing jetshare_offers, prioritize 'open' offers first
    if (tableName === 'jetshare_offers') {
      console.log('Processing open JetShare offers first...');
      await processEntries(tableName, 'open');
      
      console.log('Processing other JetShare offers...');
      // Process others without a status filter
      await processEntries(tableName);
    } else {
      await processEntries(tableName);
    }
    
    console.log('Embedding generation complete');
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 