#!/usr/bin/env tsx
/**
 * JetShare Embedding Worker
 * 
 * This script runs as a background process to continuously update embeddings
 * for new or modified jetshare_offers, flights, airports, and jets.
 *
 * It can be run:
 * - On a schedule via cron (recommended for production)
 * - As a long-running process with sleep intervals
 * - Triggered by a webhook after database changes
 * 
 * Usage:
 *   npx tsx scripts/embedding-worker.ts [--continuous] [--interval=300] [--batch-size=50]
 * 
 * Options:
 *   --continuous: Run continuously with sleep intervals
 *   --interval: Sleep interval in seconds between runs (default: 300 - 5 minutes)
 *   --batch-size: Number of records to process per batch (default: 50)
 */

import { createClient } from '@supabase/supabase-js';
import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';
import minimist from 'minimist';

// Process command line arguments
const args = minimist(process.argv.slice(2), {
  boolean: ['continuous'],
  default: {
    continuous: false,
    interval: 300,
    'batch-size': 50
  }
});

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
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

// Define the config type for table configuration
interface TableConfig {
  getBatchSql: string;
  generateTextFn?: string;
  markEmbeddedFn?: string;
  priority: number;
}

// Define tables to process
const TABLES_CONFIG: Record<string, TableConfig> = {
  jetshare_offers: {
    getBatchSql: `SELECT * FROM get_jetshare_offers_needing_embedding($1)`,
    generateTextFn: 'generate_jetshare_offer_embedding_text',
    markEmbeddedFn: 'mark_jetshare_offer_as_embedded',
    priority: 1, // Highest priority
  },
  airports: {
    getBatchSql: `SELECT code FROM airports WHERE embedding IS NULL LIMIT $1`,
    priority: 3,
  },
  flights: {
    getBatchSql: `SELECT id FROM flights WHERE embedding IS NULL LIMIT $1`,
    priority: 2,
  },
  jets: {
    getBatchSql: `SELECT id FROM jets WHERE embedding IS NULL LIMIT $1`,
    priority: 4,
  }
};

// Rate limit tracking
const API_RATE_LIMIT = 35; // Slightly below the 40/min limit to be safe
const API_RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
let apiCallsInWindow = 0;
let windowStartTime = Date.now();

/**
 * Check and update rate limit tracking
 */
async function checkRateLimit(): Promise<void> {
  const now = Date.now();
  const timeElapsed = now - windowStartTime;
  
  // Reset window if it's been more than a minute
  if (timeElapsed > API_RATE_WINDOW) {
    apiCallsInWindow = 0;
    windowStartTime = now;
    return;
  }
  
  // If we're approaching the limit, wait until the window resets
  if (apiCallsInWindow >= API_RATE_LIMIT) {
    const timeToWait = API_RATE_WINDOW - timeElapsed + 1000; // Add 1 second buffer
    console.log(`Rate limit reached. Waiting ${Math.ceil(timeToWait/1000)} seconds before continuing...`);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
    apiCallsInWindow = 0;
    windowStartTime = Date.now();
  }
}

/**
 * Generate text content for embedding based on record type
 */
