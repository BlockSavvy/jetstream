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
    
    // Check all status values in the database
    console.log('Checking status values in jetshare_offers');
    const { data: statusValues, error: statusError } = await supabase
      .from('jetshare_offers')
      .select('id, status');
    
    if (statusError) {
      console.error('Error checking status values:', statusError);
      return NextResponse.json({ error: 'Failed to check status values' }, { status: 500 });
    }
    
    // Get distinct status values
    const distinctValues = Array.from(new Set(statusValues?.map(o => o.status)));
    console.log('Distinct status values:', distinctValues);
    
    // Get counts by status
    const countsByStatus: Record<string, number> = {};
    statusValues?.forEach(offer => {
      const status = offer.status;
      countsByStatus[status] = (countsByStatus[status] || 0) + 1;
    });
    console.log('Counts by status:', countsByStatus);
    
    return NextResponse.json({
      success: true,
      data: {
        status_values: statusValues,
        distinct_status_values: distinctValues,
        counts_by_status: countsByStatus
      }
    });
  } catch (error) {
    console.error('Error inspecting status:', error);
    return NextResponse.json({ error: 'Inspection failed' }, { status: 500 });
  }
} 