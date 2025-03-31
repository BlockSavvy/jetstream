import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Define the basic models to be inserted
const basicModels = [
  {
    manufacturer: 'Gulfstream',
    model: 'G650',
    display_name: 'Gulfstream G650',
    seat_capacity: 19,
    range_nm: 7000,
    cruise_speed_kts: 516,
    image_url: '/images/jets/gulfstream/g650.jpg',
    description: 'Ultra-long-range business jet with exceptional comfort and performance.'
  },
  {
    manufacturer: 'Bombardier',
    model: 'Global 7500',
    display_name: 'Bombardier Global 7500',
    seat_capacity: 19,
    range_nm: 7700,
    cruise_speed_kts: 516,
    image_url: '/images/jets/bombardier/global-7500.jpg',
    description: 'Ultra-long-range business jet with four living spaces.'
  },
  {
    manufacturer: 'Embraer',
    model: 'Phenom 300E',
    display_name: 'Embraer Phenom 300E',
    seat_capacity: 10,
    range_nm: 2010,
    cruise_speed_kts: 453,
    image_url: '/images/jets/embraer/phenom-300e.jpg',
    description: 'Light business jet with exceptional performance and comfort.'
  },
  {
    manufacturer: 'Cessna',
    model: 'Citation Longitude',
    display_name: 'Cessna Citation Longitude',
    seat_capacity: 12,
    range_nm: 3500,
    cruise_speed_kts: 476,
    image_url: '/images/jets/cessna/citation-longitude.jpg',
    description: 'Super mid-size business jet with long-range capabilities.'
  },
  {
    manufacturer: 'Other',
    model: 'Custom',
    display_name: 'Other (Custom Aircraft)',
    seat_capacity: 8,
    description: 'Custom aircraft model not in the standard list.'
  }
];

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if the aircraft_models table already exists and has data
    const { data: existingData, error: checkError } = await supabase
      .from('aircraft_models')
      .select('count')
      .limit(1);
      
    if (!checkError && existingData && existingData.length > 0) {
      // Table exists and has data, no need to create it
      return NextResponse.json({ 
        success: true, 
        message: 'Aircraft models table already exists and has data',
        action: 'none'
      });
    }
    
    // Try to insert the models directly
    try {
      // Attempt to insert the models
      const { error: insertError } = await supabase
        .from('aircraft_models')
        .insert(basicModels);
        
      if (insertError) {
        console.error('Error inserting models:', insertError.message);
        
        // If this failed, we should try to create the table first
        try {
          console.log('Attempting to create aircraft_models table...');
          
          // First check if we can execute the SQL directly through the Supabase API
          const { error: sqlCheckError } = await supabase.rpc('execute_sql', { 
            sql: 'SELECT 1' 
          });
          
          if (sqlCheckError) {
            console.log('SQL execution not supported via RPC, trying direct SQL...');
            
            // If RPC is not available, we'll try a different approach
            // Create the table with direct SQL approach - may require additional permissions
            let tableCreateError = null;
            try {
              const { error } = await supabase
                .from('aircraft_models')
                .select('*')
                .limit(1);
              tableCreateError = error;
            } catch (error) {
              console.log('Table does not exist, trying to create it directly');
              
              // Log a more detailed message about what we're trying to do
              console.log('Creating a new aircraft_models table with these fields: id, manufacturer, model, display_name, seat_capacity, etc.');
              
              // We need to use our migration approach
              // This will run in the Supabase dashboard SQL editor
              tableCreateError = new Error('Table does not exist and RPC not available - please run the SQL migration manually');
            }
            
            if (tableCreateError) {
              console.error('Error checking/creating table:', tableCreateError);
              return NextResponse.json({
                success: false,
                error: 'Could not create table automatically',
                message: 'Please run the SQL migration file manually in the Supabase dashboard SQL editor',
                details: 'The migration file is located at: supabase/migrations/create_aircraft_models_safe.sql'
              }, { status: 500 });
            }
          } else {
            console.log('Executing CREATE TABLE via RPC...');
            
            // Try to create the table with the SQL command
            const createTableSQL = `
              CREATE TABLE IF NOT EXISTS public.aircraft_models (
                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                manufacturer VARCHAR(100) NOT NULL,
                model VARCHAR(100) NOT NULL,
                display_name VARCHAR(255) NOT NULL,
                seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
                range_nm INTEGER,
                cruise_speed_kts INTEGER,
                image_url TEXT,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
              
              ALTER TABLE public.aircraft_models ENABLE ROW LEVEL SECURITY;
              GRANT SELECT ON public.aircraft_models TO authenticated;
            `;
            
            const { error: createError } = await supabase.rpc('execute_sql', {
              sql: createTableSQL
            });
            
            if (createError) {
              console.error('Error executing CREATE TABLE SQL:', createError);
              return NextResponse.json({
                success: false,
                error: 'Failed to create table via SQL',
                message: createError.message
              }, { status: 500 });
            }
            
            console.log('Table created successfully via RPC');
          }
          
          // Now try to insert the models again
          const { error: insertError2 } = await supabase
            .from('aircraft_models')
            .insert(basicModels);
            
          if (insertError2) {
            console.error('Error inserting models after table creation:', insertError2);
            return NextResponse.json({ 
              success: false, 
              error: 'Failed to insert aircraft models after table creation',
              details: insertError2.message 
            }, { status: 500 });
          }
          
          return NextResponse.json({ 
            success: true, 
            message: 'Aircraft models table created and data inserted successfully',
            action: 'create_table_and_insert'
          });
        } catch (createError) {
          console.error('Error creating table:', createError);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create aircraft_models table',
            details: (createError as Error).message 
          }, { status: 500 });
        }
      }
      
      // If we get here, the insert was successful
      return NextResponse.json({ 
        success: true, 
        message: 'Aircraft models inserted successfully',
        action: 'insert'
      });
    } catch (error) {
      console.error('Error in aircraft models setup:', error);
      return NextResponse.json(
        { error: 'Server error', message: (error as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in createAircraftModels API:', error);
    return NextResponse.json(
      { error: 'Server error', message: (error as Error).message },
      { status: 500 }
    );
  }
} 