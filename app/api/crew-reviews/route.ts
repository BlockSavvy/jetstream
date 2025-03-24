import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    if (!body.crewId || !body.rating || (body.rating < 1 || body.rating > 5)) {
      return NextResponse.json({ error: 'Missing required fields or invalid rating' }, { status: 400 });
    }
    
    // Check if the user has already reviewed this crew member
    const { data: existingReview, error: existingError } = await supabase
      .from('crew_reviews')
      .select('id')
      .eq('crew_id', body.crewId)
      .eq('user_id', user.id);
      
    if (existingError) {
      console.error('Error checking existing review:', existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    
    if (existingReview && existingReview.length > 0) {
      return NextResponse.json({ error: 'You have already reviewed this crew member' }, { status: 400 });
    }
    
    // If flightId is provided, verify that the user was actually on that flight
    if (body.flightId) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('flight_id', body.flightId)
        .eq('user_id', user.id);
        
      if (bookingsError) {
        console.error('Error verifying flight booking:', bookingsError);
        return NextResponse.json({ error: bookingsError.message }, { status: 500 });
      }
      
      if (!bookings || bookings.length === 0) {
        return NextResponse.json({ error: 'You must have booked this flight to review the crew' }, { status: 403 });
      }
    }
    
    // Create the review
    const { data, error } = await supabase
      .from('crew_reviews')
      .insert({
        crew_id: body.crewId,
        user_id: user.id,
        flight_id: body.flightId || null,
        rating: body.rating,
        review_text: body.reviewText || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Update the crew member's average rating
    const { data: reviewStats, error: statsError } = await supabase
      .from('crew_reviews')
      .select('rating')
      .eq('crew_id', body.crewId);
      
    if (statsError) {
      console.error('Error fetching review stats:', statsError);
      // Continue anyway as the review was created
    } else if (reviewStats && reviewStats.length > 0) {
      // Calculate new average rating
      const sum = reviewStats.reduce((acc, review) => acc + review.rating, 0);
      const avg = sum / reviewStats.length;
      
      // Update the crew member
      const { error: updateError } = await supabase
        .from('pilots_crews')
        .update({
          ratings_avg: avg,
          updated_at: new Date().toISOString()
        })
        .eq('id', body.crewId);
        
      if (updateError) {
        console.error('Error updating crew rating:', updateError);
        // Continue anyway as the review was created
      }
    }
    
    // Transform data to match our types
    const transformedData = {
      id: data.id,
      crewId: data.crew_id,
      userId: data.user_id,
      flightId: data.flight_id,
      rating: data.rating,
      reviewText: data.review_text,
      createdAt: data.created_at
    };
    
    return NextResponse.json({ review: transformedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 