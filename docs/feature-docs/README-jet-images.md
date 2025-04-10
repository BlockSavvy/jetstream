# Updating Jet Images in JetStream

This README provides instructions for updating the jet images in the JetStream database.

## Prerequisites

Before running the update script, ensure you have the following:

1. Node.js installed
2. Access to the Supabase project
3. Environment variables set up with Supabase credentials

## Setting up Environment Variables

Create a `.env` file in the root of the project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Install Dependencies

Make sure you have the required dependencies:

```bash
npm install @supabase/supabase-js dotenv
```

## Running the Update Script

To update the jet images in the database:

1. Navigate to the project root
2. Run the update script:

```bash
node db/update-jet-images.js
```

## What the Script Does

This script:

1. Fetches all jets from the database
2. Maps each jet's manufacturer and model to the corresponding image paths from our local image folders
3. Updates the `images` field in the database with the correct paths

## Troubleshooting

If you encounter errors:

1. Verify your Supabase credentials are correct
2. Check that the `jets` table exists in your database
3. Ensure you have the required permissions to update the table

## Additional Resources

For more detailed information, see:

- `docs/jet-images-guide.md` - Comprehensive guide to working with jet images
- `db/README-update-images.md` - Technical details about the update script
