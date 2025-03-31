-- Migration to add jetshare_internal_ops table
-- This table is used to track operations that need to be processed asynchronously
-- For example, when we can't update status due to constraint issues

-- Create the internal operations table
CREATE TABLE IF NOT EXISTS "jetshare_internal_ops" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "operation" TEXT NOT NULL,
  "params" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "processed_at" TIMESTAMPTZ,
  "result" JSONB,
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for pending operations
CREATE INDEX IF NOT EXISTS idx_jetshare_internal_ops_pending 
ON "jetshare_internal_ops" ("status") 
WHERE status = 'pending';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jetshare_internal_ops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_jetshare_internal_ops_modtime ON "jetshare_internal_ops";
CREATE TRIGGER update_jetshare_internal_ops_modtime
BEFORE UPDATE ON "jetshare_internal_ops"
FOR EACH ROW
EXECUTE FUNCTION update_jetshare_internal_ops_updated_at(); 