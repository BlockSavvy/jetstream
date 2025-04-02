#!/usr/bin/env tsx
/**
 * JetShare Test Offers Seeding Script
 * 
 * This script creates sample jetshare offers for testing the AI agent.
 * It creates offers from different users with various destinations and dates.
 * 
 * Usage:
 *   npx tsx scripts/seed-test-jetshare-offers.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample user IDs (replace with actual user IDs from your database)
const sampleUserIds: string[] = [];

// Sample airports
const airports = [
  { code: 'KDEN', name: 'Denver International Airport', city: 'Denver', country: 'USA' },
  { code: 'KJFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { code: 'KLAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
  { code: 'KMIA', name: 'Miami International Airport', city: 'Miami', country: 'USA' },
  { code: 'KLAS', name: 'Harry Reid International Airport', city: 'Las Vegas', country: 'USA' },
];

// Sample aircraft models
const aircraftModels = [
  'Gulfstream G650',
  'Bombardier Global 7500',
  'Dassault Falcon 8X',
  'Cessna Citation Longitude',
  'Embraer Praetor 600',
];

// Helper function to get a random item from an array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get a random future date within the next 30 days
function getRandomFutureDate(daysAhead = 30): string {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * daysAhead * 24 * 60 * 60 * 1000);
  return futureDate.toISOString().split('T')[0];
}

// Generate a random time (HH:MM)
function getRandomTime(): string {
  const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
  const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Generate a random price between min and max
function getRandomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Create a jetshare offer
async function createJetShareOffer(userId: string) {
  const departureAirport = getRandomItem(airports);
  
  // Make sure arrival airport is different from departure
  let arrivalAirport;
  do {
    arrivalAirport = getRandomItem(airports);
  } while (arrivalAirport.code === departureAirport.code);
  
  const flightDate = getRandomFutureDate();
  const departureTime = getRandomTime();
  const totalFlightCost = getRandomPrice(15000, 50000);
  const availableSeats = Math.floor(Math.random() * 10) + 2; // 2 to 12 seats
  const costPerSeat = Math.floor(totalFlightCost / availableSeats);
  
  // Use a valid status value
  const status = 'open'; // Valid values are 'open' and 'completed'
  
  const offer = {
    id: uuidv4(),
    user_id: userId,
    departure_location: departureAirport.code,
    arrival_location: arrivalAirport.code,
    flight_date: flightDate,
    total_flight_cost: totalFlightCost,
    available_seats: availableSeats,
    requested_share_amount: costPerSeat,
    status: status,
    aircraft_model: getRandomItem(aircraftModels),
    total_seats: availableSeats + Math.floor(Math.random() * 3), // Total seats slightly higher than available
    tickets_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('jetshare_offers').insert([offer]);

  if (error) {
    console.error(`Error creating offer: ${error.message}`);
    return null;
  }

  console.log(`Created offer from ${departureAirport.city} to ${arrivalAirport.city} on ${flightDate} with status '${status}'`);
  return offer;
}

// Main function to create offers
async function createTestOffers() {
  try {
    // First, get a list of user IDs from the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);

    if (profilesError) {
      console.error(`Error fetching profiles: ${profilesError.message}`);
      process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
      console.error('No profiles found in the database');
      process.exit(1);
    }

    console.log(`Found ${profiles.length} user profiles`);
    
    // Use the fetched user IDs
    const userIds = profiles.map(profile => profile.id);
    
    // For debugging purposes, print the user IDs
    console.log('Using these user IDs:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.id} (${profile.email || 'No email'})`);
    });
    
    // Delete existing offers
    console.log('Clearing existing jetshare offers...');
    const { error: deleteError } = await supabase
      .from('jetshare_offers')
      .delete()
      .not('id', 'is', null);
    
    if (deleteError) {
      console.error(`Error deleting existing offers: ${deleteError.message}`);
    } else {
      console.log('Successfully cleared existing offers');
    }

    // Create 15 sample offers
    console.log('Creating new test offers...');
    const offerPromises = [];
    for (let i = 0; i < 15; i++) {
      const userId = userIds[i % userIds.length]; // Cycle through available users
      offerPromises.push(createJetShareOffer(userId));
    }

    await Promise.all(offerPromises);
    console.log('Test offers created successfully!');
    
    // Create some specific test cases for Denver
    console.log('Creating specific test offers for Denver...');
    
    // Offer from Denver to New York
    await createSpecificOffer(
      userIds[0],
      'KDEN', 'Denver', 'USA',
      'KJFK', 'New York', 'USA',
      getRandomFutureDate(7), // Within the next week
      getRandomTime(),
      'Gulfstream G650',
      35000,
      4
    );
    
    // Offer from Denver to Miami
    await createSpecificOffer(
      userIds[1],
      'KDEN', 'Denver', 'USA',
      'KMIA', 'Miami', 'USA',
      getRandomFutureDate(14), // Within the next two weeks
      getRandomTime(),
      'Bombardier Global 7500',
      42000,
      6
    );
    
    // Offer from Denver to Los Angeles
    await createSpecificOffer(
      userIds[2],
      'KDEN', 'Denver', 'USA',
      'KLAX', 'Los Angeles', 'USA',
      getRandomFutureDate(3), // Very soon
      getRandomTime(),
      'Cessna Citation Longitude',
      28000,
      3
    );
    
    console.log('Specific test offers created successfully!');
    
    // Show a summary of created offers
    const { data: allOffers, error: countError } = await supabase
      .from('jetshare_offers')
      .select('*');
      
    if (countError) {
      console.error(`Error fetching offer count: ${countError.message}`);
    } else {
      console.log(`Total offers in database: ${allOffers?.length || 0}`);
    }
    
    console.log('\nNow you should run the embedding worker to generate embeddings:');
    console.log('npx dotenv-cli -e .env.local -- npx tsx scripts/embedding-worker.ts --batch-size=30');
    
  } catch (error) {
    console.error('Error in createTestOffers:', error);
  }
}

// Create a specific jetshare offer with provided details
async function createSpecificOffer(
  userId: string,
  departureCode: string,
  departureCity: string,
  departureCountry: string,
  arrivalCode: string,
  arrivalCity: string,
  arrivalCountry: string,
  flightDate: string,
  departureTime: string,
  aircraftModel: string,
  totalFlightCost: number,
  availableSeats: number
) {
  const costPerSeat = Math.floor(totalFlightCost / availableSeats);
  
  // Use a valid status value
  const status = 'open'; // Valid values are 'open' and 'completed'
  
  const offer = {
    id: uuidv4(),
    user_id: userId,
    departure_location: departureCode,
    arrival_location: arrivalCode,
    flight_date: flightDate,
    total_flight_cost: totalFlightCost,
    available_seats: availableSeats,
    requested_share_amount: costPerSeat,
    status: status,
    aircraft_model: aircraftModel,
    total_seats: availableSeats + 1, // One seat for the owner
    tickets_generated: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('jetshare_offers').insert([offer]);

  if (error) {
    console.error(`Error creating specific offer: ${error.message}`);
    return null;
  }

  console.log(`Created specific offer from ${departureCity} to ${arrivalCity} on ${flightDate} with status '${status}'`);
  return offer;
}

// Run the main function
createTestOffers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 