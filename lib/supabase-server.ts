import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Log the keys being used (sanitized for security)
    console.log('Creating Supabase client with URL:', supabaseUrl)
    console.log('Using service role key:', supabaseKey ? 'Key provided (value hidden)' : 'No key provided')

    return createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name) {
            try {
              return cookieStore.get(name)?.value
            } catch (error) {
              console.error(`Error getting cookie ${name}:`, error)
              return undefined
            }
          },
          set(name, value, options) {
            try {
              cookieStore.set({ name, value, ...options as CookieOptions })
            } catch (error) {
              // The `set` method was called from a Server Component.
              console.error(`Error setting cookie ${name}:`, error)
            }
          },
          remove(name, options) {
            try {
              cookieStore.set({ name, value: '', ...options as CookieOptions })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              console.error(`Error removing cookie ${name}:`, error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating server-side Supabase client:', error)
    throw error
  }
} 