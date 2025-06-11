import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      zapEventId, 
      zapRequest, 
      zapReceipt, 
      amount, 
      senderPubkey, 
      recipientPubkey,
      offerId,
      comment,
      userId
    } = body;
    
    if (!zapEventId || !amount || !senderPubkey || !recipientPubkey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createClient();
    
    // Insert zap receipt into database
    const { data, error } = await supabase
      .from('nostr_zaps')
      .insert({
        zap_event_id: zapEventId,
        zap_request: zapRequest,
        zap_receipt: zapReceipt,
        amount,
        sender_pubkey: senderPubkey,
        recipient_pubkey: recipientPubkey,
        offer_id: offerId,
        comment,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Error storing zap receipt:', error);
      return NextResponse.json({ error: 'Failed to store zap receipt' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Zap receipt stored successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error in zap receipt API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const offerId = searchParams.get('offerId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Create Supabase client
    const supabase = createClient();
    
    // Build query
    let query = supabase
      .from('nostr_zaps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Add filters if provided
    if (offerId) {
      query = query.eq('offer_id', offerId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching zap receipts:', error);
      return NextResponse.json({ error: 'Failed to fetch zap receipts' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in zap receipt API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 