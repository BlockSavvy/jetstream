import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  console.log('Diagnostic API called');
  
  try {
    // Step 1: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    console.log('Environment variables check:', envCheck);
    
    // Step 2: Create Supabase client
    console.log('Creating Supabase client...');
    const supabase = await createClient();
    console.log('Supabase client created successfully');
    
    // Step 3: Check if user is authenticated
    console.log('Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const authCheck = {
      isAuthenticated: !!user,
      userEmail: user?.email || null,
      userId: user?.id || null,
      authError: authError ? authError.message : null,
    };
    console.log('Authentication check:', authCheck);
    
    // Step 4: Check if tables exist
    console.log('Checking database tables...');
    
    // First check if aircraft_models table exists
    let aircraftModelsExist = false;
    let aircraftModelsError = null;
    let aircraftModelsCount = 0;
    
    try {
      const { data, error, count } = await supabase
        .from('aircraft_models')
        .select('*', { count: 'exact' })
        .limit(1);
      
      aircraftModelsExist = !error && !!data;
      aircraftModelsError = error ? error.message : null;
      aircraftModelsCount = count || 0;
      
      console.log('Aircraft models table check:', { 
        exists: aircraftModelsExist,
        count: aircraftModelsCount,
        error: aircraftModelsError
      });
    } catch (error) {
      aircraftModelsError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking aircraft_models table:', error);
    }
    
    // Also check jetshare_offers table as comparison
    let jetshareOffersExist = false;
    let jetshareOffersError = null;
    let jetshareOffersCount = 0;
    
    try {
      const { data, error, count } = await supabase
        .from('jetshare_offers')
        .select('*', { count: 'exact' })
        .limit(1);
      
      jetshareOffersExist = !error && !!data;
      jetshareOffersError = error ? error.message : null;
      jetshareOffersCount = count || 0;
      
      console.log('Jetshare offers table check:', { 
        exists: jetshareOffersExist,
        count: jetshareOffersCount,
        error: jetshareOffersError
      });
    } catch (error) {
      jetshareOffersError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking jetshare_offers table:', error);
    }
    
    // Step 5: Try to list all tables in the schema
    let tables = [];
    let tablesError = null;
    
    try {
      // This query may require more permissions than available to the anon key
      const { data, error } = await supabase.rpc('list_tables');
      
      if (!error && data) {
        tables = data;
      } else {
        tablesError = error ? error.message : 'No data returned';
      }
      
      console.log('Tables in schema:', { count: tables.length, error: tablesError });
    } catch (error) {
      tablesError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error listing tables:', error);
    }
    
    // Step 6: Try to create a records in a test table 
    // (this step might not be necessary if earlier steps identify the issue)
    
    // Return all diagnostic information
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      authentication: authCheck,
      database: {
        aircraftModels: {
          exists: aircraftModelsExist,
          count: aircraftModelsCount,
          error: aircraftModelsError
        },
        jetshareOffers: {
          exists: jetshareOffersExist,
          count: jetshareOffersCount,
          error: jetshareOffersError
        },
        tables: {
          list: tables,
          error: tablesError
        }
      }
    });
    
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 