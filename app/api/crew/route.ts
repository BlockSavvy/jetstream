import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
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
    const specializations = searchParams.get('specializations');
    const minRating = searchParams.get('minRating');
    const searchTerm = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Start query
    let query = supabase
      .from('pilots_crews')
      .select(`
        *,
        crew_reviews (*)
      `);
    
    // Apply filters
    if (specializations) {
      const specializationsArray = specializations.split(',');
      query = query.contains('specializations', specializationsArray);
    }
    
    if (minRating) {
      query = query.gte('ratings_avg', parseFloat(minRating));
    }
    
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('ratings_avg', { ascending: false });
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching crew:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedData = data.map(crew => ({
      id: crew.id,
      userId: crew.user_id,
      name: crew.name,
      bio: crew.bio,
      profileImageUrl: crew.profile_image_url,
      ratingsAvg: crew.ratings_avg,
      specializations: crew.specializations,
      socialLinks: crew.social_links,
      reviews: crew.crew_reviews,
      reviewCount: crew.crew_reviews ? crew.crew_reviews.length : 0
    }));
    
    return NextResponse.json({ 
      crew: transformedData,
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
    const cookieStore = cookies();
    
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
    if (!body.name || !body.specializations || !Array.isArray(body.specializations)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create the crew member
    const { data, error } = await supabase
      .from('pilots_crews')
      .insert({
        user_id: user.id,
        name: body.name,
        bio: body.bio,
        profile_image_url: body.profileImageUrl,
        specializations: body.specializations,
        social_links: body.socialLinks || {},
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating crew member:', error);
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