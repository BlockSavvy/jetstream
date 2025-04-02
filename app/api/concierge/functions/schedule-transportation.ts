import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Helper to parse natural language pickup times
function parsePickupTime(timeStr: string): string {
  try {
    if (!timeStr) return new Date().toISOString();
    
    // Check if already in ISO format
    if (timeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return timeStr;
    }
    
    const now = new Date();
    
    // Handle common phrases
    if (timeStr.toLowerCase().includes('in 1 hour') || 
        timeStr.toLowerCase().includes('in one hour') ||
        timeStr.toLowerCase().includes('in an hour')) {
      const inOneHour = new Date();
      inOneHour.setHours(inOneHour.getHours() + 1);
      return inOneHour.toISOString();
    }
    
    if (timeStr.toLowerCase().includes('in 2 hours') || 
        timeStr.toLowerCase().includes('in two hours')) {
      const inTwoHours = new Date();
      inTwoHours.setHours(inTwoHours.getHours() + 2);
      return inTwoHours.toISOString();
    }
    
    if (timeStr.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM
      return tomorrow.toISOString();
    }
    
    if (timeStr.toLowerCase().includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0); // 9 AM
      return nextWeek.toISOString();
    }
    
    if (timeStr.toLowerCase().includes('this evening') || 
        timeStr.toLowerCase().includes('tonight')) {
      const tonight = new Date();
      tonight.setHours(19, 0, 0, 0); // 7 PM
      return tonight.toISOString();
    }
    
    // Try to parse using Date constructor
    const parsedDate = new Date(timeStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
    
    // Default to one hour from now if we can't parse
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    return oneHourFromNow.toISOString();
  } catch (error) {
    console.error('Error parsing pickup time:', error);
    // Default to one hour from now
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    return oneHourFromNow.toISOString();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { 
      pickup_location,
      dropoff_location,
      pickup_time,
      vehicle_type = 'sedan',
      user_id
    } = await req.json();
    
    // Validate required fields
    if (!pickup_location || !dropoff_location || !user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Parse pickup time
    const parsedPickupTime = parsePickupTime(pickup_time);
    
    // Validate vehicle type
    const validVehicleTypes = ['sedan', 'suv', 'limo', 'van', 'executive'];
    let validatedVehicleType = vehicle_type.toLowerCase();
    
    if (!validVehicleTypes.includes(validatedVehicleType)) {
      // Try to map to a valid vehicle type
      if (validatedVehicleType.includes('limo')) {
        validatedVehicleType = 'limo';
      } else if (validatedVehicleType.includes('suv') || validatedVehicleType.includes('luxury')) {
        validatedVehicleType = 'suv';
      } else if (validatedVehicleType.includes('van')) {
        validatedVehicleType = 'van';
      } else if (validatedVehicleType.includes('exec')) {
        validatedVehicleType = 'executive';
      } else {
        validatedVehicleType = 'sedan'; // Default
      }
    }
    
    // Store transportation request in the database
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('concierge_transportation_bookings')
      .insert({
        user_id,
        pickup_location,
        dropoff_location,
        pickup_time: parsedPickupTime,
        vehicle_type: validatedVehicleType,
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
          .from('concierge_transportation_bookings')
          .insert({
            user_id,
            pickup_location,
            dropoff_location,
            pickup_time: parsedPickupTime,
            vehicle_type: validatedVehicleType,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (retryResult.error) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to schedule transportation' 
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: `Transportation scheduled from ${pickup_location} to ${dropoff_location}`,
          booking: {
            id: retryResult.data.id,
            pickup_location,
            dropoff_location,
            pickup_time: parsedPickupTime,
            formatted_time: new Date(parsedPickupTime).toLocaleString(),
            vehicle_type: validatedVehicleType
          }
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to schedule transportation' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Transportation scheduled from ${pickup_location} to ${dropoff_location}`,
      booking: {
        id: data.id,
        pickup_location,
        dropoff_location,
        pickup_time: parsedPickupTime,
        formatted_time: new Date(parsedPickupTime).toLocaleString(),
        vehicle_type: validatedVehicleType
      }
    });
  } catch (error) {
    console.error('Error scheduling transportation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process transportation scheduling request' 
    }, { status: 500 });
  }
} 