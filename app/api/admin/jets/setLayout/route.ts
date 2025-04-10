import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Admin-only endpoint to set a custom seat layout for a jet
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with proper cookie handling
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated and has admin privileges
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user is an admin (modify this according to your auth system)
    const { data: isAdmin } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
      
    if (!isAdmin?.is_admin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }
    
    // Parse the request body
    const { jetId, layout } = await request.json();
    
    if (!jetId || !layout) {
      return NextResponse.json({ error: 'Missing required fields: jetId, layout' }, { status: 400 });
    }
    
    // Ensure layout has required properties
    if (!layout.rows || !layout.seatsPerRow || !layout.totalSeats) {
      return NextResponse.json({ 
        error: 'Layout must include rows, seatsPerRow, and totalSeats' 
      }, { status: 400 });
    }
    
    // Check if the jet exists
    const { data: jet, error: jetError } = await supabase
      .from('jets')
      .select('id')
      .eq('id', jetId)
      .single();
      
    if (jetError || !jet) {
      return NextResponse.json({ error: 'Jet not found' }, { status: 404 });
    }
    
    // Check if a layout already exists for this jet
    const { data: existingLayout } = await supabase
      .from('jet_seat_layouts')
      .select('id')
      .eq('jet_id', jetId)
      .maybeSingle();
    
    let result;
    
    if (existingLayout) {
      // Update existing layout
      result = await supabase
        .from('jet_seat_layouts')
        .update({ layout })
        .eq('jet_id', jetId)
        .select();
    } else {
      // Insert new layout
      result = await supabase
        .from('jet_seat_layouts')
        .insert({ jet_id: jetId, layout })
        .select();
    }
    
    if (result.error) {
      console.error('Database error:', result.error);
      return NextResponse.json({ 
        error: 'Failed to save layout', 
        details: result.error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Seat layout saved successfully',
      data: result.data[0]
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Admin-only endpoint to get all available preset layouts
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with proper cookie handling
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // Check if the user is authenticated 
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Return available preset layouts
    const presetLayouts = {
      // 2 seats per row layouts
      'private-2-seats': {
        label: '2 seats per row (A1-A2, B1-B2, etc.)',
        options: [
          { value: '2x2', label: '2 rows x 2 seats (4 total)' },
          { value: '3x2', label: '3 rows x 2 seats (6 total)' },
          { value: '4x2', label: '4 rows x 2 seats (8 total)' },
          { value: '5x2', label: '5 rows x 2 seats (10 total)' },
          { value: '6x2', label: '6 rows x 2 seats (12 total)' },
          { value: '7x2', label: '7 rows x 2 seats (14 total)' },
          { value: '8x2', label: '8 rows x 2 seats (16 total)' },
        ]
      },
      // 3 seats per row layouts
      'mid-size-3-seats': {
        label: '3 seats per row (A1-A3, B1-B3, etc.)',
        options: [
          { value: '3x3', label: '3 rows x 3 seats (9 total)' },
          { value: '4x3', label: '4 rows x 3 seats (12 total)' },
          { value: '5x3', label: '5 rows x 3 seats (15 total)' },
          { value: '6x3', label: '6 rows x 3 seats (18 total)' },
          { value: '7x3', label: '7 rows x 3 seats (21 total)' },
        ]
      },
      // 4 seats per row layouts
      'commercial-4-seats': {
        label: '4 seats per row (A1-A4, B1-B4, etc.)',
        options: [
          { value: '3x4', label: '3 rows x 4 seats (12 total)' },
          { value: '4x4', label: '4 rows x 4 seats (16 total)' },
          { value: '5x4', label: '5 rows x 4 seats (20 total)' },
          { value: '6x4', label: '6 rows x 4 seats (24 total)' },
        ]
      }
    };
    
    return NextResponse.json({ presetLayouts });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
} 