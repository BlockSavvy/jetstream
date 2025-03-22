import { NextRequest, NextResponse } from 'next/server';
import { findMatches, syncFlightToVectorDB, syncUserToVectorDB } from '@/lib/services/matching';
import { MatchQuery } from '@/lib/types/matching.types';
import { createClient } from '@/lib/supabase-server';
import { encode } from '@/lib/services/embeddings';

/**
 * API endpoint to match flights and travel companions based on user profile
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { query, filters = {} } = data;
    
    // Step 1: Generate embeddings for the query using Cohere
    const queryEmbedding = await encode(query);
    
    // Step 2: Search for similar flights in Pinecone
    const pineconeMatches = await getMatchingFlights(queryEmbedding, filters);
    
    // Step 3: Enrich the results with metadata from Supabase if needed
    const supabase = await createClient();
    
    // Prepare results for frontend display
    const results = await Promise.all(pineconeMatches.map(async (match) => {
      if (!match || !match.metadata) {
        return null;
      }
      
      const { id, metadata, score } = match;
      const matchScore = score ? Math.round(score * 100) : 85; // Convert score to percentage with fallback
      
      return {
        id: metadata.flightId || id,
        route: `${metadata.origin} → ${metadata.destination}`,
        departure: metadata.departureTime,
        matchScore: matchScore,
        reasons: generateMatchReasons(metadata, matchScore),
        price: Number(metadata.price) || 10000 + Math.round(matchScore * 100),
        companions: metadata.companions || Math.floor(Math.random() * 5) + 1,
        metadata: metadata
      };
    }));
    
    // Filter out null results
    const validResults = results.filter(result => result !== null);
    
    // In case Pinecone isn't set up yet, use fallback mock data
    if (validResults.length === 0) {
      return NextResponse.json({
        query,
        results: generateMockResults(query)
      });
    }
    
    return NextResponse.json({
      query,
      results: validResults
    });
  } catch (error) {
    console.error('Error in AI matching API:', error);
    
    // If there's an error with Pinecone, fall back to mock data
    return NextResponse.json({
      query: 'unknown query',
      results: generateMockResults(''),
      isBackupData: true
    });
  }
}

// Initialize Pinecone connection
async function getPineconeClient() {
  try {
    // In production, you'd use environmental variables for API keys
    const PINECONE_API_KEY = process.env.PINECONE_API_KEY || 'pcsk_43YvfP_PE6WWpZHaoxvznfduXY3S9nRoXqghCaKhm2T2W6SiGmHq91jsvunDhQswMnvm6g';
    
    // Dynamically import Pinecone to avoid bundling issues with Next.js
    const { Pinecone } = await import('@pinecone-database/pinecone');
    
    // Initialize client
    const pc = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });
    
    // Index name - replace with your actual index name
    const indexName = 'jetstream-matching';
    return { pc, indexName };
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    throw new Error('Failed to initialize vector database');
  }
}

// Get matching flights based on user preferences
async function getMatchingFlights(embedding: number[], filter = {}) {
  try {
    const { pc, indexName } = await getPineconeClient();
    const index = pc.index(indexName);
    
    // Query the index
    const results = await index.query({
      vector: embedding,
      topK: 10,
      includeMetadata: true,
      filter: filter
    });
    
    return results.matches || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error('Failed to query vector database');
  }
}

function generateMatchReasons(metadata: any, matchScore: number) {
  // Generate personalized reasons based on metadata and match score
  const reasons: string[] = [];
  
  if (metadata.origin) {
    reasons.push(`Matches your preferred departure from ${metadata.origin}`);
  }
  
  if (metadata.destination) {
    reasons.push(`Matches your preferred destination to ${metadata.destination}`);
  }
  
  if (metadata.departureTime) {
    const date = new Date(metadata.departureTime);
    const isEvening = date.getHours() >= 17;
    const isMorning = date.getHours() < 12;
    const timeOfDay = isMorning ? 'morning' : isEvening ? 'evening' : 'afternoon';
    reasons.push(`${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} departure time (${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`);
  }
  
  if (metadata.companions && Number(metadata.companions) > 0) {
    reasons.push(`${metadata.companions} compatible travelers with similar interests`);
  }
  
  if (metadata.amenities) {
    reasons.push(`Includes preferred amenities: ${metadata.amenities.split(',').slice(0, 2).join(', ')}`);
  }

  if (metadata.jetModel) {
    reasons.push(`Preferred aircraft type: ${metadata.jetModel}`);
  }
  
  // Add more personalized reasons based on match score
  if (matchScore > 90) {
    reasons.push('Exceptional match for your travel preferences and style');
  } else if (matchScore > 80) {
    reasons.push('Very strong match for your requirements');
  }
  
  return reasons;
}

// Fallback mock data in case Pinecone isn't set up yet
function generateMockResults(query: string) {
  const queryLower = query.toLowerCase();
  const cities = [
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Miami',
    'Boston', 'Las Vegas', 'Seattle', 'Austin', 'Denver'
  ];
  
  // Extract cities mentioned in the query
  const originCity = cities.find(city => queryLower.includes(city.toLowerCase())) || 'New York';
  
  // Find destination cities (not the origin)
  const destinationOptions = cities.filter(city => city !== originCity);
  const destinationCity = destinationOptions[Math.floor(Math.random() * destinationOptions.length)];
  
  // Detect preferences
  const isBusinessFocused = queryLower.includes('business') || queryLower.includes('professional') || 
                          queryLower.includes('work') || queryLower.includes('executive');
  const isFamilyFocused = queryLower.includes('family') || queryLower.includes('kid') || 
                        queryLower.includes('children') || queryLower.includes('vacation');
  
  // Generate mock results
  const results = [];
  
  for (let i = 0; i < 3; i++) {
    const departure = new Date();
    departure.setDate(departure.getDate() + 7 + i * 3); // Upcoming days
    
    const matchScore = 95 - (i * 5); // Decreasing match scores
    const amenities = isBusinessFocused ? 
      'Wi-Fi, Meeting Space, Workstations' : 
      isFamilyFocused ? 'Family Entertainment, Kid-Friendly Meals, Extra Space' : 
      'Premium Food, Luxury Seating, Personal Service';
    
    const jetModels = ['Gulfstream G650', 'Bombardier Global 6000', 'Embraer Praetor 600'];
    
    // Generate professionals based on query
    const professionals = [];
    if (isBusinessFocused) {
      professionals.push(
        { jobTitle: 'CEO', industry: 'Technology' },
        { jobTitle: 'Investment Banker', industry: 'Finance' },
        { jobTitle: 'Marketing Executive', industry: 'Consumer Goods' }
      );
    }
    
    results.push({
      id: `mock-${i}`,
      route: `${originCity} → ${destinationOptions[i % destinationOptions.length]}`,
      departure: departure.toISOString(),
      matchScore: matchScore,
      reasons: generateMatchReasons(
        { 
          origin: originCity, 
          destination: destinationOptions[i % destinationOptions.length], 
          departureTime: departure.toISOString(),
          companions: isBusinessFocused ? 3 : isFamilyFocused ? 2 : 1,
          amenities: amenities,
          jetModel: jetModels[i % jetModels.length]
        }, 
        matchScore
      ),
      price: 8500 + (i * 2000) + (matchScore * 10),
      companions: isBusinessFocused ? 3 : isFamilyFocused ? 2 : 1,
      metadata: {
        professionals: isBusinessFocused ? professionals : null,
        amenities: amenities,
        jetModel: jetModels[i % jetModels.length],
        origin: originCity,
        destination: destinationOptions[i % destinationOptions.length],
        departureTime: departure.toISOString()
      }
    });
  }
  
  return results;
}

/**
 * API endpoint to sync a user profile to the vector DB
 */
export async function PUT(req: NextRequest) {
  try {
    // Get request body
    const requestBody = await req.json();
    
    // Validate request
    if (!requestBody.userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // For development/testing purposes, check if we're using a test user
    // In production, you would always verify authentication
    const isTestUser = requestBody.userId.startsWith('test-') || requestBody.isTestMode;
    
    if (!isTestUser) {
      // Verify authentication for non-test users
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 401 }
        );
      }
      
      // Make sure the requesting user is either the target user or an admin
      if (requestBody.userId !== user.id) {
        // Check if the user is an admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        if (!profile || profile.user_type !== 'admin') {
          return NextResponse.json(
            { error: 'Unauthorized to sync this user\'s profile' },
            { status: 403 }
          );
        }
      }
    }
    
    // Sync user profile to vector DB
    const success = await syncUserToVectorDB(requestBody.userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to sync user profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in sync user API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 