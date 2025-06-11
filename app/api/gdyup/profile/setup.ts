import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Ensures that the user profile is properly updated to reflect actual data state
 * This function is now completely free of authentication operations to avoid cookie issues
 * @param supabase Supabase client
 * @param userId User ID to update
 */
export async function fixProfileInconsistencies(supabase: any, userId: string) {
  try {
    console.log('Starting profile consistency fix for user:', userId);
    
    // First check if the user has a jets table entry but doesn't have has_jet = true
    const { data: jetsData, error: jetsError } = await supabase
      .from('jets')
      .select('id')
      .eq('owner_id', userId);
      
    if (jetsError) {
      console.error('Error checking for jets:', jetsError);
    } else if (jetsData && jetsData.length > 0) {
      // User has jets, make sure has_jet flag is set to true
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('has_jet')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Error checking profile has_jet flag:', profileError);
      } else if (!profile?.has_jet) {
        // Need to update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ has_jet: true })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating has_jet flag:', updateError);
        } else {
          console.log('Updated has_jet flag for user:', userId);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error fixing profile inconsistencies:', error);
    return { success: false, error };
  }
} 