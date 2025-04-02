import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const {
      notification_time,
      message_content,
      user_id,
    } = await request.json();

    // Validate required parameters
    if (!notification_time || !message_content || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters for scheduling notification'
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

    // Parse the notification time - this is a simplistic approach
    // A more complex implementation would use a library like chrono-node
    let scheduledTime: Date;
    
    try {
      // Try to parse as ISO date first
      scheduledTime = new Date(notification_time);
      
      // Check if the date is valid
      if (isNaN(scheduledTime.getTime())) {
        // If not a valid ISO date, try some common formats
        if (notification_time.toLowerCase().includes('tomorrow')) {
          scheduledTime = new Date();
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          scheduledTime.setHours(9, 0, 0, 0); // Default to 9 AM
        } else if (notification_time.toLowerCase().includes('next week')) {
          scheduledTime = new Date();
          scheduledTime.setDate(scheduledTime.getDate() + 7);
          scheduledTime.setHours(9, 0, 0, 0); // Default to 9 AM
        } else if (notification_time.toLowerCase().includes('hour')) {
          const match = notification_time.match(/(\d+)\s*hour/i);
          const hours = match && match[1] ? parseInt(match[1], 10) : 1;
          scheduledTime = new Date();
          scheduledTime.setHours(scheduledTime.getHours() + hours);
        } else if (notification_time.toLowerCase().includes('minute')) {
          const match = notification_time.match(/(\d+)\s*minute/i);
          const minutes = match && match[1] ? parseInt(match[1], 10) : 15;
          scheduledTime = new Date();
          scheduledTime.setMinutes(scheduledTime.getMinutes() + minutes);
        } else {
          // Default to tomorrow at 9 AM if we can't parse
          scheduledTime = new Date();
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          scheduledTime.setHours(9, 0, 0, 0);
        }
      }
    } catch (e) {
      // Default to tomorrow at 9 AM if parsing fails
      scheduledTime = new Date();
      scheduledTime.setDate(scheduledTime.getDate() + 1);
      scheduledTime.setHours(9, 0, 0, 0);
    }
    
    // Create the notification record
    const { data, error } = await supabase
      .from('concierge_scheduled_tasks')
      .insert({
        user_id,
        task_type: 'reminder',
        task_details: {
          message: message_content,
          original_request: notification_time
        },
        scheduled_at: scheduledTime.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error scheduling notification:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to schedule notification'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Format the scheduled time for display
    const formattedTime = scheduledTime.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });

    // Return success response with the notification ID
    return new Response(
      JSON.stringify({
        success: true,
        notification_id: data.id,
        scheduled_time: scheduledTime.toISOString(),
        formatted_time: formattedTime,
        message: `Successfully scheduled notification for ${formattedTime}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-notification API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 