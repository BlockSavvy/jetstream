import { createClient } from '@/lib/supabase-server';
import { User } from '@supabase/supabase-js';

/**
 * Ensures that a user profile exists in the profiles table
 * This is essential for foreign key relationships in jetshare_offers
 * @returns boolean indicating success, and string message for error reporting
 */
export async function ensureUserProfile(user: User): Promise<{ success: boolean; message?: string }> {
  // Early return if no user
  if (!user) return { success: false, message: 'No user provided' };
  
  try {
    const supabase = await createClient();
    
    // First, check if profiles table exists to avoid errors
    try {
      const { error: tableError } = await supabase
        .from('profiles')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableError && tableError.message.includes('relation "profiles" does not exist')) {
        return { 
          success: false, 
          message: 'Profiles table does not exist. Please ensure database is properly set up.' 
        };
      }
    } catch (tableCheckError) {
      console.error('Error checking profiles table:', tableCheckError);
    }
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, user_type, verification_status')
      .eq('id', user.id)
      .single();
    
    // If profile exists, update it if needed
    if (profile) {
      // Extract user details
      const { firstName, lastName } = extractUserNameDetails(user);
      
      // Check if profile needs updating
      if (!profile.email || !profile.first_name || !profile.last_name || !profile.user_type || !profile.verification_status) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: profile.email || user.email,
            first_name: profile.first_name || firstName,
            last_name: profile.last_name || lastName,
            user_type: profile.user_type || 'traveler',
            verification_status: profile.verification_status || 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.warn('Error updating incomplete profile:', updateError);
          // Continue anyway since the profile exists
        }
      }
      return { success: true };
    }
    
    // If profile doesn't exist, create a new one
    if (!profile) {
      // Extract user details
      const { firstName, lastName } = extractUserNameDetails(user);
      
      // Create new profile with all required fields
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          avatar_url: null,
          user_type: 'traveler',
          verification_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating user profile:', insertError);
        return { 
          success: false, 
          message: `Failed to create profile: ${insertError.message}` 
        };
      }
      
      return { success: true };
    }
    
    return { success: false, message: 'Unexpected flow - neither found nor created profile' };
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return { 
      success: false, 
      message: `Error ensuring user profile: ${(error as Error).message}` 
    };
  }
}

/**
 * Helper function to extract a user's name details from metadata or email
 */
function extractUserNameDetails(user: User): { firstName: string; lastName: string } {
  // Try to extract names from user metadata
  let firstName = user.user_metadata?.first_name || user.user_metadata?.given_name || '';
  let lastName = user.user_metadata?.last_name || user.user_metadata?.family_name || '';
  
  // If no metadata, try to parse from email
  if ((!firstName || !lastName) && user.email) {
    const email = user.email;
    const nameParts = email.split('@')[0].split('.');
    
    if (nameParts.length > 1) {
      // If email has format like "first.last@example.com"
      firstName = firstName || (nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : '');
      lastName = lastName || (nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '');
    } else if (nameParts.length === 1 && !firstName) {
      // Just use the email username as first name
      firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    }
  }
  
  // Use fallbacks if still empty
  firstName = firstName || 'User';
  lastName = lastName || user.id.slice(0, 5);
  
  return { firstName, lastName };
} 