import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server-side usage with admin privileges
 * This always uses the service role key for server-side operations
 * that require full database access
 */
export const createClient = async () => {
  // Always use the service role key for admin-level access
  // This is essential for operations that need to bypass RLS policies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or service role key');
  }
  
  // Create the admin client directly with service role
  // This ensures we don't try to use cookies which can cause dynamic API issues
  const supabase = createSupabaseClient(
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
};

/**
 * Creates a Supabase client for server components using cookie-based auth
 * This is for regular user operations that should respect RLS policies
 */
export const createAuthClient = async () => {
  try {
    // Create server-side client with cookie-based auth
    const supabase = createServerComponentClient({ cookies });
    return supabase;
  } catch (e) {
    console.warn('Error creating server component client, falling back to direct client:', e);
    
    // Fallback to direct client if cookie access fails
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    return createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
};