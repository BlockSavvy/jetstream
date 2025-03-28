import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// This API endpoint is used to fix transaction table issues
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
    
    // First, check the current table structure
    const { data: tableStructure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'jetshare_transactions' });
      
    if (structureError) {
      return NextResponse.json({
        error: 'Failed to get table structure',
        message: structureError.message,
        note: 'SQL function get_table_structure may not exist'
      }, { status: 500 });
    }
    
    console.log('Current table structure:', tableStructure);
    
    // Check for needed columns and add them if missing
    const actions = [];
    
    // Payment method column
    if (!tableStructure.some((col: any) => col.column_name === 'payment_method')) {
      const { error: paymentMethodError } = await supabase
        .rpc('add_column_if_not_exists', {
          p_table_name: 'jetshare_transactions',
          p_column_name: 'payment_method',
          p_column_def: 'TEXT'
        });
        
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
    } else {
      actions.push({
        action: 'add_payment_method',
        status: 'skipped',
        message: 'Column already exists'
      });
    }
    
    // Handling fee column
    if (!tableStructure.some((col: any) => col.column_name === 'handling_fee')) {
      const { error: handlingFeeError } = await supabase
        .rpc('add_column_if_not_exists', {
          p_table_name: 'jetshare_transactions',
          p_column_name: 'handling_fee',
          p_column_def: 'DECIMAL(10, 2)'
        });
        
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
    } else {
      actions.push({
        action: 'add_handling_fee',
        status: 'skipped',
        message: 'Column already exists'
      });
    }
    
    // Payment status column
    if (!tableStructure.some((col: any) => col.column_name === 'payment_status')) {
      const { error: paymentStatusError } = await supabase
        .rpc('add_column_if_not_exists', {
          p_table_name: 'jetshare_transactions',
          p_column_name: 'payment_status',
          p_column_def: 'TEXT'
        });
        
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
    } else {
      actions.push({
        action: 'add_payment_status',
        status: 'skipped',
        message: 'Column already exists'
      });
    }
    
    // Return the actions taken
    return NextResponse.json({
      success: true,
      actions,
      note: "SQL functions may need to be created - check developer console for details."
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fixing transactions table:', error);
    return NextResponse.json(
      { error: 'Failed to fix transactions table', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// SQL functions to add to Supabase:
/*
-- Function to get table structure
CREATE OR REPLACE FUNCTION get_table_structure(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_agg(json_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'column_default', column_default,
      'is_nullable', is_nullable
    ))
    FROM information_schema.columns
    WHERE table_name = $1
    AND table_schema = 'public'
  );
END;
$$;

-- Function to add a column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table_name text,
  p_column_name text,
  p_column_def text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = p_table_name
    AND column_name = p_column_name
    AND table_schema = 'public'
  ) THEN
    -- Add the column using dynamic SQL
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS %I %s',
                  p_table_name, p_column_name, p_column_def);
  END IF;
END;
$$;
*/ 