import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareTransactions } from '@/lib/services/jetshare';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId') || searchParams.get('id');
    
    if (!offerId) {
      return NextResponse.json({ error: 'Missing required parameter: offerId or id' }, { status: 400 });
    }
    
    // Validate that the user is authorized to view this offer's transactions
    const { data: offer, error: offerError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .single();
      
    if (offerError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // Check if the user is either the offer creator or the matched user
    if (offer.user_id !== user.id && offer.matched_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this offer\'s transactions' }, { status: 403 });
    }
    
    // Get transactions for this offer
    try {
      const transactions = await getJetShareTransactions(user.id, {
        offerId,
        limit: 10,
      });
      
      // Even if no transactions are found, still return the offer
      return NextResponse.json({ 
        success: true, 
        transactions: transactions || [],
        offer,
        hasTransactions: transactions && transactions.length > 0
      }, { status: 200 });
    } catch (txError) {
      console.error('Error fetching transactions:', txError);
      
      // Still return the offer even if transactions fail
      return NextResponse.json({ 
        success: true, 
        transactions: [],
        offer,
        hasTransactions: false,
        transactionError: (txError as Error).message
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching offer transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offer transactions', message: (error as Error).message },
      { status: 500 }
    );
  }
} 