import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSBClient } from '@supabase/supabase-js';
import { getJetShareTransactions } from '@/lib/services/jetshare';

// Define CORS headers for consistent response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const requestId = searchParams.get('rid') || 'unknown-rid';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`Get transactions for user: ${userId} (request: ${requestId})`);
    
    // For all requests with userId, use direct database access with service role
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceUrl || !supabaseServiceKey) {
      console.error('Missing Supabase service credentials for transactions');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500, headers: corsHeaders }
      );
    }
    
    try {
      console.log(`Creating transactions service client for ${userId} with URL: ${supabaseServiceUrl.substring(0, 20)}...`);
      
      // Create a service client directly with minimal options
      const serviceClient = createSBClient(supabaseServiceUrl, supabaseServiceKey, {
        auth: { persistSession: false },
        global: { headers: { 'x-connection-id': requestId } }
      });
      
      // Get transactions directly with the service client - simplified query without joins
      console.log(`Executing transaction query for user ${userId}`);
      const { data: transactions, error: transactionsError } = await serviceClient
        .from('jetshare_transactions')
        .select('*')
        .or(`payer_user_id.eq.${userId},recipient_user_id.eq.${userId}`);
      
      if (transactionsError) {
        console.error('Error fetching transactions with service role:', JSON.stringify(transactionsError));
        return NextResponse.json(
          { error: 'Database error', message: JSON.stringify(transactionsError) },
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log(`Found ${transactions?.length || 0} transactions for user ${userId}`);
      
      // Return the transactions
      return NextResponse.json({
        transactions: transactions || [],
        count: transactions?.length || 0,
        success: true
      }, { headers: corsHeaders });
      
    } catch (serviceError) {
      console.error('Service role client error for transactions:', serviceError);
      return NextResponse.json(
        { error: 'Service error' },
        { status: 500, headers: corsHeaders }
      );
    }
    
  } catch (error) {
    console.error('Error in getTransactions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
} 