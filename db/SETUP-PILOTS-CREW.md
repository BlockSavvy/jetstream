# Setting Up Pilots & Crew Feature

This guide explains how to set up the database for the Pilots & Crew Specialization feature.

## Migration Files

The database migrations are structured as follows:

1. `001_initial_schema.sql` - Base JetStream database tables
2. `002_pilots_crew_tables.sql` - Pilots and crew specialization tables
3. `003_travel_preferences.sql` - User travel preferences

## Seed Data

Two seed files provide comprehensive test data:

1. `001_seed_data.js` - Core JetStream seed data (users, flights, jets, etc.)
2. `002_crew_data.js` - Specialized pilot and crew data

## Option 1: Supabase SQL Editor (Recommended)

For the most reliable setup, use the Supabase SQL Editor:

1. Log into your Supabase Dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy/paste the contents of `pilots_crew_sql_for_editor.sql`
5. Run the SQL script

This approach bypasses any issues with the migration system and directly creates all tables, relationships, and seed data.

## Option 2: One-Step Setup Script

Use the all-in-one setup script that handles everything:

```bash
# Make sure you have the required dependencies
npm install

# Run the complete setup
npm run setup
```

This will:

1. Create required database functions
2. Run all migrations in sequence
3. Seed the database with both core and crew data

## Option 3: Manual Step-by-Step

If you prefer to run the steps manually:

```bash
# 1. Set up the database structure
npm run migrate

# 2. Seed the database with test data
npm run seed
```

## Troubleshooting

If you encounter issues with the migrations or seeding:

1. Check that your `.env` file has the correct Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

2. If specific seed data is failing, you can run individual seed files:

   ```bash
   node ./seeds/001_seed_data.js
   node ./seeds/002_crew_data.js
   ```

3. If `flight_duration_hours` column errors appear, update your schema:

   ```sql
   ALTER TABLE flights ADD COLUMN IF NOT EXISTS flight_duration_hours NUMERIC;
   ```

4. If `travel_history` column errors appear, update your profiles table:

   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS travel_history JSONB DEFAULT '[]';
   ```

5. If encountering `exec_sql` function errors, manually create it in the SQL Editor:

   ```sql
   CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
   RETURNS void
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     EXECUTE sql_query;
   END;
   $$;
   ```

## Database Schema Details

The feature introduces these new tables:

- `pilots_crews` - Stores crew member profiles, specializations, and ratings
- `crew_reviews` - Stores user reviews for crew members
- `specialized_flights` - Links crews with flights and adds specialized themes
- `custom_itinerary_requests` - Stores custom flight requests from users
- `travel_preferences` - Stores user travel preferences for AI matching

The feature also adds columns to the existing `flights` table:

- `specialized_event` - Boolean flag for specialized flights
- `crew_id` - Reference to the pilot/crew member

## Integration with AI Matching

The pilots & crew specialization data integrates with JetStream's AI matching (Pulse) by:

1. Using crew specializations as matching criteria
2. Including crew ratings in flight recommendations
3. Supporting custom itinerary requests that match users with similar interests
