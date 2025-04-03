import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Helper to parse natural language dates
function parseFlightDate(dateStr: string): string {
  try {
    if (!dateStr) return new Date().toISOString();
    
    // Check if already in ISO format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return dateStr;
    }
    
    // Handle common phrases
    const today = new Date();
    
    if (dateStr.toLowerCase().includes('today')) {
      // Set to later today if it's "today"
      today.setHours(today.getHours() + 3);
      return today.toISOString();
    }
    
    if (dateStr.toLowerCase().includes('tomorrow')) {
      // Set to tomorrow
      today.setDate(today.getDate() + 1);
      today.setHours(12, 0, 0, 0); // Noon
      return today.toISOString();
    }
    
    if (dateStr.toLowerCase().includes('next week')) {
      // Set to next week
      today.setDate(today.getDate() + 7);
      today.setHours(12, 0, 0, 0); // Noon
      return today.toISOString();
    }
    
    // Try to parse using Date constructor
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
    
    // Default to today+2days if we can't parse
    today.setDate(today.getDate() + 2);
    today.setHours(12, 0, 0, 0); // Noon
    return today.toISOString();
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date().toISOString();
  }
}

// Helper to extract time from date string or parse time
function parseTime(timeStr: string, dateStr: string): string | null {
  try {
    if (!timeStr) return null;
    
    // If it's already a complete ISO datetime string, return it
    if (timeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return timeStr;
    }
    
    // Get the date part from the flight_date
    const flightDate = new Date(parseFlightDate(dateStr));
    const dateString = flightDate.toISOString().split('T')[0];
    
    // Handle common time formats
    if (timeStr.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      // Simple HH:MM format
      return `${dateString}T${timeStr}:00Z`;
    }
    
    // Handle AM/PM format
    const amPmMatch = timeStr.match(/^([0-1]?[0-9]):([0-5][0-9])\s*(am|pm|AM|PM)$/);
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1]);
      const minutes = amPmMatch[2];
      const period = amPmMatch[3].toLowerCase();
      
      if (period === 'pm' && hours < 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
      
      const hoursStr = hours.toString().padStart(2, '0');
      return `${dateString}T${hoursStr}:${minutes}:00Z`;
    }
    
    // Try parsing it with a full date constructor
    const combinedDateTime = `${dateString} ${timeStr}`;
    const parsedDateTime = new Date(combinedDateTime);
    if (!isNaN(parsedDateTime.getTime())) {
      return parsedDateTime.toISOString();
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing time:', error);
    return null;
  }
}

// Helper to validate a jet type
function validateJetType(jetType: string): string {
  const validJetTypes = ['G600', 'G550', 'Citation X', 'Phenom 300', 'Legacy 600', 'G450'];
  
  // If the jet type is already valid, return it
  if (validJetTypes.includes(jetType)) {
    return jetType;
  }
  
  // Try to match a partial jet type
  const matchedJet = validJetTypes.find(valid => 
    jetType.toLowerCase().includes(valid.toLowerCase()) || 
    valid.toLowerCase().includes(jetType.toLowerCase())
  );
  
  // Return matched jet or default
  return matchedJet || 'G550';
}

export async function POST(req: NextRequest) {
  try {
    const { 
      departure,
      arrival,
      flight_date,
      departure_time,
      jet_type = 'G550',
      total_cost,
      share_amount,
      user_id
    } = await req.json();
    
    // Validate required fields
    if (!departure || !arrival || !user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Process fields
    const parsedDate = parseFlightDate(flight_date);
    
    // Parse departure time if provided, otherwise use the date
    let parsedDepartureTime = null;
    if (departure_time) {
      parsedDepartureTime = parseTime(departure_time, flight_date);
    }
    
    // If departure_time couldn't be parsed, use the flight_date
    if (!parsedDepartureTime) {
      parsedDepartureTime = parsedDate;
    }
    
    const validatedJetType = validateJetType(jet_type);
    const parsedTotalCost = typeof total_cost === 'string' ? 
      parseInt(total_cost.replace(/[^0-9]/g, '')) : 
      total_cost;
    
    // Create JetShare offer in database
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('jetshare_offers')
      .insert({
        user_id,
        departure_location: departure,
        arrival_location: arrival,
        flight_date: parsedDate,
        departure_time: parsedDepartureTime,
        aircraft_model: validatedJetType,
        total_flight_cost: parsedTotalCost,
        requested_share_amount: share_amount,
        status: 'open',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating JetShare offer:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create JetShare offer' 
      }, { status: 500 });
    }
    
    // Format output
    const formattedOffer = {
      id: data.id,
      departure: data.departure_location,
      arrival: data.arrival_location,
      flight_date: data.flight_date,
      departure_time: data.departure_time,
      formatted_date: new Date(data.departure_time || data.flight_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      jet_type: data.aircraft_model,
      total_cost: data.total_flight_cost,
      formatted_cost: data.total_flight_cost ? 
        new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(data.total_flight_cost) : 
        'Not specified',
      share_amount: data.requested_share_amount,
      status: data.status
    };
    
    return NextResponse.json({
      success: true,
      message: `Successfully created JetShare offer from ${departure} to ${arrival}`,
      offer: formattedOffer
    });
  } catch (error) {
    console.error('Error processing JetShare offer creation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process JetShare offer creation request' 
    }, { status: 500 });
  }
} 