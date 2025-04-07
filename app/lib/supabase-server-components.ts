import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for server components using cookie-based auth
 * This is for regular user operations that should respect RLS policies
 * 
 * IMPORTANT: This file should ONLY be imported by server components in the /app directory
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