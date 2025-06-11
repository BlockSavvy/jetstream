-- Migration: Add Bitcoin wallet and Nostr fields to profiles table
DO $$
BEGIN
    -- Add BTC wallet address column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'btcWalletAddress'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "btcWalletAddress" TEXT;
        RAISE NOTICE 'Added btcWalletAddress column to profiles table';
    END IF;

    -- Add LNURL column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'lnurl'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "lnurl" TEXT;
        RAISE NOTICE 'Added lnurl column to profiles table';
    END IF;

    -- Add Lightning wallet type column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'lightningWalletType'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "lightningWalletType" TEXT;
        RAISE NOTICE 'Added lightningWalletType column to profiles table';
    END IF;

    -- Add theme column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'theme'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "theme" TEXT;
        RAISE NOTICE 'Added theme column to profiles table';
    END IF;

    -- Add Nostr NIP-05 verification fields if they don't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'nip05_verified'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "nip05_verified" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added nip05_verified column to profiles table';
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'nip05_verified_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN "nip05_verified_at" TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added nip05_verified_at column to profiles table';
    END IF;

    -- Create a function to enable updating the verification timestamp
    CREATE OR REPLACE FUNCTION update_nip05_verified_at()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.nip05_verified = true AND (OLD.nip05_verified = false OR OLD.nip05_verified IS NULL) THEN
            NEW.nip05_verified_at = NOW();
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create the trigger if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_nip05_verified_at'
    ) THEN
        CREATE TRIGGER set_nip05_verified_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_nip05_verified_at();
        
        RAISE NOTICE 'Created trigger set_nip05_verified_at on profiles table';
    END IF;

    -- Add index on Nostr pubkey for better query performance
    IF NOT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_nostr_pubkey'
    ) THEN
        CREATE INDEX idx_profiles_nostr_pubkey ON profiles ("nostr_pubkey");
        RAISE NOTICE 'Created index on nostr_pubkey column';
    END IF;

    -- Add index on BTC wallet address for better query performance
    IF NOT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_btc_wallet'
    ) THEN
        CREATE INDEX idx_profiles_btc_wallet ON profiles ("btcWalletAddress");
        RAISE NOTICE 'Created index on btcWalletAddress column';
    END IF;

    RAISE NOTICE 'Migration for wallet and Nostr fields completed successfully';
END $$; 