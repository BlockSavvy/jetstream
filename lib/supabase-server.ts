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
 * Creates a Supabase client that works in both client and server components
 * using the anon key. This is a replacement for the server-component specific
 * version that used cookies from next/headers.
 * 
 * Note: This doesn't maintain user sessions. For authenticated requests in server
 * components, use the createAuthClient from app/lib/supabase-server-components.ts
 */
export const createAuthClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or anon key');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Export a type so other files can use our return type
export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;