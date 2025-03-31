import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase-api';

export const dynamic = 'force-dynamic';

// This is a stub endpoint that returns an empty session
// This prevents 404 errors when Next.js tries to fetch the session
export async function GET(request: NextRequest) {
  console.log('📝 API route called: /api/auth/session');
  
  try {
    // Create a Supabase client using our utility function
    // Now we need to await the createApiClient call
    const supabase = await createApiClient();
    console.log('🔌 Supabase client created');
    
    // Get user session 
    console.log('🔍 Fetching user session from Supabase auth');
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError.message);
      return NextResponse.json(
        { 
          authenticated: false, 
          error: sessionError.message 
        }, 
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    }
    
    const session = data.session;
    
    if (!session || !session.user) {
      console.log('👤 No authenticated user found');
      return NextResponse.json(
        { authenticated: false }, 
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    }
    
    console.log('✅ User authenticated:', session.user.id);
    return NextResponse.json(
      { 
        authenticated: true, 
        user: {
          id: session.user.id,
          email: session.user.email,
          created_at: session.user.created_at
        }
      }, 
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error: any) {
    console.error('❌ Unexpected error checking session:', error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: error.message 
      }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  }
} 