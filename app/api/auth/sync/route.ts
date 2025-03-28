import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('Session sync API called');
    
    // Get the Supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the session - this will sync the session with cookies
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error syncing session:', error.message);
      
      // Handle refresh token errors specifically
      if (error.message.includes('Invalid Refresh Token') || 
          error.message.includes('refresh token not found') ||
          error.message.includes('expired')) {
        // Return a more specific error so the client can handle it appropriately
        return NextResponse.json({ 
          error: 'invalid_refresh_token', 
          message: error.message 
        }, { status: 401 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // If we have a session, force a refresh to ensure it's valid
    if (session) {
      // Log the current session for debugging
      console.log('Current session found:', {
        user_id: session.user.id,
        email: session.user.email,
        expires_at: new Date(session.expires_at! * 1000).toISOString()
      });
      
      // Force refresh the session 
      const { data, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('Error refreshing session:', refreshError.message);
        
        // Handle refresh token errors
        if (refreshError.message.includes('Invalid Refresh Token') || 
            refreshError.message.includes('refresh token not found') ||
            refreshError.message.includes('expired')) {
          return NextResponse.json({ 
            error: 'invalid_refresh_token', 
            message: refreshError.message 
          }, { status: 401 });
        }
        
        return NextResponse.json({ error: refreshError.message }, { status: 500 })
      }
      
      // Session refreshed successfully
      console.log('Session synced and refreshed successfully');
      
      // Return the refreshed session data
      return NextResponse.json({ 
        message: 'Session synced and refreshed successfully',
        user: data.session?.user || null,
        session: !!data.session,
        expires_at: data.session?.expires_at
      }, { 
        status: 200,
        headers: {
          // Prevent caching
          'Cache-Control': 'no-store, max-age=0',
        }
      })
    }
    
    console.log('No active session found during sync');
    return NextResponse.json({ 
      message: 'No active session found',
      session: false
    }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error syncing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 