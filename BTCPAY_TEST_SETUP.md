# BTCPay Server Test Mode Setup for Production

## Overview

This guide explains how to set up BTCPay Server in test mode while running your app in production. This allows you to:

- Test the full payment flow on your production domain
- Let users simulate payments without spending real BTC
- Use the app while your node is still syncing

## Configuration Steps

### 1. Environment Variables Setup

Add these environment variables to your production deployment:

```
BTCPAY_DEV_MODE=true
BTCPAY_TEST_MODE=true
```

This will enable the development simulator even in production builds.

### 2. BTCPay Server Store Settings

1. Log in to your BTCPay Server admin panel
2. Go to **Stores** > **[Your Store]** > **Settings**
3. Enable **Allow anyone to create invoices** setting
4. Under **Checkout Experience**, set:
   - Default expiration time: 60 minutes (longer for testing)
   - Consider invoice confirmed when: At least 1 confirmation
5. Save changes

### 3. Create a Test Wallet

1. Go to **Wallets** section in BTCPay Server
2. Create a new wallet specifically for testing
3. Label it clearly as "TEST WALLET - DO NOT USE FOR REAL FUNDS"
4. Connect this wallet to your test store

### 4. Set Up Test Payment Methods

1. Go to **Stores** > **[Your Store]** > **Payment Methods**
2. For Bitcoin:
   - Enable "On-Chain" and "Lightning" payments
   - Under "Lightning", enable "Use testnet node for Lightning payments"
   - If you want to test Lightning without a synced node, enable "LNURL" too

### 5. Test Invoice System

1. Go to **Invoices** > **Create Invoice**
2. Create test invoices manually to verify setup
3. Use the "Mark as Paid" button to simulate payments

### 6. Webhook Configuration

1. Go to **Stores** > **[Your Store]** > **Webhooks**
2. Create a new webhook with:
   - URL: `https://your-production-domain.com/api/webhooks/btcpay`
   - Events: `invoice_created`, `invoice_processing`, `invoice_settled`, `invoice_expired`
   - Secret: Generate and copy the webhook secret
3. Add this secret to your environment variables:

   ```
   BTCPAY_WEBHOOK_SECRET=your_generated_secret
   ```

## Testing With Friends

1. Invite friends using your production URL
2. They will see the regular payment flow, but with the simulator
3. For them to test as buyers:
   - They should create accounts on your site
   - You'll need to create test offers in the database
   - They can "purchase" shares without spending real BTC

## Reverting to Real Payments

When your node is fully synced and you're ready for real payments:

1. Remove the `BTCPAY_DEV_MODE` and `BTCPAY_TEST_MODE` environment variables
2. In BTCPay Server, disable test settings
3. Verify your Lightning node is properly connected and funded

Remember to clearly communicate to all users when switching from test to real mode!
