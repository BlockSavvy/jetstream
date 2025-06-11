import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get real dashboard statistics from the database
    const [
      activeListingsResult,
      totalBookingsResult,
      totalEarnedResult,
      flightHoursResult
    ] = await Promise.all([
      // Count active listings for the user
      supabase
        .from('jetshare_offers')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active'),

      // Count total bookings where user is either owner or passenger
      supabase
        .from('jetshare_bookings')
        .select('id', { count: 'exact' })
        .or(`user_id.eq.${userId},jetshare_offer.user_id.eq.${userId}`),

      // Sum total earnings from completed transactions
      supabase
        .from('jetshare_transactions')
        .select('amount_usd')
        .eq('user_id', userId)
        .eq('status', 'completed'),

      // Calculate flight hours (this would be more complex in reality)
      supabase
        .from('jetshare_bookings')
        .select('jetshare_offer(estimated_duration_hours)')
        .eq('user_id', userId)
        .eq('status', 'completed')
    ]);

    // Calculate totals
    const activeListings = activeListingsResult.count || 0;
    const totalBookings = totalBookingsResult.count || 0;
    
    const totalEarned = totalEarnedResult.data?.reduce((sum, transaction) => {
      return sum + (transaction.amount_usd || 0);
    }, 0) || 0;

    const flightHours = flightHoursResult.data?.reduce((sum, booking: any) => {
      return sum + (booking.jetshare_offer?.estimated_duration_hours || 0);
    }, 0) || 0;

    console.log(`[GDY·UP Dashboard API] Stats for user ${userId}:`, {
      activeListings,
      totalBookings,
      totalEarned,
      flightHours
    });

    return NextResponse.json({
      activeListings,
      totalBookings,
      totalEarned,
      flightHours,
      success: true
    });

  } catch (error) {
    console.error('[GDY·UP Dashboard API] Error:', error);
    
    // Return default values if there's an error
    return NextResponse.json({
      activeListings: 0,
      totalBookings: 0,
      totalEarned: 0,
      flightHours: 0,
      success: false,
      error: 'Failed to load dashboard data'
    });
  }
} 