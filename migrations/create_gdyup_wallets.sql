-- Migration: Create gdyup_wallets table
DO $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'gdyup_wallets'
  ) THEN
    -- Create the table
    CREATE TABLE gdyup_wallets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      bitcoin_address TEXT,
      lightning_address TEXT,
      custodial BOOLEAN DEFAULT false,
      nostr_linked BOOLEAN DEFAULT false,
      label TEXT,
      nip05 TEXT,
      nip05_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add indices for faster lookups
    CREATE INDEX gdyup_wallets_user_id_idx ON gdyup_wallets(user_id);
    
    -- Add RLS policies
    ALTER TABLE gdyup_wallets ENABLE ROW LEVEL SECURITY;
    
    -- Policy for users to see only their own wallet
    CREATE POLICY "Users can view their own wallet" ON gdyup_wallets
      FOR SELECT USING (auth.uid() = user_id);
      
    -- Policy for users to update their own wallet
    CREATE POLICY "Users can update their own wallet" ON gdyup_wallets
      FOR UPDATE USING (auth.uid() = user_id);
      
    -- Policy for users to insert their own wallet
    CREATE POLICY "Users can insert their own wallet" ON gdyup_wallets
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    RAISE NOTICE 'Created gdyup_wallets table with all required columns';
  ELSE
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'gdyup_wallets' AND column_name = 'nip05'
    ) THEN
      ALTER TABLE gdyup_wallets ADD COLUMN nip05 TEXT;
      RAISE NOTICE 'Added nip05 column to gdyup_wallets table';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'gdyup_wallets' AND column_name = 'nip05_verified'
    ) THEN
      ALTER TABLE gdyup_wallets ADD COLUMN nip05_verified BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added nip05_verified column to gdyup_wallets table';
    END IF;
    
    RAISE NOTICE 'gdyup_wallets table already exists, checked for missing columns';
  END IF;
  
  -- Make sure the table is granted the right permissions
  GRANT ALL ON gdyup_wallets TO service_role;
  GRANT SELECT ON gdyup_wallets TO anon, authenticated;
  GRANT INSERT, UPDATE, DELETE ON gdyup_wallets TO authenticated;
  
  -- Ensure the profiles table has the necessary wallet-related columns
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'btcWalletAddress'
  ) THEN
    ALTER TABLE profiles ADD COLUMN "btcWalletAddress" TEXT;
    RAISE NOTICE 'Added btcWalletAddress column to profiles table';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'lightning_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN lightning_address TEXT;
    RAISE NOTICE 'Added lightning_address column to profiles table';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'nip05_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nip05_verified BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added nip05_verified column to profiles table';
  END IF;
END
$$;

-- Create function to keep wallet data in sync
CREATE OR REPLACE FUNCTION sync_wallet_data()
RETURNS TRIGGER AS $$
BEGIN
  -- When gdyup_wallets is updated, update profiles
  IF TG_TABLE_NAME = 'gdyup_wallets' THEN
    UPDATE profiles
    SET 
      "btcWalletAddress" = NEW.bitcoin_address,
      lightning_address = NEW.lightning_address,
      nip05 = NEW.nip05,
      nip05_verified = NEW.nip05_verified,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  
  -- When profiles is updated, update gdyup_wallets  
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    -- Check if wallet exists
    IF EXISTS (SELECT 1 FROM gdyup_wallets WHERE user_id = NEW.id) THEN
      UPDATE gdyup_wallets
      SET 
        bitcoin_address = NEW."btcWalletAddress",
        lightning_address = NEW.lightning_address,
        nip05 = NEW.nip05,
        nip05_verified = NEW.nip05_verified,
        updated_at = NOW()
      WHERE user_id = NEW.id;
    ELSE
      -- Create wallet if it doesn't exist
      INSERT INTO gdyup_wallets (
        user_id, 
        bitcoin_address, 
        lightning_address, 
        nip05,
        nip05_verified
      ) VALUES (
        NEW.id, 
        NEW."btcWalletAddress", 
        NEW.lightning_address, 
        NEW.nip05,
        NEW.nip05_verified
      );
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for wallet data sync if they don't exist
DO $$
BEGIN
  DROP TRIGGER IF EXISTS wallet_update_trigger ON gdyup_wallets;
  CREATE TRIGGER wallet_update_trigger
  AFTER UPDATE ON gdyup_wallets
  FOR EACH ROW
  EXECUTE FUNCTION sync_wallet_data();
  
  DROP TRIGGER IF EXISTS profile_wallet_update_trigger ON profiles;
  CREATE TRIGGER profile_wallet_update_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (
    OLD."btcWalletAddress" IS DISTINCT FROM NEW."btcWalletAddress" OR
    OLD.lightning_address IS DISTINCT FROM NEW.lightning_address OR
    OLD.nip05 IS DISTINCT FROM NEW.nip05 OR
    OLD.nip05_verified IS DISTINCT FROM NEW.nip05_verified
  )
  EXECUTE FUNCTION sync_wallet_data();
  
  RAISE NOTICE 'Wallet synchronization triggers created or updated';
END
$$; 