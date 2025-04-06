import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET route handler
 */
export async function GET(request: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  
  if (!id) {
    return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
  }
  
  try {
    // Use the existing createClient function
    const supabase = await createClient();
    
    // Get the crew member with reviews
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (crewError) {
      // If the error is "not found", return a 404 status
      if (crewError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: crewError.message,
        details: `Failed to fetch crew with ID: ${id}` 
      }, { status: 500 });
    }
    
    if (!crewData) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }
    
    // Get reviews for the crew member - if this fails, don't fail the whole request
    let reviewsData = [];
    try {
      // First get the reviews without the problematic join
      const { data, error } = await supabase
        .from('crew_reviews')
        .select('*')
        .eq('crew_id', id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching crew reviews:', error);
      } else if (data && data.length > 0) {
        // If we have reviews, try to get user information separately
        reviewsData = await Promise.all(data.map(async (review) => {
          // Only try to get user info if user_id exists
          if (review.user_id) {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url')
              .eq('id', review.user_id)
              .single();
            
            if (userError) {
              console.error('Error fetching user data for review:', userError);
              return {
                ...review,
                user: undefined
              };
            }
            
            return {
              ...review,
              user: userData ? {
                name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Anonymous',
                avatarUrl: userData.avatar_url
              } : undefined
            };
          }
          
          return {
            ...review,
            user: undefined
          };
        }));
      } else {
        reviewsData = data || [];
      }
    } catch (error) {
      console.error('Unexpected error fetching reviews:', error);
    }
    
    // Get specialized flights for the crew member - if this fails, don't fail the whole request
    let flightsData = [];
    try {
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('Error fetching specialized flights:', error);
      } else {
        flightsData = data || [];
      }
    } catch (error) {
      console.error('Unexpected error fetching flights:', error);
    }
    
    // Transform data to match our types
    const transformedCrew = {
      id: crewData.id,
      userId: crewData.user_id,
      name: crewData.name,
      bio: crewData.bio,
      profileImageUrl: crewData.profile_image_url,
      ratingsAvg: crewData.ratings_avg,
      specializations: crewData.specializations || [],
      socialLinks: crewData.social_links || {},
      isCaptain: crewData.is_captain || false,
      dedicatedJetOwnerId: crewData.dedicated_jet_owner_id,
      yearsOfExperience: crewData.years_of_experience,
      availability: crewData.availability,
      reviews: reviewsData,
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
    console.error('Unexpected error in crew API:', error);
    return NextResponse.json({ 
      error: error.message, 
      source: 'GET /api/crew/[id]'
    }, { status: 500 });
  }
}

/**
 * PATCH route handler
 */
export async function PATCH(request: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  
  if (!id) {
    return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
  }
  
  try {
    // Use the existing createClient function
    const supabase = await createClient();
    
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
      isCaptain: data.is_captain || false,
      dedicatedJetOwnerId: data.dedicated_jet_owner_id,
      yearsOfExperience: data.years_of_experience,
      availability: data.availability
    };
    
    return NextResponse.json({ crew: transformedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE route handler
 */
export async function DELETE(request: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  
  if (!id) {
    return NextResponse.json({ error: 'Crew ID is required' }, { status: 400 });
  }
  
  try {
    // Use the existing createClient function
    const supabase = await createClient();
    
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