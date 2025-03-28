import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API route to check the status of the JetShare database
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check tables with proper error handling
    let offersCount = 0;
    let offersError = null;
    try {
      const result = await supabase
        .from('jetshare_offers')
        .select('*', { count: 'exact', head: true });
      offersCount = result.count || 0;
      offersError = result.error;
    } catch (error) {
      offersError = { message: 'Table may not exist' };
    }
    
    let profilesCount = 0;
    let profilesError = null;
    try {
      const result = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      profilesCount = result.count || 0;
      profilesError = result.error;
    } catch (error) {
      profilesError = { message: 'Table may not exist' };
    }
    
    let transactionsCount = 0;
    let transactionsError = null;
    try {
      const result = await supabase
        .from('jetshare_transactions')
        .select('*', { count: 'exact', head: true });
      transactionsCount = result.count || 0;
      transactionsError = result.error;
    } catch (error) {
      transactionsError = { message: 'Table may not exist' };
    }
    
    // Determine overall status
    const allTablesExist = !offersError && !transactionsError;
    
    // Get summary of database status
    const dbStatus = {
      offers_exists: !offersError,
      offers_count: offersCount,
      offers_error: offersError ? offersError.message : null,
      
      profiles_exists: !profilesError,
      profiles_count: profilesCount,
      profiles_error: profilesError ? profilesError.message : null,
      
      transactions_exists: !transactionsError,
      transactions_count: transactionsCount,
      transactions_error: transactionsError ? transactionsError.message : null
    };
    
    // Determine instructions based on status
    let instructions = '';
    if (!allTablesExist) {
      instructions = 'Please click "Setup/Repair Database" to create missing tables.';
    }
    
    return NextResponse.json({
      success: allTablesExist,
      message: allTablesExist 
        ? 'Database is properly configured' 
        : 'Some required tables are missing',
      instructions: instructions || null,
      dbStatus
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error checking JetShare database:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking database status',
      error: (error as Error).message
    }, { status: 500 });
  }
} 