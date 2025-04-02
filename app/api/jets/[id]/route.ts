import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

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
    
    if (error) {
      console.error('Error fetching jet data:', error);
      
      // If the jet doesn't exist, return default layout data
      // This allows us to still render the visualizer with default values
      return NextResponse.json({
        id: jetId,
        seatLayout: {
          rows: 6,
          seatsPerRow: 4,
          layoutType: 'standard'
        }
      });
    }
    
    // Extract or generate seat layout information
    let seatLayout = {
      rows: 6, // Default
      seatsPerRow: 4, // Default
      layoutType: 'standard' as 'standard' | 'luxury' | 'custom'
    };
    
    // If the jet has a seat_layout field, use that
    if (jet.seat_layout) {
      try {
        // Parse the seat layout if it's stored as JSON string
        if (typeof jet.seat_layout === 'string') {
          seatLayout = JSON.parse(jet.seat_layout);
        } else {
          // Otherwise assume it's already an object
          seatLayout = jet.seat_layout;
        }
      } catch (parseError) {
        console.error('Error parsing seat layout:', parseError);
        // Keep using the default layout
      }
    } else {
      // If no seat_layout exists, derive from capacity
      if (jet.capacity) {
        // Approximate a reasonable layout based on capacity
        if (jet.capacity <= 6) {
          seatLayout = {
            rows: 2,
            seatsPerRow: 3,
            layoutType: 'standard'
          };
        } else if (jet.capacity <= 10) {
          seatLayout = {
            rows: 3,
            seatsPerRow: 3,
            layoutType: 'standard'
          };
        } else if (jet.capacity <= 16) {
          seatLayout = {
            rows: 4,
            seatsPerRow: 4,
            layoutType: 'standard'
          };
        } else {
          seatLayout = {
            rows: 5,
            seatsPerRow: 4,
            layoutType: 'standard'
          };
        }
      }
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
      seatLayout: {
        rows: 6,
        seatsPerRow: 4,
        layoutType: 'standard'
      }
    }, { status: 500 });
  }
} 