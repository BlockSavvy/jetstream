import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler for fetching custom seat layouts for specific jets
 * 
 * @param request The incoming request
 * @param params Contains the jet_id parameter from the URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jet_id: string } }
): Promise<NextResponse> {
  const { jet_id } = params;
  
  if (!jet_id) {
    return NextResponse.json(
      { error: 'Missing jet_id parameter' },
      { status: 400 }
    );
  }
  
  try {
    // Create Supabase client
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // First try to find a direct match by the specific jet_id
    let { data: layoutData, error: layoutError } = await supabase
      .from('jet_seat_layouts')
      .select('*')
      .eq('jet_id', jet_id)
      .limit(1)
      .single();
    
    // If no direct match, try to find by jet model
    if (layoutError || !layoutData) {
      // Check if the jet_id is actually a model name (e.g., "gulfstream-g650")
      const { data: jetModelLayout, error: jetModelError } = await supabase
        .from('jet_seat_layouts')
        .select('*')
        .eq('model_id', jet_id)
        .limit(1)
        .single();
      
      if (!jetModelError && jetModelLayout) {
        layoutData = jetModelLayout;
      } else {
        // If still not found, get the jet info to find its model
        const { data: jetData, error: jetError } = await supabase
          .from('jets')
          .select('model, manufacturer')
          .eq('id', jet_id)
          .limit(1)
          .single();
        
        if (!jetError && jetData) {
          // Use the model to find a matching layout
          const modelName = `${jetData.manufacturer.toLowerCase()}-${jetData.model.toLowerCase().replace(/\s+/g, '-')}`;
          
          const { data: modelLayout, error: modelLayoutError } = await supabase
            .from('jet_seat_layouts')
            .select('*')
            .eq('model_id', modelName)
            .limit(1)
            .single();
          
          if (!modelLayoutError && modelLayout) {
            layoutData = modelLayout;
          }
        }
      }
    }
    
    // If we found a layout, return it
    if (layoutData) {
      return NextResponse.json({ 
        layout: layoutData.layout, 
        jet_id: layoutData.jet_id,
        created_at: layoutData.created_at,
        updated_at: layoutData.updated_at
      });
    }
    
    // No layout found - return 404
    return NextResponse.json({ error: 'No custom layout found for this jet' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching jet seat layout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jet seat layout' },
      { status: 500 }
    );
  }
} 