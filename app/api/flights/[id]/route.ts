import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flightId = params.id;
    
    if (!flightId) {
      return NextResponse.json(
        { error: 'Flight ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching flight with ID: ${flightId}`);
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('flights')
      .select(`
        *,
        jets!inner (*),
        origin:airports!origin_airport (*),
        destination:airports!destination_airport (*)
      `)
      .eq('id', flightId)
      .single();
    
    if (error) {
      console.error('Error fetching flight:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flight', details: error.message },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }
    
    // Transform the data to match our expected format
    const transformedData = {
      ...data,
      airports: data.origin,
      "airports!flights_destination_airport_fkey": data.destination
    };
    
    // Get booking availability
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('seats_booked')
      .eq('flight_id', flightId)
      .eq('booking_status', 'confirmed');
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }
    
    // Calculate total booked seats
    const totalBookedSeats = bookingsData?.reduce((total, booking) => total + booking.seats_booked, 0) || 0;
    
    // Calculate remaining seats
    const remainingSeats = Math.max(0, data.available_seats - totalBookedSeats);
    
    // Check if fractional ownership tokens are available for this jet
    const { data: tokensData, error: tokensError } = await supabase
      .from('fractional_tokens')
      .select('*')
      .eq('jet_id', data.jet_id)
      .eq('status', 'for_sale');
    
    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
    }
    
    // Add additional information to the response
    const enhancedData = {
      ...transformedData,
      booking_availability: {
        total_seats: data.available_seats,
        booked_seats: totalBookedSeats,
        remaining_seats: remainingSeats,
        is_available: remainingSeats > 0
      },
      fractional_ownership: {
        tokens_available: tokensData ? tokensData.length > 0 : false,
        tokens: tokensData || []
      }
    };
    
    return NextResponse.json(enhancedData);
    
  } catch (err) {
    console.error('Unexpected error in flight API:', err);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
} 