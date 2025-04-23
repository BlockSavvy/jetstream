import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const jetId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    console.log(`Fetching details for jet ${jetId} for user ${userId}`);
    
    const supabase = await createClient();
    
    // Fetch user's jet
    const { data, error } = await supabase
      .from('jets')
      .select('*')
      .eq('id', jetId)
      .single();
    
    if (error) {
      console.error('Error fetching jet:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Jet not found' }, { status: 404 });
    }
    
    // Check if this jet belongs to the user
    if (data.owner_id !== userId) {
      // For now, just log this - in a real app you might want to restrict access
      console.warn(`User ${userId} accessed jet ${jetId} which is owned by ${data.owner_id}`);
    }
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in jet detail API:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error
    }, { status: 500 });
  }
} 