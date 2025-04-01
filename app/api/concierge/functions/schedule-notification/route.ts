import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { notification_time, message_content, user_id } = await request.json();

    // Validate input
    if (!notification_time || !message_content || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate the notification time
    const scheduledTime = new Date(notification_time);
    if (isNaN(scheduledTime.getTime()) || scheduledTime < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or past notification time' },
        { status: 400 }
      );
    }

    // Create a supabase client
    const supabase = createClient();

    // Validate that the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create a scheduled task for the notification
    const { data: task, error: taskError } = await supabase
      .from('concierge_scheduled_tasks')
      .insert({
        user_id: user_id,
        task_type: 'reminder',
        task_details: {
          message: message_content,
          notification_methods: ['in_app', 'email'],
          user_email: userData.email
        },
        scheduled_at: scheduledTime.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error scheduling notification:', taskError);
      return NextResponse.json(
        { error: 'Failed to schedule notification' },
        { status: 500 }
      );
    }

    // Log the function call in the concierge_function_calls table
    await supabase
      .from('concierge_function_calls')
      .insert({
        user_id: user_id,
        function_name: 'ScheduleNotification',
        function_parameters: {
          notification_time,
          message_content
        },
        function_result: { task_id: task.id },
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    // Return the created task
    return NextResponse.json({
      message: 'Notification scheduled successfully',
      task_id: task.id,
      scheduled_at: scheduledTime.toISOString()
    });
  } catch (error) {
    console.error('Error in schedule notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 