# JetStream Database Setup and Restoration

This folder contains scripts to set up and restore the JetStream database, fully integrated with JetShare functionality.

## Table Structure

The JetStream database consists of several core tables:

1. **profiles**: User profiles with basic information
2. **jets**: Available jets with details like model, capacity, and cost
3. **flights**: Scheduled flights with departure/arrival information
4. **bookings**: Flight bookings made by users
5. **ratings**: User ratings for flights
6. **jetshare_offers**: Offers to share jet flights with other users
7. **jetshare_transactions**: Financial transactions for jetshare arrangements
8. **jetshare_settings**: System settings for the JetShare functionality

## Scripts

This folder contains several scripts for managing the database:

### Core Scripts

- **check-tables-info-schema.js**: Lists all tables in the database and their row counts
- **populate-correct-schema.js**: Populates ratings and jetshare_transactions tables using the correct schema
- **populate-minimal.js**: Populates jetshare_settings table with default values
- **test-connection.js**: Tests the connection to the Supabase database

### SQL Restoration Scripts

The SQL scripts are designed to restore the entire database schema:

- **restore-jetstream-1-schema.sql**: Creates the core schema
- **restore-jetstream-2-crew-tables.sql**: Creates crew-related tables
- **restore-jetstream-3-jetshare-tables.sql**: Creates JetShare tables
- **restore-jetstream-4-rls-policies.sql**: Sets up Row Level Security policies
- **restore-jetstream-5-triggers.sql**: Creates database triggers for automated actions
- **restore-jetstream-6-seed-data.sql**: Populates the database with sample data
- **restore-jetstream-complete.sql**: Master file combining all the above scripts

## Setup Instructions

### 1. Set up environment variables

Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Test your connection

```bash
node db/test-connection.js
```

### 3. Check existing tables

```bash
node db/check-tables-info-schema.js
```

### 4. Populate necessary tables

If tables exist but are empty, you can run these scripts to populate them:

```bash
# Populate JetShare settings table
node db/populate-minimal.js

# Populate ratings and jetshare_transactions tables
node db/populate-correct-schema.js
```

### 5. Verify population was successful

```bash
node db/check-tables-info-schema.js
```

## Database Restoration Using SQL (if needed)

If you need to completely restore the database from scratch:

```bash
# Connect to your Supabase database and run:
\i '/path/to/restore-jetstream-complete.sql'
```

This will execute all the SQL scripts in the correct order to set up the entire database schema and populate it with sample data.

## Notes

- The scripts use UUID v4 for generating IDs
- The database is designed to work with Supabase and leverages Row Level Security
- Sample data is provided for demonstration purposes only 