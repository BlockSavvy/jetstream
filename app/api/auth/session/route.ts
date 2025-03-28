import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// This is a stub endpoint that returns an empty session
// This prevents 404 errors when Next.js tries to fetch the session
export async function GET(request: NextRequest) {
  try {
    // Check cookies
    const cookieString = request.headers.get('cookie') || '';
    console.log('GET /api/auth/session - Cookie header present:', !!cookieString, 'Length:', cookieString.length);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json({ 
        error: 'Authentication error', 
        message: error.message 
      }, { status: 401 });
    }
    
    // Get user if session exists
    if (data?.session) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return NextResponse.json({ 
          error: 'Error getting user data', 
          message: userError.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        session: data.session,
        user: userData.user,
        authenticated: true
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
    
    // No session
    return NextResponse.json({ 
      authenticated: false,
      message: 'No active session found'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in session route:', error);
    return NextResponse.json(
      { error: 'Session error', message: (error as Error).message },
      { status: 500 }
    );
  }
} 