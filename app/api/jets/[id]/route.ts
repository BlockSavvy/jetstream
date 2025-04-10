import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { GetRouteHandler, PostRouteHandler, PatchRouteHandler, DeleteRouteHandler, PutRouteHandler, IdParam } from '@/lib/types/route-types';

// Define interface for aircraft layout template
interface AircraftLayout {
  rows: number;
  seatsPerRow: number;
  layoutType: string;
  totalSeats: number;
  seatMap?: {
    skipPositions?: number[][];
    customPositions?: { row: number; col: number; id: string }[];
  };
}

// Define interface for the layouts object
interface AircraftLayoutsMap {
  [key: string]: AircraftLayout;
}

// Aircraft-specific seat layout templates
const AIRCRAFT_LAYOUTS: AircraftLayoutsMap = {
  // Gulfstream models
  'gulfstream-g650': {
    rows: 5,
    seatsPerRow: 4,
    layoutType: 'luxury',
    totalSeats: 19,
    seatMap: {
      skipPositions: [[4, 3]] // Skip last seat in last row to make it 19 seats
    }
  },
  'gulfstream-g550': {
    rows: 4,
    seatsPerRow: 4,
    layoutType: 'luxury',
    totalSeats: 16,
  },
  // Default fallback layout if specific model not found
  'default': {
    rows: 4,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 12,
  }
};

// Using the correct Next.js pattern for dynamic route parameters
export const GET: GetRouteHandler<{ id: string }> = async (
  request: NextRequest,
  context: IdParam
) => {
  try {
    const { id } = await context.params;
    const jet_id = id;
    
    // Special case: If "default" is requested, return the default layout
    if (jet_id === 'default') {
      return NextResponse.json({
        jet: {
          id: 'default',
          model: 'Default Jet',
          manufacturer: 'Generic',
          capacity: 12
        },
        interior: null,
        seatLayout: AIRCRAFT_LAYOUTS['default']
      });
    }
    
    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    // Get jet data
    const { data: jet, error: jetError } = await supabase
      .from('jets')
      .select(`
        *,
        owner:owner_id(id, first_name, last_name, email, avatar_url)
      `)
      .eq('id', jet_id)
      .single();
    
    if (jetError) {
      console.error('Error fetching jet:', jetError);
      return NextResponse.json({ error: 'Failed to fetch jet' }, { status: 500 });
    }
    
    if (!jet) {
      return NextResponse.json({ error: 'Jet not found' }, { status: 404 });
    }
    
    // Get jet interior data
    const { data: interior, error: interiorError } = await supabase
      .from('jet_interiors')
      .select('*')
      .eq('jet_id', jet_id)
      .maybeSingle();
    
    if (interiorError) {
      console.error('Error fetching jet interior:', interiorError);
      // Continue without interior data
    }
    
    // Get jet seat layout data
    const { data: seatLayoutData, error: layoutError } = await supabase
      .from('jet_seat_layouts')
      .select('layout')
      .eq('jet_id', jet_id)
      .maybeSingle();
    
    if (layoutError) {
      console.error('Error fetching seat layout:', layoutError);
      // Continue without seat layout data
    }
    
    // Create a default seat layout based on capacity if no custom layout exists
    let seatLayout = null;
    
    if (seatLayoutData?.layout) {
      // Use the stored layout
      seatLayout = seatLayoutData.layout;
    } else {
      // Create a default layout based on capacity
      const capacity = jet.capacity || (interior?.seats || 4);
      let rows = 0;
      let seatsPerRow = 0;
      
      // Calculate a reasonable layout
      if (capacity <= 4) {
        rows = 2;
        seatsPerRow = 2;
      } else if (capacity <= 8) {
        rows = 2;
        seatsPerRow = 4;
      } else if (capacity <= 12) {
        rows = 3;
        seatsPerRow = 4;
      } else if (capacity <= 16) {
        rows = 4;
        seatsPerRow = 4;
      } else {
        rows = 5;
        seatsPerRow = 4;
      }
      
      seatLayout = {
        rows,
        seatsPerRow,
        layoutType: 'standard',
        totalSeats: capacity,
        skipPositions: []
      };
    }
    
    // Return combined data
    return NextResponse.json({
      jet,
      interior: interior || null,
      seatLayout
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};