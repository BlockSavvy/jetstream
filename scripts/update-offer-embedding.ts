#!/usr/bin/env tsx
/**
 * Utility script to update embeddings for a specific offer
 * Usage: npx tsx scripts/update-offer-embedding.ts <offer_id>
 */

import { createClient } from '@supabase/supabase-js';
import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';

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

// Pad an embedding to the expected dimension
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

async function generateEmbeddingText(offerId: string): Promise<string> {
  try {
    // First try to use the database function
    const { data: functionData, error: functionError } = await supabase.rpc(
      'generate_jetshare_offer_embedding_text',
      { offer_id: offerId }
    );
    
    if (!functionError && functionData) {
      return functionData;
    }
    
    console.log('Function not found, generating text manually');
    
    // Fetch the offer with all related data
    const { data: record, error } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        profiles:user_id (*),
        matched_profiles:matched_user_id (*)
      `)
      .eq('id', offerId)
      .single();
      
    if (error || !record) {
      throw new Error(`Failed to fetch jetshare_offers ${offerId}: ${error?.message || 'Record not found'}`);
    }
    
    // Get airport information for better context
    const { data: departureAirport } = await supabase
      .from('airports')
      .select('name, city, country')
      .eq('code', record.departure_location.split(' ')[0])
      .single();
      
    const { data: arrivalAirport } = await supabase
      .from('airports')
      .select('name, city, country')
      .eq('code', record.arrival_location.split(' ')[0])
      .single();
    
    // Check for Nostr data
    let nostrInfo = '';
    if (record.profiles?.npub || record.profiles?.nip05) {
      nostrInfo = `
Nostr Information:
${record.profiles?.npub ? `Creator npub: ${record.profiles.npub}` : ''}
${record.profiles?.nip05 ? `Creator NIP-05: ${record.profiles.nip05}` : ''}`;
    }
    
    // Check for Nostr offer events
    let nostrOfferEvents = '';
    try {
      const { data: events } = await supabase
        .from('nostr_offer_events')
        .select('event_id, relay')
        .eq('offer_id', offerId);
        
      if (events && events.length > 0) {
        nostrOfferEvents = `
Nostr Events: ${events.length} events published
${events.map(e => `- ${e.relay || 'Unknown relay'}: ${e.event_id}`).join('\n')}`;
      }
    } catch (e) {
      console.log('No nostr_offer_events table found or no events');
    }
    
    // Format the text for embedding
    return `
JetShare Offer Information:
ID: ${record.id}
Status: ${record.status}
From: ${record.departure_location} ${departureAirport ? `(${departureAirport.city}, ${departureAirport.country})` : ''}
To: ${record.arrival_location} ${arrivalAirport ? `(${arrivalAirport.city}, ${arrivalAirport.country})` : ''}
Date: ${record.flight_date}
Time: ${record.departure_time ? new Date(record.departure_time).toLocaleString() : 'Not specified'}
Aircraft: ${record.aircraft_model || 'Not specified'}
Total Cost: $${record.total_flight_cost || 0}
Available Seats: ${record.available_seats || 0} of ${record.total_seats || 0}
Cost Per Seat: $${record.requested_share_amount || 0}
Created By: ${record.profiles?.full_name || record.profiles?.email || record.user_id}
Created: ${record.created_at || 'Unknown'}
${nostrInfo}${nostrOfferEvents}
    `.trim();
    
  } catch (error) {
    console.error('Error generating embedding text:', error);
    throw error;
  }
}

// Main function to update embedding for a specific offer
async function updateOfferEmbedding(offerId: string): Promise<void> {
  try {
    console.log(`Updating embedding for offer ${offerId}...`);
    
    // Generate text for embedding
    const text = await generateEmbeddingText(offerId);
    console.log('Generated text for embedding:', text);
    
    // Generate embedding
    const response = await cohere.embed({ 
      texts: [text],
      model: 'embed-english-v3.0',
      inputType: 'search_document'
    });
    
    // Format embedding correctly
    let embedding = Array.isArray(response.embeddings) ? 
      response.embeddings[0] : 
      response.embeddings;
    
    // Pad the embedding to match the expected dimension
    embedding = padEmbedding(embedding as number[]);
    
    // Update the database
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update({ 
        embedding,
        embedding_updated_at: new Date().toISOString(),
        needs_embedding: false
      })
      .eq('id', offerId);
      
    if (updateError) {
      throw new Error(`Failed to update embedding: ${updateError.message}`);
    }
    
    console.log(`✅ Successfully updated embedding for offer ${offerId}`);
  } catch (error) {
    console.error(`❌ Error updating embedding:`, error);
    process.exit(1);
  }
}

// Get the offer ID from command line arguments
const offerId = process.argv[2];
if (!offerId) {
  console.error('Error: Offer ID must be provided as a command-line argument');
  console.error('Usage: npx tsx scripts/update-offer-embedding.ts <offer_id>');
  process.exit(1);
}

// Run the update
updateOfferEmbedding(offerId); 