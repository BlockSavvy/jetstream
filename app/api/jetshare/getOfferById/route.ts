import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSBClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get('id');
    const userId = searchParams.get('u');
    
    console.log(`getOfferById API called with ID: ${offerId}, user: ${userId || 'unknown'}`);
    
    if (!offerId) {
      return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });
    }
    
    // Log the exact offer ID we're looking for to debug
    console.log('Attempting to find offer with exact ID:', offerId);
    
    // Create Supabase client with service role key to bypass auth issues
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }
    
    const serviceClient = createSBClient(supabaseUrl, supabaseServiceKey);
    
    // First try to get the offer directly with service role - this should always work if it exists
    const { data: offer, error: offerError } = await serviceClient
      .from('jetshare_offers')
      .select('*')
      .eq('id', offerId)
      .maybeSingle();
      
    if (offerError) {
      console.error('Error fetching offer by ID:', offerError);
      return NextResponse.json({ 
        error: 'Failed to fetch offer', 
        details: offerError 
      }, { status: 500 });
    }
    
    if (!offer) {
      console.log('Offer not found with ID:', offerId);
      
      // Try to find offers that match the accepting user - maybe ID was lost in transit
      if (userId) {
        const { data: matchedOffers } = await serviceClient
          .from('jetshare_offers')
          .select('*')
          .eq('matched_user_id', userId)
          .eq('status', 'accepted')
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (matchedOffers && matchedOffers.length > 0) {
          console.log('Found recently accepted offer by matched_user_id:', matchedOffers[0].id);
          
          // Return this as a potential match
          const relevantOffer = matchedOffers[0];
          
          // Get user details
          const { data: user } = await serviceClient
            .from('profiles')
            .select('*')
            .eq('id', relevantOffer.user_id)
            .single();
            
          // Get matched user if present
          const { data: matchedUser } = await serviceClient
            .from('profiles')
            .select('*')
            .eq('id', relevantOffer.matched_user_id)
            .single();
            
          return NextResponse.json({
            offer: relevantOffer,
            user,
            matched_user: matchedUser,
            recovered: true
          });
        }
      }
      
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }
    
    // If we found the offer, get user details
    let userData = null;
    if (offer.user_id) {
      const { data: user } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', offer.user_id)
        .single();
        
      userData = user;
    }
    
    // Get matched user if present
    let matchedUserData = null;
    if (offer.matched_user_id) {
      const { data: matchedUser } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', offer.matched_user_id)
        .single();
        
      matchedUserData = matchedUser;
    }
    
    // Return the offer with associated user data
    return NextResponse.json({
      offer,
      user: userData,
      matched_user: matchedUserData
    });
  } catch (error) {
    console.error('Unhandled error in getOfferById API:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 