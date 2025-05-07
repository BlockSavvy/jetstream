import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ensures that the user profile is properly updated to reflect actual data state
 * @param supabase Supabase client
 * @param userId User ID to update
 */
export async function fixProfileInconsistencies(supabase: SupabaseClient, userId: string) {
  try {
    console.log('Starting profile consistency fix for user:', userId);
    
    // 1. Check if user has jets and update has_jet flag
    const { data: jets, error: jetsError } = await supabase
      .from('jets')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
      
    if (jetsError) {
      console.error('Error checking user jets:', jetsError);
    } else {
      const hasJets = jets && jets.length > 0;
      
      // Update has_jet status in profile
      if (hasJets) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ has_jet: true })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating has_jet flag:', updateError);
        } else {
          console.log('Updated has_jet flag to true for user:', userId);
        }
      }
    }
    
    // 2. Get current profile data to use for metadata update
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        full_name,
        avatar_url,
        nip05,
        nostr_pubkey,
        bitcoin_address,
        lightning_address,
        btcWalletAddress,
        has_jet
      `)
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile for consistency fix:', profileError);
      return false;
    }
    
    // 3. Get current user metadata
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error('Error fetching user data for metadata update:', userError);
      return false;
    }
    
    // 4. Prepare updated metadata with all consistent values
    const currentMetadata = userData.user.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      // Identity fields
      nip05: profileData.nip05 || currentMetadata.nip05,
      nostr_pubkey: profileData.nostr_pubkey || currentMetadata.nostr_pubkey,
      bitcoin_address: profileData.btcWalletAddress || profileData.bitcoin_address || currentMetadata.bitcoin_address,
      lightning_address: profileData.lightning_address || currentMetadata.lightning_address,
      // Profile fields
      full_name: profileData.full_name || currentMetadata.full_name,
      avatar_url: profileData.avatar_url || currentMetadata.avatar_url,
      // Jet ownership
      hasJets: profileData.has_jet || !!jets?.length || currentMetadata.hasJets || false
    };
    
    // 5. Update the user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    });
    
    if (updateError) {
      console.error('Error updating user metadata for consistency:', updateError);
      return false;
    }
    
    console.log('Successfully updated user metadata for consistency');
    return true;
  } catch (error) {
    console.error('Error in fixProfileInconsistencies:', error);
    return false;
  }
} 