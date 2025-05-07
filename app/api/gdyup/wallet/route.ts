import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Handler for GET requests to fetch wallet information
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }
  
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch the user's wallet information
    const { data, error } = await supabase
      .from('gdyup_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
      console.error('Error fetching wallet:', error);
      return NextResponse.json({ error: 'Failed to fetch wallet information' }, { status: 500 });
    }
    
    // Return the wallet data, or null if not found
    return NextResponse.json({
      success: true,
      wallet: data || null
    });
  } catch (error) {
    console.error('Error in wallet API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handler for POST requests to save wallet information
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, bitcoin_address, lightning_address, custodial, nostr_linked } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if wallet exists for this user
    const { data: existingWallet } = await supabase
      .from('gdyup_wallets')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    let response;
    
    if (existingWallet) {
      // Update existing wallet
      response = await supabase
        .from('gdyup_wallets')
        .update({
          bitcoin_address,
          lightning_address,
          custodial: custodial || false,
          nostr_linked: nostr_linked || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWallet.id)
        .select('*')
        .single();
    } else {
      // Create new wallet
      response = await supabase
        .from('gdyup_wallets')
        .insert({
          user_id: userId,
          bitcoin_address,
          lightning_address,
          custodial: custodial || false,
          nostr_linked: nostr_linked || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
    }
    
    const { data, error } = response;
    
    if (error) {
      console.error('Error saving wallet:', error);
      return NextResponse.json({ error: 'Failed to save wallet information' }, { status: 500 });
    }
    
    // Return the updated wallet data
    return NextResponse.json({
      success: true,
      wallet: data
    });
  } catch (error) {
    console.error('Error in wallet API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 