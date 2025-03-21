# JetStream Database Setup Instructions

## Database Setup

We've encountered some issues with direct migration scripts due to SSL certificate validation and PostgreSQL function access constraints. The recommended approach is to use Supabase's SQL Editor:

1. **Login to Supabase Dashboard:**
   - Go to https://app.supabase.com/ and login
   - Select your JetStream project

2. **Execute the Schema SQL:**
   - Go to the SQL Editor in the left sidebar
   - Create a new query
   - Copy and paste the contents of `db/sql-for-editor.sql`
   - Execute the query

## Database Seeding Options

After setting up the schema, you can populate the database with test data in one of these ways:

### Option 1: Run the Node.js Seed Script
```bash
cd db
node seeds/001_seed_data.js
```

### Option 2: Use Supabase Dashboard
1. Go to the "Table Editor" in Supabase
2. For each table, click "Insert Row" to manually add data

## Verification

To verify the database setup:
1. Go to the "Table Editor" in Supabase
2. Check that all tables (profiles, jets, airports, flights, etc.) exist
3. If using the seed script, check that data was properly inserted

## Troubleshooting

If you encounter issues with the seed script:
1. Check for error messages in the console
2. Verify that the schema has been correctly set up
3. Check your Supabase credentials in the `.env` file

## Next Steps

Once the database is set up:
1. Connect your application to Supabase using the provided credentials
2. Use the TypeScript types in `lib/types/database.types.ts` for type safety
3. Implement the application features that interact with the database 