#!/usr/bin/env tsx
/**
 * Manually Embed a JetShare Offer
 * 
 * This script creates an embedding for a specific JetShare offer
 * and updates the database record directly.
 * 
 * Usage:
 *   npx tsx scripts/manual-embed-offer.ts <offer_id>
 */

import { createClient } from '@/lib/supabase-server';
import * as embeddings from '@/lib/services/embeddings';
import * as pinecone from '@/lib/services/pinecone';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get offer ID from command line argument
const offerId = process.argv[2];

if (!offerId) {
  console.error('Error: Offer ID must be provided as a command line argument');
  console.error('Usage: npx tsx scripts/manual-embed-offer.ts <offer_id>');
  process.exit(1);
}

async function main() {
  try {
    console.log(`Manually embedding JetShare offer: ${offerId}`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get the offer data
    const { data: offer, error: fetchError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
    
    if (fetchError) {
      throw new Error(`Error fetching offer: ${fetchError.message}`);
    }
    
    if (!offer) {
      throw new Error(`Offer with ID ${offerId} not found`);
    }
    
    console.log(`Found offer: ${offer.departure_location} to ${offer.arrival_location}`);
    
    // Generate text for embedding
    const offerText = embeddings.generateJetShareOfferText(offer);
    console.log('Generated text for embedding:', offerText);
    
    // Generate embedding vector
    console.log('Generating embedding...');
    const vector = await embeddings.encode(offerText);
    console.log(`Generated vector with ${vector.length} dimensions`);
    
    // Update the database with the embedding
    console.log('Updating database...');
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update({ 
        embedding: vector,
        embedding_updated_at: new Date().toISOString()
      })
      .eq('id', offerId);
      
    if (updateError) {
      throw new Error(`Error updating database: ${updateError.message}`);
    }
    
    // Also store in Pinecone if available
    try {
      console.log('Storing in Pinecone...');
      const record = embeddings.preparePineconeRecord(
        offerId,
        vector,
        'jetshare_offer',
        offer,
        offerText
      );
      
      await pinecone.upsertRecords([record]);
      console.log('Successfully stored in Pinecone');
    } catch (pineconeError) {
      console.warn('Warning: Failed to store in Pinecone (non-critical):', pineconeError);
    }
    
    console.log('✅ Embedding completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 