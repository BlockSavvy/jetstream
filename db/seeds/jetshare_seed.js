/**
 * Seed script for JetShare feature
 * Populates the database with sample JetShare offers and transactions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to generate random future date
const randomFutureDate = (daysAhead = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date.toISOString();
};

// Helper function to generate random past date
const randomPastDate = (daysAgo = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo) - 1);
  return date.toISOString();
};

// Helper function to get random element from array
const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Sample locations
const locations = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Miami, FL',
  'Las Vegas, NV',
  'San Francisco, CA',
  'Seattle, WA',
  'Boston, MA',
  'Dallas, TX',
  'Atlanta, GA',
  'Denver, CO',
  'Austin, TX',
  'Nashville, TN',
  'New Orleans, LA',
  'Washington, DC'
];

// Sample flight cost ranges
const flightCostRanges = [
  { min: 20000, max: 35000 },
  { min: 35000, max: 50000 },
  { min: 50000, max: 75000 },
  { min: 75000, max: 100000 }
];

// Generate random flight cost
const randomFlightCost = () => {
  const range = randomElement(flightCostRanges);
  return Math.floor(Math.random() * (range.max - range.min) + range.min);
};

// Calculate share amount (usually 40-60% of total cost)
const calculateShareAmount = (totalCost) => {
  const percentage = Math.random() * 0.2 + 0.4; // 40-60%
  return Math.floor(totalCost * percentage);
};

// Seed the database with sample data
async function seedJetShare() {
  try {
    console.log('Starting JetShare seed process...');

    // Get users to use as sample data
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .limit(10);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    if (!users || users.length < 2) {
      throw new Error('Not enough users found to seed data. Please create at least 2 users first.');
    }

    console.log(`Found ${users.length} users for seeding.`);

    // Check if settings exist, if not, create default
    const { data: settings, error: settingsError } = await supabase
      .from('jetshare_settings')
      .select('id')
      .limit(1);

    if (settingsError) {
      throw new Error(`Error checking settings: ${settingsError.message}`);
    }

    if (!settings || settings.length === 0) {
      const { error: insertSettingsError } = await supabase
        .from('jetshare_settings')
        .insert([
          {
            handling_fee_percentage: 7.5,
            allow_crypto_payments: true,
            allow_fiat_payments: true
          }
        ]);

      if (insertSettingsError) {
        throw new Error(`Error inserting settings: ${insertSettingsError.message}`);
      }

      console.log('Created default JetShare settings.');
    }

    // Create sample offers
    const offers = [];
    
    // Open offers (5)
    for (let i = 0; i < 5; i++) {
      const departure = randomElement(locations);
      let arrival;
      do {
        arrival = randomElement(locations);
      } while (arrival === departure);

      const totalCost = randomFlightCost();
      const shareAmount = calculateShareAmount(totalCost);

      offers.push({
        user_id: randomElement(users).id,
        flight_date: randomFutureDate(60),
        departure_location: departure,
        arrival_location: arrival,
        total_flight_cost: totalCost,
        requested_share_amount: shareAmount,
        status: 'open'
      });
    }

    // Accepted offers (3)
    for (let i = 0; i < 3; i++) {
      const departure = randomElement(locations);
      let arrival;
      do {
        arrival = randomElement(locations);
      } while (arrival === departure);

      const totalCost = randomFlightCost();
      const shareAmount = calculateShareAmount(totalCost);
      const userId = randomElement(users).id;
      let matchedUserId;
      do {
        matchedUserId = randomElement(users).id;
      } while (matchedUserId === userId);

      offers.push({
        user_id: userId,
        flight_date: randomFutureDate(30),
        departure_location: departure,
        arrival_location: arrival,
        total_flight_cost: totalCost,
        requested_share_amount: shareAmount,
        status: 'accepted',
        matched_user_id: matchedUserId
      });
    }

    // Completed offers (4)
    for (let i = 0; i < 4; i++) {
      const departure = randomElement(locations);
      let arrival;
      do {
        arrival = randomElement(locations);
      } while (arrival === departure);

      const totalCost = randomFlightCost();
      const shareAmount = calculateShareAmount(totalCost);
      const userId = randomElement(users).id;
      let matchedUserId;
      do {
        matchedUserId = randomElement(users).id;
      } while (matchedUserId === userId);

      offers.push({
        user_id: userId,
        flight_date: randomPastDate(45),
        departure_location: departure,
        arrival_location: arrival,
        total_flight_cost: totalCost,
        requested_share_amount: shareAmount,
        status: 'completed',
        matched_user_id: matchedUserId
      });
    }

    // Insert the offers
    const { data: insertedOffers, error: offersError } = await supabase
      .from('jetshare_offers')
      .insert(offers)
      .select();

    if (offersError) {
      throw new Error(`Error inserting offers: ${offersError.message}`);
    }

    console.log(`Successfully created ${insertedOffers.length} sample offers.`);

    // Create transactions for accepted and completed offers
    const transactions = [];
    
    // For each accepted or completed offer, create a transaction
    for (const offer of insertedOffers) {
      if (offer.status === 'accepted' || offer.status === 'completed') {
        const handlingFeePercentage = 7.5;
        const amount = parseFloat(offer.requested_share_amount);
        const handlingFee = parseFloat((amount * (handlingFeePercentage / 100)).toFixed(2));
        
        transactions.push({
          offer_id: offer.id,
          payer_user_id: offer.matched_user_id,
          recipient_user_id: offer.user_id,
          amount: amount,
          handling_fee: handlingFee,
          payment_method: Math.random() > 0.5 ? 'fiat' : 'crypto',
          payment_status: offer.status === 'completed' ? 'completed' : 'pending',
          transaction_date: offer.status === 'completed' ? randomPastDate(30) : new Date().toISOString(),
          transaction_reference: `tx_${Math.random().toString(36).substring(2, 15)}`
        });
      }
    }

    // Insert the transactions
    const { data: insertedTransactions, error: transactionsError } = await supabase
      .from('jetshare_transactions')
      .insert(transactions)
      .select();

    if (transactionsError) {
      throw new Error(`Error inserting transactions: ${transactionsError.message}`);
    }

    console.log(`Successfully created ${insertedTransactions.length} sample transactions.`);
    console.log('JetShare seed process completed successfully!');

  } catch (error) {
    console.error('Error seeding JetShare data:', error.message);
    process.exit(1);
  }
}

// Run the seed function
seedJetShare(); 