import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jetId = params.id;
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch the jet data from the jets table
    const { data: jet, error } = await supabase
      .from('jets')
      .select('*')
      .eq('id', jetId)
      .single();
    
    // Normalize the jetId to match our template keys
    const normalizedJetId = jetId.toLowerCase().replace(/\s+/g, '-');
    
    // Check if we have a predefined layout for this aircraft
    const hasTemplate = normalizedJetId in AIRCRAFT_LAYOUTS;
    
    // Get either the predefined layout or use the default
    const layoutTemplate = hasTemplate 
      ? AIRCRAFT_LAYOUTS[normalizedJetId] 
      : AIRCRAFT_LAYOUTS['default'];
    
    if (error) {
      console.error('Error fetching jet data:', error);
      
      // If the jet doesn't exist, return layout data from our templates
      return NextResponse.json({
        id: jetId,
        seatLayout: layoutTemplate
      });
    }
    
    // Extract or generate seat layout information
    let seatLayout = layoutTemplate;
    
    // If the jet has a seat_layout field, use that to override template
    if (jet.seat_layout) {
      try {
        // Parse the seat layout if it's stored as JSON string
        if (typeof jet.seat_layout === 'string') {
          const parsedLayout = JSON.parse(jet.seat_layout);
          seatLayout = {
            ...layoutTemplate, // Start with template as base
            ...parsedLayout,   // Override with stored values
          };
        } else {
          // Otherwise assume it's already an object
          seatLayout = {
            ...layoutTemplate, // Start with template as base
            ...jet.seat_layout, // Override with stored values
          };
        }
      } catch (parseError) {
        console.error('Error parsing seat layout:', parseError);
        // Keep using the template layout
      }
    } else if (jet.capacity) {
      // If no layout but capacity exists, update the template's totalSeats
      seatLayout = {
        ...layoutTemplate,
        totalSeats: jet.capacity
      };
    }
    
    // Return the jet data with formatted seat layout
    return NextResponse.json({
      id: jet.id,
      model: jet.model,
      manufacturer: jet.manufacturer,
      capacity: jet.capacity,
      seatLayout
    });
    
  } catch (error) {
    console.error('Error in GET /api/jets/[id]:', error);
    
    // Return a default response in case of error
    return NextResponse.json({
      seatLayout: AIRCRAFT_LAYOUTS['default']
    }, { status: 500 });
  }
} 