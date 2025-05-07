import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Synchronizes user metadata with the profiles table for a specific user
 * @param supabase Supabase client
 * @param userId User ID to sync
 */
export async function syncUserMetadataWithProfile(supabase: SupabaseClient, userId: string) {
  try {
    // Get the current user data from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error('Error fetching user data for sync:', userError);
      return false;
    }
    
    // Extract relevant metadata
    const { user_metadata } = userData.user;
    
    // Get the current profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile for sync:', profileError);
      return false;
    }
    
    // Fields to sync from user_metadata to profile
    const syncFields = {
      // Sync basic profile info if available
      full_name: user_metadata?.full_name,
      avatar_url: user_metadata?.avatar_url,
      // Sync identifiers
      nip05: user_metadata?.nip05,
      bitcoin_address: user_metadata?.bitcoin_address,
      lightning_address: user_metadata?.lightning_address,
      // Update timestamp
      updated_at: new Date().toISOString()
    };
    
    // Filter out undefined values
    const updateFields = Object.entries(syncFields).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Skip update if there are no fields to update
    if (Object.keys(updateFields).length === 0) {
      return true;
    }
    
    // Update the profile with metadata
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating profile with user metadata:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in syncUserMetadataWithProfile:', error);
    return false;
  }
}

/**
 * Updates user metadata with data from the profiles table
 * @param supabase Supabase client
 * @param userId User ID to update
 */
export async function updateUserMetadataFromProfile(supabase: SupabaseClient, userId: string) {
  try {
    // Get the current profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile for metadata update:', profileError);
      return false;
    }
    
    if (!profileData) {
      console.error('Profile not found for metadata update');
      return false;
    }
    
    // Get current user metadata
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user) {
      console.error('Error fetching user data for metadata update:', userError);
      return false;
    }
    
    const currentMetadata = userData.user.user_metadata || {};
    
    // Fields to sync from profile to user_metadata
    const updatedMetadata = {
      ...currentMetadata,
      // Identity fields
      nip05: profileData.nip05 || currentMetadata.nip05,
      nostr_pubkey: profileData.nostr_pubkey || currentMetadata.nostr_pubkey,
      bitcoin_address: profileData.bitcoin_address || currentMetadata.bitcoin_address,
      lightning_address: profileData.lightning_address || currentMetadata.lightning_address,
      // Profile fields
      full_name: profileData.full_name || currentMetadata.full_name,
      avatar_url: profileData.avatar_url || currentMetadata.avatar_url
    };
    
    // Update the user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    });
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateUserMetadataFromProfile:', error);
    return false;
  }
} 