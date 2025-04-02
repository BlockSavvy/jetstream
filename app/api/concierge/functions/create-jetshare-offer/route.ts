import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const {
      departure,
      arrival,
      flight_date,
      jet_type = 'Not specified',
      total_cost,
      share_amount,
      user_id,
    } = await request.json();

    // Validate required parameters
    if (!departure || !arrival || !flight_date || !total_cost || !share_amount || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters for offer creation'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase
    const supabase = createClient();

    // Ensure the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .limit(1);

    if (userError || !userData || userData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not found'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a new jetshare offer
    const { data, error } = await supabase
      .from('jetshare_offers')
      .insert({
        user_id,
        departure_location: departure,
        arrival_location: arrival,
        departure_date: new Date(flight_date).toISOString(),
        jet_type,
        total_cost,
        share_amount,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating JetShare offer:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create JetShare offer'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return success response with the offer ID
    return new Response(
      JSON.stringify({
        success: true,
        offer_id: data.id,
        message: `Successfully created JetShare offer from ${departure} to ${arrival}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-jetshare-offer API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 