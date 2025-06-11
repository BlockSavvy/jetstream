# GDY·UP Payment & Offer Execution Overhaul

This document outlines the Bitcoin payment flow integration, "Pay Later" functionality, and fixes for broken routes in the GDY·UP app.

## Overview

The implementation provides a complete payment flow for GDY·UP with the following features:

- BTCPay Server integration for Bitcoin payments (Lightning + On-chain)
- Stripe integration for credit card payments
- "Pay Later" functionality with 1-hour hold
- Fixed routing for offer acceptance, payment, and post-payment flows
- Mobile-responsive UI with Bitcoin-themed styling
- Auto-expiry system for unpaid offers

## Environment Variables

Add these variables to your `.env` file:

```
# BTCPay Server configuration
BTCPAY_HOST=https://btc.gdyup.xyz
BTCPAY_API_KEY=your-api-key-from-btcpay-server
BTCPAY_WEBHOOK_SECRET=your-webhook-secret-from-btcpay-server

# Internal API key for cron jobs
INTERNAL_API_KEY=gdyup-internal-api
```

## API Endpoints

### Payment Processing

- `/api/jetshare/process-payment`: Handles both Stripe and BTCPay payments
- `/api/jetshare/check-payment`: Checks the status of a payment
- `/api/webhooks/btcpay`: Webhook handler for BTCPay Server payment updates
- `/api/jetshare/cleanup-expired-offers`: Reverts expired offers to available status

## User Flow

1. **Offer Acceptance**:
   - User accepts a jetshare offer
   - Offer is marked as "accepted" in the database

2. **Payment Options**:
   - Credit Card (Stripe)
   - Bitcoin (BTCPay Server with Lightning Network preference)
   - Pay Later (1-hour hold)

3. **Pay Later Flow**:
   - Offer status set to "accepted_but_unpaid"
   - Offer gets an expiration time (1 hour from acceptance)
   - Seats are temporarily locked
   - User sees a countdown timer
   - After expiration, offer reverts to "available" via cleanup API

4. **Post-Payment Flow**:
   - Payment completion updates offer to "completed"
   - User gets access to:
     - Boarding pass
     - Seat assignment
     - Messaging with the other party

## File Structure

### Components

- `app/gdyup/components/JetSharePaymentForm.tsx`: Main payment form component

### API Routes

- `app/api/jetshare/process-payment/route.ts`: Payment processing API
- `app/api/jetshare/check-payment/route.ts`: Payment status checking
- `app/api/webhooks/btcpay/route.ts`: BTCPay webhook handler
- `app/api/jetshare/cleanup-expired-offers/route.ts`: Expired offer cleanup

### Pages

- `app/gdyup/payment/[id]/page.tsx`: Payment page
- `app/gdyup/payment/success/page.tsx`: Success page
- `app/gdyup/dashboard/offers/[id]/page.tsx`: Offer detail page
- `app/gdyup/boardingpass/[id]/page.tsx`: Boarding pass page

### Services

- `lib/services/btcpay-api.ts`: BTCPay Server API integration

## Setting Up BTCPay Server

1. Access your BTCPay Server at <https://btc.gdyup.xyz>
2. Create a new API key with the following permissions:
   - `btcpay.store.canviewinvoices`
   - `btcpay.store.cancreateinvoice`
   - `btcpay.store.canmodifyinvoices`
3. Create a new webhook pointing to your application's webhook URL:
   - URL: `https://yourapp.com/api/webhooks/btcpay`
   - Events: `InvoiceSettled`, `InvoiceExpired`, `InvoicePaymentSettled`, `InvoicePaymentFailed`
4. Copy the webhook secret to your .env file

## Auto-Expiry Setup

Set up a cron job or scheduled task to call the cleanup API every few minutes:

```bash
# Example using curl (run every 5 minutes)
curl -X GET "https://yourapp.com/api/jetshare/cleanup-expired-offers?key=your-internal-api-key"
```

## Testing

1. Development mode automatically uses test mode for both Stripe and BTCPay
2. Test credit cards:
   - 4242 4242 4242 4242 (Visa)
   - Expiry date: Any future date
   - CVV: Any 3 digits
3. For Bitcoin testing, BTCPay Server has a testnet mode

## Removed Features

- All Coinbase Commerce integration code has been removed
- Old payment handling code has been replaced

## Future Enhancements

- .pkpass boarding pass generation for Apple Wallet
- Advanced seat selection interface
- Nostr DM integration for messaging
- Add npub field to users for future Nostr integration
