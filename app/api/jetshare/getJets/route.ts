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
  console.log('getJets API called');
  
  // Set CORS headers for response
  const corsHeaders = getCorsHeaders(request);
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const manufacturer = searchParams.get('manufacturer');
    const minCapacity = searchParams.get('minCapacity') ? parseInt(searchParams.get('minCapacity')!) : null;
    const maxCapacity = searchParams.get('maxCapacity') ? parseInt(searchParams.get('maxCapacity')!) : null;
    const sort = searchParams.get('sort') || 'model';
    const order = searchParams.get('order') || 'asc';
    const search = searchParams.get('search')?.toLowerCase();
    const withImageOnly = searchParams.get('withImageOnly') === 'true';
    
    console.log('Query params:', { manufacturer, minCapacity, maxCapacity, sort, order, search, withImageOnly });
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('jets')
      .select('*');
    
    // Apply filters
    if (manufacturer) {
      query = query.eq('manufacturer', manufacturer);
    }
    
    if (minCapacity !== null) {
      query = query.gte('capacity', minCapacity);
    }
    
    if (maxCapacity !== null) {
      query = query.lte('capacity', maxCapacity);
    }
    
    if (search) {
      query = query.or(`manufacturer.ilike.%${search}%,model.ilike.%${search}%,tail_number.ilike.%${search}%`);
    }
    
    if (withImageOnly) {
      query = query.not('image_url', 'is', null);
    }
    
    // Apply sorting
    if (['model', 'manufacturer', 'capacity', 'range_nm'].includes(sort)) {
      query = query.order(sort, { ascending: order === 'asc' });
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching jets from Supabase:', error);
      
      return NextResponse.json(
        { error: 'Failed to fetch jets', message: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!data || data.length === 0) {
      console.log('No jets found in database, providing fallback data');
      return provideFallbackData(corsHeaders);
    }
    
    console.log(`Successfully fetched ${data.length} jets`);
    
    // Enhance the response with additional data (thumbnail URLs, etc.)
    const enhancedData = data.map(jet => {
      // Generate thumbnail URL from full image URL
      let thumbnailUrl = jet.image_url;
      
      // If we have a real image URL, enhance with additional data
      if (jet.image_url && jet.image_url !== '/images/placeholder-jet.jpg') {
        // You can process the URL here to generate a thumbnail path
        // For now, we'll just use the same URL
      }
      
      return {
        ...jet,
        thumbnail_url: thumbnailUrl,
        // Add additional data here as needed
        manufacturer_logo: `/images/logos/${jet.manufacturer.toLowerCase()}.png`,
        is_popular: ['Gulfstream G650', 'Bombardier Global 7500', 'Embraer Phenom 300E'].includes(`${jet.manufacturer} ${jet.model}`)
      };
    });
    
    // Try to fetch interior details for each jet to get seat capacity
    const interiorPromises = enhancedData.map(async (jet) => {
      try {
        const { data: interiorData } = await supabase
          .from('jet_interiors')
          .select('seats')
          .eq('jet_id', jet.id)
          .single();
        
        if (interiorData && interiorData.seats) {
          return {
            ...jet,
            // If the interior has seat data, update the capacity
            capacity: parseInt(interiorData.seats) || jet.capacity
          };
        }
        
        return jet;
      } catch (err) {
        console.warn(`Could not fetch interior for jet ${jet.id}:`, err);
        return jet;
      }
    });
    
    // Wait for all interior data to be fetched
    const jetsWithInteriors = await Promise.all(interiorPromises);
    
    // Return the enhanced jets
    return NextResponse.json({ 
      jets: jetsWithInteriors,
      total: jetsWithInteriors.length,
      manufacturers: [...new Set(jetsWithInteriors.map(jet => jet.manufacturer))].sort()
    }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Unexpected error in getJets API:', error);
    return provideFallbackData(corsHeaders);
  }
}

function provideFallbackData(corsHeaders: any) {
  console.log('Using fallback jet data');
  
  // Provide fallback data when API fails
  const fallbackJets = [
    { 
      id: 'gulfstream-g650', 
      manufacturer: 'Gulfstream', 
      model: 'G650', 
      tail_number: 'N1JS',
      capacity: 19,
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
      tail_number: 'N2JS',
      capacity: 19,
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
      tail_number: 'N3JS',
      capacity: 10,
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
      tail_number: 'N4JS',
      capacity: 12,
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
      tail_number: 'N5JS',
      capacity: 16,
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
      tail_number: '',
      capacity: 8,
      range_nm: null,
      cruise_speed_kts: null,
      image_url: '/images/placeholder-jet.jpg',
      description: 'Custom aircraft model not in the standard list.',
      thumbnail_url: '/images/placeholder-jet.jpg',
      manufacturer_logo: '/images/logos/other.png',
      is_popular: false
    }
  ];
  
  const manufacturers = [...new Set(fallbackJets.map(jet => jet.manufacturer))].sort();
  
  return NextResponse.json({ 
    jets: fallbackJets,
    total: fallbackJets.length,
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