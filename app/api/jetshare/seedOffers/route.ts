import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Define a list of sample destinations
const destinations = [
  { departure: 'New York', arrival: 'Los Angeles' },
  { departure: 'Miami', arrival: 'Las Vegas' },
  { departure: 'Chicago', arrival: 'San Francisco' },
  { departure: 'Boston', arrival: 'Seattle' },
  { departure: 'Dallas', arrival: 'Denver' },
  { departure: 'Atlanta', arrival: 'Phoenix' },
  { departure: 'Houston', arrival: 'Orlando' },
  { departure: 'Washington DC', arrival: 'San Diego' },
];

// Define function to generate random dates
function getRandomFutureDate(minDays = 5, maxDays = 60) {
  const today = new Date();
  const futureDate = new Date(today);
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  futureDate.setDate(today.getDate() + randomDays);
  return futureDate.toISOString();
}

// Generate random past date for completed offers
function getRandomPastDate(minDays = 5, maxDays = 30) {
  const today = new Date();
  const pastDate = new Date(today);
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  pastDate.setDate(today.getDate() - randomDays);
  return pastDate.toISOString();
}

// Generate a random cost for a flight
function getRandomCost(min = 20000, max = 75000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Define the POST handler for seeding offers
export async function POST(request: NextRequest) {
  try {
    // Verify permissions - we might want to restrict this in production
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const {
      userId = user.id, // Default to current user if not provided
      secondUserId, // Optional second user for matched offers
      options = {
        openOffers: true,
        acceptedOffers: true,
        completedOffers: true,
        deleteExisting: false
      }
    } = body;
    
    console.log('Seeding offers with options:', {
      userId,
      secondUserId,
      options
    });
    
    // Validate user IDs
    if (!userId) {
      return NextResponse.json(
        { error: 'Primary user ID is required' },
        { status: 400 }
      );
    }
    
    // If deleteExisting is true, delete existing offers for this user
    if (options.deleteExisting) {
      console.log('Deleting existing offers for user:', userId);
      
      // Delete transactions first (foreign key constraint)
      const { error: deleteTransactionsError } = await supabase
        .from('jetshare_transactions')
        .delete()
        .or(`payer_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
        
      if (deleteTransactionsError) {
        console.error('Error deleting transactions:', deleteTransactionsError);
      }
      
      // Delete offers
      const { error: deleteError } = await supabase
        .from('jetshare_offers')
        .delete()
        .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
        
      if (deleteError) {
        console.error('Error deleting offers:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete existing offers', details: deleteError.message },
          { status: 500 }
        );
      }
      
      if (secondUserId) {
        // Delete transactions for second user
        await supabase
          .from('jetshare_transactions')
          .delete()
          .or(`payer_user_id.eq.${secondUserId},recipient_user_id.eq.${secondUserId}`);
        
        // Delete offers for second user
        await supabase
          .from('jetshare_offers')
          .delete()
          .or(`user_id.eq.${secondUserId},matched_user_id.eq.${secondUserId}`);
      }
    }
    
    // Create arrays to hold our generated offers
    const offers = [];
    
    // 1. Generate open offers if requested
    if (options.openOffers) {
      console.log('Creating open offers...');
      
      // Create 3-5 open offers
      const openOfferCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < openOfferCount; i++) {
        const destination = destinations[Math.floor(Math.random() * destinations.length)];
        const totalCost = getRandomCost();
        const requestedShare = Math.round(totalCost * (Math.random() * 0.2 + 0.4)); // 40-60% of total
        
        const openOffer = {
          user_id: userId,
          flight_date: getRandomFutureDate(),
          departure_location: destination.departure,
          arrival_location: destination.arrival,
          total_flight_cost: totalCost,
          requested_share_amount: requestedShare,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        offers.push(openOffer);
      }
    }
    
    // 2. Generate accepted offers if requested
    if (options.acceptedOffers && secondUserId) {
      console.log('Creating accepted offers...');
      
      // Create 2-3 accepted offers
      const acceptedOfferCount = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < acceptedOfferCount; i++) {
        const destination = destinations[Math.floor(Math.random() * destinations.length)];
        const totalCost = getRandomCost();
        const requestedShare = Math.round(totalCost * (Math.random() * 0.2 + 0.4)); // 40-60% of total
        
        const acceptedOffer = {
          user_id: userId,
          matched_user_id: secondUserId,
          flight_date: getRandomFutureDate(10, 30),
          departure_location: destination.departure,
          arrival_location: destination.arrival,
          total_flight_cost: totalCost,
          requested_share_amount: requestedShare,
          status: 'accepted',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          updated_at: new Date().toISOString()
        };
        
        offers.push(acceptedOffer);
      }
    }
    
    // 3. Generate completed offers if requested
    if (options.completedOffers && secondUserId) {
      console.log('Creating completed offers...');
      
      // Create 2-4 completed offers
      const completedOfferCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < completedOfferCount; i++) {
        const destination = destinations[Math.floor(Math.random() * destinations.length)];
        const totalCost = getRandomCost();
        const requestedShare = Math.round(totalCost * (Math.random() * 0.2 + 0.4)); // 40-60% of total
        const pastDate = getRandomPastDate();
        
        const completedOffer = {
          user_id: userId,
          matched_user_id: secondUserId,
          flight_date: pastDate,
          departure_location: destination.departure,
          arrival_location: destination.arrival,
          total_flight_cost: totalCost,
          requested_share_amount: requestedShare,
          status: 'completed',
          created_at: new Date(new Date(pastDate).getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days before flight
          updated_at: new Date(new Date(pastDate).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days before flight
        };
        
        offers.push(completedOffer);
      }
    }
    
    // Insert all offers
    console.log(`Inserting ${offers.length} offers...`);
    const { data: insertedOffers, error: insertError } = await supabase
      .from('jetshare_offers')
      .insert(offers)
      .select();
      
    if (insertError) {
      console.error('Error inserting offers:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert offers', details: insertError.message },
        { status: 500 }
      );
    }
    
    console.log(`Successfully inserted ${insertedOffers.length} offers`);
    
    // Create transactions for completed offers
    if (options.completedOffers && secondUserId) {
      console.log('Creating transactions for completed offers...');
      
      const transactions = insertedOffers
        .filter(offer => offer.status === 'completed')
        .map(offer => ({
          offer_id: offer.id,
          payer_user_id: secondUserId,
          recipient_user_id: userId,
          amount: offer.requested_share_amount,
          handling_fee: Math.round(offer.requested_share_amount * 0.075),
          payment_method: Math.random() > 0.5 ? 'card' : 'fiat',
          payment_status: 'completed',
          transaction_reference: `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
          transaction_date: new Date(new Date(offer.flight_date).getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days before flight
        }));
        
      if (transactions.length > 0) {
        const { error: transactionError } = await supabase
          .from('jetshare_transactions')
          .insert(transactions);
          
        if (transactionError) {
          console.error('Error inserting transactions:', transactionError);
          // Continue anyway, as the offers were inserted successfully
        } else {
          console.log(`Successfully inserted ${transactions.length} transactions`);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully seeded offers',
      count: insertedOffers.length
    });
  } catch (error) {
    console.error('Unexpected error in seedOffers:', error);
    return NextResponse.json(
      { error: 'Failed to seed offers', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 