import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// This is a development-only API endpoint to seed test data
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ensure user has a profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      // Create a profile for the user if not exists
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: 'User',
          last_name: user.id.slice(0, 5),
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertProfileError) {
        return NextResponse.json({ error: 'Failed to create user profile', message: insertProfileError.message }, { status: 500 });
      }
    }
    
    // Create test data
    const testOffers = [
      {
        user_id: 'test-user-1',
        flight_date: '2025-04-01',
        departure_location: 'New York',
        arrival_location: 'Los Angeles',
        total_flight_cost: 25000,
        requested_share_amount: 12500,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: 'test-user-2',
        flight_date: '2025-04-15',
        departure_location: 'Miami',
        arrival_location: 'Chicago',
        total_flight_cost: 18000,
        requested_share_amount: 9000,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: 'test-user-3',
        flight_date: '2025-05-01',
        departure_location: 'San Francisco',
        arrival_location: 'Seattle',
        total_flight_cost: 15000,
        requested_share_amount: 7500,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Insert test offers
    const { data: offers, error } = await supabase
      .from('jetshare_offers')
      .insert(testOffers)
      .select();

    if (error) {
      throw error;
    }

    // Create test user profiles for the test users
    const testProfiles = [
      {
        id: 'test-user-1',
        first_name: 'John',
        last_name: 'Doe',
        verification_status: 'verified'
      },
      {
        id: 'test-user-2',
        first_name: 'Jane',
        last_name: 'Smith',
        verification_status: 'verified'
      },
      {
        id: 'test-user-3',
        first_name: 'Mike',
        last_name: 'Johnson',
        verification_status: 'verified'
      }
    ];

    // Insert test profiles
    const { error: insertProfileError } = await supabase
      .from('profiles')
      .upsert(testProfiles);

    if (insertProfileError) {
      throw insertProfileError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test data seeded successfully',
      offers 
    });

  } catch (error) {
    console.error('Error seeding test data:', error);
    return NextResponse.json(
      { error: 'Failed to seed test data', message: (error as Error).message },
      { status: 500 }
    );
  }
} 