async function generateEmbeddingText(table: string, id: string): Promise<string> {
  // For jetshare_offers
  if (table === 'jetshare_offers') {
    try {
      // First try the database function if it exists
      const { data: functionData, error: functionError } = await supabase.rpc(
        TABLES_CONFIG[table].generateTextFn as string, 
        { offer_id: id }
      );
      
      if (!functionError && functionData) {
        return functionData;
      }
      
      // If the function doesn't exist, fetch and format the data ourselves
      console.log(`Function ${TABLES_CONFIG[table].generateTextFn} not found, generating text manually`);
      
      const { data: record, error } = await supabase
        .from(table)
        .select('*, profiles(*)') // Join with profiles to get user info
        .eq('id', id)
        .single();
        
      if (error || !record) {
        throw new Error(`Failed to fetch ${table} ${id}: ${error?.message || 'Record not found'}`);
      }
      
      // Get airport information
      const { data: departureAirport } = await supabase
        .from('airports')
        .select('name, city, country')
        .eq('code', record.departure_location)
        .single();
        
      const { data: arrivalAirport } = await supabase
        .from('airports')
        .select('name, city, country')
        .eq('code', record.arrival_location)
        .single();
      
      // Format the text for embedding
      return `
JetShare Offer Information:
ID: ${record.id}
Status: ${record.status}
From: ${record.departure_location} (${departureAirport?.city || 'Unknown'}, ${departureAirport?.country || 'Unknown'})
To: ${record.arrival_location} (${arrivalAirport?.city || 'Unknown'}, ${arrivalAirport?.country || 'Unknown'})
Date: ${record.flight_date}
Aircraft: ${record.aircraft_model || 'Not specified'}
Total Cost: $${record.total_flight_cost}
Available Seats: ${record.available_seats} of ${record.total_seats}
Cost Per Seat: $${record.requested_share_amount}
Offered By: ${record.profiles?.email || record.user_id}
Created: ${record.created_at}
      `.trim();
    } catch (error) {
      // If the database function approach fails, try direct fetch as a fallback
      const { data: record, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError || !record) {
        throw new Error(`Failed to fetch ${table} ${id}: ${fetchError?.message || 'Record not found'}`);
      }
      
      // Basic formatting without joined data
      return `
JetShare Offer Information:
ID: ${record.id}
Status: ${record.status}
From: ${record.departure_location}
To: ${record.arrival_location}
Date: ${record.flight_date}
Aircraft: ${record.aircraft_model || 'Not specified'}
Total Cost: $${record.total_flight_cost}
Available Seats: ${record.available_seats}
Cost Per Seat: $${record.requested_share_amount}
User ID: ${record.user_id}
Created: ${record.created_at}
      `.trim();
    }
  }
  
  // Special handling for airports table which uses code as primary key
  if (table === 'airports') {
    const { data: record, error } = await supabase
      .from(table)
      .select('*')
      .eq('code', id)
      .single();
    
    if (error || !record) {
      throw new Error(`Failed to fetch ${table} ${id}: ${error?.message || 'Record not found'}`);
    }
    
    return `
Airport Information:
Name: ${record.name || 'Unknown'}
IATA Code: ${record.code}
Location: ${record.city || 'Unknown'}, ${record.country || 'Unknown'}
Facilities: ${record.facilities || 'Not specified'}
Description: ${record.description || `${record.name || 'Unknown'} airport located in ${record.city || 'Unknown'}, ${record.country || 'Unknown'}`}
    `.trim();
  }
  
  // For other tables, fetch record and format manually
  const { data: record, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !record) {
    throw new Error(`Failed to fetch ${table} ${id}: ${error?.message || 'Record not found'}`);
  }
  
  // Format based on table type
  switch (table) {
    case 'flights':
      return `
Flight Information:
From: ${record.departure_location || 'Unknown'}
To: ${record.arrival_location || 'Unknown'}
Date: ${record.flight_date || 'Not specified'}
Aircraft: ${record.aircraft_model || 'Not specified'}
Total Cost: $${record.total_flight_cost || 'Not specified'}
Available Seats: ${record.available_seats || 'Not specified'}
Status: ${record.status || 'Available'}
      `.trim();
      
    case 'jets':
      return `
Jet Information:
Model: ${record.model || 'Unknown'}
Manufacturer: ${record.manufacturer || 'Unknown'}
Range: ${record.range || 'Unknown'} miles
Passenger Capacity: ${record.passenger_capacity || 'Unknown'} passengers
Cruise Speed: ${record.cruise_speed || 'Unknown'} mph
Features: ${record.features || 'Not specified'}
      `.trim();
      
    default:
      throw new Error(`Unsupported table: ${table}`);
  }
}

/**
 * Pad an embedding to the expected dimension
 */
