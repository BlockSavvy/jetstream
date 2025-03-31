import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for API routes that correctly handles cookies
 * This is a thin wrapper over createServerClient from @supabase/ssr
 * It properly handles cookies access by awaiting the cookies() function
 */
export async function createApiClient() {
  try {
    // Cookies() is now an async function that needs to be awaited
    console.log('Fetching cookie store from Next.js headers')
    const cookieStore = await cookies()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase/)?.[1] || ''
    
    console.log(`Creating Supabase API client with URL: ${supabaseUrl}`)
    
    // Debug - log available cookies (only names for security)
    try {
      const allCookies = cookieStore.getAll()
      console.log(`Found ${allCookies.length} cookies:`, allCookies.map(c => c.name))
      
      // Look specifically for Supabase auth cookies
      const authCookies = allCookies.filter(c => 
        c.name.includes('supabase') || 
        c.name.includes('sb-')
      )
      console.log(`Found ${authCookies.length} auth cookies:`, authCookies.map(c => c.name))
    } catch (cookieError) {
      console.error('Error listing cookies:', cookieError)
    }
    
    // Extract the token from the supabase-auth-token cookie if it exists
    const authTokenCookie = cookieStore.get('supabase-auth-token')
    let authToken = null
    let refreshToken = null
    
    if (authTokenCookie?.value) {
      try {
        // The cookie value is base64-{json}
        const cookieValue = authTokenCookie.value
        if (cookieValue.startsWith('base64-')) {
          const jsonStr = atob(cookieValue.replace('base64-', ''))
          const parsed = JSON.parse(jsonStr)
          authToken = parsed.access_token || null
          refreshToken = parsed.refresh_token || null
          console.log('Successfully extracted auth token from supabase-auth-token cookie')
        }
      } catch (e) {
        console.error('Error parsing auth token cookie:', e)
      }
    }
    
    return createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name) {
            try {
              // Special handling for the sb-[ref]-auth-token cookie
              if (name === `sb-${projectRef}-auth-token`) {
                console.log(`Special handling for ${name}, returning extracted token`)
                return authToken
              }
              
              // Special handling for refresh token
              if (name === `sb-${projectRef}-auth-token.refresh`) {
                console.log(`Special handling for refresh token, returning extracted token`)
                return refreshToken
              }
              
              const cookie = cookieStore.get(name)
              console.log(`Cookie requested: ${name}, found: ${!!cookie}`)
              return cookie?.value
            } catch (error) {
              console.error(`Error getting cookie ${name}:`, error)
              return undefined
            }
          },
          set(name, value, options) {
            try {
              console.log(`Setting cookie: ${name}`)
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error)
            }
          },
          remove(name, options) {
            try {
              console.log(`Removing cookie: ${name}`)
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating API Supabase client:', error)
    throw error
  }
} 