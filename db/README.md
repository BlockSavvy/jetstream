# JetStream Database Tools

This directory contains tools for setting up and seeding the JetStream database in Supabase.

## Setup

1. Install dependencies:
```bash
cd db
npm install
```

2. Create a `.env` file in the `db` directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Note: The service role key is required for database migrations and creating users in the seed data. Keep this key secure and never expose it in client-side code.

## Running Migrations

To create the database schema:

```bash
npm run migrate
```

This will run the SQL files in the `migrations` directory in alphabetical order.

## Alternative Migration Method

If the default migration script encounters issues with the `pgbouncer_exec` function, you can try the alternative migration script:

```bash
node migrate-sql.js
```

## Seeding the Database

To populate the database with test data:

```bash
npm run seed
```

This will create:
- 50 test users with realistic profiles
- 25 private jets with detailed specifications
- 100 flights between various airports
- 40 fractional ownership tokens
- Bookings, payments, and ratings

## Test User Credentials

All test users are created with the same password: `Password123!`

You can log in with any of the email addresses generated during seeding.

## Migrations

The migrations directory contains SQL files for creating the database schema:

- `001_initial_schema.sql` - Creates all tables, triggers, and RLS policies

## Seed Data

The seed script (`seeds/001_seed_data.js`) generates realistic data for:

1. User profiles with preferences
2. Jets with detailed specifications and amenities
3. Flights with origin/destination airports and pricing
4. Fractional ownership tokens with blockchain details
5. Bookings and payments
6. User ratings

## Manual Database Management

You can also use the Supabase dashboard to manage your database:

1. Log in to your Supabase account
2. Go to the SQL Editor
3. Execute the SQL in the migration files manually 