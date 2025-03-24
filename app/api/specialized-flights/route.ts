import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get('theme');
    const crewId = searchParams.get('crewId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const minSeats = searchParams.get('minSeats');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Start query
    let query = supabase
      .from('specialized_flights')
      .select(`
        *,
        crew:crew_id (
          id,
          name,
          profile_image_url,
          ratings_avg,
          specializations
        ),
        flight:flight_id (
          *,
          jets:jet_id (*),
          origin:origin_airport (*),
          destination:destination_airport (*)
        )
      `);
    
    // Apply filters
    if (theme) {
      query = query.ilike('theme', `%${theme}%`);
    }
    
    if (crewId) {
      query = query.eq('crew_id', crewId);
    }
    
    // If flight filters are provided, apply them through the join
    if (dateFrom || dateTo || origin || destination || minSeats) {
      // We'll need to create a complex filter on the flight join
      let flightFilters = '';
      
      if (dateFrom) {
        flightFilters += `and flight.departure_time >= '${dateFrom}'`;
      }
      
      if (dateTo) {
        flightFilters += `and flight.departure_time <= '${dateTo}'`;
      }
      
      if (origin) {
        flightFilters += `and flight.origin_airport = '${origin}'`;
      }
      
      if (destination) {
        flightFilters += `and flight.destination_airport = '${destination}'`;
      }
      
      if (minSeats) {
        flightFilters += `and flight.available_seats >= ${minSeats}`;
      }
      
      // Remove the leading 'and' if it exists
      if (flightFilters.startsWith('and ')) {
        flightFilters = flightFilters.substring(4);
      }
      
      if (flightFilters) {
        // Use a foreign key filter on the join
        query = query.or(`flight.${flightFilters}`);
      }
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching specialized flights:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedData = data.map(flight => ({
      id: flight.id,
      flightId: flight.flight_id,
      title: flight.title,
      theme: flight.theme,
      description: flight.description,
      crewId: flight.crew_id,
      nftTicketed: flight.nft_ticketed,
      seatsAvailable: flight.seats_available,
      createdAt: flight.created_at,
      updatedAt: flight.updated_at,
      crew: flight.crew ? {
        id: flight.crew.id,
        name: flight.crew.name,
        profileImageUrl: flight.crew.profile_image_url,
        ratingsAvg: flight.crew.ratings_avg,
        specializations: flight.crew.specializations
      } : undefined,
      flight: flight.flight
    }));
    
    return NextResponse.json({ 
      specializedFlights: transformedData,
      count: count || transformedData.length,
      hasMore: (offset + limit) < (count || 0)
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.flightId || !body.title || !body.theme || !body.crewId || !body.seatsAvailable) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify the authenticated user is the crew member
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('user_id')
      .eq('id', body.crewId)
      .single();
    
    if (crewError) {
      console.error('Error fetching crew member:', crewError);
      return NextResponse.json({ error: crewError.message }, { status: 500 });
    }
    
    if (crewData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to create specialized flight for this crew member' }, { status: 403 });
    }
    
    // Create the specialized flight
    const { data, error } = await supabase
      .from('specialized_flights')
      .insert({
        flight_id: body.flightId,
        title: body.title,
        theme: body.theme,
        description: body.description,
        crew_id: body.crewId,
        nft_ticketed: body.nftTicketed || false,
        seats_available: body.seatsAvailable
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating specialized flight:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Update the flight to mark it as specialized
    const { error: updateError } = await supabase
      .from('flights')
      .update({
        specialized_event: true,
        crew_id: body.crewId
      })
      .eq('id', body.flightId);
    
    if (updateError) {
      console.error('Error updating flight:', updateError);
      // Continue anyway as the specialized flight was created
    }
    
    // Transform data to match our types
    const transformedData = {
      id: data.id,
      flightId: data.flight_id,
      title: data.title,
      theme: data.theme,
      description: data.description,
      crewId: data.crew_id,
      nftTicketed: data.nft_ticketed,
      seatsAvailable: data.seats_available,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    return NextResponse.json({ specializedFlight: transformedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 