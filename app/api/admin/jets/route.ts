import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

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
    
    // Get all jets
    const { data: jets, error } = await supabase
      .from('jets')
      .select('id, model, manufacturer, capacity, image_url')
      .order('manufacturer', { ascending: true })
      .order('model', { ascending: true });
    
    if (error) {
      console.error('Error fetching jets:', error);
      return NextResponse.json({ error: 'Failed to fetch jets' }, { status: 500 });
    }
    
    return NextResponse.json({ jets });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 