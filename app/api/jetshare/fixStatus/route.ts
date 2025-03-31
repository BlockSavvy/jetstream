import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is not available in production' }, { status: 403 });
  }
  
  try {
    // Create supabase client
    const supabase = await createClient();
    
    console.log('Starting status type fix process');
    
    // First, remove the check constraint
    console.log('Step 1: Removing existing check constraint');
    const removeConstraintSql = `
      ALTER TABLE jetshare_offers 
      DROP CONSTRAINT IF EXISTS jetshare_offers_status_check;
    `;
    
    const { error: removeConstraintError } = await supabase.rpc('run_sql', { 
      sql: removeConstraintSql 
    });
    
    if (removeConstraintError) {
      console.error('Error removing constraint:', removeConstraintError);
      return NextResponse.json(
        { error: 'Failed to remove constraint', details: removeConstraintError.message },
        { status: 500 }
      );
    }
    
    // Update existing values to ensure they are all valid
    console.log('Step 2: Standardizing existing status values');
    const standardizeSql = `
      UPDATE jetshare_offers 
      SET status = 'open' 
      WHERE status NOT IN ('open', 'accepted', 'completed');
    `;
    
    const { error: standardizeError } = await supabase.rpc('run_sql', { 
      sql: standardizeSql 
    });
    
    if (standardizeError) {
      console.error('Error standardizing status values:', standardizeError);
      return NextResponse.json(
        { error: 'Failed to standardize status values', details: standardizeError.message },
        { status: 500 }
      );
    }
    
    // Add the constraint back with proper syntax
    console.log('Step 3: Re-adding check constraint with proper syntax');
    const addConstraintSql = `
      ALTER TABLE jetshare_offers 
      ADD CONSTRAINT jetshare_offers_status_check 
      CHECK (status IN ('open', 'accepted', 'completed'));
    `;
    
    const { error: addConstraintError } = await supabase.rpc('run_sql', { 
      sql: addConstraintSql 
    });
    
    if (addConstraintError) {
      console.error('Error adding constraint:', addConstraintError);
      return NextResponse.json(
        { error: 'Failed to add constraint', details: addConstraintError.message },
        { status: 500 }
      );
    }
    
    // Verify changes
    console.log('Step 4: Verifying changes');
    const { data: statusValues, error: statusError } = await supabase
      .from('jetshare_offers')
      .select('id, status');
    
    if (statusError) {
      console.error('Error checking status values:', statusError);
      return NextResponse.json(
        { error: 'Failed to verify changes', details: statusError.message },
        { status: 500 }
      );
    }
    
    console.log('Status fix completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Status type and constraint fixed successfully',
      data: {
        status_values: statusValues,
        distinct_values: Array.from(new Set(statusValues?.map(o => o.status)))
      }
    });
  } catch (error) {
    console.error('Error fixing status:', error);
    return NextResponse.json(
      { error: 'Fix operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 