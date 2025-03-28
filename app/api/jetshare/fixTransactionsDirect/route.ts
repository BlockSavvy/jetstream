import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// This API endpoint directly executes SQL to fix the transaction table
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
  }
  
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We'll use direct SQL queries to fix the table structure
    const actions = [];
    
    // Add handling_fee column if it doesn't exist
    try {
      const { error: handlingFeeError } = await supabase.rpc(
        'exec_sql',
        { sql: 'ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2)' }
      );
      
      if (handlingFeeError) {
        actions.push({
          action: 'add_handling_fee',
          status: 'error',
          message: handlingFeeError.message
        });
      } else {
        actions.push({
          action: 'add_handling_fee',
          status: 'success'
        });
      }
    } catch (err) {
      actions.push({
        action: 'add_handling_fee',
        status: 'error',
        message: (err as Error).message
      });
    }
    
    // Add payment_method column if it doesn't exist
    try {
      const { error: paymentMethodError } = await supabase.rpc(
        'exec_sql',
        { sql: 'ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS payment_method TEXT' }
      );
      
      if (paymentMethodError) {
        actions.push({
          action: 'add_payment_method',
          status: 'error',
          message: paymentMethodError.message
        });
      } else {
        actions.push({
          action: 'add_payment_method',
          status: 'success'
        });
      }
    } catch (err) {
      actions.push({
        action: 'add_payment_method',
        status: 'error',
        message: (err as Error).message
      });
    }
    
    // Add payment_status column if it doesn't exist
    try {
      const { error: paymentStatusError } = await supabase.rpc(
        'exec_sql',
        { sql: 'ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT' }
      );
      
      if (paymentStatusError) {
        actions.push({
          action: 'add_payment_status',
          status: 'error',
          message: paymentStatusError.message
        });
      } else {
        actions.push({
          action: 'add_payment_status',
          status: 'success'
        });
      }
    } catch (err) {
      actions.push({
        action: 'add_payment_status',
        status: 'error',
        message: (err as Error).message
      });
    }
    
    // Return results of our actions
    return NextResponse.json({
      success: true,
      actions,
      note: "To run these commands directly in Supabase SQL Editor, use:\n" +
            "ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2);\n" +
            "ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;\n" +
            "ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT;"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fixing transactions table:', error);
    return NextResponse.json({
      error: 'Failed to fix transactions table',
      message: (error as Error).message,
      sqlToRunManually: 
        "-- Run these commands directly in Supabase SQL Editor:\n" +
        "ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2);\n" +
        "ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;\n" +
        "ALTER TABLE jetshare_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT;"
    }, { status: 500 });
  }
}

// SQL function to add to Supabase if needed:
/*
-- Function to execute arbitrary SQL (admin use only)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
*/ 