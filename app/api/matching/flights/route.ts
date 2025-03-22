import { NextRequest, NextResponse } from 'next/server';
import { syncFlightToVectorDB } from '@/lib/services/matching';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to sync a flight to the vector DB
 */
export async function PUT(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Check if user is authorized (admin or jet owner)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (!profile || (profile.user_type !== 'admin' && profile.user_type !== 'owner')) {
      return NextResponse.json(
        { error: 'Unauthorized to sync flight data' },
        { status: 403 }
      );
    }
    
    // Get request body
    const requestBody = await req.json();
    
    // Validate request
    if (!requestBody.flightId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // If user is a jet owner, verify they own the jet for this flight
    if (profile.user_type === 'owner') {
      const { data: flight } = await supabase
        .from('flights')
        .select(`
          id,
          jet_id,
          jets(owner_id)
        `)
        .eq('id', requestBody.flightId)
        .single();
      
      // Safely access the owner_id from jets
      const jetOwner = flight?.jets && Array.isArray(flight.jets) && flight.jets[0]?.owner_id;
      
      if (!flight || jetOwner !== user.id) {
        return NextResponse.json(
          { error: 'You can only sync flights for jets you own' },
          { status: 403 }
        );
      }
    }
    
    // Sync flight to vector DB
    const success = await syncFlightToVectorDB(requestBody.flightId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to sync flight' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in sync flight API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to sync multiple flights to the vector DB
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Check if user is authorized (admin or jet owner)
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (!profile || (profile.user_type !== 'admin' && profile.user_type !== 'owner')) {
      return NextResponse.json(
        { error: 'Unauthorized to sync flight data' },
        { status: 403 }
      );
    }
    
    // Get request body
    const requestBody = await req.json();
    
    // Validate request
    if (!requestBody.flightIds || !Array.isArray(requestBody.flightIds) || requestBody.flightIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid flightIds array' },
        { status: 400 }
      );
    }
    
    // If user is a jet owner, verify they own the jets for these flights
    if (profile.user_type === 'owner') {
      const { data: flights } = await supabase
        .from('flights')
        .select(`
          id,
          jet_id,
          jets(owner_id)
        `)
        .in('id', requestBody.flightIds);
      
      // Filter to only flights owned by this user
      const authorizedFlightIds = (flights || [])
        .filter(flight => {
          // Safely access the owner_id from jets
          const jetOwner = flight.jets && Array.isArray(flight.jets) && flight.jets[0]?.owner_id;
          return jetOwner === user.id;
        })
        .map(flight => flight.id);
      
      if (authorizedFlightIds.length === 0) {
        return NextResponse.json(
          { error: 'You do not own any of these flights' },
          { status: 403 }
        );
      }
      
      // Update flightIds to only include authorized flights
      requestBody.flightIds = authorizedFlightIds;
    }
    
    // Sync flights to vector DB
    const results = await Promise.allSettled(
      requestBody.flightIds.map((flightId: string) => syncFlightToVectorDB(flightId))
    );
    
    // Count successes and failures
    const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failureCount = requestBody.flightIds.length - successCount;
    
    return NextResponse.json({
      success: true,
      results: {
        total: requestBody.flightIds.length,
        synced: successCount,
        failed: failureCount
      }
    });
  } catch (error: any) {
    console.error('Error in sync multiple flights API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 