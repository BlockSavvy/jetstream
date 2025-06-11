import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sets up the gdyup_wallets table in the database if it doesn't exist
 */
export async function setupWalletTable(supabase: SupabaseClient) {
  try {
    // Check if the table exists
    const { data: tableExists } = await supabase.rpc('check_table_exists', {
      table_name: 'gdyup_wallets'
    });
    
    // If table already exists, no need to create it
    if (tableExists) {
      console.log('gdyup_wallets table already exists');
      return true;
    }
    
    // Create the table using raw SQL
    const { error } = await supabase.rpc('execute_sql', {
      sql_string: `
        CREATE TABLE IF NOT EXISTS public.gdyup_wallets (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          bitcoin_address TEXT,
          lightning_address TEXT,
          custodial BOOLEAN DEFAULT false,
          nostr_linked BOOLEAN DEFAULT false,
          label TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add indices for faster lookups
        CREATE INDEX IF NOT EXISTS gdyup_wallets_user_id_idx ON public.gdyup_wallets(user_id);
        
        -- Add RLS policies
        ALTER TABLE public.gdyup_wallets ENABLE ROW LEVEL SECURITY;
        
        -- Policy for users to see only their own wallet
        CREATE POLICY "Users can view their own wallet" ON public.gdyup_wallets
          FOR SELECT USING (auth.uid() = user_id);
          
        -- Policy for users to insert/update their own wallet
        CREATE POLICY "Users can update their own wallet" ON public.gdyup_wallets
          FOR UPDATE USING (auth.uid() = user_id);
          
        -- Policy for users to insert their own wallet
        CREATE POLICY "Users can insert their own wallet" ON public.gdyup_wallets
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    });
    
    if (error) {
      console.error('Error creating gdyup_wallets table:', error);
      return false;
    }
    
    console.log('Successfully created gdyup_wallets table');
    return true;
  } catch (error) {
    console.error('Error in setupWalletTable:', error);
    return false;
  }
} 