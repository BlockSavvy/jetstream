import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareOffers } from '@/lib/services/jetshare';

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
    const userId = searchParams.get('userId') || undefined;
    const departureLocation = searchParams.get('departureLocation') || undefined;
    const arrivalLocation = searchParams.get('arrivalLocation') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get offers with filters
    const offers = await getJetShareOffers({
      status,
      userId,
      departureLocation,
      arrivalLocation,
      startDate,
      endDate,
      limit,
      offset,
    });
    
    return NextResponse.json({ success: true, offers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching JetShare offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers', message: (error as Error).message },
      { status: 500 }
    );
  }
} 