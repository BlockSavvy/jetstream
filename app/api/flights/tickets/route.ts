import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const bookingId = searchParams.get('bookingId');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Build the query
    let query = supabase
      .from('tickets')
      .select('*, bookings(*), flights(*, jets(*), origin:airports!flights_origin_airport_fkey(*), destination:airports!flights_destination_airport_fkey(*))');
    
    // Add filters
    query = query.eq('user_id', userId);
    
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    // Sort by creation date, newest first
    query = query.order('created_at', { ascending: false });
    
    // Execute the query
    const { data: tickets, error } = await query;
    
    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      tickets
    });
  } catch (error) {
    console.error('Error processing tickets request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 