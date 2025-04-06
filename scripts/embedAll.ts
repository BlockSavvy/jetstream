#!/usr/bin/env tsx
/**
 * JetStream Embeddings CLI Tool
 * 
 * This script processes and embeds various JetStream data types into Pinecone vector storage.
 * It supports filtering by type, dry-running, limiting record counts, and comprehensive logging.
 * 
 * Usage:
 *   pnpm exec tsx scripts/embedAll.ts [options]
 * 
 * Options:
 *   --only=<type>    Only process specific data type (offers,flights,crews,users,simulations)
 *   --dry-run        Run without storing to Pinecone (test/preview mode)
 *   --limit=<n>      Limit to processing n records per type
 *   --debug          Enable verbose debug logging
 *   --help           Show this help message
 * 
 * Examples:
 *   pnpm exec tsx scripts/embedAll.ts                     # Process all types
 *   pnpm exec tsx scripts/embedAll.ts --only=offers       # Only process JetShare offers
 *   pnpm exec tsx scripts/embedAll.ts --dry-run           # Test run without storing
 *   pnpm exec tsx scripts/embedAll.ts --limit=10          # Process max 10 items per type
 */

import path from 'path';
import fs from 'fs';
import { createClient } from '@/lib/supabase-server';
import * as embeddings from '@/lib/services/embeddings';
import * as pinecone from '@/lib/services/pinecone';
import { format } from 'date-fns';

// Supported data types
type DataType = 'offers' | 'flights' | 'crews' | 'users' | 'simulations' | 'all';

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  only: 'all' as DataType,
  dryRun: false,
  limit: Number.MAX_SAFE_INTEGER,
  debug: false,
  help: false
};

// Setup logging
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
const logFile = path.join(LOG_DIR, `embeddings-${timestamp}.log`);
const errorLogFile = path.join(LOG_DIR, `embeddings-errors-${timestamp}.log`);

// Parse arguments
args.forEach(arg => {
  if (arg.startsWith('--only=')) {
    const type = arg.split('=')[1] as DataType;
    if (['offers', 'flights', 'crews', 'users', 'simulations', 'all'].includes(type)) {
      options.only = type;
    } else {
      console.error(`Invalid type: ${type}. Using 'all' instead.`);
    }
  } else if (arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg.startsWith('--limit=')) {
    const limit = parseInt(arg.split('=')[1], 10);
    if (!isNaN(limit) && limit > 0) {
      options.limit = limit;
    }
  } else if (arg === '--debug') {
    options.debug = true;
  } else if (arg === '--help') {
    options.help = true;
  }
});

// Helper for logging
function log(message: string, isError = false, isDebug = false) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  
  // Always write to log file
  fs.appendFileSync(isError ? errorLogFile : logFile, logMessage + '\n');
  
  // Console output based on log level
  if (isError) {
    console.error(logMessage);
  } else if (!isDebug || (isDebug && options.debug)) {
    console.log(logMessage);
  }
}

// Display help if requested
if (options.help) {
  console.log(`
JetStream Embeddings CLI Tool

This script processes and embeds various JetStream data types into Pinecone vector storage.
It supports filtering by type, dry-running, limiting record counts, and comprehensive logging.

Usage:
  pnpm exec tsx scripts/embedAll.ts [options]

Options:
  --only=<type>    Only process specific data type (offers,flights,crews,users,simulations)
  --dry-run        Run without storing to Pinecone (test/preview mode)
  --limit=<n>      Limit to processing n records per type
  --debug          Enable verbose debug logging
  --help           Show this help message

Examples:
  pnpm exec tsx scripts/embedAll.ts                     # Process all types
  pnpm exec tsx scripts/embedAll.ts --only=offers       # Only process JetShare offers
  pnpm exec tsx scripts/embedAll.ts --dry-run           # Test run without storing
  pnpm exec tsx scripts/embedAll.ts --limit=10          # Process max 10 items per type
  `);
  process.exit(0);
}

/**
 * Processes JetShare offers and embeds them in Pinecone
 */
async function processJetShareOffers(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  log(`Starting to process JetShare offers (limit: ${limit}, dry-run: ${dryRun})...`);
  
  try {
    // Fetch JetShare offers
    let query = supabase.from('jetshare_offers').select('*');
    
    if (limit !== Number.MAX_SAFE_INTEGER) {
      query = query.limit(limit);
    }
    
    const { data: offers, error } = await query;
    
    if (error) {
      throw error;
    }
    
    log(`Found ${offers.length} JetShare offers to process.`);
    
    let successCount = 0;
    
    // Process each offer
    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];
      try {
        log(`Processing offer ${i + 1}/${offers.length}: ${offer.id}`, false, true);
        
        // Generate embedding input text
        const offerText = embeddings.generateJetShareOfferText(offer);
        
        // Create embedding vector
        const vector = await embeddings.encode(offerText);
        
        // Store in Pinecone (if not dry run)
        if (!dryRun) {
          // Create record for Pinecone
          const record = embeddings.preparePineconeRecord(
            offer.id,
            vector,
            'jetshare_offer',
            offer,
            offerText
          );
          
          // Store in Pinecone
          await pinecone.upsertRecords([record]);
        }
        
        successCount++;
      } catch (err) {
        log(`Error processing offer ${offer.id}: ${err}`, true);
      }
    }
    
    log(`Successfully processed ${successCount}/${offers.length} JetShare offers.`);
    return successCount;
  } catch (err) {
    log(`Error fetching JetShare offers: ${err}`, true);
    return 0;
  }
}

