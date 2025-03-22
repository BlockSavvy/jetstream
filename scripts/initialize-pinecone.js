/**
 * This script initializes or resets the Pinecone index for the JetStream AI matching system.
 * It will create a new index if one doesn't exist, or reset an existing one.
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const path = require('path');
// Load environment variables from .env.local for direct Node.js script execution
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
// Also try .env as fallback
require('dotenv').config();

// Configuration
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX || 'jetstream';
const DIMENSION = 1024; // Cohere embed-english-v3.0 produces 1024-dimensional vectors

// Free tier is only available in AWS us-east-1 (as of March 2024)
const FREE_TIER_REGIONS = {
  cloud: 'aws', 
  region: 'us-east-1' // Only region supported for free tier
};

async function main() {
  try {
    if (!PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }

    console.log('🔑 Connecting to Pinecone...');
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    // List existing indexes
    console.log('📋 Checking existing indexes...');
    const indexList = await pinecone.listIndexes();
    
    console.log('Available indexes:', indexList);
    
    // Check if our index exists
    let existingIndex = false;
    if (indexList && indexList.indexes) {
      existingIndex = indexList.indexes.some(index => index.name === PINECONE_INDEX);
    } else if (Array.isArray(indexList)) {
      existingIndex = indexList.some(index => index.name === PINECONE_INDEX);
    } else if (typeof indexList === 'object') {
      existingIndex = Object.values(indexList).some(index => 
        typeof index === 'object' && index.name === PINECONE_INDEX
      );
    }
    
    if (existingIndex) {
      console.log(`🔍 Found existing index '${PINECONE_INDEX}'`);
      
      // Prompt for confirmation before deleting
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const confirmation = await new Promise(resolve => {
        readline.question(`⚠️ Do you want to delete and recreate the index '${PINECONE_INDEX}'? THIS WILL DELETE ALL VECTOR DATA! (y/N): `, answer => {
          readline.close();
          resolve(answer.toLowerCase());
        });
      });
      
      if (confirmation === 'y' || confirmation === 'yes') {
        console.log(`🗑️ Deleting index '${PINECONE_INDEX}'...`);
        await pinecone.deleteIndex(PINECONE_INDEX);
        console.log(`✅ Index '${PINECONE_INDEX}' deleted.`);
      } else {
        console.log('❌ Operation cancelled. The existing index will not be modified.');
        return;
      }
    }
    
    // Create the index
    console.log(`🔨 Creating index '${PINECONE_INDEX}'...`);
    console.log(`Using free tier region: ${FREE_TIER_REGIONS.cloud}/${FREE_TIER_REGIONS.region}`);
    
    await pinecone.createIndex({
      name: PINECONE_INDEX,
      dimension: DIMENSION,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: FREE_TIER_REGIONS.cloud,
          region: FREE_TIER_REGIONS.region
        }
      }
    });
    
    console.log('⏳ Waiting for index to initialize...');
    
    // Wait for the index to be ready
    let indexReady = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!indexReady && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      try {
        const indexDescription = await pinecone.describeIndex(PINECONE_INDEX);
        console.log('Index description:', indexDescription);
        
        indexReady = indexDescription && 
                    indexDescription.status && 
                    (indexDescription.status.ready === true || 
                     indexDescription.status.state === 'Ready');
        
        if (indexReady) {
          console.log('✅ Index is ready!');
        } else {
          console.log(`⏳ Index is initializing... (attempt ${attempts}/${maxAttempts})`);
        }
      } catch (error) {
        console.log(`⏳ Index is initializing... (attempt ${attempts}/${maxAttempts})`);
        console.log('Error while checking index status:', error.message);
      }
    }
    
    if (!indexReady) {
      console.log('⚠️ Index initialization is taking longer than expected.');
      console.log('   It might still be initializing in the background.');
      console.log('   Check the Pinecone dashboard for status updates.');
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Set up your environment variables:');
    console.log(`   PINECONE_API_KEY=${PINECONE_API_KEY}`);
    console.log(`   PINECONE_INDEX=${PINECONE_INDEX}`);
    console.log(`   Also update your environment to reflect the actual cloud/region used:`);
    console.log(`   PINECONE_CLOUD=${FREE_TIER_REGIONS.cloud}`); 
    console.log(`   PINECONE_REGION=${FREE_TIER_REGIONS.region}`);
    console.log('2. Upload user profiles and flights using the API endpoints:');
    console.log('   PUT /api/matching - to sync a user profile');
    console.log('   PUT /api/matching/flights - to sync a flight');
    
  } catch (error) {
    console.error('❌ Error initializing Pinecone:', error);
    process.exit(1);
  }
}

main(); 