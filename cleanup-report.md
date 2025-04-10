# JetStream Codebase Cleanup Report

## Overview
This document outlines the changes made during the systematic cleanup and refactoring of the JetStream codebase, performed under the feature branch `feature/cleanup-archive-refactor`.

## 1. SQL and Database Files
Moved the following SQL files to an organized archive structure:

### Migrated to /archive/sql
- migration_fix_run_sql.sql
- migration_fix_database_admin.sql
- migration_fix_embedding_logs.sql
- migration_embedding_logs.sql
- concierge_voice_tables.sql
- fix-offers-status.sql
- seed_marketplace_offers.sql
- seed-jets.sql
- jetshare_seed.sql
- add_missing_columns_to_jets.sql

### Migrated to /archive/sql/data-exports
- jets_rows.sql (renamed from "jets_rows (3).sql")
- jet_interiors_rows.sql (renamed from "jet_interiors_rows (1).sql")
- aircraft_models_rows.sql (renamed from "aircraft_models_rows (2).sql")

### Migrated to /archive/db/fix-scripts
- flight-airports-fixer.js
- flight-fixer-backup.js
- flight-fixer.js
- fix-flights-direct.js
- fix-flights-sql-editor.sql
- fix-flights-v2.js
- fix-flights-with-airports.sql
- fix-flights.js
- fix-flights.sql
- final-flight-fixer.js
- airport-flights-fixer.js

### Migrated to /archive/db/restore-scripts
- restore-jetstream-1-schema.sql
- restore-jetstream-2-crew-tables.sql
- restore-jetstream-3-jetshare-tables.sql
- restore-jetstream-4-rls-policies.sql
- restore-jetstream-5-triggers.sql
- restore-jetstream-6-seed-data.sql
- restore-jetstream-complete.sql
- restore-jetstream-README.md
- restore-direct.js
- restore-db-for-dashboard.sql
- restore-database.js

## 2. Fix Scripts
Moved one-time data fix scripts to the archive:

### Migrated to /archive/fix-scripts
- fix-crew-db.js
- fix-status-constraint.js
- run-add-missing-columns.js

## 3. Documentation Organization
Organized documentation files into a more structured hierarchy:

### Migrated to /docs/feature-docs
- AI-INFERENCE-SETUP-NOTES.md
- FIX-JETSHARE-STATUS.md
- FIX-STATUS-ISSUE.md
- JETSHARE-AI-CONCIERGE-DOCS.md
- PILOTS-CREW-FEATURE.md
- README-OPENAI.md
- README-jet-images.md

### Migrated to /docs/project-docs
- MIGRATION-NEXT15.md
- PR-TEMPLATE-CONCIERGE.md

## 4. Miscellaneous Files
Organized miscellaneous files into appropriate archive locations:

### Migrated to /archive/logs
- supabase_logs.csv
- cookies.txt

### Migrated to /archive/screenshots
- Screen Shot 2025-03-31 at 6.10.15 PM.png
- Screen Shot 2025-03-31 at 6.06.36 PM.png

## 5. Bug Fixes

### Fixed JetSeatVisualizer API Issue
- Modified `/app/api/jets/[id]/route.ts` to handle 'default' ID case specifically
- Added proper handling for the 'default' case to avoid database querying with invalid UUID
- Fixed NextRequest import to resolve TypeScript error

## 6. Code Consolidation

### Consolidated Utility Functions
- Removed duplicate formatting functions from `lib/utils.ts`
- Centralized formatting functions in `lib/utils/format.ts`
- Updated `lib/utils.ts` to re-export formatting functions to maintain backward compatibility

## 7. Next.js Configuration
- Analyzed both next.config.js and next.config.mjs
- Found significant differences in functionality:
  - next.config.mjs supports user config merging and ES modules
  - next.config.js has different webpack configs and module resolution
- Kept both files as they appear to serve different purposes

## 8. TODO Items
- Identified several TODO comments and temporary settings in config files
- Left TypeScript error handling settings in place as they appear to be intentional

## Next Steps
- Continue identifying and consolidating any other duplicated code
- Review and clean up unused dependencies in package.json
- Standardize naming conventions across the codebase
- Run linting and fix any style issues 