'use client';

import { createClient } from '@supabase/supabase-js';
import { User, Session } from '@supabase/supabase-js';

// Dev mode configuration
const DEV_USER_ID = process.env.NEXT_PUBLIC_AUTH_DEV_USER_ID || '26209e07-7600-4df6-ab1e-4b338f760aff';
const DEV_USER_EMAIL = process.env.NEXT_PUBLIC_AUTH_DEV_USER_EMAIL || 'dev@example.com';
const isDevMode = process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true';

// Cache the fetched user data
let cachedDevUser: User | null = null;
let cachedDevSession: Session | null = null;

/**
 * Creates a development session with a real user from the database
 * This bypasses the actual sign-in process but creates a valid session
 * for the specified user ID
 */
export async function createDevSession(): Promise<{
  user: User | null;
  session: Session | null;
}> {
  // Return cached data if available
  if (cachedDevUser && cachedDevSession) {
    return { user: cachedDevUser, session: cachedDevSession };
  }
  
  if (!isDevMode) {
    console.warn('Development mode is not enabled. Enable with NEXT_PUBLIC_AUTH_DEV_MODE=true');
    return { user: null, session: null };
  }
  
  try {
    console.log('DEV MODE: Creating development session for user:', DEV_USER_ID);
    
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('DEV MODE: Missing Supabase credentials');
      return { user: null, session: null };
    }
    
    // Create a temporary Supabase client
    const tempClient = createClient(supabaseUrl, supabaseKey);
    
    // Try to fetch the real user from the database
    let userData = { 
      email: DEV_USER_EMAIL,
      first_name: 'Dev',
      last_name: 'User',
    };
    
    try {
      // We're not signing in but getting the user data to create a realistic session
      const { data: profiles, error: profileError } = await tempClient
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', DEV_USER_ID)
        .maybeSingle();
      
      if (profileError) {
        console.warn('DEV MODE: Error fetching user profile:', profileError);
        // Continue with default data
      } else if (profiles) {
        console.log('DEV MODE: Found user profile:', profiles);
        userData = {
          email: profiles.email || DEV_USER_EMAIL,
          first_name: profiles.first_name || 'Dev',
          last_name: profiles.last_name || 'User',
        };
      } else {
        console.warn(`DEV MODE: No profile found for ID ${DEV_USER_ID}, using fallback data`);
      }
    } catch (profileFetchError) {
      console.warn('DEV MODE: Error during profile fetch:', profileFetchError);
      // Continue with default data
    }
    
    // Create a user object using real data if available, or fallback to configured values
    const user: User = {
      id: DEV_USER_ID,
      email: userData.email,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`
      },
      app_metadata: { provider: 'email' },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as User;
    
    // Create mock tokens for the session (will not be valid for API calls)
    const session: Session = {
      user,
      access_token: `dev_mode_token_${DEV_USER_ID}`,
      refresh_token: `dev_mode_refresh_${DEV_USER_ID}`,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      expires_in: 3600,
      token_type: 'bearer'
    };
    
    // Store in localStorage for consistency with real auth
    try {
      localStorage.setItem('jetstream_user_id', DEV_USER_ID);
      localStorage.setItem('jetstream_user_email', user.email || '');
      localStorage.setItem('jetstream_session_time', Date.now().toString());
      
      // Also store a token in the expected format
      const tokenData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user
      };
      localStorage.setItem('sb-vjhrmizwqhmafkxbmfwa-auth-token', JSON.stringify(tokenData));
      
      console.log('DEV MODE: Stored auth data in localStorage');
    } catch (e) {
      console.warn('DEV MODE: Error storing dev session in localStorage:', e);
    }
    
    // Cache the user and session
    cachedDevUser = user;
    cachedDevSession = session;
    
    console.log('DEV MODE: Created development session for:', user.email);
    return { user, session };
  } catch (e) {
    console.error('DEV MODE: Error creating development session:', e);
    return { user: null, session: null };
  }
}

/**
 * Checks if dev mode is enabled
 */
export function isDevAuthMode(): boolean {
  return isDevMode;
}

/**
 * Gets the configured dev user ID
 */
export function getDevUserId(): string {
  return DEV_USER_ID;
} 