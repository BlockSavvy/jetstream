# JetShare - Private Jet Flight Sharing Platform

## Overview

JetShare is a flight-sharing application integrated into the JetStream platform. It allows users who have booked private jet flights to share a portion of their flight cost with other users, providing a way to offset the cost of private air travel.

## Features

- **Flight Share Offers**: Create and manage offers to share flight costs
- **Flight Share Listings**: Browse and accept available offers
- **Secure Payments**: Process payments via Stripe Connect (fiat) or Coinbase Commerce (crypto)
- **Transaction Management**: Track all transactions and payment status
- **Mobile-First Design**: Optimized UI for mobile devices with responsive desktop views
- **User Dashboard**: Manage offers, bookings, and view transaction history

## Database Schema

JetShare uses the following Supabase tables:

1. **jetshare_settings**
   - Platform-wide settings including handling fee percentage
   - Controls for enabling/disabling payment methods

2. **jetshare_offers**
   - Stores flight share offers with details like departure/arrival locations
   - Tracks offer status (open, accepted, completed)
   - Links to original purchaser and matched user

3. **jetshare_transactions**
   - Records all financial transactions
   - Stores payment method, status, and references
   - Links to the relevant offer and involved users

## Setup Instructions

### 1. Database Setup

Run the migration script in your Supabase SQL Editor:

```sql
-- Copy the contents of migrations/jetshare_migration.sql here
```

### 2. Environment Variables

Add the following environment variables:

```
# Stripe API keys for fiat payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Coinbase Commerce API keys for crypto payments
COINBASE_COMMERCE_API_KEY=...
COINBASE_COMMERCE_WEBHOOK_SECRET=...
```

### 3. Install dependencies

```bash
npm install stripe coinbase-commerce-node
```

### 4. Seed the database with sample data (optional)

   ```bash
   npm run seed:jetshare
   ```

## User Flow

1. **Creating an Offer**:
   - Navigate to `/jetshare`
   - Click "Offer a Flight Share"
   - Fill in flight details and share amount
   - Submit to create the offer

2. **Finding and Accepting a Share**:
   - Navigate to `/jetshare/listings`
   - Browse available offers
   - Click "View Details" on an interesting offer
   - Review details and click "Accept & Book"
   - Complete payment with card or crypto

3. **Managing Offers and Bookings**:
   - Navigate to `/dashboard/jetshare`
   - View statistics and all your JetShare activity
   - Track transactions and download receipts

## Payment Processing

- **Stripe Connect**: Used for credit card payments with a 7.5% platform fee
- **Coinbase Commerce**: Used for cryptocurrency payments with the same fee structure
- **Webhooks**: Both payment processors send webhooks to update transaction status

## Future Enhancements

1. **AI Matching**: Integration with JetStream Pulse for intelligent flight matching
2. **Advanced Filters**: More sophisticated filtering of available offers
3. **In-app Messaging**: Allow users to communicate before accepting offers
4. **Multi-passenger Sharing**: Enable multiple users to share a single flight
5. **Social Verification**: Enhanced trust features for user profiles

## Troubleshooting

If you encounter issues:

1. **Payment Processing**: Check webhook configurations and logs
2. **Database Issues**: Verify migration scripts have run successfully
3. **API Errors**: Check the browser console and server logs for details

For detailed logs, monitor the API routes in the browser Dev Tools Network tab or server console.

## Security Considerations

- All transactions are secured through proper authentication and authorization
- Financial data is handled securely through Stripe and Coinbase
- Supabase Row Level Security (RLS) policies are implemented to protect user data
- Personal information is anonymized in public listings

## Contributing

When contributing to the JetShare feature:

1. Follow the established code patterns and conventions
2. Ensure mobile-first design principles are maintained
3. Write comprehensive tests for new functionality
4. Document any API changes or new features

---

JetShare is designed to be modular, allowing for easy expansion as the platform grows. The mobile-first approach ensures optimal user experience on smartphones, while maintaining full functionality on desktop browsers.
