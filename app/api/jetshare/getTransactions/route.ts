import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getJetShareTransactions } from '@/lib/services/jetshare';

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
    const offerId = searchParams.get('offerId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
    
    // Get transactions with filters
    const transactions = await getJetShareTransactions(user.id, {
      offerId,
      limit,
      offset,
    });
    
    return NextResponse.json({ success: true, transactions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching JetShare transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', message: (error as Error).message },
      { status: 500 }
    );
  }
} 