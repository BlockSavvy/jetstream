import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Add a mapping of common jet models to ensure we find the right ID
const MODEL_ID_MAPPINGS: Record<string, string> = {
  'Gulfstream G650': 'gulfstream-g650',
  'G650': 'gulfstream-g650',
  'Bombardier Global 7500': 'bombardier-global-7500',
  'Global 7500': 'bombardier-global-7500',
  'Embraer Phenom 300E': 'embraer-phenom-300e',
  'Phenom 300E': 'embraer-phenom-300e',
  'Cessna Citation Longitude': 'cessna-citation-longitude',
  'Citation Longitude': 'cessna-citation-longitude',
  'Dassault Falcon 8X': 'dassault-falcon-8x',
  'Falcon 8X': 'dassault-falcon-8x'
};

export async function GET(request: NextRequest) {
  // Set standard headers
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
  
  try {
    // Get the model name from the query string
    const searchParams = request.nextUrl.searchParams;
    const model = searchParams.get('model');
    
    if (!model) {
      return NextResponse.json(
        { error: 'Model parameter is required' },
        { status: 400, headers }
      );
    }
    
    console.log(`Finding jet ID for model: ${model}`);
    
    // Check if we have a direct mapping for this model
    if (MODEL_ID_MAPPINGS[model]) {
      const mappedId = MODEL_ID_MAPPINGS[model];
      console.log(`Using predefined mapping for ${model}: ${mappedId}`);
      return NextResponse.json({ jetId: mappedId }, { headers });
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // First try exact match on display_name or model
    let { data: jets, error } = await supabase
      .from('jets')
      .select('id, model, manufacturer')
      .or(`model.ilike.${model},manufacturer.ilike.%${model}%`)
      .limit(1);
    
    if (error) {
      console.error('Error fetching jet ID by model:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jet ID', details: error.message },
        { status: 500, headers }
      );
    }
    
    // If we found a matching jet, return its ID
    if (jets && jets.length > 0) {
      console.log(`Found jet ID ${jets[0].id} for model ${model}`);
      return NextResponse.json({ jetId: jets[0].id }, { headers });
    }
    
    // If we didn't find an exact match, try partial match on model and manufacturer
    const { data: partialMatches, error: partialError } = await supabase
      .from('jets')
      .select('id, model, manufacturer')
      .or(`model.ilike.%${model}%,manufacturer.ilike.%${model}%`)
      .limit(1);
    
    if (partialError) {
      console.error('Error in partial match search:', partialError);
      return NextResponse.json(
        { error: 'Failed to fetch jet ID', details: partialError.message },
        { status: 500, headers }
      );
    }
    
    // If we found a partial match, return its ID
    if (partialMatches && partialMatches.length > 0) {
      console.log(`Found partial match jet ID ${partialMatches[0].id} for model ${model}`);
      return NextResponse.json({ jetId: partialMatches[0].id }, { headers });
    }
    
    // If we still don't have a match, check in aircraft_models table as fallback
    const { data: aircraftModels, error: aircraftError } = await supabase
      .from('aircraft_models')
      .select('id')
      .or(`model.ilike.%${model}%,display_name.ilike.%${model}%,manufacturer.ilike.%${model}%`)
      .limit(1);
    
    if (aircraftError) {
      console.error('Error in aircraft_models fallback search:', aircraftError);
      // Continue to default without erroring
    }
    
    // If we found a match in aircraft_models, use its ID
    if (aircraftModels && aircraftModels.length > 0) {
      console.log(`Found aircraft_models ID ${aircraftModels[0].id} for model ${model}`);
      return NextResponse.json({ jetId: aircraftModels[0].id }, { headers });
    }
    
    // If no match was found, generate a normalized model name for template use
    // This is better than just returning an error, as we can still show the jet
    const modelLower = model.toLowerCase();
    
    // Try to extract key model information if we have a complex name
    let normalizedModel = '';
    
    if (modelLower.includes('gulfstream') || modelLower.includes('g650')) {
      normalizedModel = 'gulfstream-g650';
    } else if (modelLower.includes('global') && modelLower.includes('7500')) {
      normalizedModel = 'bombardier-global-7500';
    } else if (modelLower.includes('phenom')) {
      normalizedModel = 'embraer-phenom-300e';
    } else if (modelLower.includes('citation') || modelLower.includes('longitude')) {
      normalizedModel = 'cessna-citation-longitude';
    } else if (modelLower.includes('falcon')) {
      normalizedModel = 'dassault-falcon-8x';
    } else {
      // Just normalize as usual
      normalizedModel = model.toLowerCase().replace(/\s+/g, '-');
    }
    
    console.log(`No match found in database, using normalized ID: ${normalizedModel}`);
    
    // Return the normalized model name as fallback ID
    return NextResponse.json({ jetId: normalizedModel }, { headers });
    
  } catch (error) {
    console.error('Unexpected error in getJetIdByModel:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers }
    );
  }
} 