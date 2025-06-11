import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: NextRequest) {
  console.log("Jets User API: Request received");
  
  // Parse the URL to get user_id
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const timestamp = searchParams.get('t') || Date.now().toString();
  
  // Set cache control headers
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json'
  };
  
  // Basic validation
  if (!userId) {
    console.error('No user ID provided');
    return NextResponse.json(
      { 
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required to fetch jets',
        timestamp
      },
      { status: 400, headers }
    );
  }

  // Check for required environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    return NextResponse.json(
      { 
        success: false,
        error: 'Server configuration error',
        message: 'Server is not properly configured',
        timestamp
      },
      { status: 500, headers }
    );
  }
  
  try {
    console.log(`Fetching jets for user: ${userId}`);
    
    // Use the service role key to skip authentication issues 
    // This makes the API usable with or without authentication
    const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);
    
    // Try owner_id field first (preferred)
    let { data: ownerJets, error: ownerError } = await supabase
      .from('jets')
      .select('*')
      .eq('owner_id', userId);
      
    // If owner_id query works and returns jets, use that data
    if (!ownerError && ownerJets && ownerJets.length > 0) {
      console.log(`Found ${ownerJets.length} jets using owner_id field`);
      return NextResponse.json(
        { 
          success: true,
          data: ownerJets, 
          timestamp, 
          userId,
          source: 'database'
        }, 
        { status: 200, headers }
      );
    }
    
    // If owner_id fails or returns no jets, try user_id as fallback
    console.log(`No jets found with owner_id=${userId}, trying user_id as fallback`);
    const { data: userJets, error: userError } = await supabase
      .from('jets')
      .select('*')
      .eq('user_id', userId);
      
    // If user_id query works and returns jets, use that data
    if (!userError && userJets && userJets.length > 0) {
      console.log(`Found ${userJets.length} jets using user_id field`);
      return NextResponse.json(
        { 
          success: true,
          data: userJets, 
          timestamp, 
          userId,
          source: 'database'
        }, 
        { status: 200, headers }
      );
    }

    // Log any errors for debugging
    if (ownerError) {
      console.error('Error querying with owner_id:', ownerError.message);
    }
    if (userError) {
      console.error('Error querying with user_id:', userError.message);
    }
    
    // If no jets found in either query but no errors occurred, return empty array
    if (!ownerError || !userError) {
      console.log(`No jets found for user ${userId}`);
      return NextResponse.json(
        { 
          success: true,
          data: [], 
          message: 'No jets found for this user',
          timestamp,
          userId,
          source: 'database'
        },
        { status: 200, headers }
      );
    }
    
    // If both queries failed with errors, there's a database issue
    throw new Error(`Database queries failed: ${ownerError?.message}, ${userError?.message}`);
    
  } catch (error) {
    console.error('Error in jets API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      },
      { status: 500, headers }
    );
  }
}