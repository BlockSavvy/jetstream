import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSBClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify this is only run in development mode for safety
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
    }
    
    // Read the SQL script
    const sqlFilePath = path.join(process.cwd(), 'fix-offers-status.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Running SQL script to fix status issues:');
    
    // Create the Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }
    
    // Direct access with service role
    const supabase = createSBClient(supabaseUrl, supabaseServiceKey);
    
    // Execute the SQL script
    const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('Error executing SQL script:', error);
      
      // Try another approach - split by semicolons and run each statement
      console.log('Attempting to run statements individually...');
      
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      const results = [];
      
      for (const stmt of statements) {
        try {
          // For each statement, use PostgreSQL REST direct call
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });
          
          if (stmtError) {
            results.push({ 
              statement: stmt.substring(0, 100) + '...', 
              success: false, 
              error: stmtError.message 
            });
          } else {
            results.push({ 
              statement: stmt.substring(0, 100) + '...', 
              success: true 
            });
          }
        } catch (e) {
          results.push({ 
            statement: stmt.substring(0, 100) + '...', 
            success: false, 
            error: e instanceof Error ? e.message : String(e)
          });
        }
      }
      
      return NextResponse.json({ 
        message: 'SQL execution completed with some errors', 
        results 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'SQL script executed successfully' 
    });
    
  } catch (error) {
    console.error('Error in runSql API:', error);
    return NextResponse.json({ 
      error: 'Failed to execute SQL script', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 