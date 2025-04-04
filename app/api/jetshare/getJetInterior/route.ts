import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get jet_id from query params
    const { searchParams } = new URL(request.url);
    const jet_id = searchParams.get('jet_id');

    if (!jet_id) {
      return NextResponse.json({ error: 'Missing jet_id parameter' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createServerComponentClient({ cookies });

    // Query the jet_interiors table based on jet_id
    const { data: interior, error } = await supabase
      .from('jet_interiors')
      .select('*')
      .eq('jet_id', jet_id)
      .single();

    if (error) {
      console.error('Error fetching jet interior:', error);
      return NextResponse.json({ error: 'Failed to fetch jet interior' }, { status: 500 });
    }

    // Return the interior data
    return NextResponse.json({ interior });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 