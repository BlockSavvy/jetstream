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
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Start query
    let query = supabase
      .from('custom_itinerary_requests')
      .select(`
        *,
        profiles:requesting_user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `);
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    // User can only see their own requests
    query = query.eq('requesting_user_id', user.id);
    
    // Apply pagination and order
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching custom itineraries:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedData = data.map(item => ({
      id: item.id,
      requestingUserId: item.requesting_user_id,
      destination: item.destination,
      origin: item.origin,
      dateTime: item.date_time,
      requestedSpecializations: item.requested_specializations,
      description: item.description,
      status: item.status,
      matchesFound: item.matches_found,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      requestor: item.profiles ? {
        id: item.profiles.id,
        name: `${item.profiles.first_name} ${item.profiles.last_name}`,
        avatarUrl: item.profiles.avatar_url
      } : undefined
    }));
    
    return NextResponse.json({ customItineraries: transformedData });
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
    
    // Validate fields
    if (!body.requestedSpecializations || !Array.isArray(body.requestedSpecializations) || body.requestedSpecializations.length === 0) {
      return NextResponse.json({ error: 'At least one specialization must be requested' }, { status: 400 });
    }
    
    // Create the custom itinerary request
    const { data, error } = await supabase
      .from('custom_itinerary_requests')
      .insert({
        requesting_user_id: user.id,
        destination: body.destination,
        origin: body.origin,
        date_time: body.dateTime,
        requested_specializations: body.requestedSpecializations,
        description: body.description,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating custom itinerary request:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Transform data to match our types
    const transformedData = {
      id: data.id,
      requestingUserId: data.requesting_user_id,
      destination: data.destination,
      origin: data.origin,
      dateTime: data.date_time,
      requestedSpecializations: data.requested_specializations,
      description: data.description,
      status: data.status,
      matchesFound: data.matches_found,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
    
    // TODO: Trigger AI matching in the background to find potential matches
    // This would involve calling a serverless function or background job
    
    return NextResponse.json({ customItinerary: transformedData });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 