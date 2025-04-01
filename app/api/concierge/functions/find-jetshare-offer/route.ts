import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { desired_location, date_range, price_range, user_id } = await request.json();

    // Validate input (only location is required)
    if (!desired_location || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields (desired_location and user_id)' },
        { status: 400 }
      );
    }

    // Create a supabase client
    const supabase = createClient();

    // Validate that the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Build the query for matching offers
    let query = supabase
      .from('jetshare_offers')
      .select('*')
      .or(`departure_location.ilike.%${desired_location}%,arrival_location.ilike.%${desired_location}%`)
      .eq('status', 'active')
      .neq('user_id', user_id); // Don't show the user's own offers

    // Add date range filter if provided
    if (date_range) {
      if (date_range.start_date) {
        const startDate = new Date(date_range.start_date);
        if (!isNaN(startDate.getTime())) {
          query = query.gte('flight_date', startDate.toISOString());
        }
      }
      
      if (date_range.end_date) {
        const endDate = new Date(date_range.end_date);
        if (!isNaN(endDate.getTime())) {
          query = query.lte('flight_date', endDate.toISOString());
        }
      }
    }

    // Add price range filter if provided
    if (price_range) {
      if (price_range.min && !isNaN(parseFloat(price_range.min))) {
        query = query.gte('share_amount', parseFloat(price_range.min));
      }
      
      if (price_range.max && !isNaN(parseFloat(price_range.max))) {
        query = query.lte('share_amount', parseFloat(price_range.max));
      }
    }

    // Order by flight date (soonest first)
    query = query.order('flight_date', { ascending: true });

    // Execute the query
    const { data: offers, error: offersError } = await query;

    if (offersError) {
      console.error('Error finding JetShare offers:', offersError);
      return NextResponse.json(
        { error: 'Failed to find JetShare offers' },
        { status: 500 }
      );
    }

    // Log the function call in the concierge_function_calls table
    await supabase
      .from('concierge_function_calls')
      .insert({
        user_id: user_id,
        function_name: 'FindJetShareOffer',
        function_parameters: {
          desired_location,
          date_range,
          price_range
        },
        function_result: { offers_count: offers.length },
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // Return the matching offers
    return NextResponse.json({
      message: `Found ${offers.length} matching JetShare offers`,
      offers: offers
    });
  } catch (error) {
    console.error('Error in find JetShare offers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 