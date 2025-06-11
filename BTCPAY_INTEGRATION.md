# BTCPay Server Integration for GDY·UP

This document explains how to set up and configure the BTCPay Server integration for the GDY·UP app in a production environment.

## Overview

GDY·UP uses BTCPay Server to process Bitcoin payments for flight shares. The integration consists of:

1. A BTCPay Server instance (self-hosted or managed)
2. API key configuration for creating invoices
3. Webhook configuration for receiving payment updates
4. Database schema support for tracking payment status

## Prerequisites

- A BTCPay Server instance (self-hosted or managed service)
- Access to environment variables for your GDY·UP deployment
- Administrative access to your Supabase database

## Configuration Steps

### 1. Database Setup

First, ensure your database has the required columns for tracking payment status. Run the following SQL in your Supabase SQL Editor:

```sql
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
```

### 2. BTCPay Server Setup

1. **Create a BTCPay Server Account/Instance**:
   - Self-hosted: Follow the [BTCPay Server documentation](https://docs.btcpayserver.org/Deployment/) for deployment options
   - BTCPay Jungle: Use a hosted service like [BTCPay Jungle](https://btcpayjungle.com/)

2. **Create a Store**:
   - Log in to your BTCPay Server
   - Go to Stores > Create a new store
   - Name it "GDY·UP Payments" or similar

3. **Connect a Bitcoin Wallet**:
   - In your store settings, go to "Wallets"
   - Set up a Bitcoin wallet (hot or watch-only)
   - Ensure the wallet is properly funded for testing

4. **Create API Key**:
   - Go to your store settings
   - Navigate to "Access Tokens"
   - Create a new API key with the following permissions:
     - `btcpay.store.canviewinvoices`
     - `btcpay.store.cancreateinvoice`
     - `btcpay.store.canmodifyinvoices`
   - Copy the API key for the next step

5. **Set Up Webhook**:
   - Go to your store settings
   - Navigate to "Webhooks"
   - Create a new webhook with the following settings:
     - URL: `https://your-app-domain.com/api/webhooks/btcpay`
     - Events: Select all invoice-related events (Invoice created, completed, expired, etc.)
     - Secret: Generate a strong secret
     - Copy the webhook secret for the next step

### 3. Environment Variables

Update your GDY·UP application environment variables:

```
BTCPAY_API_KEY=your_api_key_here
BTCPAY_STORE_ID=your_store_id_here
BTCPAY_SERVER_URL=https://your-btcpay-server-domain.com
BTCPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

For development environments, you can use:

```
BTCPAY_DEV_MODE=true
```

This will enable the development simulation when the real BTCPay server is unavailable.

### 4. Testing the Integration

1. **Create a Test Invoice**:
   - Make an offer in the GDY·UP app
   - Go through the payment flow and select Bitcoin
   - Verify you're redirected to the BTCPay checkout page

2. **Test Payment**:
   - For testing, you can use the BTCPay Server's "Mark as Paid" feature
   - Alternatively, send a small amount of Bitcoin to the displayed address

3. **Verify Webhook**:
   - After payment, check your server logs for webhook processing
   - Verify the offer status is updated correctly in the database

## Troubleshooting

### Common Issues

1. **Invoice Creation Fails**:
   - Check your API key permissions
   - Verify the store ID is correct
   - Check server logs for detailed error messages

2. **Webhook Not Receiving Events**:
   - Verify your webhook URL is publicly accessible
   - Check the webhook secret is configured correctly
   - Look for any firewall issues blocking incoming webhooks

3. **Payment Status Not Updating**:
   - Check database schema for payment_status column
   - Verify the webhook is processing correctly
   - Look for errors in the updateOfferPaymentStatus function

### Testing Without Real Bitcoin

For development and testing, the simulator will be used automatically when:

- You're in a development environment (NODE_ENV=development)
- The BTCPay server connection fails
- BTCPAY_DEV_MODE is set to true

## Resources

- [BTCPay Server Documentation](https://docs.btcpayserver.org/)
- [BTCPay Server API Reference](https://docs.btcpayserver.org/API/Greenfield/v1/)
- [BTCPay Server Webhooks](https://docs.btcpayserver.org/Webhooks/)
