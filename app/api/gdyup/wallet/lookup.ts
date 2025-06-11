import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Comprehensive wallet lookup function that checks all possible wallet sources
 * and returns the most complete wallet information
 * 
 * @param supabase Supabase client
 * @param userId User ID to lookup
 * @returns Consolidated wallet data
 */
export async function lookupAllWalletSources(supabase: SupabaseClient, userId: string) {
  try {
    // Try the gdyup_wallets table first if it exists
    const { data: gdyupWallet, error: walletError } = await supabase
      .from('gdyup_wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    // Try profile table wallet fields
    const { data: profileWallet, error: profileError } = await supabase
      .from('profiles')
      .select('btcWalletAddress, lightning_address, lnurl, lightningWalletType, nostr_pubkey, nostr_settings, nip05')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile wallet data:', profileError);
    }
    
    // Try to get user metadata
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    let metadataWallet = null;
    if (!userError && userData.user?.user_metadata) {
      metadataWallet = {
        bitcoin_address: userData.user.user_metadata.bitcoin_address,
        lightning_address: userData.user.user_metadata.lightning_address,
        nostr_pubkey: userData.user.user_metadata.nostr_pubkey,
        nip05: userData.user.user_metadata.nip05,
        nostr_linked: !!userData.user.user_metadata.nostr_pubkey
      };
    }
    
    // Log all data sources for debugging
    console.log('Wallet data sources:', {
      gdyupWallet: gdyupWallet ? { 
        btc: gdyupWallet.bitcoin_address, 
        lightning: gdyupWallet.lightning_address 
      } : null,
      profileWallet: profileWallet ? { 
        btc: profileWallet.btcWalletAddress, 
        lightning: profileWallet.lightning_address,
        nip05: profileWallet.nip05
      } : null,
      metadataWallet: metadataWallet ? {
        btc: metadataWallet.bitcoin_address,
        lightning: metadataWallet.lightning_address,
        nip05: metadataWallet.nip05
      } : null
    });
    
    // Create a consolidated wallet object with the most complete information
    const consolidatedWallet = {
      user_id: userId,
      bitcoin_address: gdyupWallet?.bitcoin_address || 
                      profileWallet?.btcWalletAddress || 
                      metadataWallet?.bitcoin_address || 
                      null,
      lightning_address: gdyupWallet?.lightning_address || 
                        profileWallet?.lightning_address || 
                        metadataWallet?.lightning_address || 
                        null,
      lnurl: profileWallet?.lnurl || null,
      custodial: gdyupWallet?.custodial || false,
      nostr_linked: gdyupWallet?.nostr_linked || 
                   !!profileWallet?.nostr_pubkey || 
                   !!metadataWallet?.nostr_pubkey || 
                   false,
      nostr_pubkey: profileWallet?.nostr_pubkey || 
                    metadataWallet?.nostr_pubkey || 
                    null,
      nip05: profileWallet?.nip05 || 
             metadataWallet?.nip05 || 
             null,
      lightningWalletType: profileWallet?.lightningWalletType || 'non-custodial',
      created_at: gdyupWallet?.created_at || new Date().toISOString(),
      updated_at: gdyupWallet?.updated_at || new Date().toISOString()
    };
    
    return {
      wallet: consolidatedWallet,
      sources: {
        gdyupWallet: !!gdyupWallet,
        profileWallet: !!profileWallet,
        metadataWallet: !!metadataWallet
      }
    };
  } catch (error) {
    console.error('Error in lookupAllWalletSources:', error);
    return {
      wallet: {
        user_id: userId,
        bitcoin_address: null,
        lightning_address: null,
        custodial: false,
        nostr_linked: false,
        nostr_pubkey: null,
        nip05: null
      },
      sources: {
        gdyupWallet: false,
        profileWallet: false,
        metadataWallet: false
      }
    };
  }
} 