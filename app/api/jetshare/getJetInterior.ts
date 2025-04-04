import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Add default interior data for popular jet models
const DEFAULT_INTERIORS: Record<string, any> = {
  'gulfstream-g650': {
    jet_id: 'gulfstream-g650',
    name: 'Gulfstream G650 Luxury Interior',
    description: 'Ultra-spacious cabin with multiple living spaces',
    seats: 19,
    configuration: 'luxury',
    amenities: ['Full Galley', 'Entertainment System', 'WiFi', 'Private Bathroom'],
    image_url: '/images/interiors/gulfstream-g650-interior.jpg'
  },
  'bombardier-global-7500': {
    jet_id: 'bombardier-global-7500',
    name: 'Bombardier Global 7500 Luxury Interior',
    description: 'Four distinct living spaces with exceptional comfort',
    seats: 19,
    configuration: 'luxury',
    amenities: ['Master Bedroom', 'Full Galley', 'Entertainment System', 'WiFi', 'Private Bathroom'],
    image_url: '/images/interiors/bombardier-global-7500-interior.jpg'
  },
  'embraer-phenom-300e': {
    jet_id: 'embraer-phenom-300e',
    name: 'Embraer Phenom 300E Interior',
    description: 'Elegant and efficient cabin design for ultimate comfort',
    seats: 9,
    configuration: 'standard',
    amenities: ['Entertainment System', 'WiFi', 'Refreshment Center'],
    image_url: '/images/interiors/embraer-phenom-300e-interior.jpg'
  },
  'cessna-citation-longitude': {
    jet_id: 'cessna-citation-longitude',
    name: 'Cessna Citation Longitude Interior',
    description: 'Spacious cabin designed for business and leisure',
    seats: 12,
    configuration: 'standard',
    amenities: ['Entertainment System', 'WiFi', 'Refreshment Center', 'Private Bathroom'],
    image_url: '/images/interiors/cessna-citation-longitude-interior.jpg'
  },
  'dassault-falcon-8x': {
    jet_id: 'dassault-falcon-8x',
    name: 'Dassault Falcon 8X Interior',
    description: 'Exceptionally quiet cabin with multiple configurations available',
    seats: 16,
    configuration: 'luxury',
    amenities: ['Entertainment System', 'WiFi', 'Full Galley', 'Private Bathroom'],
    image_url: '/images/interiors/dassault-falcon-8x-interior.jpg'
  },
  'default': {
    jet_id: 'default',
    name: 'Standard Luxury Interior',
    description: 'Comfortable and elegant interior suitable for business and leisure',
    seats: 12,
    configuration: 'standard',
    amenities: ['WiFi', 'Refreshment Center'],
    image_url: '/images/interiors/default-interior.jpg'
  }
};

export async function GET(request: NextRequest) {
  // Get jetId from query parameters
  const searchParams = request.nextUrl.searchParams;
  const jetId = searchParams.get('jetId');

  if (!jetId) {
    return NextResponse.json({ error: 'Missing jetId parameter' }, { status: 400 });
  }

  console.log(`Fetching interior for jet ID: ${jetId}`);

  try {
    // Create Supabase client
    const supabase = await createClient();

    // Query the jet_interiors table to find matching interior
    const { data: interiorData, error } = await supabase
      .from('jet_interiors')
      .select('*')
      .eq('jet_id', jetId)
      .single();

    if (error) {
      console.log(`Error fetching jet interior for ${jetId}:`, error);
      
      // First, check if we have a default interior for this specific jet model
      const normalizedJetId = jetId.toLowerCase().replace(/\s+/g, '-');
      
      if (DEFAULT_INTERIORS[normalizedJetId]) {
        console.log(`Using default interior data for ${normalizedJetId}`);
        return NextResponse.json({
          interior: DEFAULT_INTERIORS[normalizedJetId],
          fallback: true
        });
      }
      
      // If no specific default, try to identify jet type from the ID
      let jetType = 'default';
      if (normalizedJetId.includes('gulfstream')) {
        jetType = 'gulfstream-g650';
      } else if (normalizedJetId.includes('global') || normalizedJetId.includes('bombardier')) {
        jetType = 'bombardier-global-7500';
      } else if (normalizedJetId.includes('phenom') || normalizedJetId.includes('embraer')) {
        jetType = 'embraer-phenom-300e';
      } else if (normalizedJetId.includes('citation') || normalizedJetId.includes('cessna')) {
        jetType = 'cessna-citation-longitude';
      } else if (normalizedJetId.includes('falcon') || normalizedJetId.includes('dassault')) {
        jetType = 'dassault-falcon-8x';
      }
      
      if (DEFAULT_INTERIORS[jetType]) {
        console.log(`Using default interior for jet type: ${jetType}`);
        return NextResponse.json({
          interior: DEFAULT_INTERIORS[jetType],
          fallback: true
        });
      }
      
      // Try a fallback approach - let's get any interior as an example
      const { data: fallbackData } = await supabase
        .from('jet_interiors')
        .select('*')
        .limit(1)
        .single();

      if (fallbackData) {
        console.log('Using a random interior from database as fallback');
        return NextResponse.json({
          interior: fallbackData,
          fallback: true
        });
      }

      // If all else fails, use the default interior
      console.log('Using default interior as last resort');
      return NextResponse.json({
        interior: DEFAULT_INTERIORS['default'],
        fallback: true
      });
    }

    // Return the jet interior data
    console.log(`Successfully found interior data for ${jetId}`);
    return NextResponse.json({
      interior: interiorData,
      fallback: false
    });
  } catch (error) {
    console.error('Unexpected error when fetching jet interior:', error);
    
    // Return default interior in case of any errors
    return NextResponse.json({ 
      interior: DEFAULT_INTERIORS['default'],
      fallback: true,
      error: 'Failed to fetch jet interior',
      errorDetails: error instanceof Error ? error.message : String(error)
    }, { status: 200 }); // Return 200 to prevent cascading failures
  }
} 