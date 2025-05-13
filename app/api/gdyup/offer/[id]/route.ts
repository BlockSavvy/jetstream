import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const offerId = params.id;
  
  if (!offerId) {
    return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
  }
  
  try {
    // Correct cookies handling
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore
    });
    
    // Get the offer details
    const { data: offer, error } = await supabase
      .from('jetshare_offers')
      .select(`
        *,
        user:user_id (*),
        matched_user:matched_user_id (*)
      `)
      .eq('id', offerId)
      .single();
      
    if (error) {
      console.error('Error fetching offer:', error);
      return NextResponse.json({ error: 'Failed to fetch offer details' }, { status: 500 });
    }
    
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // Return the offer details
    return NextResponse.json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('Error in offer API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 