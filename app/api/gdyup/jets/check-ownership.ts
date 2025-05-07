import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks if a user owns any jets and updates their user metadata accordingly
 * @param supabase Supabase client
 * @param userId User ID to check
 * @returns Boolean indicating if the user owns any jets
 */
export async function checkJetOwnership(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    // Query jets table to see if user owns any jets
    const { data: jets, error } = await supabase
      .from('jets')
      .select('id')
      .eq('owner_id', userId)
      .limit(1);
      
    if (error) {
      console.error('Error checking jet ownership:', error);
      return false;
    }
    
    const hasJets = jets && jets.length > 0;
    
    // Update user metadata with hasJets flag
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (!userError && userData.user) {
      const currentMetadata = userData.user.user_metadata || {};
      
      // Only update if the value has changed
      if (currentMetadata.hasJets !== hasJets) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...currentMetadata,
            hasJets
          }
        });
      }
    }
    
    return hasJets;
  } catch (error) {
    console.error('Error in checkJetOwnership:', error);
    return false;
  }
} 