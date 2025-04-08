import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server'; // Use server client
import { getRecentSimulations } from '@/lib/simulation'; // Import the function

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    // Get limit from query params, default to 10
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Note: We don't need to explicitly create the client here
    // if getRecentSimulations handles it internally using supabase-server
    
    const simulations = await getRecentSimulations(limit);
    
    return NextResponse.json({ simulations }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('Error fetching simulation history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch simulation history', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 