import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';

export async function POST(request: Request) {
  try {
    // Use server-side client instead of cookie-based authentication
    const supabase = await createClient();
    
    // Get the current user's session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error in createOffer:', userError || 'No user found');
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Before creating the offer, ensure the user profile exists
    // This is required because jetshare_offers has a foreign key to the profiles table
    const { success: profileSuccess, message: profileMessage } = await ensureUserProfile(user);
    
    if (!profileSuccess) {
      console.error('Failed to ensure user profile:', profileMessage);
      return NextResponse.json(
        { message: 'Failed to create user profile required for offers: ' + profileMessage },
        { status: 500 }
      );
    }
    
    // Get the request body
    const {
      flight_date,
      departure_location,
      arrival_location,
      aircraft_model,
      total_seats,
      available_seats,
      total_flight_cost,
      requested_share_amount,
      status = 'open'
    } = await request.json();
    
    // Validate required fields
    if (!flight_date || !departure_location || !arrival_location || !aircraft_model || 
        !total_seats || !available_seats || !total_flight_cost || !requested_share_amount) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate numeric fields
    if (total_seats < 1 || available_seats < 1 || total_flight_cost <= 0 || requested_share_amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid numeric values' },
        { status: 400 }
      );
    }
    
    // Validate available seats
    if (available_seats > total_seats) {
      return NextResponse.json(
        { message: 'Available seats cannot exceed total seats' },
        { status: 400 }
      );
    }
    
    // Create the offer
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .insert([
        {
          user_id: user.id,
          flight_date,
          departure_location,
          arrival_location,
          aircraft_model,
          total_seats,
          available_seats,
          total_flight_cost,
          requested_share_amount,
          status,
          matched_user_id: null
        }
      ])
      .select()
      .single();
    
    if (offerError) {
      console.error('Error creating offer:', offerError);
      return NextResponse.json(
        { message: 'Failed to create offer' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(offer);
  } catch (error) {
    console.error('Error in createOffer route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 