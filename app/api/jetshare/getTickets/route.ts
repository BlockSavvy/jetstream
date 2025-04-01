import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('[API] getTickets: Starting ticket lookup');
    
    // Parse request parameters
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offer_id');
    const userId = searchParams.get('user_id');
    
    if (!offerId && !userId) {
      return NextResponse.json({
        success: false,
        message: 'Either offer_id or user_id parameter is required'
      }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    let query = supabase
      .from('jetshare_tickets')
      .select(`
        *,
        offer:offer_id (
          *,
          user:user_id (*),
          matched_user:matched_user_id (*)
        )
      `);
    
    // Apply filters
    if (offerId) {
      query = query.eq('offer_id', offerId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Execute the query
    const { data: tickets, error } = await query;
    
    if (error) {
      console.error('[API] getTickets: Error fetching tickets:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch tickets',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      tickets: tickets || []
    });
    
  } catch (error) {
    console.error('[API] getTickets: Unhandled error:', error);
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 