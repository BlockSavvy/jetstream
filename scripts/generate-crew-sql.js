const fs = require('fs');
const path = require('path');

// Read the migration file
const migrationPath = path.join(__dirname, '../db/migrations/001_pilots_crew_tables.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

// Output the SQL to console for easy copying
console.log('=================== SQL MIGRATION SCRIPT ===================');
console.log('-- Copy this entire SQL script and paste it into the Supabase SQL Editor');
console.log('-- This will create all required tables for the Pilots & Crew feature');
console.log();
console.log(migration);
console.log();
console.log('=================== END OF MIGRATION SCRIPT ==================='); 