# JetShare Module

JetShare is a module integrated into the JetStream platform that allows users to share private jet flights, reducing costs by finding co-passengers.

## Setup Instructions

### 1. Database Setup

JetShare requires two main tables and some utility functions for diagnostics:

```sql
-- Run these in the Supabase SQL Editor

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS jetshare_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  flight_date TIMESTAMP WITH TIME ZONE NOT NULL,
  departure_location TEXT NOT NULL,
  arrival_location TEXT NOT NULL,
  total_flight_cost INTEGER NOT NULL,
  requested_share_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  matched_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jetshare_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES jetshare_offers(id),
  payer_user_id UUID NOT NULL REFERENCES profiles(id),
  recipient_user_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  handling_fee INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  transaction_reference TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS jetshare_offers_user_id_idx ON jetshare_offers(user_id);
CREATE INDEX IF NOT EXISTS jetshare_offers_status_idx ON jetshare_offers(status);
CREATE INDEX IF NOT EXISTS jetshare_offers_matched_user_id_idx ON jetshare_offers(matched_user_id);

-- Set up RLS (Row Level Security) for these tables if needed
ALTER TABLE jetshare_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetshare_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "jetshare_offers_insert_policy" ON jetshare_offers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "jetshare_offers_select_policy" ON jetshare_offers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "jetshare_offers_update_policy" ON jetshare_offers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR matched_user_id = auth.uid());

-- Add diagnostic functions
-- Copy and paste the contents of app/jetshare/utils/supabase_functions.sql here
```

### 2. Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Running the Application

```bash
npm run dev
```

Access JetShare at: <http://localhost:3000/jetshare>

## Debugging & Troubleshooting

### Common Issues & Solutions

#### 1. Foreign Key Constraint Violations

**Issue**: When creating offers, you might encounter errors related to foreign key constraints.

**Solution**: This usually happens when a user profile doesn't exist. Use the diagnostic endpoint to check and fix:

```
GET /api/jetshare/debug
```

Or visit the debug page (development mode only):

```
/jetshare/debug
```

#### 2. Offers Not Appearing in the Marketplace

**Issue**: Offers created by a user might not appear in the marketplace listings.

**Solutions**:

- Check that the API endpoint is filtering correctly (viewMode=marketplace)
- Ensure the user has created an offer
- Verify that the offer status is "open"

#### 3. Blank Offer Creation Form

**Issue**: The offer creation form might appear blank or not load properly.

**Solutions**:

- Check browser console for JavaScript errors
- Ensure user is authenticated
- Verify that the user has a valid profile in the database

#### 4. Database Setup Troubleshooting

If you need to check if the database is set up correctly, run the SQL script in `app/jetshare/utils/supabase_functions.sql` in the Supabase SQL Editor. This will create the necessary diagnostic functions.

### Debugging Tools

We've provided several debugging tools:

1. **Debug API**: `/api/jetshare/debug` - Returns information about the current user, their profile, and offers
2. **Fix Constraints API**: `/api/jetshare/fixConstraints` - Can fix database constraints and create missing profiles
3. **Debug Page**: `/jetshare/debug` - UI for debugging database issues (development mode only)

### Manual Database Fixes

If you need to directly fix the database:

1. Ensure user profiles exist:

```sql
INSERT INTO profiles (id, first_name, last_name, email, created_at, updated_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'first_name', 'User'),
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  email,
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

2. Remove orphaned offers:

```sql
DELETE FROM jetshare_offers
WHERE user_id NOT IN (SELECT id FROM profiles);
```

## Development Notes

### File Structure

```
/app/jetshare
  /components - UI components
  /utils - Utility functions
  /api - API endpoints
  /debug - Debug UI
```

### API Endpoints

- `/api/jetshare/getOffers` - Get flight share offers with filtering
- `/api/jetshare/createOffer` - Create a new flight share offer
- `/api/jetshare/acceptOffer` - Accept a flight share offer
- `/api/jetshare/processPayment` - Process payment for an accepted offer
- `/api/jetshare/debug` - Get debug information
- `/api/jetshare/fixConstraints` - Fix database constraints

### Key Components

- `JetShareListingsContent` - Displays flight share listings
- `OfferCreationForm` - Form for creating flight share offers
- `JetShareDashboard` - User dashboard for managing offers and bookings

## Additional Resources

- Database Schema: See SQL setup above
- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js Documentation: [https://nextjs.org/docs](https://nextjs.org/docs)

# JetShare Dashboard Module

## Error Handling and Resilience Strategy

The JetShare dashboard is designed to be highly resilient to various failure modes, using the following strategies:

### Client-Side Component

1. **Multiple Authentication Sources**:
   - Uses session, localStorage, and auth context as fallbacks to find the user ID
   - Continues to function if any single auth method fails

2. **Graceful Data Handling**:
   - Implements timeouts to prevent endless loading states
   - Individual API failures do not crash the entire dashboard
   - Shows empty states with helpful messages when data cannot be loaded

3. **Defensive Rendering**:
   - Validates all data before rendering components
   - Provides fallbacks for missing or malformed data
   - Prevents crashes from unexpected API response formats

### API Routes

1. **Direct Database Access**:
   - Uses Supabase service role for authentication-independent data access
   - Bypasses session validation to avoid "Auth session missing" errors

2. **Explicit Error Handling**:
   - Provides detailed error messages for debugging
   - Returns clean error responses to the client
   - Logs issues with context for troubleshooting

3. **Safe Query Construction**:
   - Uses simplified queries without complex joins to reduce points of failure
   - Ensures minimal dependencies on related data structures

## Common Issues and Fixes

1. **Auth Session Missing**: Fixed by using direct service role access in API routes
2. **Cannot Read Properties of Undefined**: Fixed by adding null checks and safe property access
3. **Empty Data States**: Fixed by providing default values and arrays
4. **Server Error (500)**: Fixed by improving error handling in API routes

## Future Improvements

- Implement local data caching for offline or error recovery
- Add retry logic for failed API requests
- Consider server-side rendering for initial data fetch
