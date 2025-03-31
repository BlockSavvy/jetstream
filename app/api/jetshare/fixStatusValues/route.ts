import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Create supabase client
    const supabase = await createClient();
    
    console.log('Starting status value fix process');
    
    // Update all offers to have status 'open' to avoid constraint issues
    const { data, error } = await supabase
      .from('jetshare_offers')
      .update({ status: 'open' })
      .neq('status', 'open')
      .select('id, status');
    
    if (error) {
      console.error('Error updating status values:', error);
      return NextResponse.json(
        { error: 'Failed to update status values', details: error.message },
        { status: 500 }
      );
    }
    
    const updated = data?.length || 0;
    console.log(`Updated ${updated} offers to 'open' status`);
    
    // Get current status values to verify
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
    
    // Check if we have any non-open statuses left
    const nonOpenStatuses = statusValues?.filter(o => o.status !== 'open') || [];
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updated} offers to 'open' status`,
      instructions: 'For a complete fix, run the migration script from the command line',
      data: {
        status_values: statusValues,
        non_open_statuses: nonOpenStatuses,
        all_open: nonOpenStatuses.length === 0
      }
    });
  } catch (error) {
    console.error('Error fixing status values:', error);
    return NextResponse.json(
      { error: 'Fix operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 