-- Add payment_status column to jetshare_offers table
ALTER TABLE "public"."jetshare_offers" 
ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR,
ADD COLUMN IF NOT EXISTS "payment_details" JSONB;

-- Create index on payment_status for faster queries
CREATE INDEX IF NOT EXISTS "idx_jetshare_offers_payment_status" ON "public"."jetshare_offers" ("payment_status");

-- Comment on columns
COMMENT ON COLUMN "public"."jetshare_offers"."payment_status" IS 'Payment status: unpaid, pending, paid, failed, expired';
COMMENT ON COLUMN "public"."jetshare_offers"."payment_method" IS 'Payment method: fiat, crypto, stripe, btcpay';
COMMENT ON COLUMN "public"."jetshare_offers"."payment_details" IS 'Payment details in JSON format';

-- Update existing offers to have unpaid status if null
UPDATE "public"."jetshare_offers" 
SET "payment_status" = 'unpaid' 
WHERE "payment_status" IS NULL; 