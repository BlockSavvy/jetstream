-- JETSTREAM DATABASE COMPLETE RESTORATION SCRIPT
-- This script restores the JetStream database with all tables, relationships, and sample data

-- Begin transaction
BEGIN;

\echo 'Running Part 1: Schema';
\ir 'restore-jetstream-1-schema.sql'

\echo 'Running Part 2: Crew Tables';
\ir 'restore-jetstream-2-crew-tables.sql'

\echo 'Running Part 3: JetShare Tables';
\ir 'restore-jetstream-3-jetshare-tables.sql'

\echo 'Running Part 4: RLS Policies';
\ir 'restore-jetstream-4-rls-policies.sql'

\echo 'Running Part 5: Triggers';
\ir 'restore-jetstream-5-triggers.sql'

\echo 'Running Part 6: Seed Data';
\ir 'restore-jetstream-6-seed-data.sql'

COMMIT; 