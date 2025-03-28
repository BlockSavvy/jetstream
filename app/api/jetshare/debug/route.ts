import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ensureUserProfile } from '@/app/jetshare/utils/ensureUserProfile';

export async function GET(request: NextRequest) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is not available in production' }, { status: 403 });
  }
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Check user's offers
    const { data: userOffers, error: offersError } = await supabase
      .from('jetshare_offers')
      .select('*')
      .eq('user_id', user.id);
    
    // Get total offers in system
    const { count: totalOffers, error: countError } = await supabase
      .from('jetshare_offers')
      .select('*', { count: 'exact', head: true });
    
    // Attempt to ensure profile exists if it doesn't
    let profileResult = { success: false, message: 'Profile already exists' };
    if (!profile) {
      const result = await ensureUserProfile(user);
      profileResult = {
        success: result.success,
        message: result.message || 'Profile creation completed'
      };
    }
    
    // Get database schema info for troubleshooting
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'jetshare_offers' })
      .select('*');
    
    return NextResponse.json({
      success: true,
      debug_info: {
        user: {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        },
        profile: {
          exists: !!profile,
          data: profile || null,
          error: profileError ? profileError.message : null,
          fixed: profileResult.success,
          fixMessage: profileResult.message,
        },
        offers: {
          user_offers: userOffers || [],
          user_offers_count: userOffers?.length || 0,
          total_offers_in_system: totalOffers || 0,
          error: offersError ? offersError.message : null,
        },
        schema: {
          data: schemaData || null,
          error: schemaError ? schemaError.message : null
        }
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Debug operation failed', message: (error as Error).message },
      { status: 500 }
    );
  }
} 