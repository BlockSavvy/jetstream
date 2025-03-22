import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Test endpoint to create a test user and profile for development
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Create a test user with a random email - using Gmail for maximum compatibility
    const timestamp = Date.now();
    const testEmail = `testuser.${timestamp}@gmail.com`;
    const testPassword = 'Test123!';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (authError) {
      console.error('Error creating test user:', authError);
      return NextResponse.json(
        { 
          error: 'Failed to create test user', 
          details: authError,
          message: authError.message || 'Authentication error',
          code: authError.code || 'unknown_error'
        },
        { status: 500 }
      );
    }
    
    const userId = authData.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to get user ID from authentication' },
        { status: 500 }
      );
    }
    
    // Create a profile for the test user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: 'Test',
        last_name: 'User',
        verification_status: 'verified',
        user_type: 'traveler',
        preferences: {
          preferredDestinations: ['NYC', 'LAX', 'MIA'],
          travelInterests: ['business', 'luxury', 'networking'],
          professionalBackground: 'Technology',
          industry: 'Software',
          tripTypes: ['business', 'leisure'],
          languages: ['English', 'Spanish'],
          amenityPreferences: ['WiFi', 'Conference Room', 'Premium Food'],
          companionPreferences: {
            professionalBackground: 'similar',
            interests: 'diverse'
          }
        }
      });
    
    if (profileError) {
      console.error('Error creating test profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to create test profile', details: profileError },
        { status: 500 }
      );
    }
    
    // Return credentials and profile info
    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: userId,
        email: testEmail,
        password: testPassword
      },
      profile: profileData
    });
    
  } catch (error: any) {
    console.error('Error in test auth endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 