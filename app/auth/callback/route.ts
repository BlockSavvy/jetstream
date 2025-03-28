import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error.message)
        return NextResponse.redirect(new URL('/auth/login', request.url))
      } else {
        console.log('Session established successfully')
      }
    }
    
    // Check for redirect URL in the query params
    const returnUrl = requestUrl.searchParams.get('returnUrl') || '/'
    
    // Create a full URL for the redirect
    const redirectUrl = new URL(returnUrl, request.url)
    
    // Redirect to the requested page or home page
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error in auth callback:', error)
    // In case of error, redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
  }
} 