/**
 * Processes flights and embeds them in Pinecone
 */
async function processFlights(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  log(`Starting to process flights (limit: ${limit}, dry-run: ${dryRun})...`);
  
  try {
    // Fetch flights
    let query = supabase
      .from('flights')
      .select(`
        *,
        jets (*)
      `);
    
    if (limit !== Number.MAX_SAFE_INTEGER) {
      query = query.limit(limit);
    }
    
    const { data: flights, error } = await query;
    
    if (error) {
      throw error;
    }
    
    log(`Found ${flights.length} flights to process.`);
    
    let successCount = 0;
    
    // Process each flight
    for (let i = 0; i < flights.length; i++) {
      const flight = flights[i];
      try {
        log(`Processing flight ${i + 1}/${flights.length}: ${flight.id}`, false, true);
        
        // Generate embedding input text
        const flightText = embeddings.generateFlightText(flight);
        
        // Create embedding vector
        const vector = await embeddings.encode(flightText);
        
        // Store in Pinecone (if not dry run)
        if (!dryRun) {
          // Create record for Pinecone
          const record = embeddings.preparePineconeRecord(
            flight.id,
            vector,
            'flight',
            flight,
            flightText
          );
          
          // Store in Pinecone
          await pinecone.upsertRecords([record]);
        }
        
        successCount++;
      } catch (err) {
        log(`Error processing flight ${flight.id}: ${err}`, true);
      }
    }
    
    log(`Successfully processed ${successCount}/${flights.length} flights.`);
    return successCount;
  } catch (err) {
    log(`Error fetching flights: ${err}`, true);
    return 0;
  }
}

/**
 * Processes crew members and embeds them in Pinecone
 */
async function processCrews(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  log(`Starting to process crew members (limit: ${limit}, dry-run: ${dryRun})...`);
  
  try {
    // Fetch crew members with their specializations
    let query = supabase
      .from('crew')
      .select(`
        *,
        crew_specializations (*)
      `);
    
    if (limit !== Number.MAX_SAFE_INTEGER) {
      query = query.limit(limit);
    }
    
    const { data: crews, error } = await query;
    
    if (error) {
      throw error;
    }
    
    log(`Found ${crews.length} crew members to process.`);
    
    let successCount = 0;
    
    // Process each crew member
    for (let i = 0; i < crews.length; i++) {
      const crew = crews[i];
      try {
        log(`Processing crew member ${i + 1}/${crews.length}: ${crew.id}`, false, true);
        
        // Generate embedding input text
        const crewText = embeddings.generateCrewText(crew);
        
        // Create embedding vector
        const vector = await embeddings.encode(crewText);
        
        // Store in Pinecone (if not dry run)
        if (!dryRun) {
          // Create record for Pinecone
          const record = embeddings.preparePineconeRecord(
            crew.id,
            vector,
            'crew',
            crew,
            crewText
          );
          
          // Store in Pinecone
          await pinecone.upsertRecords([record]);
        }
        
        successCount++;
      } catch (err) {
        log(`Error processing crew member ${crew.id}: ${err}`, true);
      }
    }
    
    log(`Successfully processed ${successCount}/${crews.length} crew members.`);
    return successCount;
  } catch (err) {
    log(`Error fetching crew members: ${err}`, true);
    return 0;
  }
}

/**
 * Processes user profiles and embeds them in Pinecone
 */
async function processUsers(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  log(`Starting to process user profiles (limit: ${limit}, dry-run: ${dryRun})...`);
  
  try {
    // Fetch user profiles
    let query = supabase
      .from('profiles')
      .select('*');
    
    if (limit !== Number.MAX_SAFE_INTEGER) {
      query = query.limit(limit);
    }
    
    const { data: profiles, error } = await query;
    
    if (error) {
      throw error;
    }
    
    log(`Found ${profiles.length} user profiles to process.`);
    
    let successCount = 0;
    
    // Process each user profile
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      try {
        log(`Processing user profile ${i + 1}/${profiles.length}: ${profile.id}`, false, true);
        
        // Enrich the profile with preferences and history if needed
        const enrichedProfile = await enrichUserProfile(supabase, profile);
        
        // Generate embedding input text
        const profileText = embeddings.generateUserProfileText(enrichedProfile);
        
        // Create embedding vector
        const vector = await embeddings.encode(profileText);
        
        // Store in Pinecone (if not dry run)
        if (!dryRun) {
          // Create record for Pinecone
          const record = embeddings.preparePineconeRecord(
            profile.id,
            vector,
            'user',
            enrichedProfile,
            profileText
          );
          
          // Store in Pinecone
          await pinecone.upsertRecords([record]);
        }
        
        successCount++;
      } catch (err) {
        log(`Error processing user profile ${profile.id}: ${err}`, true);
      }
    }
    
    log(`Successfully processed ${successCount}/${profiles.length} user profiles.`);
    return successCount;
  } catch (err) {
    log(`Error fetching user profiles: ${err}`, true);
    return 0;
  }
}

