import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET all aircraft models
export async function GET() {
  try {
    const { data: models, error } = await supabase
      .from('aircraft_models')
      .select('*')
      .order('manufacturer', { ascending: true });
    
    if (error) {
      console.error('Error fetching aircraft models:', error);
      return NextResponse.json(
        { error: 'Failed to fetch aircraft models' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(models);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 