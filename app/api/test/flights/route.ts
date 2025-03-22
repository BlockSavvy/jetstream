import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncFlightToVectorDB } from '@/lib/services/matching';

/**
 * Test endpoint to create sample flights for testing the AI matching service
 */
export async function POST(req: NextRequest) {
  try {
    // Create a Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create three sample jets
    const jets = [
      {
        model: 'Citation X',
        manufacturer: 'Cessna',
        year: 2020,
        tail_number: 'N123JS',
        capacity: 8,
        range_nm: 3500,
        images: ['https://example.com/citation.jpg'],
        amenities: ['WiFi', 'Conference Room', 'Premium Food', 'Entertainment System'],
        home_base_airport: 'KTEB',
        status: 'available',
        hourly_rate: 5000
      },
      {
        model: 'Gulfstream G650',
        manufacturer: 'Gulfstream',
        year: 2021,
        tail_number: 'N456JS',
        capacity: 14,
        range_nm: 7000,
        images: ['https://example.com/gulfstream.jpg'],
        amenities: ['WiFi', 'Bedroom', 'Shower', 'Conference Room', 'Premium Food', 'Entertainment System'],
        home_base_airport: 'KLAX',
        status: 'available',
        hourly_rate: 12000
      },
      {
        model: 'Phenom 300',
        manufacturer: 'Embraer',
        year: 2019,
        tail_number: 'N789JS',
        capacity: 6,
        range_nm: 2000,
        images: ['https://example.com/phenom.jpg'],
        amenities: ['WiFi', 'Premium Food', 'Entertainment System'],
        home_base_airport: 'KMIA',
        status: 'available',
        hourly_rate: 3500
      }
    ];
    
    // Insert jets to get their IDs
    const { data: jetsData, error: jetsError } = await supabaseAdmin
      .from('jets')
      .upsert(jets.map(jet => ({
        ...jet,
        id: undefined, // Let Supabase generate the IDs
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select();
    
    if (jetsError) {
      console.error('Error creating sample jets:', jetsError);
      return NextResponse.json(
        { error: 'Failed to create sample jets', details: jetsError },
        { status: 500 }
      );
    }
    
    // Define sample flights using the created jets
    const jetIds = jetsData.map(jet => jet.id);
    
    const flights = [
      {
        jet_id: jetIds[0],
        origin_airport: 'KTEB',
        destination_airport: 'KLAX',
        departure_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        arrival_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // 6 hours flight time
        available_seats: 8,
        base_price: 35000,
        status: 'scheduled'
      },
      {
        jet_id: jetIds[1],
        origin_airport: 'KLAX',
        destination_airport: 'KJFK',
        departure_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        arrival_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // 5 hours flight time
        available_seats: 14,
        base_price: 65000,
        status: 'scheduled'
      },
      {
        jet_id: jetIds[2],
        origin_airport: 'KMIA',
        destination_airport: 'KLAS',
        departure_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        arrival_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // 5 hours flight time
        available_seats: 6,
        base_price: 25000,
        status: 'scheduled'
      },
      {
        jet_id: jetIds[0],
        origin_airport: 'KJFK',
        destination_airport: 'KMIA',
        departure_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        arrival_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours flight time
        available_seats: 8,
        base_price: 20000,
        status: 'scheduled'
      },
      {
        jet_id: jetIds[1],
        origin_airport: 'KLAS',
        destination_airport: 'KTEB',
        departure_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        arrival_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours flight time
        available_seats: 14,
        base_price: 55000,
        status: 'scheduled'
      }
    ];
    
    // Insert flights to get their IDs
    const { data: flightsData, error: flightsError } = await supabaseAdmin
      .from('flights')
      .upsert(flights.map(flight => ({
        ...flight,
        id: undefined, // Let Supabase generate the IDs
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select();
    
    if (flightsError) {
      console.error('Error creating sample flights:', flightsError);
      return NextResponse.json(
        { error: 'Failed to create sample flights', details: flightsError },
        { status: 500 }
      );
    }
    
    // Sync flights to vector database
    const flightIds = flightsData.map(flight => flight.id);
    const syncResults = await Promise.allSettled(
      flightIds.map(flightId => syncFlightToVectorDB(flightId))
    );
    
    const successCount = syncResults.filter(
      result => result.status === 'fulfilled' && result.value
    ).length;
    
    return NextResponse.json({
      message: 'Sample flights created and synced successfully',
      jets: jetsData,
      flights: flightsData,
      syncResults: {
        total: flightIds.length,
        synced: successCount,
        failed: flightIds.length - successCount
      }
    });
    
  } catch (error: any) {
    console.error('Error in test flights endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 