import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// POST to assign a user to a jet
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.jet_id || !data.user_id || !data.role || !data.permission_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if assignment already exists
    const { data: existingAssignment, error: checkError } = await supabase
      .from('jet_user_assignments')
      .select('*')
      .eq('jet_id', data.jet_id)
      .eq('user_id', data.user_id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing assignment:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing assignment' },
        { status: 500 }
      );
    }
    
    // If assignment already exists, update it
    if (existingAssignment) {
      const { error: updateError } = await supabase
        .from('jet_user_assignments')
        .update({
          role: data.role,
          permission_level: data.permission_level,
          updated_at: new Date().toISOString(),
        })
        .eq('jet_id', data.jet_id)
        .eq('user_id', data.user_id);
      
      if (updateError) {
        console.error('Error updating assignment:', updateError);
        return NextResponse.json(
          { error: 'Failed to update assignment' },
          { status: 500 }
        );
      }
      
      // If assignment was for owner, update the jet's owner_id too
      if (data.role === 'owner') {
        const { error: jetUpdateError } = await supabase
          .from('jets')
          .update({
            owner_id: data.user_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.jet_id);
        
        if (jetUpdateError) {
          console.error('Error updating jet owner:', jetUpdateError);
          // Not critical, continue anyway
        }
      }
      
      // Revalidate related paths
      revalidatePath('/admin/jets');
      
      return NextResponse.json({
        success: true,
        id: existingAssignment.id,
        message: 'Assignment updated successfully',
      });
    }
    
    // Otherwise, create a new assignment
    const assignment_id = uuidv4();
    
    const { error: insertError } = await supabase
      .from('jet_user_assignments')
      .insert({
        id: assignment_id,
        jet_id: data.jet_id,
        user_id: data.user_id,
        role: data.role,
        permission_level: data.permission_level,
      });
    
    if (insertError) {
      console.error('Error creating assignment:', insertError);
      return NextResponse.json(
        { error: 'Failed to create assignment' },
        { status: 500 }
      );
    }
    
    // If assignment is for owner, update the jet's owner_id too
    if (data.role === 'owner') {
      const { error: jetUpdateError } = await supabase
        .from('jets')
        .update({
          owner_id: data.user_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.jet_id);
      
      if (jetUpdateError) {
        console.error('Error updating jet owner:', jetUpdateError);
        // Not critical, continue anyway
      }
    }
    
    // Revalidate related paths
    revalidatePath('/admin/jets');
    
    return NextResponse.json({
      success: true,
      id: assignment_id,
      message: 'User assigned to jet successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 