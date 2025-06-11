import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Ensure the response is not cached
export const dynamic = 'force-dynamic';

// Define type for jet data
interface Jet {
  id: string;
  manufacturer: string;
  model: string;
  tail_number?: string;
  capacity?: number;
  image_url?: string;
  range_nm?: number;
  cruise_speed_kts?: number;
  year?: number;
  [key: string]: any; // Allow additional properties
}

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
    'Content-Type': 'application/json',
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
    
    // Create Supabase client using the shared helper function
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
        { error: 'Failed to fetch jets from database', details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!data || data.length === 0) {
      console.log('No jets found in database');
      return NextResponse.json(
        { jets: [], total: 0, manufacturers: [] },
        { status: 200, headers: corsHeaders }
      );
    }
    
    console.log(`Successfully fetched ${data.length} jets`);
    
    // Type the data as Jet[]
    const jetsData = data as Jet[];
    
    // Enhance the response with additional data
    const enhancedData = jetsData.map((jet: Jet) => {
      return {
        ...jet,
        thumbnail_url: jet.image_url,
        manufacturer_logo: `/images/logos/${jet.manufacturer.toLowerCase()}.png`,
        is_popular: ['Gulfstream G650', 'Bombardier Global 7500', 'Embraer Phenom 300E'].includes(`${jet.manufacturer} ${jet.model}`)
      };
    });
    
    // Try to fetch interior details for each jet to get seat capacity
    const interiorPromises = enhancedData.map(async (jet: Jet) => {
      try {
        // Check if the jet already has capacity data
        if (jet.capacity) {
          return jet;
        }
        
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
    
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(request)
  });
} 