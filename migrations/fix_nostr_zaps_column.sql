-- Fix for nostr_zaps table column naming

-- First check if the table exists
DO $$
BEGIN
    -- If the table already exists but has profile_id column
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'nostr_zaps'
    ) AND EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'nostr_zaps' AND column_name = 'profile_id'
    ) THEN
        -- Rename profile_id to user_id
        ALTER TABLE nostr_zaps RENAME COLUMN profile_id TO user_id;
        
        -- Drop the old index if it exists
        DROP INDEX IF EXISTS idx_nostr_zaps_profile_id;
        
        -- Create new index on user_id
        CREATE INDEX IF NOT EXISTS idx_nostr_zaps_user_id ON nostr_zaps(user_id);
        
        RAISE NOTICE 'Column profile_id has been renamed to user_id in nostr_zaps table';
    ELSIF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'nostr_zaps'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'nostr_zaps' AND column_name = 'user_id'
    ) THEN
        -- If table exists but neither column exists, add user_id
        ALTER TABLE nostr_zaps ADD COLUMN user_id UUID;
        
        -- Create index on user_id
        CREATE INDEX IF NOT EXISTS idx_nostr_zaps_user_id ON nostr_zaps(user_id);
        
        RAISE NOTICE 'Column user_id has been added to nostr_zaps table';
    ELSE
        RAISE NOTICE 'No changes needed for nostr_zaps table';
    END IF;
END
$$; 