# JetStream Database Restoration

This folder contains SQL scripts to restore and populate the JetStream database, fully integrated with JetShare functionality. These scripts create all necessary tables, relationships, and seed them with realistic data.

## Script Organization

The restoration is split into multiple files for better organization and ease of execution:

1. **restore-jetstream-1-schema.sql**: Creates the core tables (profiles, jets, airports, flights, bookings, etc.)
2. **restore-jetstream-2-crew-tables.sql**: Creates the crew-related tables and functions
3. **restore-jetstream-3-jetshare-tables.sql**: Creates the JetShare-specific tables
4. **restore-jetstream-4-rls-policies.sql**: Sets up Row Level Security policies for all tables
5. **restore-jetstream-5-triggers.sql**: Creates triggers and functions for timestamps and other automated behaviors
6. **restore-jetstream-6-seed-data.sql**: Populates all tables with realistic sample data

## Main Restoration File

The **restore-jetstream-complete.sql** file includes all the parts in the correct order, wrapped in a transaction for safety.

## How to Execute

### Option 1: Using the Supabase Dashboard SQL Editor

1. Visit the [Supabase Dashboard](https://app.supabase.io)
2. Navigate to the SQL Editor
3. Open `restore-jetstream-complete.sql`
4. Click "Run" to execute

### Option 2: Using the PostgreSQL Command Line

```bash
psql "postgres://postgres.vjhrmizwqhmafkxbmfwa:opR70XVU1mnVcgOP@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require" -f restore-jetstream-complete.sql
```

### Option 3: Using the direct-migration.js Script

```bash
node db/direct-migration.js
```

## What's Included

- **Users & Profiles**: 20 realistic user profiles with different types (travelers, owners)
- **Jets**: 15 realistic private jets with detailed specifications
- **Airports**: 15 major airports across the USA
- **Pilots & Crew**: 20 specialized crew members with ratings and reviews
- **Flights**: 15 scheduled flights with bookings
- **Specialized Flights**: Various themed flight experiences
- **JetShare Offers**: 20 offers (10 open, 10 accepted/completed with transactions)

## Database Schema

The complete database schema includes:

- Core tables: profiles, jets, airports, flights, bookings, etc.
- Crew tables: pilots_crews, crew_reviews, specialized_flights, etc.
- JetShare tables: jetshare_offers, jetshare_transactions, jetshare_settings

All tables are properly related with foreign keys and equipped with appropriate indices and RLS policies.

## Image References

The scripts reference images in the following paths that should be available in your storage:

- Jet images: `/jets/1.jpg` through `/jets/15.jpg`
- Crew images: `/crew/1.jpg` through `/crew/20.jpg`
- User avatars: `/avatars/user-1.jpg` through `/avatars/user-20.jpg`
