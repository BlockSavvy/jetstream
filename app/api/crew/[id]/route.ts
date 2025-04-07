import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET route handler
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    // Use the existing createClient function
    const supabase = await createClient();
    
    // Get the crew member
    const { data: crewData, error: crewError } = await supabase
      .from('pilots_crews')
      .select('*')
      .eq('id', id)
      .single();
    
    if (crewError) {
      if (crewError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: crewError.message
      }, { status: 500 });
    }
    
    if (!crewData) {
      return NextResponse.json({ error: 'Crew member not found' }, { status: 404 });
    }
    
    return NextResponse.json({ crew: crewData });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message
    }, { status: 500 });
  }
}

/**
 * PATCH route handler
 */
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    // Use the existing createClient function
    const supabase = await createClient();
    
    // Get the request body
    const body = await request.json();
    
    // Update the crew member
    const { data, error } = await supabase
      .from('pilots_crews')
      .update({
        name: body.name,
        bio: body.bio,
        profile_image_url: body.profileImageUrl,
        specializations: body.specializations,
        social_links: body.socialLinks,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ crew: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE route handler
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    
    // Use the existing createClient function
    const supabase = await createClient();
    
    // Delete the crew member
    const { error } = await supabase
      .from('pilots_crews')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 