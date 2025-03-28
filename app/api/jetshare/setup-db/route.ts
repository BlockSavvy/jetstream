import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

/**
 * API route to set up or check the JetShare database
 * This endpoint is primarily for development use
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Ensure the user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Read the SQL script
    const sqlFilePath = path.join(process.cwd(), 'app/jetshare/utils/jetshare_migration.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the script
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Error running migration script:', error);
      return NextResponse.json({ 
        error: 'Failed to run migration script', 
        message: error.message,
        details: error.details
      }, { status: 500 });
    }
    
    // Check if the tables exist now
    const { count: offersCount, error: countError } = await supabase
      .from('jetshare_offers')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking tables after migration:', countError);
      return NextResponse.json({ 
        error: 'Tables may not exist after migration', 
        message: countError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'JetShare database setup completed successfully',
      tables: {
        offers: {
          exists: true,
          count: offersCount
        }
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error setting up JetShare database:', error);
    return NextResponse.json(
      { error: 'Failed to set up database', message: (error as Error).message },
      { status: 500 }
    );
  }
} 