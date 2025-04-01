import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { pickup_location, dropoff_location, pickup_time, vehicle_type, payment_method_id, user_id } = await request.json();

    // Validate input
    if (!pickup_location || !dropoff_location || !pickup_time || !vehicle_type || !payment_method_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate pickup time
    const pickupDateTime = new Date(pickup_time);
    if (isNaN(pickupDateTime.getTime()) || pickupDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or past pickup time' },
        { status: 400 }
      );
    }

    // Validate vehicle type
    const validVehicleTypes = ['sedan', 'suv', 'luxury', 'van', 'limousine'];
    if (!validVehicleTypes.includes(vehicle_type)) {
      return NextResponse.json(
        { error: 'Invalid vehicle type' },
        { status: 400 }
      );
    }

    // Create a supabase client
    const supabase = createClient();

    // Validate that the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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

    // Insert the transportation booking
    const { data: transportBooking, error: transportError } = await supabase
      .from('transportation_bookings')
      .insert({
        user_id: user_id,
        pickup_location: pickup_location,
        dropoff_location: dropoff_location,
        pickup_time: pickupDateTime.toISOString(),
        vehicle_type: vehicle_type,
        payment_method_id: payment_method_id,
        status: 'confirmed',
        passenger_name: userData.full_name,
        passenger_email: userData.email,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transportError) {
      console.error('Error scheduling transportation:', transportError);
      return NextResponse.json(
        { error: 'Failed to schedule transportation' },
        { status: 500 }
      );
    }

    // Also create a scheduled task as a reminder
    const reminderTime = new Date(pickupDateTime);
    reminderTime.setHours(reminderTime.getHours() - 2); // 2 hours before pickup
    
    if (reminderTime > new Date()) {
      await supabase
        .from('concierge_scheduled_tasks')
        .insert({
          user_id: user_id,
          task_type: 'reminder',
          task_details: {
            message: `Reminder: Your transportation from ${pickup_location} to ${dropoff_location} is scheduled for ${pickupDateTime.toLocaleString()}`,
            transportation_id: transportBooking.id,
            notification_methods: ['in_app', 'email'],
            user_email: userData.email
          },
          scheduled_at: reminderTime.toISOString(),
          status: 'pending',
          created_at: new Date().toISOString()
        });
    }

    // Log the function call in the concierge_function_calls table
    await supabase
      .from('concierge_function_calls')
      .insert({
        user_id: user_id,
        function_name: 'ScheduleTransportation',
        function_parameters: {
          pickup_location,
          dropoff_location,
          pickup_time,
          vehicle_type,
          payment_method_id
        },
        function_result: { booking_id: transportBooking.id },
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // Return the booking details
    return NextResponse.json({
      message: 'Transportation scheduled successfully',
      booking_id: transportBooking.id,
      details: transportBooking,
      reminder_scheduled: reminderTime > new Date()
    });
  } catch (error) {
    console.error('Error in schedule transportation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 