import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    // Additional layout info can be added here
    seatMap: {
      // Custom seat map can be defined here
      // For example, seats that should be disabled or have special positions
      skipPositions: [[4, 3]] // Skip last seat in last row to make it 19 seats
    }
  },
  'gulfstream-g550': {
    rows: 4,
    seatsPerRow: 4,
    layoutType: 'luxury',
    totalSeats: 16,
  },
  'gulfstream-g280': {
    rows: 3,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 9,
  },
  // Bombardier models
  'bombardier-global-7500': {
    rows: 5,
    seatsPerRow: 4,
    layoutType: 'luxury',
    totalSeats: 19,
    seatMap: {
      skipPositions: [[4, 3]] // Skip last seat in last row to make it 19 seats
    }
  },
  'bombardier-challenger-350': {
    rows: 3,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 9,
  },
  'bombardier-challenger-650': {
    rows: 4,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 12,
  },
  // Dassault models
  'dassault-falcon-8x': {
    rows: 5,
    seatsPerRow: 3,
    layoutType: 'luxury',
    totalSeats: 14,
    seatMap: {
      skipPositions: [[4, 2]] // Skip last seat in last row to make it 14 seats
    }
  },
  'dassault-falcon-2000lxs': {
    rows: 3,
    seatsPerRow: 4,
    layoutType: 'standard',
    totalSeats: 10,
    seatMap: {
      skipPositions: [[2, 2], [2, 3]] // Skip last two seats in last row
    }
  },
  // Cessna models
  'cessna-citation-longitude': {
    rows: 3,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 8,
    seatMap: {
      skipPositions: [[2, 2]] // Skip last seat in last row
    }
  },
  // Embraer models
  'embraer-phenom-300': {
    rows: 3,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 8,
    seatMap: {
      skipPositions: [[2, 2]] // Skip last seat in last row
    }
  },
  // Default fallback layout if specific model not found
  'default': {
    rows: 4,
    seatsPerRow: 3,
    layoutType: 'standard',
    totalSeats: 12,
  }
};

/**
 * GET handler for Jets API
 */
export async function GET(request: Request, context: { params: { id: string } }) {
  const jet_id = context.params.id;
  
  try {
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
} 