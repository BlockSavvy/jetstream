import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verifies if the current user is an admin
 * @param supabase - The Supabase client
 * @returns The user object if admin, null otherwise
 */
export async function verifyAdmin(supabase: SupabaseClient): Promise<any> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return null;
    }
    
    // Check if user has admin role in user_roles table
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (roleError) {
      console.error('Error checking user role:', roleError);
      return null;
    }
    
    // Alternative check in profiles table if user_roles doesn't exist or is empty
    if (!userRole) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }
      
      // Check if profile has admin role
      if (profile.role !== 'admin') {
        console.log('User is not an admin (profile check)');
        return null;
      }
    }
    
    // If we made it here, user is an admin
    return user;
  } catch (error) {
    console.error('Error in verifyAdmin:', error);
    return null;
  }
}

/**
 * Checks if a user has a specific role
 * @param supabase - The Supabase client
 * @param role - The role to check for
 * @returns The user object if they have the role, null otherwise
 */
export async function verifyUserRole(supabase: SupabaseClient, role: string): Promise<any> {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return null;
    }
    
    // Check if user has the specified role in user_roles table
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', role)
      .maybeSingle();
    
    if (roleError) {
      console.error('Error checking user role:', roleError);
      return null;
    }
    
    // Alternative check in profiles table if user_roles doesn't exist or is empty
    if (!userRole) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }
      
      // Check if profile has the specified role
      if (profile.role !== role) {
        console.log(`User does not have role: ${role} (profile check)`);
        return null;
      }
    }
    
    // If we made it here, user has the required role
    return user;
  } catch (error) {
    console.error(`Error in verifyUserRole for ${role}:`, error);
    return null;
  }
} 