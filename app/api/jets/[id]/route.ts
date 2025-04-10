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
    
    // Initialize Supabase client with the correct cookie handling
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
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
    
    // Try to get jet seat layout data - but handle the case where table doesn't exist yet
    let seatLayoutData = null;
    let layoutError = null;
    
    try {
      const result = await supabase
        .from('jet_seat_layouts')
        .select('layout')
        .eq('jet_id', jet_id)
        .maybeSingle();
        
      seatLayoutData = result.data;
      layoutError = result.error;
      
      if (layoutError && layoutError.code === '42P01') {
        console.log('Seat layout table does not exist yet, using default layout');
        layoutError = null; // Clear the error since we'll handle it gracefully
      } else if (layoutError) {
        console.error('Error fetching seat layout:', layoutError);
      }
    } catch (err) {
      console.error('Error in seat layout query:', err);
      // Continue without layout data
    }
    
    // Create a default seat layout based on capacity if no custom layout exists
    let seatLayout = null;
    
    if (seatLayoutData?.layout) {
      // Use the stored layout
      seatLayout = seatLayoutData.layout;
    } else {
      // Create a default layout based on capacity
      const capacity = jet.capacity || (interior?.seats ? parseInt(interior.seats) : 4);
      let rows = 0;
      let seatsPerRow = 0;
      let skipPositions: number[][] = [];
      
      // Configure typical aircraft layout - prioritize 2 seats per row for most jets
      if (capacity <= 4) {
        // For very small jets, 2 rows of 2 seats
        rows = 2;
        seatsPerRow = 2;
      } else if (capacity <= 16) {
        // For most private jets, use 2 seats per row
        seatsPerRow = 2;
        rows = Math.ceil(capacity / seatsPerRow);
        
        // Handle odd number of seats by skipping the last position
        if (capacity % 2 !== 0) {
          skipPositions.push([rows - 1, 1]); // Skip last seat in last row
        }
      } else if (capacity <= 30) {
        // For larger jets, use 3 seats per row
        seatsPerRow = 3;
        rows = Math.ceil(capacity / seatsPerRow);
        
        // Handle seats that don't fill the last row
        const lastRowPositions = capacity % seatsPerRow;
        if (lastRowPositions > 0) {
          for (let i = lastRowPositions; i < seatsPerRow; i++) {
            skipPositions.push([rows - 1, i]);
          }
        }
      } else {
        // For commercial aircraft, use 4 seats per row
        seatsPerRow = 4;
        rows = Math.ceil(capacity / seatsPerRow);
        
        // Handle seats that don't fill the last row
        const lastRowPositions = capacity % seatsPerRow;
        if (lastRowPositions > 0) {
          for (let i = lastRowPositions; i < seatsPerRow; i++) {
            skipPositions.push([rows - 1, i]);
          }
        }
      }
      
      // Create the layout object
      seatLayout = {
        rows,
        seatsPerRow,
        layoutType: 'standard',
        totalSeats: capacity,
        seatMap: {
          skipPositions: skipPositions
        }
      };
      
      console.log(`Generated layout for ${capacity} seats:`, {
        rows, 
        seatsPerRow, 
        skipPositions,
        actualSeats: (rows * seatsPerRow) - skipPositions.length
      });
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