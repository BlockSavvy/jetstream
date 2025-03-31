import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSBClient } from '@supabase/supabase-js';

// Define CORS headers for consistent response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Supabase-Auth',
  'Access-Control-Allow-Credentials': 'true',
};

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const requestId = searchParams.get('rid') || 'unknown-rid';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Get stats for user: ${userId} (request: ${requestId})`);
    
    // For all requests with userId, use direct database access with service role
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceUrl || !supabaseServiceKey) {
      console.error('Missing Supabase service credentials for stats');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    
    try {
      console.log(`Creating stats service client for ${userId} with URL: ${supabaseServiceUrl.substring(0, 20)}...`);
      
      // Create a service client directly with minimal options
      const serviceClient = createSBClient(supabaseServiceUrl, supabaseServiceKey, {
        auth: { persistSession: false },
        global: { headers: { 'x-connection-id': requestId } }
      });
      
      console.log('Stats API: Service client created for user', userId);

      // Calculate total offers
      const { count: totalOffers, error: offersError } = await serviceClient
        .from('jetshare_offers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (offersError) {
        console.error('Error getting total offers:', offersError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Calculate total bookings (offers matched to this user)
      const { count: totalBookings, error: bookingsError } = await serviceClient
        .from('jetshare_offers')
        .select('*', { count: 'exact', head: true })
        .eq('matched_user_id', userId);

      if (bookingsError) {
        console.error('Error getting total bookings:', bookingsError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // Skip transactions for now
      console.log(`Stats computed for user ${userId}: offers=${totalOffers}, bookings=${totalBookings}`);

      return NextResponse.json({
        stats: {
          totalOffers: totalOffers || 0,
          totalBookings: totalBookings || 0,
          totalSpent: 0, // Default values while transactions are fixed
          totalEarned: 0,
        },
        success: true,
      });
      
    } catch (serviceError) {
      console.error('Service role client error for stats:', serviceError);
      return NextResponse.json({ error: 'Service error' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 