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
        departure,
        arrival,
        flight_date: parsedDate,
        jet_type: validatedJetType,
        total_cost: parsedTotalCost,
        share_amount,
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
      departure: data.departure,
      arrival: data.arrival,
      flight_date: data.flight_date,
      formatted_date: new Date(data.flight_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      jet_type: data.jet_type,
      total_cost: data.total_cost,
      formatted_cost: data.total_cost ? 
        new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(data.total_cost) : 
        'Not specified',
      share_amount: data.share_amount,
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