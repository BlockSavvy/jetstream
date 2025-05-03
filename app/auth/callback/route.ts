import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createApiClient } from '@/lib/supabase-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('📝 Auth callback route called');
  
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const type = requestUrl.searchParams.get('type')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    const isMobile = request.headers.get('user-agent')?.includes('Mobile') || false
    
    console.log('🔍 Auth callback params:', { 
      hasCode: !!code, 
      type: type || 'standard', 
      hasError: !!error,
      isMobile
    });
    
    // Log cookie header for debugging
    const cookieHeader = request.headers.get('cookie');
    console.log('🍪 Cookie header present:', !!cookieHeader);
    
    // Get the app mode/name to determine redirect behavior
    const appMode = process.env.NEXT_PUBLIC_APP_MODE || 'jetstream';
    const isGdyup = appMode === 'gdyup';
    console.log('🔧 App mode:', appMode, 'Is GDYUP:', isGdyup);
    
    // Check for error in the URL - commonly happens when the link is expired
    if (error) {
      console.error(`❌ Auth callback error: ${error}, description: ${errorDescription}`)
      // Redirect to login with error message
      const loginUrl = new URL('/auth/login', requestUrl.origin)
      loginUrl.searchParams.set('error', errorDescription || 'Authentication error')
      return NextResponse.redirect(loginUrl)
    }
    
    if (code) {
      // Create the Supabase client with cookie store - await needed for Next.js 15+
      const supabase = await createApiClient();
      console.log('🔌 Supabase client created for auth callback');
      
      try {
        // Exchange the code for a session
        console.log('🔄 Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('❌ Error exchanging code for session:', error.message)
          // Redirect to login with error message
          const loginUrl = new URL('/auth/login', requestUrl.origin)
          loginUrl.searchParams.set('error', error.message)
          return NextResponse.redirect(loginUrl)
        } 
        
        if (data?.session) {
          console.log('✅ Session established successfully, user ID:', data.session.user.id)
          
          // Allow cookies to be properly set before profile creation
          console.log('⏱️ Allowing time for cookies to be set before profile creation');
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Create or update user profile
          await createOrUpdateUserProfile(supabase, data.session.user.id, data.session.user.email)
          
          // Allow cookies to be properly set after profile update
          console.log('⏱️ Allowing additional time for cookies to be properly set');
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get the returnUrl and referrer for redirection logic
          const referrer = request.headers.get('referer') || ''
          const returnUrl = requestUrl.searchParams.get('returnUrl') || '/'
          
          // For GDYUP deployments, prioritize redirecting to the GDYUP app
          if (isGdyup) {
            console.log('🚀 GDYUP Mode: Redirecting to GDYUP app after authentication')
            return NextResponse.redirect(new URL('/gdyup', requestUrl.origin))
          }
          
          // If the referrer or returnUrl is from JetShare, redirect there
          if (referrer.includes('/jetshare') || returnUrl.includes('/jetshare')) {
            console.log('🚀 Redirecting to JetShare after authentication')
            return NextResponse.redirect(new URL('/jetshare', requestUrl.origin))
          }
          
          // If this is a mobile app and the type is signup or recovery
          if (isMobile && (type === 'signup' || type === 'recovery')) {
            if (isGdyup) {
              console.log('📱 Mobile signup/recovery detected for GDYUP, redirecting to GDYUP app')
              return NextResponse.redirect(new URL('/gdyup', requestUrl.origin))
            } else {
              console.log('📱 Mobile signup/recovery detected, redirecting to appropriate dashboard')
              return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
            }
          }
          
          // If this is after signup/verification or password recovery (non-mobile)
          if (type === 'signup' || type === 'recovery') {
            console.log('🚀 Redirecting to dashboard after signup/recovery')
            return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
          }
          
          // For other auth flows, redirect to the requested return URL or home
          const redirectUrl = returnUrl ? new URL(returnUrl, requestUrl.origin) : new URL('/', requestUrl.origin)
          console.log(`🚀 Redirecting to: ${redirectUrl.pathname}`)
          return NextResponse.redirect(redirectUrl)
        } else {
          console.log('⚠️ No session data returned after code exchange');
        }
      } catch (exchangeError) {
        console.error('❌ Exception during code exchange:', exchangeError)
        // Redirect to login with generic error message
        const loginUrl = new URL('/auth/login', requestUrl.origin)
        loginUrl.searchParams.set('error', 'Failed to process authentication')
        return NextResponse.redirect(loginUrl)
      }
    }
    
    // If we get here without a code or after processing the code, redirect to appropriate home
    console.log('ℹ️ No code provided or processing complete, redirecting to home');
    const homePath = isGdyup ? '/gdyup' : '/';
    return NextResponse.redirect(new URL(homePath, requestUrl.origin))
  } catch (error) {
    console.error('❌ Error in auth callback:', error)
    // In case of error, redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
  }
}

// Helper function to create or update a user profile
async function createOrUpdateUserProfile(supabase: any, userId: string, email: string | undefined) {
  try {
    console.log('🔍 Checking if profile exists for user:', userId);
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!existingProfile) {
      console.log(`🆕 Creating new profile for user ${userId}`);
      
      // Extract name from email if available
      let firstName = '';
      let lastName = '';
      
      if (email) {
        const emailName = email.split('@')[0];
        // Try to split on common separators
        const nameParts = emailName.split(/[._-]/);
        if (nameParts.length > 1) {
          firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
          lastName = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
        } else {
          // Just use the email name as first name
          firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
      }
      
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Error creating user profile:', insertError);
      } else {
        console.log(`✅ Profile created successfully for user ${userId}`);
      }
    } else {
      console.log(`🔄 Profile already exists for user ${userId}, updating last login`);
      
      // Update existing profile with last login
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error('❌ Error updating user profile:', updateError);
      } else {
        console.log(`✅ Profile updated successfully for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in createOrUpdateUserProfile:', error);
  }
} 