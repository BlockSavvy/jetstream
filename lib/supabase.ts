import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  try {
    return createBrowserClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Fallback to creating a client without options
    return createBrowserClient(
      supabaseUrl,
      supabaseKey
    )
  }
} 