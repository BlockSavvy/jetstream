import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { userId, taskType, taskDetails, scheduledTime } = await request.json();

    // Validate input
    if (!userId || !taskType || !taskDetails || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate task type
    const validTaskTypes = ['offer_notification', 'reminder', 'schedule'];
    if (!validTaskTypes.includes(taskType)) {
      return NextResponse.json(
        { error: 'Invalid task type' },
        { status: 400 }
      );
    }

    // Parse the scheduled time
    let scheduledAt: Date;
    try {
      scheduledAt = new Date(scheduledTime);
      if (isNaN(scheduledAt.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid schedule time format' },
        { status: 400 }
      );
    }

    // Create the task in the database
    const supabase = createClient();
    const { data, error } = await supabase
      .from('concierge_scheduled_tasks')
      .insert({
        user_id: userId,
        task_type: taskType,
        task_details: taskDetails,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating scheduled task:', error);
      return NextResponse.json(
        { error: 'Error creating task' },
        { status: 500 }
      );
    }

    // Return the task ID
    return NextResponse.json({ 
      message: 'Task scheduled successfully',
      taskId: data.id,
      scheduledAt: scheduledAt.toISOString()
    });
  } catch (error) {
    console.error('Error in schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the query parameters
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Get pending tasks for the user
    const supabase = createClient();
    const { data, error } = await supabase
      .from('concierge_scheduled_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Error fetching tasks' },
        { status: 500 }
      );
    }

    // Return the tasks
    return NextResponse.json({ tasks: data });
  } catch (error) {
    console.error('Error in schedule API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight request
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 