import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { setupWalletTable } from './setup';
import { lookupAllWalletSources } from './lookup';

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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    // Make sure wallet table exists
    await setupWalletTable(supabase);
    
    // Use our comprehensive wallet lookup function
    const { wallet, sources } = await lookupAllWalletSources(supabase, userId);
    
    // If we don't have a gdyup_wallet record but have data from other sources,
    // create a wallet record to ensure consistency
    if (!sources.gdyupWallet && (sources.profileWallet || sources.metadataWallet)) {
      await supabase
        .from('gdyup_wallets')
        .insert({
          user_id: userId,
          bitcoin_address: wallet.bitcoin_address,
          lightning_address: wallet.lightning_address,
          custodial: wallet.custodial || false,
          nostr_linked: wallet.nostr_linked || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
        
      console.log('Created new gdyup_wallet record for data consistency');
    }
    
    // Return the wallet data
    return NextResponse.json({
      success: true,
      wallet
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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    // Make sure wallet table exists
    await setupWalletTable(supabase);
    
    // Check if wallet exists for this user
    const { data: existingWallet } = await supabase
      .from('gdyup_wallets')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
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
    
    // Also update the profile table with this wallet info for compatibility
    await supabase
      .from('profiles')
      .update({
        bitcoin_address,
        btcWalletAddress: bitcoin_address, // Update both fields for consistency
        lightning_address,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    // Also update user metadata for complete consistency
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (!userError && userData.user) {
      const currentMetadata = userData.user.user_metadata || {};
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMetadata,
          bitcoin_address,
          lightning_address
        }
      });
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