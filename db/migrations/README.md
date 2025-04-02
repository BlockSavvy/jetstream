# Concierge Tables Database Migration

This directory contains the SQL migration scripts needed to set up the database tables for the AI Concierge feature.

## How to Execute the Migration

### Option 1: Using the Supabase SQL Editor (Recommended)

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy the contents of `concierge_tables.sql` and paste it into the SQL Editor
5. Click "Run" to execute the SQL

### Option 2: Using the Create Tables API Endpoint

You can also use the API endpoint we've created to set up the tables programmatically:

```
GET /api/concierge/create-tables
```

Note that this endpoint requires authentication and is intended to be used during development or by admin users.

## Table Structure

The migration creates the following tables:

1. **concierge_conversations**
   - Stores conversation history between users and the AI concierge
   - Contains message history and interaction type (text/voice)

2. **concierge_scheduled_tasks**
   - Stores scheduled notifications, reminders, and other tasks
   - Used for flight notifications and user-requested reminders

3. **concierge_amenity_bookings**
   - Stores amenity booking requests for flights
   - Includes preferences and status tracking

4. **concierge_transportation_bookings**
   - Stores ground transportation booking requests
   - Includes pickup/dropoff locations and vehicle preferences

## Row Level Security (RLS)

The migration also sets up Row Level Security policies to ensure users can only:

- View their own conversations and data
- Create records associated with their user ID
- Update their own records

This ensures proper data isolation and security in a multi-tenant environment.

## Database Functions

The migration creates several PostgreSQL functions that can be called via RPC:

- `create_concierge_tables()`: Creates all tables
- Individual functions for creating each table separately

These functions are used by the API endpoint for table creation but can also be called directly via Supabase's RPC functionality.
