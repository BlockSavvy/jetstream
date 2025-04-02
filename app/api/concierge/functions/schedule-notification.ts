import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Helper to parse natural language notification times
function parseNotificationTime(timeStr: string): string {
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
    
    // Default to one day from now if we can't parse
    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    return oneDayFromNow.toISOString();
  } catch (error) {
    console.error('Error parsing notification time:', error);
    // Default to one hour from now
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
    return oneHourFromNow.toISOString();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      notification_time,
      message_content,
      user_id
    } = await req.json();
    
    // Validate required fields
    if (!message_content || !user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Parse notification time
    const parsedTime = parseNotificationTime(notification_time);
    
    // Store notification in the database
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('concierge_scheduled_tasks')
      .insert({
        user_id,
        task_type: 'notification',
        scheduled_at: parsedTime,
        task_details: {
          message: message_content,
          notification_type: 'in_app'
        },
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error scheduling notification:', error);
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        // Try to create the table
        await supabase.rpc('create_concierge_tables');
        
        // Try the insert again
        const retryResult = await supabase
          .from('concierge_scheduled_tasks')
          .insert({
            user_id,
            task_type: 'notification',
            scheduled_at: parsedTime,
            task_details: {
              message: message_content,
              notification_type: 'in_app'
            },
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (retryResult.error) {
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to schedule notification' 
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: `Notification scheduled for ${new Date(parsedTime).toLocaleString()}`,
          notification: {
            id: retryResult.data.id,
            scheduled_at: parsedTime,
            formatted_time: new Date(parsedTime).toLocaleString(),
            message: message_content
          }
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to schedule notification' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Notification scheduled for ${new Date(parsedTime).toLocaleString()}`,
      notification: {
        id: data.id,
        scheduled_at: parsedTime,
        formatted_time: new Date(parsedTime).toLocaleString(),
        message: message_content
      }
    });
  } catch (error) {
    console.error('Error processing notification scheduling:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process notification scheduling request' 
    }, { status: 500 });
  }
} 