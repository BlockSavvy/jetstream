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
    
    // Also check for GDYUP in the URL or referrer to handle cross-domain redirects
    const referrer = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const url = request.url || '';

    // Multiple ways to detect if this is a GDYUP-related request
    const isFromGdyup = 
      referrer.includes('gdyup') || 
      requestUrl.searchParams.get('app') === 'gdyup' ||
      url.includes('gdyup') ||
      userAgent.includes('GDYUP-App');

    // Force GDYUP mode if the URL contains 'gdyup' (highest priority)
    const forceGdyupMode = url.includes('gdyup');
    const finalIsGdyup = isGdyup || isFromGdyup || forceGdyupMode;

    console.log('📱 Request context:', {
      referrer: referrer.substring(0, 50) + (referrer.length > 50 ? '...' : ''),
      url: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
      userAgent: userAgent.substring(0, 50) + (userAgent.length > 50 ? '...' : ''),
      isFromGdyup,
      forceGdyupMode,
      finalIsGdyup
    });
    
    // Check for error in the URL - commonly happens when the link is expired
    if (error) {
      console.error(`❌ Auth callback error: ${error}, description: ${errorDescription}`)
      // Redirect to login with error message
      const loginUrl = new URL(finalIsGdyup ? '/gdyup/auth/login' : '/auth/login', requestUrl.origin)
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
          const loginUrl = new URL(finalIsGdyup ? '/gdyup/auth/login' : '/auth/login', requestUrl.origin)
          loginUrl.searchParams.set('error', error.message)
          return NextResponse.redirect(loginUrl)
        } 
        
        if (data?.session) {
          console.log('✅ Session established successfully, user ID:', data.session.user.id)
          
          // Allow cookies to be properly set before profile creation
          console.log('⏱️ Allowing time for cookies to be set before profile creation');
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Create or update user profile
          const profileResult = await createOrUpdateUserProfile(supabase, data.session.user.id, data.session.user.email)
          console.log('👤 Profile creation result:', profileResult);
          
          // Allow cookies to be properly set after profile update
          console.log('⏱️ Allowing additional time for cookies to be properly set');
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get user metadata to check if this was a GDYUP signup
          const userData = data.session.user.user_metadata || {};
          const userAppMode = userData.app_mode as string || '';
          const isUserFromGdyup = userAppMode === 'gdyup' || 
                                   userData.source === 'gdyup' || 
                                   userData.app === 'gdyup';
          
          console.log(' User metadata:', { 
            userAppMode, 
            isUserFromGdyup,
            userData: JSON.stringify(userData).substring(0, 100) 
          });
          
          // Determine if we should redirect to GDYUP
          const shouldRedirectToGdyup = finalIsGdyup || isUserFromGdyup;
          
          // For GDYUP users, prioritize redirecting to the GDYUP app
          if (shouldRedirectToGdyup) {
            console.log('🚀 GDYUP User: Redirecting to GDYUP app after authentication')
            return NextResponse.redirect(new URL('/gdyup', requestUrl.origin))
          }
          
          // If the referrer or returnUrl is from JetShare, redirect there
          if (referrer.includes('/jetshare') || requestUrl.searchParams.get('returnUrl')?.includes('/jetshare')) {
            console.log('🚀 Redirecting to JetShare after authentication')
            return NextResponse.redirect(new URL('/jetshare', requestUrl.origin))
          }
          
          // If this is a mobile app and the type is signup or recovery
          if (isMobile && (type === 'signup' || type === 'recovery')) {
            if (shouldRedirectToGdyup) {
              console.log('📱 Mobile signup/recovery detected for GDYUP, redirecting to GDYUP app')
              return NextResponse.redirect(new URL('/gdyup', requestUrl.origin))
            } else {
              console.log('📱 Mobile signup/recovery detected, redirecting to appropriate dashboard')
              return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
            }
          }
          
          // If this is after signup/verification or password recovery (non-mobile)
          if (type === 'signup' || type === 'recovery') {
            if (shouldRedirectToGdyup) {
              console.log('🚀 Redirecting to GDYUP after signup/recovery')
              return NextResponse.redirect(new URL('/gdyup', requestUrl.origin))
            } else {
              console.log('🚀 Redirecting to dashboard after signup/recovery')
              return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
            }
          }
          
          // For other auth flows, redirect to the requested return URL or home
          const returnUrl = requestUrl.searchParams.get('returnUrl');
          const defaultRedirect = shouldRedirectToGdyup ? '/gdyup' : '/';
          const redirectUrl = returnUrl 
            ? new URL(returnUrl, requestUrl.origin) 
            : new URL(defaultRedirect, requestUrl.origin);
            
          console.log(`🚀 Redirecting to: ${redirectUrl.pathname}`)
          return NextResponse.redirect(redirectUrl)
        } else {
          console.log('⚠️ No session data returned after code exchange');
        }
      } catch (exchangeError) {
        console.error('❌ Exception during code exchange:', exchangeError)
        // Redirect to login with generic error message
        const loginUrl = new URL(finalIsGdyup ? '/gdyup/auth/login' : '/auth/login', requestUrl.origin)
        loginUrl.searchParams.set('error', 'Failed to process authentication')
        return NextResponse.redirect(loginUrl)
      }
    }
    
    // If we get here without a code or after processing the code, redirect to appropriate home
    console.log('ℹ️ No code provided or processing complete, redirecting to home');
    const homePath = finalIsGdyup ? '/gdyup' : '/';
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
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileQueryError) {
      console.log(`⚠️ Error checking if profile exists: ${profileQueryError.message}. Profile might not exist yet.`);
      // Continue to profile creation if error is "not found"
    }
    
    if (!existingProfile) {
      console.log(`🆕 Creating new profile for user ${userId}`);
      
      // Extract name from email if available
      let firstName = 'User';  // Default value
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
      
      // Ensure first_name is never null
      if (!firstName || firstName.trim() === '') {
        firstName = 'User';
      }
      
      // Ensure last_name is never null (it's a required field)
      if (!lastName || lastName.trim() === '') {
        lastName = email ? email.split('@')[0] : 'Profile';
      }
      
      console.log(`👤 Extracted name info: first_name="${firstName}", last_name="${lastName}"`);
      
      const fullName = `${firstName} ${lastName}`.trim();
      
      // Create profile object with all required fields
      const profileData = {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Required fields from schema
        user_type: 'traveler',
        verification_status: 'pending',
        // Onboarding fields
        onboarding_completed: false,
        onboarding_step: 'profile',
        profile_visibility: 'public',
        has_jet: false
      };
      
      console.log('📝 Inserting profile with data:', JSON.stringify(profileData));
      
      // Create new profile with all required fields
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error creating user profile:', insertError);
        // Log more details about the error
        console.error('Error code:', insertError.code);
        console.error('Error details:', insertError.details);
        console.error('Error message:', insertError.message);
        console.error('Error hint:', insertError.hint);
        
        return { 
          success: false, 
          error: insertError,
          message: `Failed to create profile: ${insertError.message}` 
        };
      } else {
        console.log(`✅ Profile created successfully for user ${userId}`);
        return { success: true, profile: newProfile };
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
        return {
          success: false,
          error: updateError,
          message: `Failed to update profile: ${updateError.message}`
        };
      } else {
        console.log(`✅ Profile updated successfully for user ${userId}`);
        return { success: true, profile: existingProfile };
      }
    }
  } catch (error) {
    console.error('❌ Error in createOrUpdateUserProfile:', error);
    return { 
      success: false, 
      error: { message: (error as Error).message },
      message: `Error ensuring user profile: ${(error as Error).message}` 
    };
  }
} 