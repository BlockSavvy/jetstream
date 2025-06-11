import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { JetShareOffer } from '@/types/jetshare';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check for a simple API key for basic security
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
    const expectedKey = process.env.INTERNAL_API_KEY || 'gdyup-internal-api';
    
    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Get the Supabase client
    const supabase = await createClient();
    
    // Get the current timestamp
    const now = new Date().toISOString();
    
    // Find all accepted_but_unpaid offers that have expired
    const { data: expiredOffers, error: findError } = await supabase
      .from('jetshare_offers')
      .select('id, status, expires_at')
      .eq('status', 'accepted_but_unpaid')
      .lt('expires_at', now);
      
    if (findError) {
      console.error('Error finding expired offers:', findError);
      return NextResponse.json(
        { error: 'Failed to find expired offers' }, 
        { status: 500 }
      );
    }
    
    console.log(`Found ${expiredOffers?.length || 0} expired offers`);
    
    if (!expiredOffers || expiredOffers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired offers found',
        count: 0
      });
    }
    
    // Update all expired offers to be available again
    const expiredIds = expiredOffers.map((offer: { id: string }) => offer.id);
    const { error: updateError } = await supabase
      .from('jetshare_offers')
      .update({
        status: 'available',
        payment_status: 'expired',
        matched_user_id: null,
        updated_at: now,
      })
      .in('id', expiredIds);
      
    if (updateError) {
      console.error('Error updating expired offers:', updateError);
      return NextResponse.json(
        { error: 'Failed to update expired offers' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${expiredOffers.length} expired offers`,
      count: expiredOffers.length,
      offers: expiredOffers
    });
  } catch (error) {
    console.error('Unhandled error in cleanup-expired-offers:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 