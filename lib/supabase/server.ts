import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase client for use in API routes that correctly handles cookies
 * Note: This should be used in API routes where cookies are needed
 */
export async function createClient() {
  try {
    // Cookies() is now an async function that needs to be awaited
    const cookieStore = await cookies();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    return createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options, maxAge: -1 });
          },
        },
      }
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
} 