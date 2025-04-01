import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { departure, arrival, flight_date, total_cost, share_amount, user_id } = await request.json();

    // Validate input
    if (!departure || !arrival || !flight_date || !total_cost || !share_amount || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate numeric values
    const costValue = parseFloat(total_cost);
    const shareValue = parseFloat(share_amount);
    if (isNaN(costValue) || isNaN(shareValue) || costValue <= 0 || shareValue <= 0) {
      return NextResponse.json(
        { error: 'Invalid numeric values' },
        { status: 400 }
      );
    }

    // Validate date
    const flightDate = new Date(flight_date);
    if (isNaN(flightDate.getTime()) || flightDate < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or past flight date' },
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

    // Create the JetShare offer
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .insert({
        user_id: user_id,
        departure_location: departure,
        arrival_location: arrival,
        flight_date: flightDate.toISOString(),
        total_cost: costValue,
        share_amount: shareValue,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (offerError) {
      console.error('Error creating JetShare offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to create JetShare offer' },
        { status: 500 }
      );
    }

    // Log the function call in the concierge_function_calls table
    await supabase
      .from('concierge_function_calls')
      .insert({
        user_id: user_id,
        function_name: 'CreateJetShareOffer',
        function_parameters: {
          departure,
          arrival,
          flight_date,
          total_cost,
          share_amount
        },
        function_result: { offer_id: offer.id },
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // Return the created offer
    return NextResponse.json({
      message: 'JetShare offer created successfully',
      offer_id: offer.id,
      details: offer
    });
  } catch (error) {
    console.error('Error in create JetShare offer API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 