/**
 * Processes simulation logs and embeds them in Pinecone
 */
async function processSimulations(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  log(`Starting to process simulation logs (limit: ${limit}, dry-run: ${dryRun})...`);
  
  try {
    // Fetch simulation logs
    let query = supabase
      .from('simulation_logs')
      .select('*');
    
    if (limit !== Number.MAX_SAFE_INTEGER) {
      query = query.limit(limit);
    }
    
    const { data: simulations, error } = await query;
    
    if (error) {
      throw error;
    }
    
    log(`Found ${simulations.length} simulation logs to process.`);
    
    let successCount = 0;
    
    // Process each simulation log
    for (let i = 0; i < simulations.length; i++) {
      const simulation = simulations[i];
      try {
        log(`Processing simulation log ${i + 1}/${simulations.length}: ${simulation.id}`, false, true);
        
        // Generate embedding input text
        const simulationText = embeddings.generateSimulationText(simulation);
        
        // Create embedding vector
        const vector = await embeddings.encode(simulationText);
        
        // Store in Pinecone (if not dry run)
        if (!dryRun) {
          // Create record for Pinecone
          const record = embeddings.preparePineconeRecord(
            simulation.id,
            vector,
            'simulation',
            simulation,
            simulationText
          );
          
          // Store in Pinecone
          await pinecone.upsertRecords([record]);
        }
        
        successCount++;
      } catch (err) {
        log(`Error processing simulation log ${simulation.id}: ${err}`, true);
      }
    }
    
    log(`Successfully processed ${successCount}/${simulations.length} simulation logs.`);
    return successCount;
  } catch (err) {
    log(`Error fetching simulation logs: ${err}`, true);
    return 0;
  }
}

/**
 * Enriches a user profile with additional data for better vector search
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
    log(`No preferences found for user ${profile.id}`, false, true);
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
    log(`No professional details found for user ${profile.id}`, false, true);
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
    log(`No interests found for user ${profile.id}`, false, true);
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
    log(`No travel history found for user ${profile.id}`, false, true);
  }
  
  return enriched;
}

/**
 * Main function to run the embedding process
 */
async function main() {
  log(`JetStream Embeddings CLI Tool - Starting (${new Date().toISOString()})`, false);
  log(`Options: ${JSON.stringify(options)}`, false);
  
  const startTime = Date.now();
  let totalProcessed = 0;
  
  try {
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Process selected data types
    if (options.only === 'all' || options.only === 'offers') {
      const offersProcessed = await processJetShareOffers(supabase, options.limit, options.dryRun);
      totalProcessed += offersProcessed;
    }
    
    if (options.only === 'all' || options.only === 'flights') {
      const flightsProcessed = await processFlights(supabase, options.limit, options.dryRun);
      totalProcessed += flightsProcessed;
    }
    
    if (options.only === 'all' || options.only === 'crews') {
      const crewsProcessed = await processCrews(supabase, options.limit, options.dryRun);
      totalProcessed += crewsProcessed;
    }
    
    if (options.only === 'all' || options.only === 'users') {
      const usersProcessed = await processUsers(supabase, options.limit, options.dryRun);
      totalProcessed += usersProcessed;
    }
    
    if (options.only === 'all' || options.only === 'simulations') {
      const simulationsProcessed = await processSimulations(supabase, options.limit, options.dryRun);
      totalProcessed += simulationsProcessed;
    }
    
    const totalTime = (Date.now() - startTime) / 1000;
    log(`JetStream Embeddings CLI Tool - Completed`, false);
    log(`Processed ${totalProcessed} total items in ${totalTime.toFixed(2)} seconds`, false);
    log(`Logs written to: ${logFile}`, false);
    
    if (fs.existsSync(errorLogFile) && fs.statSync(errorLogFile).size > 0) {
      log(`Error logs written to: ${errorLogFile}`, false);
    }
  } catch (error) {
    log(`Fatal error: ${error}`, true);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => process.exit(0))
  .catch(error => {
    log(`Unhandled error: ${error}`, true);
    process.exit(1);
  }); 