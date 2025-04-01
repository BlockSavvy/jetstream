import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { amenity_type, flight_id, preferences, payment_method_id, user_id } = await request.json();

    // Validate input
    if (!amenity_type || !flight_id || !payment_method_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate amenity type
    const validAmenityTypes = ['catering', 'ground_transportation', 'accommodation', 'entertainment'];
    if (!validAmenityTypes.includes(amenity_type)) {
      return NextResponse.json(
        { error: 'Invalid amenity type' },
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

    // Validate that the flight exists and belongs to the user
    const { data: flightData, error: flightError } = await supabase
      .from('jetshare_offers')
      .select('id, user_id')
      .eq('id', flight_id)
      .single();

    if (flightError || !flightData) {
      return NextResponse.json(
        { error: 'Flight not found' },
        { status: 404 }
      );
    }

    // Check if the user is associated with the flight
    // (either as the owner or as a passenger who booked)
    if (flightData.user_id !== user_id) {
      // Check if user is a passenger
      const { data: bookingData, error: bookingError } = await supabase
        .from('jetshare_bookings')
        .select('id')
        .eq('offer_id', flight_id)
        .eq('user_id', user_id)
        .single();

      if (bookingError || !bookingData) {
        return NextResponse.json(
          { error: 'User is not authorized to book amenities for this flight' },
          { status: 403 }
        );
      }
    }

    // Validate payment method
    const { data: paymentMethod, error: paymentError } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('id', payment_method_id)
      .eq('user_id', user_id)
      .single();

    if (paymentError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found or not owned by user' },
        { status: 404 }
      );
    }

    // Insert the amenity booking
    const { data: amenityBooking, error: amenityError } = await supabase
      .from('amenity_bookings')
      .insert({
        user_id: user_id,
        flight_id: flight_id,
        amenity_type: amenity_type,
        preferences: preferences || {},
        payment_method_id: payment_method_id,
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (amenityError) {
      console.error('Error booking amenity:', amenityError);
      return NextResponse.json(
        { error: 'Failed to book amenity' },
        { status: 500 }
      );
    }

    // Log the function call in the concierge_function_calls table
    await supabase
      .from('concierge_function_calls')
      .insert({
        user_id: user_id,
        function_name: 'BookAmenities',
        function_parameters: {
          amenity_type,
          flight_id,
          preferences,
          payment_method_id
        },
        function_result: { booking_id: amenityBooking.id },
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // Return the booking details
    return NextResponse.json({
      message: 'Amenity booked successfully',
      booking_id: amenityBooking.id,
      details: amenityBooking
    });
  } catch (error) {
    console.error('Error in book amenities API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 