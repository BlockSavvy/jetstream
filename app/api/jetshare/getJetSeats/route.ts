import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Define specific seat layouts including skip positions for common aircraft
const jetSpecificLayouts: Record<number, { 
  rows: number, 
  seatsPerRow: number,
  skipPositions: number[][]  // Add which positions to skip
}> = {
  4: { rows: 2, seatsPerRow: 2, skipPositions: [] },
  6: { rows: 2, seatsPerRow: 3, skipPositions: [] },
  8: { rows: 2, seatsPerRow: 4, skipPositions: [] },
  9: { rows: 3, seatsPerRow: 3, skipPositions: [] },
  10: { 
    rows: 3, 
    seatsPerRow: 4, 
    skipPositions: [[2, 2], [2, 3]]  // Skip the last two seats in the last row (C3, C4)
  },
  12: { rows: 3, seatsPerRow: 4, skipPositions: [] },
  14: { rows: 4, seatsPerRow: 4, skipPositions: [[3, 2], [3, 3]] }, // Skip last two seats in last row
  16: { rows: 4, seatsPerRow: 4, skipPositions: [] },
  19: { rows: 5, seatsPerRow: 4, skipPositions: [[4, 1]] }, // Skip one seat in last row
  22: { rows: 6, seatsPerRow: 4, skipPositions: [[5, 1], [5, 2]] }, // Skip two seats in last row
  24: { rows: 6, seatsPerRow: 4, skipPositions: [] } 
};

// Update the helper function to calculate optimal seat layout with skip positions
function calculateOptimalLayout(totalSeats: number) {
  // Use jet-specific layout if available
  if (jetSpecificLayouts[totalSeats]) {
    return jetSpecificLayouts[totalSeats];
  }

  // Otherwise calculate dynamically
  // Try to keep a more rectangular layout with the majority of seats along the width
  if (totalSeats <= 4) {
    return { 
      rows: 2, 
      seatsPerRow: Math.ceil(totalSeats / 2),
      skipPositions: []
    };
  } else if (totalSeats <= 12) {
    const rows = 3;
    const seatsPerRow = Math.ceil(totalSeats / 3);
    const totalPositions = rows * seatsPerRow;
    const skipPositions: number[][] = [];
    
    // Calculate positions to skip
    if (totalPositions > totalSeats) {
      const positionsToSkip = totalPositions - totalSeats;
      // Skip positions starting from the bottom-right corner
      for (let i = 0; i < positionsToSkip; i++) {
        const row = rows - 1 - Math.floor(i / seatsPerRow);
        const col = seatsPerRow - 1 - (i % seatsPerRow);
        skipPositions.push([row, col]);
      }
    }
    
    return { rows, seatsPerRow, skipPositions };
  } else if (totalSeats <= 16) {
    const rows = 4;
    const seatsPerRow = Math.ceil(totalSeats / 4);
    const totalPositions = rows * seatsPerRow;
    const skipPositions: number[][] = [];
    
    // Calculate positions to skip
    if (totalPositions > totalSeats) {
      const positionsToSkip = totalPositions - totalSeats;
      // Skip positions starting from the bottom-right corner
      for (let i = 0; i < positionsToSkip; i++) {
        const row = rows - 1 - Math.floor(i / seatsPerRow);
        const col = seatsPerRow - 1 - (i % seatsPerRow);
        skipPositions.push([row, col]);
      }
    }
    
    return { rows, seatsPerRow, skipPositions };
  } else {
    // For larger configurations, try to keep width reasonable
    const seatsPerRow = 4;
    const rows = Math.ceil(totalSeats / seatsPerRow);
    const totalPositions = rows * seatsPerRow;
    const skipPositions: number[][] = [];
    
    // Calculate positions to skip
    if (totalPositions > totalSeats) {
      const positionsToSkip = totalPositions - totalSeats;
      // Skip positions starting from the bottom-right corner
      for (let i = 0; i < positionsToSkip; i++) {
        const row = rows - 1 - Math.floor(i / seatsPerRow);
        const col = seatsPerRow - 1 - (i % seatsPerRow);
        skipPositions.push([row, col]);
      }
    }
    
    return { rows, seatsPerRow, skipPositions };
  }
}

// Update the API handler to include skipPositions in the response
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jetId = searchParams.get('jet_id');
  
  if (!jetId) {
    return NextResponse.json({ error: 'Missing jet_id parameter' }, { status: 400 });
  }
  
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // First try to get from jet_interiors table which has the most accurate seat info
    let { data: interiorData, error: interiorError } = await supabase
      .from('jet_interiors')
      .select('*')
      .eq('jet_id', jetId)
      .single();
    
    // If we found interior data with seat info, return it
    if (interiorData && interiorData.seats) {
      const seatCount = parseInt(interiorData.seats);
      if (!isNaN(seatCount)) {
        const seatLayout = calculateOptimalLayout(seatCount);
        
        return NextResponse.json({
          success: true,
          seats: seatCount,
          layout: {
            rows: seatLayout.rows,
            seatsPerRow: seatLayout.seatsPerRow,
            layoutType: 'custom',
            totalSeats: seatCount,
            seatMap: {
              skipPositions: seatLayout.skipPositions
            }
          },
          interior: interiorData
        });
      }
    }
    
    // Fallback to jets table
    const { data: jetData, error: jetError } = await supabase
      .from('jets')
      .select('*')
      .eq('id', jetId)
      .single();
      
    if (jetError) {
      throw jetError;
    }
    
    if (!jetData) {
      return NextResponse.json({ error: 'Jet not found' }, { status: 404 });
    }
    
    // Get seat capacity from jets table
    const seatCapacity = jetData.seat_capacity || 10; // Default to 10 if not specified
    const seatLayout = calculateOptimalLayout(seatCapacity);
    
    return NextResponse.json({
      success: true,
      seats: seatCapacity,
      layout: {
        rows: seatLayout.rows,
        seatsPerRow: seatLayout.seatsPerRow,
        layoutType: 'custom',
        totalSeats: seatCapacity,
        seatMap: {
          skipPositions: seatLayout.skipPositions
        }
      },
      jet: jetData,
      interior: interiorData || null
    });
    
  } catch (error) {
    console.error('Error fetching jet seat data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jet seat data' },
      { status: 500 }
    );
  }
} 