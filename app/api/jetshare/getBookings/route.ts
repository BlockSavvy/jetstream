import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareBookings } from '@/lib/services/jetshare';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get bookings with filters
    const bookings = await getJetShareBookings(user.id, {
      status,
      limit,
      offset,
    });
    
    return NextResponse.json({ success: true, bookings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching JetShare bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', message: (error as Error).message },
      { status: 500 }
    );
  }
} 