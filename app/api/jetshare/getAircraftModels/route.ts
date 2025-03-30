import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Helper function to get CORS headers
function getCorsHeaders(request: NextRequest) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

export async function GET(request: NextRequest) {
  console.log('getAircraftModels API called');
  
  // Set CORS headers for response
  const corsHeaders = getCorsHeaders(request);
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const manufacturer = searchParams.get('manufacturer');
    const minSeats = searchParams.get('minSeats') ? parseInt(searchParams.get('minSeats')!) : null;
    const maxSeats = searchParams.get('maxSeats') ? parseInt(searchParams.get('maxSeats')!) : null;
    const sort = searchParams.get('sort') || 'display_name';
    const order = searchParams.get('order') || 'asc';
    const search = searchParams.get('search')?.toLowerCase();
    const withImageOnly = searchParams.get('withImageOnly') === 'true';
    
    console.log('Query params:', { manufacturer, minSeats, maxSeats, sort, order, search, withImageOnly });
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('aircraft_models')
      .select('*');
    
    // Apply filters
    if (manufacturer) {
      query = query.eq('manufacturer', manufacturer);
    }
    
    if (minSeats !== null) {
      query = query.gte('seat_capacity', minSeats);
    }
    
    if (maxSeats !== null) {
      query = query.lte('seat_capacity', maxSeats);
    }
    
    if (search) {
      query = query.or(`manufacturer.ilike.%${search}%,model.ilike.%${search}%,display_name.ilike.%${search}%`);
    }
    
    if (withImageOnly) {
      query = query.not('image_url', 'is', null);
    }
    
    // Apply sorting
    if (['display_name', 'manufacturer', 'seat_capacity', 'range_nm'].includes(sort)) {
      query = query.order(sort, { ascending: order === 'asc' });
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching aircraft models from Supabase:', error);
      
      // Try to handle common errors
      if (error.code === 'PGRST116') {
        // Table doesn't exist, provide fallback data
        return provideFallbackData(corsHeaders);
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch aircraft models', message: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!data || data.length === 0) {
      console.log('No aircraft models found in database, providing fallback data');
      return provideFallbackData(corsHeaders);
    }
    
    console.log(`Successfully fetched ${data.length} aircraft models`);
    
    // Enhance the response with additional data (thumbnail URLs, etc.)
    const enhancedData = data.map(model => {
      // Generate thumbnail URL from full image URL
      let thumbnailUrl = model.image_url;
      
      // If we have a real image URL, enhance with additional data
      if (model.image_url && model.image_url !== '/images/jets/other/custom.jpg') {
        // You can process the URL here to generate a thumbnail path
        // For now, we'll just use the same URL
      }
      
      return {
        ...model,
        thumbnail_url: thumbnailUrl,
        // Add additional data here as needed
        manufacturer_logo: `/images/logos/${model.manufacturer.toLowerCase()}.png`,
        is_popular: ['Gulfstream G650', 'Bombardier Global 7500', 'Embraer Phenom 300E'].includes(model.display_name)
      };
    });
    
    // Return the enhanced models
    return NextResponse.json({ 
      aircraft_models: enhancedData,
      total: enhancedData.length,
      manufacturers: [...new Set(enhancedData.map(model => model.manufacturer))].sort()
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Unexpected error in getAircraftModels API:', error);
    return provideFallbackData(corsHeaders);
  }
}

function provideFallbackData(corsHeaders: any) {
  console.log('Using fallback aircraft data');
  
  // Provide fallback data when API fails
  const fallbackModels = [
    { 
      id: 'gulfstream-g650', 
      manufacturer: 'Gulfstream', 
      model: 'G650', 
      display_name: 'Gulfstream G650', 
      seat_capacity: 19,
      range_nm: 7000,
      cruise_speed_kts: 516,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Ultra-long-range business jet with exceptional comfort and performance.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/gulfstream.png',
      is_popular: true
    },
    { 
      id: 'bombardier-global-7500', 
      manufacturer: 'Bombardier', 
      model: 'Global 7500', 
      display_name: 'Bombardier Global 7500', 
      seat_capacity: 19,
      range_nm: 7700,
      cruise_speed_kts: 516,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Ultra-long-range business jet with four living spaces.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/bombardier.png',
      is_popular: true
    },
    { 
      id: 'embraer-phenom-300e', 
      manufacturer: 'Embraer', 
      model: 'Phenom 300E', 
      display_name: 'Embraer Phenom 300E', 
      seat_capacity: 10,
      range_nm: 2010,
      cruise_speed_kts: 453,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Light business jet with exceptional performance and comfort.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/embraer.png',
      is_popular: true
    },
    { 
      id: 'cessna-citation-longitude', 
      manufacturer: 'Cessna', 
      model: 'Citation Longitude', 
      display_name: 'Cessna Citation Longitude', 
      seat_capacity: 12,
      range_nm: 3500,
      cruise_speed_kts: 476,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Super mid-size business jet with long-range capabilities.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/cessna.png',
      is_popular: false
    },
    { 
      id: 'dassault-falcon-8x', 
      manufacturer: 'Dassault', 
      model: 'Falcon 8X', 
      display_name: 'Dassault Falcon 8X', 
      seat_capacity: 16,
      range_nm: 6450,
      cruise_speed_kts: 460,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Ultra-long-range business jet with exceptional fuel efficiency.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/dassault.png',
      is_popular: false
    },
    { 
      id: 'other-custom', 
      manufacturer: 'Other', 
      model: 'Custom', 
      display_name: 'Other (Custom Aircraft)', 
      seat_capacity: 8,
      range_nm: null,
      cruise_speed_kts: null,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Custom aircraft model not in the standard list.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/other.png',
      is_popular: false
    }
  ];
  
  const manufacturers = [...new Set(fallbackModels.map(model => model.manufacturer))].sort();
  
  return NextResponse.json({ 
    aircraft_models: fallbackModels,
    total: fallbackModels.length,
    manufacturers: manufacturers
  }, { status: 200, headers: corsHeaders });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request)
  });
}