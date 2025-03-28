import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getUserJetShareStats } from '@/lib/services/jetshare';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the user's JetShare statistics
    const stats = await getUserJetShareStats(user.id);
    
    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching JetShare statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', message: (error as Error).message },
      { status: 500 }
    );
  }
} 