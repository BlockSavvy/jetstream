import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { 
      amenity_type,
      flight_id,
      preferences,
      user_id
    } = await req.json();
    
    // Validate required fields
    if (!amenity_type || !flight_id || !user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Validate the flight exists and belongs to the user or the user has access
    const supabase = createClient();
    
    const { data: flightData, error: flightError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', flight_id)
      .single();
    
    if (flightError || !flightData) {
      return NextResponse.json({
        success: false,
        error: 'Flight not found or access denied'
      }, { status: 404 });
    }
    
    // Validate user has permission for this flight
    // Either they own it or they've booked a seat on it
    if (flightData.user_id !== user_id) {
      // Check if user has booked a seat on this flight
      const { data: bookingData, error: bookingError } = await supabase
        .from('jetshare_bookings')
        .select('*')
        .eq('offer_id', flight_id)
        .eq('passenger_id', user_id)
        .single();
      
      if (bookingError || !bookingData) {
        return NextResponse.json({
          success: false,
          error: 'You do not have permission to book amenities for this flight'
        }, { status: 403 });
      }
    }
    
    // Process and validate amenity type
    const validAmenityTypes = ['catering', 'entertainment', 'ground_transport', 'special_request'];
    let validatedAmenityType = amenity_type.toLowerCase();
    
    if (!validAmenityTypes.includes(validatedAmenityType)) {
      // Try to map to a valid amenity type
      if (validatedAmenityType.includes('cater') || validatedAmenityType.includes('food')) {
        validatedAmenityType = 'catering';
      } else if (validatedAmenityType.includes('entertain') || validatedAmenityType.includes('movie')) {
        validatedAmenityType = 'entertainment';
      } else if (validatedAmenityType.includes('transport') || validatedAmenityType.includes('car')) {
        validatedAmenityType = 'ground_transport';
      } else {
        validatedAmenityType = 'special_request';
      }
    }
    
    // Create the amenity booking
    const { data, error } = await supabase
      .from('concierge_amenity_bookings')
      .insert({
        user_id,
        flight_id,
        amenity_type: validatedAmenityType,
        preferences: preferences || '',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        // Try to create the table via RPC
        await supabase.rpc('create_concierge_tables');
        
        // Retry the insert
        const retryResult = await supabase
          .from('concierge_amenity_bookings')
          .insert({
            user_id,
            flight_id,
            amenity_type: validatedAmenityType,
            preferences: preferences || '',
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (retryResult.error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to book amenity'
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: `Successfully booked ${validatedAmenityType} for your flight`,
          amenity_booking: {
            id: retryResult.data.id,
            amenity_type: validatedAmenityType,
            preferences: preferences || '',
            status: 'pending'
          }
        });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to book amenity'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully booked ${validatedAmenityType} for your flight`,
      amenity_booking: {
        id: data.id,
        amenity_type: validatedAmenityType,
        preferences: preferences || '',
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error booking amenity:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process amenity booking request'
    }, { status: 500 });
  }
} 