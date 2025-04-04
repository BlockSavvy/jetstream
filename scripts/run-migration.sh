#!/bin/bash

# Script to run the migration that adds the departure_time field to jetshare_offers table

echo "Running migration to add departure_time field to jetshare_offers table..."

# Set up environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check if the SUPABASE_URL and SUPABASE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables are not set."
  echo "Please ensure these are set in your .env file or environment."
  exit 1
fi

# Create a temporary file
TEMP_FILE=$(mktemp)

# Copy migration SQL to the temporary file
cat migrations/add-departure-time.sql > $TEMP_FILE

# Run the migration with proper authorization headers
curl -X POST \
  -H "Content-Type: application/sql" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  --data-binary @$TEMP_FILE \
  "$SUPABASE_URL/rest/v1/sql" \
  -o /dev/null

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Migration failed. Please check your database connection and permissions."
fi

# Clean up the temporary file
rm $TEMP_FILE

echo "Done." 