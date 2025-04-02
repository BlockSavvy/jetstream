import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Execute SQL to create tables using RPC function
    const { error } = await supabase.rpc('create_concierge_tables');
    
    if (error) {
      console.error('Error calling create_concierge_tables RPC:', error);
      
      // If RPC fails, try creating tables individually
      try {
        await createTablesIndividually(supabase);
        
        return NextResponse.json({
          success: true,
          message: 'Concierge tables created successfully via individual creation'
        });
      } catch (individualError) {
        console.error('Error creating individual tables:', individualError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create tables'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Concierge tables created successfully'
    });
  } catch (error) {
    console.error('Error setting up concierge tables:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function to create tables individually
async function createTablesIndividually(supabase: any) {
  console.log('Attempting to create tables individually...');
  
  // Create concierge_conversations table
  await supabase.from('concierge_conversations').select('count').limit(1).catch(async () => {
    console.log('Creating concierge_conversations table...');
    const { error } = await supabase.rpc('create_concierge_conversations_table').catch((e: Error) => {
      console.error('Failed to call create_concierge_conversations_table RPC:', e);
      return { error: e };
    });
    
    if (error) {
      console.error('Error creating concierge_conversations table:', error);
      throw error;
    }
  });
  
  // Create concierge_scheduled_tasks table
  await supabase.from('concierge_scheduled_tasks').select('count').limit(1).catch(async () => {
    console.log('Creating concierge_scheduled_tasks table...');
    const { error } = await supabase.rpc('create_concierge_scheduled_tasks_table').catch((e: Error) => {
      console.error('Failed to call create_concierge_scheduled_tasks_table RPC:', e);
      return { error: e };
    });
    
    if (error) {
      console.error('Error creating concierge_scheduled_tasks table:', error);
      throw error;
    }
  });
  
  // Create concierge_amenity_bookings table
  await supabase.from('concierge_amenity_bookings').select('count').limit(1).catch(async () => {
    console.log('Creating concierge_amenity_bookings table...');
    const { error } = await supabase.rpc('create_concierge_amenity_bookings_table').catch((e: Error) => {
      console.error('Failed to call create_concierge_amenity_bookings_table RPC:', e);
      return { error: e };
    });
    
    if (error) {
      console.error('Error creating concierge_amenity_bookings table:', error);
      throw error;
    }
  });
  
  // Create concierge_transportation_bookings table
  await supabase.from('concierge_transportation_bookings').select('count').limit(1).catch(async () => {
    console.log('Creating concierge_transportation_bookings table...');
    const { error } = await supabase.rpc('create_concierge_transportation_bookings_table').catch((e: Error) => {
      console.error('Failed to call create_concierge_transportation_bookings_table RPC:', e);
      return { error: e };
    });
    
    if (error) {
      console.error('Error creating concierge_transportation_bookings table:', error);
      throw error;
    }
  });
  
  console.log('Individual table creation completed successfully');
} 