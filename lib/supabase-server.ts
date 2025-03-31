import { createClient as createSBClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server-side usage with admin privileges
 * This always uses the service role key for server-side operations
 * that require full database access
 */
export async function createClient() {
  try {
    // Always use the service role key for admin-level access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase URL or service role key');
    }
    
    // Log that we're using the service role for transparency in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Creating Supabase client with URL:', supabaseUrl);
      console.log('Using service role key: Key provided (value hidden)');
    }
    
    // Create the admin client directly with service role
    // This ensures we don't try to use cookies which can cause dynamic API issues
    const supabase = createSBClient(
      supabaseUrl, 
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    return supabase;
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
}