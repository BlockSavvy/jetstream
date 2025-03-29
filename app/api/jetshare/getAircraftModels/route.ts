import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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
      console.error('Error fetching aircraft models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch aircraft models', message: error.message },
        { status: 500 }
      );
    }
    
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
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in getAircraftModels API:', error);
    return NextResponse.json(
      { error: 'Server error', message: (error as Error).message },
      { status: 500 }
    );
  }
} 