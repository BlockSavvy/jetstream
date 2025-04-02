import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const {
      departure,
      arrival,
      flight_date,
      jet_type = 'Not specified',
      total_cost,
      share_amount,
      user_id,
    } = await request.json();

    console.log('CreateJetShareOffer API called with:', { 
      departure, arrival, flight_date, jet_type, total_cost, share_amount, user_id 
    });

    // Validate required parameters
    if (!departure || !arrival || !flight_date || !total_cost || !share_amount || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters for offer creation'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Connect to Supabase with service role
    const supabase = createClient();
    
    // Format data for insertion
    const departureDate = new Date(flight_date);
    
    // Parse share amount - could be a percentage or number of seats
    let parsedShareAmount = share_amount;
    if (typeof share_amount === 'string') {
      if (share_amount.includes('%')) {
        parsedShareAmount = share_amount; // Keep as percentage string
      } else {
        // Try to convert to number if it's not a percentage
        const numericValue = parseFloat(share_amount.replace(/[^0-9.]/g, ''));
        if (!isNaN(numericValue)) {
          parsedShareAmount = numericValue;
        }
      }
    }

    // Calculate flight cost based on total and share amount
    let availableSeats = 0;
    let totalSeats = 0;
    
    // Determine total seats based on jet type
    switch(jet_type.toLowerCase()) {
      case 'g600':
      case 'gulfstream g600':
        totalSeats = 19;
        break;
      case 'g550':
      case 'gulfstream g550':
        totalSeats = 16;
        break;
      case 'citation x':
        totalSeats = 8;
        break;
      case 'phenom 300':
        totalSeats = 7;
        break;
      case 'legacy 600':
        totalSeats = 13;
        break;
      case 'g450':
      case 'gulfstream g450':
        totalSeats = 16;
        break;
      default:
        totalSeats = 10; // Default if jet type is unknown
    }
    
    // Calculate available seats based on share amount
    if (typeof parsedShareAmount === 'string' && parsedShareAmount.includes('%')) {
      const percentage = parseFloat(parsedShareAmount.replace(/[^0-9.]/g, '')) / 100;
      availableSeats = Math.round(totalSeats * percentage);
    } else if (typeof parsedShareAmount === 'number') {
      availableSeats = parsedShareAmount;
    } else if (typeof parsedShareAmount === 'string') {
      // Handle cases like "half" or "3 seats"
      if (parsedShareAmount.toLowerCase().includes('half')) {
        availableSeats = Math.floor(totalSeats / 2);
      } else if (parsedShareAmount.toLowerCase().includes('all but one') || 
                parsedShareAmount.toLowerCase().includes('all except one')) {
        availableSeats = totalSeats - 1;
      } else {
        // Try to extract a number
        const match = parsedShareAmount.match(/\d+/);
        if (match) {
          availableSeats = parseInt(match[0]);
        } else {
          availableSeats = Math.floor(totalSeats / 2); // Default to half if we can't parse
        }
      }
    }
    
    // Ensure available seats is valid
    availableSeats = Math.min(Math.max(1, availableSeats), totalSeats - 1);
    
    // Create a new jetshare offer
    console.log('Creating JetShare offer with:', {
      user_id,
      departure_location: departure,
      arrival_location: arrival,
      departure_date: departureDate.toISOString(),
      aircraft_model: jet_type,
      total_seats: totalSeats,
      available_seats: availableSeats,
      total_flight_cost: parseFloat(total_cost.toString()),
      status: 'active'
    });
    
    const { data, error } = await supabase
      .from('jetshare_offers')
      .insert({
        user_id,
        departure_location: departure,
        arrival_location: arrival,
        departure_date: departureDate.toISOString(),
        aircraft_model: jet_type,
        total_seats: totalSeats,
        available_seats: availableSeats,
        total_flight_cost: parseFloat(total_cost.toString()),
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating JetShare offer:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create JetShare offer: ' + error.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('JetShare offer created successfully:', data.id);
    
    // Return success response with the offer ID
    return new Response(
      JSON.stringify({
        success: true,
        offer_id: data.id,
        message: `Successfully created JetShare offer from ${departure} to ${arrival}`,
        details: {
          departure,
          arrival,
          flight_date: departureDate.toISOString(),
          jet_type,
          total_seats: totalSeats,
          available_seats: availableSeats,
          total_cost: parseFloat(total_cost.toString()),
          share_amount: parsedShareAmount
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-jetshare-offer API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (error as Error).message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 