function padEmbedding(embedding: number[], expectedDimension: number = 1536): number[] {
  if (embedding.length === expectedDimension) {
    return embedding;
  }
  
  // Create a new array of the expected dimension filled with zeros
  const padded = new Array(expectedDimension).fill(0);
  
  // Copy the original embedding values
  for (let i = 0; i < Math.min(embedding.length, expectedDimension); i++) {
    padded[i] = embedding[i];
  }
  
  return padded;
}

/**
 * Update embedding for a single record
 */
async function updateEmbedding(table: string, id: string): Promise<void> {
  try {
    console.log(`Processing ${table} record ${id}...`);
    
    // Generate text for embedding
    const text = await generateEmbeddingText(table, id);
    
    // Check rate limit before making API call
    await checkRateLimit();
    
    // Generate embedding
    const response = await cohere.embed({ 
      texts: [text],
      model: 'embed-english-v3.0',
      inputType: 'search_document'
    });
    
    // Update rate limit tracking
    apiCallsInWindow++;
    
    // Format embedding correctly
    let embedding = Array.isArray(response.embeddings) ? 
      response.embeddings[0] : 
      response.embeddings;
    
    // Pad the embedding to match the expected dimension
    embedding = padEmbedding(embedding as number[]);
    
    // Try to update with embedding_updated_at column
    try {
      if (table === 'airports') {
        // For airports, use code as the primary key
        const { error: updateError } = await supabase
          .from(table)
          .update({ 
            embedding,
            embedding_updated_at: new Date().toISOString()
          })
          .eq('code', id);
          
        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        // For other tables, use id as the primary key
        const { error: updateError } = await supabase
          .from(table)
          .update({ 
            embedding,
            embedding_updated_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (updateError) {
          throw new Error(updateError.message);
        }
      }
    } catch (e) {
      // If the column doesn't exist, try without embedding_updated_at
      console.warn(`Error updating with embedding_updated_at, trying without: ${e}`);
      
      if (table === 'airports') {
        // For airports, use code as the primary key
        const { error: updateError } = await supabase
          .from(table)
          .update({ embedding })
          .eq('code', id);
          
        if (updateError) {
          throw new Error(`Failed to update embedding: ${updateError.message}`);
        }
      } else {
        // For other tables, use id as the primary key
        const { error: updateError } = await supabase
          .from(table)
          .update({ embedding })
          .eq('id', id);
          
        if (updateError) {
          throw new Error(`Failed to update embedding: ${updateError.message}`);
        }
      }
    }
    
    // Mark as embedded for jetshare_offers
    if (table === 'jetshare_offers' && TABLES_CONFIG[table].markEmbeddedFn) {
      try {
        const { error: markError } = await supabase.rpc(
          TABLES_CONFIG[table].markEmbeddedFn as string,
          { offer_id: id }
        );
        
        if (markError) {
          console.warn(`Failed to mark as embedded: ${markError.message}`);
        }
      } catch (e) {
        console.warn(`Failed to mark as embedded: ${e}`);
      }
    }
    
    console.log(`✅ Successfully updated embedding for ${table} record ${id}`);
  } catch (error) {
    console.error(`❌ Error updating embedding for ${table} record ${id}:`, error);
  }
}

/**
 * Process a batch of records needing embeddings
 */
async function processBatch(table: string, batchSize: number): Promise<number> {
  try {
    const config = TABLES_CONFIG[table];
    if (!config) {
      throw new Error(`Invalid table: ${table}`);
    }
    
    console.log(`Processing batch for ${table}...`);
    
    // Fetch batch of records needing embedding
    let batch: any[] = [];
    
    // Use different approaches based on table
    if (table === 'jetshare_offers' && config.getBatchSql.includes('get_jetshare_offers_needing_embedding')) {
      // Try to use the RPC function if it exists
      try {
        const { data, error } = await supabase.rpc('get_jetshare_offers_needing_embedding', { 
          limit_param: batchSize 
        });
        
        if (!error) {
          batch = data || [];
        } else {
          console.warn(`Function get_jetshare_offers_needing_embedding not found, falling back to default query`);
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .is('embedding', null)
            .limit(batchSize);
          
          batch = data || [];
        }
      } catch (e) {
        console.warn(`Error using function, falling back to default query: ${e}`);
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .is('embedding', null)
          .limit(batchSize);
        
        batch = data || [];
      }
    } else if (table === 'airports') {
      // For airports, use code as identifier
      const { data, error } = await supabase
        .from(table)
        .select('code')
        .is('embedding', null)
        .limit(batchSize);
      
      if (error) {
        throw new Error(`Failed to fetch batch for ${table}: ${error.message}`);
      }
      
      batch = data || [];
    } else {
      // For other tables, just use a simple query
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .is('embedding', null)
        .limit(batchSize);
      
      if (error) {
        throw new Error(`Failed to fetch batch for ${table}: ${error.message}`);
      }
      
      batch = data || [];
    }
    
    if (batch.length === 0) {
      console.log(`No records needing embedding for ${table}`);
      return 0;
    }
    
    console.log(`Found ${batch.length} records needing embedding for ${table}`);
    
    // Process each record with rate limiting
    // Reduce concurrency to avoid hitting rate limits
    const ids = batch.map((record: any) => record.id || record.code);
    const CONCURRENCY = 2; // Lower concurrency to avoid rate limits
    
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      await Promise.all(chunk.map((id: string) => updateEmbedding(table, id)));
      
      // Always wait between chunks to avoid rate limiting
      if (i + CONCURRENCY < ids.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
      }
    }
    
    return batch.length;
  } catch (error) {
    console.error(`Error processing batch for ${table}:`, error);
    return 0;
  }
}

/**
 * Process all tables in priority order
 */
async function processAllTables(batchSize: number): Promise<{[key: string]: number}> {
  const results: {[key: string]: number} = {};
  
  // Sort tables by priority
  const tables = Object.entries(TABLES_CONFIG)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([table]) => table);
  
  for (const table of tables) {
    results[table] = await processBatch(table, batchSize);
  }
  
  return results;
}

