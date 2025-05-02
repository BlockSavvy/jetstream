import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper function to safely parse numeric values
function safelyParseNumeric(value: any): number | null {
  if (value === null || value === undefined || value === 'N/A') {
    return null;
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  // Try to parse as number if it's a string
  if (typeof value === 'string') {
    // Check if it contains a decimal point
    if (value.includes('.')) {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    } else {
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    }
  }
  
  return null;
}

export async function GET(request: Request) {
  try {
    // Get jet_id from query params
    const { searchParams } = new URL(request.url);
    const jet_id = searchParams.get('jet_id');

    if (!jet_id) {
      return NextResponse.json({ error: 'Missing jet_id parameter' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // First, get the basic jet data
    const { data: jet, error } = await supabase
      .from('jets')
      .select('*')
      .eq('id', jet_id)
      .single();

    // *** ADD LOGGING ***
    console.log('[getJet API] Data fetched from jets table for ID:', jet_id, 'Result:', jet);
    // *** END LOGGING ***

    if (error) {
      console.error('Error fetching jet:', error);
      return NextResponse.json({ error: 'Failed to fetch jet' }, { status: 500 });
    }

    // If no jet was found, return a 404
    if (!jet) {
      return NextResponse.json({ error: 'Jet not found' }, { status: 404 });
    }

    // Get the associated jet interior data
    const { data: interiorData } = await supabase
      .from('jet_interiors')
      .select('*')
      .eq('jet_id', jet_id)
      .single();

    // Process numeric values to ensure they're returned as numbers, not strings
    const processedJet = {
      ...jet,
      capacity: safelyParseNumeric(jet.capacity),
      range_nm: safelyParseNumeric(jet.range_nm),
      cruise_speed_kts: safelyParseNumeric(jet.cruise_speed_kts),
      max_altitude: safelyParseNumeric(jet.max_altitude),
      cabin_width: safelyParseNumeric(jet.cabin_width),
      cabin_height: safelyParseNumeric(jet.cabin_height),
      cabin_length: safelyParseNumeric(jet.cabin_length),
      year: safelyParseNumeric(jet.year),
    };
    
    // Process interior data numeric values
    const processedInteriorData = interiorData ? {
      ...interiorData,
      seats: safelyParseNumeric(interiorData.seats),
    } : null;

    // Merge the interior data if available
    const completeJetData = {
      ...processedJet,
      ...(processedInteriorData || {}),
      id: processedJet.id,
      // Ensure these critical fields are present with either DB values or correct defaults
      capacity: processedJet.capacity || (processedInteriorData?.seats || 8),
      tail_number: processedJet.tail_number || 'N/A',
      year: processedJet.year || null,
      range_nm: processedJet.range_nm || null,
      cruise_speed_kts: processedJet.cruise_speed_kts || null,
      max_altitude: processedJet.max_altitude || null,
      cabin_width: processedJet.cabin_width || null,
      cabin_height: processedJet.cabin_height || null,
      cabin_length: processedJet.cabin_length || null,
    };

    console.log('Returning jet data:', completeJetData);
    
    // Return the enhanced jet data
    return NextResponse.json({ jet: completeJetData });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 