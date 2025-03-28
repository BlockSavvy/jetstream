import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareOfferById } from '@/lib/services/jetshare';

export async function GET(request: NextRequest) {
  console.log('getOffer API hit');
  
  try {
    // Get the offer ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('Missing offer ID in request');
      return NextResponse.json(
        { error: 'Missing offer ID', message: 'Offer ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Getting offer details for:', id);
    
    // Check auth - user must be authenticated
    const supabase = await createClient();
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData.user) {
      console.error('Authentication error or no user found:', authError);
      return NextResponse.json(
        { error: 'Authentication required', message: 'You must be logged in to view offer details' },
        { status: 401 }
      );
    }
    
    // Get the offer
    try {
      const offer = await getJetShareOfferById(id);
      console.log('Offer retrieved:', { id: offer.id, status: offer.status });
      
      return NextResponse.json({ 
        success: true, 
        offer
      }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    } catch (offerError) {
      console.error('Error getting offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to get offer', message: (offerError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in getOffer:', error);
    return NextResponse.json(
      { error: 'Failed to get offer', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
} 