/**
 * Archive old completed offers to save space
 */
async function archiveOldOffers(): Promise<number> {
  try {
    // Try to use the RPC function if it exists
    try {
      const { data, error } = await supabase.rpc('archive_old_jetshare_offers', { days_threshold: 90 });
      
      if (error) {
        console.warn('archive_old_jetshare_offers function not found, skipping archiving');
        return 0;
      }
      
      return data || 0;
    } catch (e) {
      console.warn(`Failed to archive old offers: ${e}`);
      return 0;
    }
  } catch (error) {
    console.warn('Error archiving old offers:', error);
    return 0;
  }
}

/**
 * Main function to run the worker
 */
async function main(): Promise<void> {
  try {
    console.log('=== JetShare Embedding Worker ===');
    console.log(`Mode: ${args.continuous ? 'Continuous' : 'One-time'}`);
    console.log(`Batch size: ${args['batch-size']}`);
    
    if (args.continuous) {
      console.log(`Interval: ${args.interval} seconds`);
    }
    
    do {
      const startTime = Date.now();
      console.log(`\n[${new Date().toISOString()}] Starting embedding update...`);
      
      // Archive old offers once per run
      const archivedCount = await archiveOldOffers();
      if (archivedCount > 0) {
        console.log(`Archived ${archivedCount} old completed offers`);
      }
      
      // Process all tables
      const results = await processAllTables(args['batch-size']);
      
      // Log summary
      console.log('\nSummary:');
      let totalProcessed = 0;
      for (const [table, count] of Object.entries(results)) {
        console.log(`- ${table}: ${count} records processed`);
        totalProcessed += count;
      }
      
      const duration = (Date.now() - startTime) / 1000;
      console.log(`\nTotal: ${totalProcessed} records processed in ${duration.toFixed(2)} seconds`);
      
      if (args.continuous) {
        // If we processed records, reduce the wait time to process the next batch faster
        const waitTime = totalProcessed > 0 ? Math.min(args.interval, 30) : args.interval;
        console.log(`Waiting ${waitTime} seconds before next run...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      }
    } while (args.continuous);
    
    console.log('Embedding worker completed successfully');
  } catch (error) {
    console.error('Error in embedding worker:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 