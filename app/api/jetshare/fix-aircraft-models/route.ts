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
    image_url: '/images/placeholder-jet.jpg',
    description: 'Ultra-long-range business jet with exceptional comfort and performance.'
  },
  {
    manufacturer: 'Bombardier',
    model: 'Global 7500',
    display_name: 'Bombardier Global 7500',
    seat_capacity: 19,
    range_nm: 7700,
    cruise_speed_kts: 516,
    image_url: '/images/placeholder-jet.jpg',
    description: 'Ultra-long-range business jet with four living spaces.'
  },
  {
    manufacturer: 'Embraer',
    model: 'Phenom 300E',
    display_name: 'Embraer Phenom 300E',
    seat_capacity: 10,
    range_nm: 2010,
    cruise_speed_kts: 453,
    image_url: '/images/placeholder-jet.jpg',
    description: 'Light business jet with exceptional performance and comfort.'
  },
  {
    manufacturer: 'Cessna',
    model: 'Citation Longitude',
    display_name: 'Cessna Citation Longitude',
    seat_capacity: 12,
    range_nm: 3500,
    cruise_speed_kts: 476,
    image_url: '/images/placeholder-jet.jpg',
    description: 'Super mid-size business jet with long-range capabilities.'
  },
  {
    manufacturer: 'Dassault',
    model: 'Falcon 8X',
    display_name: 'Dassault Falcon 8X',
    seat_capacity: 16,
    range_nm: 6450,
    cruise_speed_kts: 460,
    image_url: '/images/placeholder-jet.jpg',
    description: 'Ultra-long-range business jet with exceptional fuel efficiency.'
  },
  {
    manufacturer: 'Other',
    model: 'Custom',
    display_name: 'Other (Custom Aircraft)',
    seat_capacity: 8,
    range_nm: null,
    cruise_speed_kts: null,
    image_url: '/images/placeholder-jet.jpg',
    description: 'Custom aircraft model not in the standard list.'
  }
];

export async function GET(request: NextRequest) {
  console.log('Fix aircraft models API called');
  
  try {
    // Create Supabase client
    console.log('Creating Supabase client...');
    const supabase = await createClient();
    console.log('Supabase client created successfully');
    
    // Check if the table exists
    console.log('Checking for existing aircraft_models table...');
    
    let tableExists = false;
    let tableError = null;
    
    try {
      // Try to query the table to see if it exists
      const { data, error } = await supabase
        .from('aircraft_models')
        .select('count(*)')
        .limit(1);
      
      if (!error) {
        tableExists = true;
        console.log('Table exists, checking for data...');
        
        // If the table exists, check if it has any data
        const { count, error: countError } = await supabase
          .from('aircraft_models')
          .select('*', { count: 'exact', head: true });
        
        if (!countError && count && count > 0) {
          console.log(`Table already has ${count} records.`);
          return NextResponse.json({
            success: true,
            message: `aircraft_models table already exists with ${count} records`,
            action: 'none_needed'
          });
        }
        
        // If the table exists but has no data, insert the basic models
        console.log('Table exists but has no data, inserting basic models...');
        const { data: insertData, error: insertError } = await supabase
          .from('aircraft_models')
          .insert(basicModels)
          .select();
        
        if (insertError) {
          console.error('Error inserting models:', insertError);
          return NextResponse.json({
            success: false,
            error: 'Failed to insert models',
            details: insertError.message
          }, { status: 500 });
        }
        
        console.log(`Successfully inserted ${insertData?.length} models`);
        return NextResponse.json({
          success: true,
          message: `Inserted ${insertData?.length} models into existing table`,
          action: 'insert_only'
        });
      } else {
        tableError = error;
        console.log('Table does not exist or cannot be accessed:', error.message);
      }
    } catch (error) {
      tableError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking aircraft_models table:', error);
    }
    
    // If the table doesn't exist, create it
    if (!tableExists) {
      console.log('Creating aircraft_models table...');
      
      try {
        // Try to create table with direct SQL
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS aircraft_models (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            manufacturer VARCHAR(100) NOT NULL,
            model VARCHAR(100) NOT NULL,
            display_name VARCHAR(255) NOT NULL,
            seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
            range_nm INTEGER,
            cruise_speed_kts INTEGER,
            image_url TEXT,
            thumbnail_url TEXT,
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
          
          -- Grant permissions
          ALTER TABLE aircraft_models ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Allow anon SELECT access" ON aircraft_models FOR SELECT USING (true);
          CREATE POLICY "Allow authenticated full access" ON aircraft_models USING (auth.role() = 'authenticated');
          GRANT SELECT ON aircraft_models TO anon, authenticated;
          GRANT ALL ON aircraft_models TO authenticated;
        `;
        
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql: createTableSQL
        });
        
        if (sqlError) {
          console.error('Error creating table with SQL:', sqlError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create table',
            details: sqlError.message
          }, { status: 500 });
        }
        
        console.log('Table created successfully');
        
        // Insert the basic models
        console.log('Inserting basic models...');
        const { data: insertData, error: insertError } = await supabase
          .from('aircraft_models')
          .insert(basicModels)
          .select();
        
        if (insertError) {
          console.error('Error inserting models after creating table:', insertError);
          return NextResponse.json({
            success: false,
            error: 'Failed to insert models after creating table',
            details: insertError.message
          }, { status: 500 });
        }
        
        console.log(`Successfully created table and inserted ${insertData?.length} models`);
        return NextResponse.json({
          success: true,
          message: `Created aircraft_models table and inserted ${insertData?.length} models`,
          action: 'create_and_insert'
        });
      } catch (error) {
        console.error('Error creating table and inserting models:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to create table and insert models',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // If we get here, something unexpected happened
    return NextResponse.json({
      success: false,
      error: 'Unexpected flow in fix-aircraft-models API',
      details: 'This code path should not be reached'
    }, { status: 500 });
    
  } catch (error) {
    console.error('Error in fix-aircraft-models API:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 