import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Flights API called with params:', request.nextUrl.searchParams.toString());
    
    const searchParams = request.nextUrl.searchParams;
    const destination = searchParams.get('destination');
    const origin = searchParams.get('origin');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minSeats = searchParams.get('minSeats');
    const hasFractionalTokens = searchParams.get('hasFractionalTokens');

    console.log('Creating Supabase client');
    const supabase = await createClient();
    
    console.log('Building query');
    let query = supabase
      .from('flights')
      .select(`
        *,
        jets!inner (*),
        origin:airports!origin_airport (*),
        destination:airports!destination_airport (*)
      `)
      .eq('status', 'scheduled');

    // Apply filters
    if (origin) {
      console.log('Applying origin filter:', origin);
      query = query.eq('origin_airport', origin);
    }
    
    if (destination) {
      console.log('Applying destination filter:', destination);
      query = query.eq('destination_airport', destination);
    }
    
    if (dateFrom) {
      console.log('Applying dateFrom filter:', dateFrom);
      query = query.gte('departure_time', dateFrom);
    }
    
    if (dateTo) {
      console.log('Applying dateTo filter:', dateTo);
      query = query.lte('departure_time', dateTo);
    }
    
    if (minPrice) {
      console.log('Applying minPrice filter:', minPrice);
      query = query.gte('base_price', minPrice);
    }
    
    if (maxPrice) {
      console.log('Applying maxPrice filter:', maxPrice);
      query = query.lte('base_price', maxPrice);
    }
    
    if (minSeats) {
      console.log('Applying minSeats filter:', minSeats);
      query = query.gte('available_seats', minSeats);
    }
    
    console.log('Executing query');
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch flights', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Query returned ${data?.length || 0} flights`);

    // Transform the data to match our expected format
    const transformedData = data?.map(flight => ({
      ...flight,
      airports: flight.origin,
      "airports!flights_destination_airport_fkey": flight.destination
    })) || [];

    // If hasFractionalTokens filter is applied, we need to check which jets have tokens available
    let filteredData = transformedData;
    
    if (hasFractionalTokens === 'true') {
      console.log('Applying fractional tokens filter');
      // Get all jets with fractional tokens available for sale
      const { data: tokensData, error: tokensError } = await supabase
        .from('fractional_tokens')
        .select('jet_id')
        .eq('status', 'for_sale');
        
      if (tokensError) {
        console.error('Error fetching fractional tokens:', tokensError);
      }
      
      if (tokensData && tokensData.length > 0) {
        console.log(`Found ${tokensData.length} jets with fractional tokens`);
        const jetIdsWithTokens = new Set(tokensData.map(token => token.jet_id));
        filteredData = filteredData.filter(flight => jetIdsWithTokens.has(flight.jet_id));
        console.log(`After filtering, ${filteredData.length} flights remaining`);
      } else {
        console.log('No jets with fractional tokens found');
      }
    }

    return NextResponse.json(filteredData);
  } catch (err) {
    console.error('Unexpected error in flights API:', err);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
} 