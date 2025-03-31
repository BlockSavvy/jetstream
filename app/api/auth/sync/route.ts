import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase-api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('📝 API route called: /api/auth/sync');
  const startTime = Date.now()
  
  try {
    // Debug cookie access
    const cookieHeader = request.headers.get('cookie');
    console.log('🍪 Cookie header present:', !!cookieHeader);
    if (cookieHeader) {
      // Extract cookie names for debugging
      const cookieNames = cookieHeader.split(';')
        .map(c => c.trim().split('=')[0])
      
      console.log('🍪 Cookie names in request:', cookieNames);
      console.log('🍪 Auth cookies in request:', 
        cookieNames.some(name => name.includes('sb-') || name.includes('supabase'))
      );
    }
    
    // Create a Supabase client using our utility function
    console.log('🔌 Creating Supabase API client');
    const supabase = await createApiClient();
    console.log('🔌 Supabase client created');
    
    // Get the current session
    console.log('🔍 Fetching user session from Supabase auth');
    const { data, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError.message)
      return NextResponse.json({ error: 'Authentication error', details: sessionError.message }, { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      })
    }
    
    console.log('💬 Session data returned:', !!data?.session);
    if (data?.session) {
      console.log('💬 Session user data:', !!data.session.user);
    }
    
    const session = data.session
    
    // If no session exists, nothing to refresh
    if (!session) {
      console.log('👤 No session found in auth/sync')
      return NextResponse.json({ status: 'no_session' }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      })
    }
    
    console.log('✅ Valid session found in sync API, user ID:', session.user.id)
      
    // Simply send back the current session user info
    // We're skipping the refresh to simplify the process
    const processingTime = Date.now() - startTime
    console.log(`⏱️ /api/auth/sync completed in ${processingTime}ms`)
    
    return NextResponse.json({ 
      status: 'success',
      user: session.user || null
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Unexpected error in auth sync (${processingTime}ms):`, error)
    return NextResponse.json({ error: 'server_error', 
                             details: JSON.stringify(error) }, {
      status: 500, 
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    })
  }
} 