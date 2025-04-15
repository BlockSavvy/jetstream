import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client using the server-side client with admin privileges
    const supabase = await createClient();
    
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