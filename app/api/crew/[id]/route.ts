import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
    }
    
    // Get the crew member with reviews
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (crewError) {
      console.error('Error fetching crew member:', crewError);
      return NextResponse.json({ error: crewError.message }, { status: 500 });
    }
    
    // Get reviews for the crew member
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('crew_reviews')
      .select(`
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('crew_id', id)
      .order('created_at', { ascending: false });
    
    if (reviewsError) {
      console.error('Error fetching crew reviews:', reviewsError);
      return NextResponse.json({ error: reviewsError.message }, { status: 500 });
    }
    
    // Get specialized flights for the crew member
    const { data: flightsData, error: flightsError } = await supabase
      .from('specialized_flights')
      .select(`
        *,
        flights:flight_id (
          *,
          jets:jet_id (*),
          origin:origin_airport (*),
          destination:destination_airport (*)
        )
      `)
      .eq('crew_id', id)
      .order('created_at', { ascending: false });
    
    if (flightsError) {
      console.error('Error fetching specialized flights:', flightsError);
      return NextResponse.json({ error: flightsError.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedCrew = {
      id: crewData.id,
      userId: crewData.user_id,
      name: crewData.name,
      bio: crewData.bio,
      profileImageUrl: crewData.profile_image_url,
      ratingsAvg: crewData.ratings_avg,
      specializations: crewData.specializations,
      socialLinks: crewData.social_links,
      reviews: reviewsData.map(review => ({
        id: review.id,
        crewId: review.crew_id,
        userId: review.user_id,
        flightId: review.flight_id,
        rating: review.rating,
        reviewText: review.review_text,
        createdAt: review.created_at,
        user: review.profiles ? {
          name: `${review.profiles.first_name} ${review.profiles.last_name}`,
          avatarUrl: review.profiles.avatar_url
        } : undefined
      })),
      specializedFlights: flightsData.map(flight => ({
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
        flight: flight.flights
      }))
    };
    
    return NextResponse.json({ crew: transformedCrew });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user is the owner of the crew member
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (crewError) {
      console.error('Error fetching crew member:', crewError);
      return NextResponse.json({ error: crewError.message }, { status: 500 });
    }
    
    if (crewData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this crew member' }, { status: 403 });
    }
    
    // Get the request body
    const body = await request.json();
    
    // Update the crew member
    const { data, error } = await supabase
      .from('pilots_crews')
      .update({
        name: body.name,
        bio: body.bio,
        profile_image_url: body.profileImageUrl,
        specializations: body.specializations,
        social_links: body.socialLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating crew member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedData = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      bio: data.bio,
      profileImageUrl: data.profile_image_url,
      ratingsAvg: data.ratings_avg,
      specializations: data.specializations,
      socialLinks: data.social_links,
    };
    
    return NextResponse.json({ crew: transformedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
    }
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user is the owner of the crew member
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (crewError) {
      console.error('Error fetching crew member:', crewError);
      return NextResponse.json({ error: crewError.message }, { status: 500 });
    }
    
    if (crewData.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this crew member' }, { status: 403 });
    }
    
    // Delete the crew member
    const { error } = await supabase
      .from('pilots_crews')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting crew member:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 