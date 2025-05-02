import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      supabaseUrl,
      serviceKey || supabaseKey // Fallback to anon key if service key is not available
    );
    
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
    
    console.log('Raw data fetched from jets table:', data);
    
    if (error) {
      console.error('Error fetching jets from Supabase:', error);
      
      return NextResponse.json(
        { error: 'Failed to fetch jets', message: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!data || data.length === 0) {
      console.log('No jets found in database.');
      // Return empty list instead of fallback
      return NextResponse.json({ 
        jets: [],
        total: 0,
        manufacturers: []
      }, { status: 200, headers: corsHeaders });
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
        // First check if the jet_interiors table has seats data
        const { data: interiorData, error: interiorError } = await supabase
          .from('jet_interiors')
          .select('seats')
          .eq('jet_id', jet.id)
          .single();
        
        if (interiorData && interiorData.seats) {
          console.log(`Found interior seats data for jet ${jet.id}: ${interiorData.seats}`);
          return {
            ...jet,
            capacity: parseInt(interiorData.seats) || jet.capacity
          };
        }
        
        // If no interior data, check if there's a record in the aircraft_models table
        if (!interiorData || interiorError) {
          const { data: modelData, error: modelError } = await supabase
            .from('aircraft_models')
            .select('capacity')
            .eq('manufacturer', jet.manufacturer)
            .eq('model', jet.model)
            .single();
            
          if (modelData && modelData.capacity) {
            console.log(`Found aircraft model capacity for ${jet.manufacturer} ${jet.model}: ${modelData.capacity}`);
            return {
              ...jet,
              capacity: parseInt(modelData.capacity) || jet.capacity
            };
          }
        }
        
        // If we still don't have capacity data, log a warning but return the jet as is
        if (!jet.capacity) {
          console.warn(`Could not find capacity data for jet ${jet.id} (${jet.manufacturer} ${jet.model})`);
        }
        
        return jet;
      } catch (err) {
        console.warn(`Error fetching additional data for jet ${jet.id}:`, err);
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
    return NextResponse.json({ 
      jets: [],
      total: 0,
      manufacturers: []
    }, { status: 200, headers: corsHeaders });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request)
  });
} 