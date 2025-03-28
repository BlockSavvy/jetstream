import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
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
    
    // Generate some test offers
    const sampleOffers = [];
    
    // Function to add days to a date
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };
    
    // Generate 5 sample offers with different dates
    for (let i = 0; i < 5; i++) {
      const flightDate = addDays(new Date(), 3 + i * 2);
      
      // Create dummy test data that looks realistic
      const testOffer = {
        user_id: user.id,
        flight_date: flightDate.toISOString(),
        departure_location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Boston'][i % 5],
        arrival_location: ['London', 'Paris', 'Tokyo', 'Dubai', 'Singapore'][i % 5],
        total_flight_cost: 15000 + (i * 5000), // Varying costs
        requested_share_amount: 7500 + (i * 2500), // 50% of total cost
        status: 'open'
      };
      
      sampleOffers.push(testOffer);
    }
    
    // Insert all sample offers at once
    const { data: insertedOffers, error: insertError } = await supabase
      .from('jetshare_offers')
      .insert(sampleOffers)
      .select();
    
    if (insertError) {
      return NextResponse.json({ error: 'Failed to seed offers', message: insertError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Created ${insertedOffers.length} sample offers`,
      offers: insertedOffers
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error seeding offers:', error);
    return NextResponse.json(
      { error: 'Failed to seed offers', message: (error as Error).message },
      { status: 500 }
    );
  }
} 