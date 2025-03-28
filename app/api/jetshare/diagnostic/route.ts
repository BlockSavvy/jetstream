import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // DIAGNOSTIC SECTION - Try different queries to understand the issue
    
    // 1. Check if the table exists by getting the count
    const { count: offersCount, error: countError } = await supabase
      .from('jetshare_offers')
      .select('*', { count: 'exact', head: true });
    
    // 2. Try to get all offers regardless of status or user
    const { data: allOffers, error: allOffersError } = await supabase
      .from('jetshare_offers')
      .select('*');
    
    // 3. Check specifically for open offers
    const { data: openOffers, error: openOffersError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('status', 'open');
    
    // 4. Check for the current user's offers
    const { data: userOffers, error: userOffersError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('user_id', user.id);
    
    // 5. Check RLS policies by getting table privileges
    let policies = null;
    let policiesError = null;
    try {
      const { data, error } = await supabase
        .rpc('get_policies_info', { table_name: 'jetshare_offers' });
      policies = data;
      policiesError = error;
    } catch (error) {
      policiesError = { message: 'Function not available' };
    }
    
    // 6. Try to insert a test offer to check if that's working
    const testOffer = {
      user_id: user.id,
      flight_date: new Date().toISOString(),
      departure_location: 'Test Location',
      arrival_location: 'Test Destination',
      total_flight_cost: 10000,
      requested_share_amount: 5000,
      status: 'open'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('jetshare_offers')
      .insert(testOffer)
      .select();
    
    return NextResponse.json({
      success: true,
      diagnostic: {
        user_id: user.id,
        offers_count: offersCount,
        count_error: countError ? countError.message : null,
        all_offers: {
          count: allOffers?.length || 0,
          data: allOffers,
          error: allOffersError ? allOffersError.message : null
        },
        open_offers: {
          count: openOffers?.length || 0,
          data: openOffers,
          error: openOffersError ? openOffersError.message : null
        },
        user_offers: {
          count: userOffers?.length || 0, 
          data: userOffers,
          error: userOffersError ? userOffersError.message : null
        },
        policies: {
          data: policies,
          error: policiesError ? policiesError.message : null
        },
        insert_test: {
          success: insertError ? false : true,
          data: insertResult,
          error: insertError ? insertError.message : null
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error running diagnostic:', error);
    return NextResponse.json(
      { error: 'Failed to run diagnostic', message: (error as Error).message },
      { status: 500 }
    );
  }
} 