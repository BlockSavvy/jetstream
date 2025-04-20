import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET all jet user assignments
export async function GET() {
  try {
    const { data: assignments, error } = await supabase
      .from('jet_user_assignments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching jet assignments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jet assignments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 