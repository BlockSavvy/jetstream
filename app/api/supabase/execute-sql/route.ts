import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { StaticRouteHandler } from '@/lib/types/route-types';

/**
 * API endpoint to execute SQL queries against Supabase
 * Only used by admin users with appropriate permissions
 */
export const POST: StaticRouteHandler = async (request: NextRequest) => {
  try {
    // Get the SQL query from the request body
    const { sql, parameters = [] } = await request.json();
    
    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Get user and check if they have admin rights
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin rights required' },
        { status: 403 }
      );
    }
    
    // Execute the SQL query
    const { data, error, count } = await supabase.rpc('execute_sql', {
      query_text: sql,
      params: parameters
    });
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data,
      count,
      message: 'Query executed successfully'
    });
  } catch (error: any) {
    console.error('Error executing SQL:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}; 