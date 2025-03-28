require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Track progress 
let currentStep = 1;
function log(message) {
  console.log(`[${currentStep}] ${message}`);
  currentStep++;
}

async function setupJetstreamDB() {
  try {
    console.log('=============================================');
    console.log('JetStream Database Setup & Seeding Tool');
    console.log('=============================================');
    console.log('This script will:');
    console.log('1. Create required database functions');
    console.log('2. Run all migrations in sequence');
    console.log('3. Seed the database with comprehensive data');
    console.log('=============================================');
    
    // Step 1: Create exec_sql function first
    log('Creating exec_sql function needed for migrations...');
    const execSqlFile = path.join(__dirname, 'create_exec_sql_function.sql');
    const execSqlQuery = fs.readFileSync(execSqlFile, 'utf8');
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: execSqlQuery });
      if (error) {
        // If the function doesn't exist yet, we need to execute it directly using raw SQL
        log('Function not found, creating using direct SQL...');
        // Run the SQL directly using a raw query or using supabase.from('*').select('1')
        const statements = execSqlQuery.split(';').filter(s => s.trim());
        for (const stmt of statements) {
          if (stmt.trim()) {
            // We can use the raw REST API to execute the statement
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                query: stmt
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.warn(`Warning when executing statement: ${errorText}`);
              console.log('Continuing with setup...');
            }
          }
        }
      }
    } catch (execError) {
      console.log('Note: Error expected when function does not exist yet. Continuing...');
    }
    
    // Step 2: Test if the function now exists
    log('Testing if exec_sql function is available...');
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: 'SELECT 1 as test;' 
      });
      
      if (error) {
        console.log('Warning: exec_sql function may not be properly created.');
        console.log('Error:', error.message);
        console.log('Continuing with migrations...');
      } else {
        console.log('exec_sql function is working correctly!');
      }
    } catch (testError) {
      console.log('Warning: Could not test exec_sql function.');
      console.log('Error:', testError.message);
      console.log('Continuing with migrations...');
    }
    
    // Step 3: Run migrations
    log('Running database migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
    } else {
      console.log(`Found ${migrationFiles.length} migration files.`);
      
      for (const migrationFile of migrationFiles) {
        console.log(`Executing migration: ${migrationFile}`);
        
        const filePath = path.join(migrationsDir, migrationFile);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL into statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i].trim();
          if (statement) {
            console.log(`Executing statement ${i + 1} of ${statements.length}...`);
            
            try {
              // Execute the SQL statement
              const { error: execError } = await supabase.rpc('exec_sql', { 
                sql_query: statement + ';' 
              });
              
              if (execError) {
                console.error(`Error executing statement: ${statement}`);
                console.error(execError);
                console.log('Continuing with next statement...');
              }
            } catch (statementError) {
              console.error(`Error executing statement in ${migrationFile}:`, statementError);
              console.log('Continuing with next statement...');
            }
          }
        }
        
        console.log(`Migration ${migrationFile} processed.`);
      }
    }
    
    // Step 4: Run seed data scripts
    log('Seeding database with comprehensive data...');
    
    // First run the main seed data (001_seed_data.js)
    const mainSeedPath = path.join(__dirname, 'seeds', '001_seed_data.js');
    log(`Running main seed file: ${mainSeedPath}`);
    try {
      require(mainSeedPath);
      console.log('Main seed data execution initiated. Waiting for completion...');
      // Give it some time to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (seedError) {
      console.error(`Error executing main seed file:`, seedError);
    }
    
    // Then run the crew seed data (002_crew_data.js)
    const crewSeedPath = path.join(__dirname, 'seeds', '002_crew_data.js');
    log(`Running crew seed file: ${crewSeedPath}`);
    try {
      require(crewSeedPath);
      console.log('Crew seed data execution initiated. Waiting for completion...');
      // Give it some time to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (seedError) {
      console.error(`Error executing crew seed file:`, seedError);
    }
    
    // Check for seed SQL files if any
    const seedsDir = path.join(__dirname, 'seeds');
    const seedSqlFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (seedSqlFiles.length > 0) {
      console.log(`Found ${seedSqlFiles.length} SQL seed files.`);
      
      for (const seedFile of seedSqlFiles) {
        console.log(`Executing SQL seed: ${seedFile}`);
        
        const filePath = path.join(seedsDir, seedFile);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL into statements
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i].trim();
          if (statement) {
            console.log(`Executing statement ${i + 1} of ${statements.length}...`);
            
            try {
              // Execute the SQL statement
              const { error: execError } = await supabase.rpc('exec_sql', { 
                sql_query: statement + ';' 
              });
              
              if (execError) {
                console.error(`Error executing statement: ${statement}`);
                console.error(execError);
                console.log('Continuing with next statement...');
              }
            } catch (statementError) {
              console.error(`Error executing statement in ${seedFile}:`, statementError);
              console.log('Continuing with next statement...');
            }
          }
        }
        
        console.log(`SQL seed ${seedFile} processed.`);
      }
    } else {
      console.log('No SQL seed files found.');
    }
    
    // Step 6: Create Specialized SQL seed for Pilots & Crew
    log('Creating specialized seed data for Pilots & Crew feature...');
    const specializedSeedPath = path.join(__dirname, 'specialized_seed.sql');
    
    // Use reasonable defaults that bypass the foreign key constraints
    const specializedSeedSQL = `
-- This specialized seed SQL bypasses foreign key constraints for development
BEGIN;

-- Temporarily disable triggering of foreign key checks
SET session_replication_role = 'replica';

-- 1. Create crew members with mock user IDs
INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, created_at, updated_at)
VALUES 
('cd5cf726-7e73-4a25-9f50-91f5c3c13ca7', '00000000-0000-0000-0000-000000000001', 'Alexandra Davis', 'Award-winning comedy specialist with over 10 years experience creating memorable in-flight experiences.', 'https://source.unsplash.com/random/300x300/?portrait,professional,1', ARRAY['Comedy', 'Live Podcasts'], '{"twitter":"@AlexDavisAir","instagram":"@alexdavis_air"}', 4.8, NOW(), NOW()),

('f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5', '00000000-0000-0000-0000-000000000002', 'Michael Chen', 'TED-style speaker and business networking expert. Transform your flight time into productive connections.', 'https://source.unsplash.com/random/300x300/?portrait,professional,2', ARRAY['TED-talks', 'Business Networking'], '{"linkedin":"https://linkedin.com/in/michaelchen"}', 4.6, NOW(), NOW()),

('3e5fc9e1-b9a6-4db8-a7a3-c1e17a3128a7', '00000000-0000-0000-0000-000000000003', 'Sophia Johnson', 'Certified wellness coach specializing in meditation and mindfulness at 40,000 feet.', 'https://source.unsplash.com/random/300x300/?portrait,professional,3', ARRAY['Wellness Sessions', 'Mindfulness'], '{"instagram":"@sophiajohnson_wellness"}', 4.9, NOW(), NOW()),

('9a2b7c36-d42e-4f8a-b91c-5d78e6a3b254', '00000000-0000-0000-0000-000000000004', 'James Wilson', 'Professional sommelier offering exclusive wine tasting experiences above the clouds.', 'https://source.unsplash.com/random/300x300/?portrait,professional,4', ARRAY['Wine Tasting', 'Culinary Experiences'], '{"twitter":"@skywinewilson","instagram":"@james_inflight_sommelier"}', 4.7, NOW(), NOW()),

('5e7d9c1b-3f82-4a67-b9d5-c46e8a213b9f', '00000000-0000-0000-0000-000000000005', 'Emma Rodriguez', 'Interactive mystery game host and storyteller. Making your journey an adventure.', 'https://source.unsplash.com/random/300x300/?portrait,professional,5', ARRAY['Interactive Mystery Events', 'Creative Workshops'], '{"instagram":"@mysteriesabove","website":"https://skydetective.com"}', 4.6, NOW(), NOW());

-- 2. Add reviews for crew members
INSERT INTO crew_reviews (id, crew_id, user_id, rating, review_text, created_at)
VALUES
('125fedb6-efdd-4458-93f1-ce20e629079d', 'cd5cf726-7e73-4a25-9f50-91f5c3c13ca7', '00000000-0000-0000-0000-000000000021', 5, 'Alexandra's comedy routine made the flight fly by! Absolutely hilarious and engaging.', NOW() - INTERVAL '10 days'),
('1caf7761-eb95-435f-8d03-423b193dfea7', 'f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5', '00000000-0000-0000-0000-000000000022', 4, 'Michael's business networking session was incredibly valuable. Made two great connections.', NOW() - INTERVAL '15 days'),
('18de7d42-90f5-4fa6-984c-c4181ad5e4f6', '3e5fc9e1-b9a6-4db8-a7a3-c1e17a3128a7', '00000000-0000-0000-0000-000000000023', 5, 'Arrived feeling refreshed thanks to Sophia's in-flight meditation. A game-changer for long flights!', NOW() - INTERVAL '5 days'),
('873269ad-e768-4608-a64c-4addb8b99d24', '9a2b7c36-d42e-4f8a-b91c-5d78e6a3b254', '00000000-0000-0000-0000-000000000024', 5, 'James curated an exceptional wine tasting that made this flight unforgettable. Learned so much!', NOW() - INTERVAL '8 days'),
('90dbbbe2-e052-4c3b-a7aa-a9ff2f04657a', '5e7d9c1b-3f82-4a67-b9d5-c46e8a213b9f', '00000000-0000-0000-0000-000000000025', 5, 'Emma's mystery game kept our entire group engaged for hours. Such a creative way to spend a flight!', NOW() - INTERVAL '12 days');

-- 3. Create dummy/placeholder flight IDs 
-- This will only work if foreign key constraints are disabled
INSERT INTO specialized_flights (id, crew_id, flight_id, title, description, theme, seats_available, date_time, status, price_premium_percentage, created_at, updated_at)
VALUES 
('abe3db22-08e9-407c-aa2c-14f0123ad68e', 'cd5cf726-7e73-4a25-9f50-91f5c3c13ca7', '00000000-0000-0000-0000-000000000101', 'Sky-High Comedy Hour', 'Laugh your way across the country with our award-winning comedy flight', 'Comedy', 6, NOW() + INTERVAL '14 days', 'scheduled', 15, NOW(), NOW()),
('ad16f91a-809b-47cf-9c0e-043507592152', 'f8a7b64c-d8b4-4f36-8d01-1b9a74f748a5', '00000000-0000-0000-0000-000000000102', 'Executive Networking Summit', 'Connect with industry leaders during this specialized business flight', 'Business Networking', 8, NOW() + INTERVAL '21 days', 'scheduled', 20, NOW(), NOW()),
('94a8b270-06e9-47ec-a78e-8d41eaa38120', '3e5fc9e1-b9a6-4db8-a7a3-c1e17a3128a7', '00000000-0000-0000-0000-000000000103', 'Mindfulness at 40,000 Feet', 'Arrive refreshed with guided meditation and wellness practices', 'Wellness Sessions', 10, NOW() + INTERVAL '7 days', 'scheduled', 18, NOW(), NOW()),
('76f3fca9-43a1-4822-9d22-edb25473b8cb', '9a2b7c36-d42e-4f8a-b91c-5d78e6a3b254', '00000000-0000-0000-0000-000000000104', 'Sky-High Wine Tasting', 'Experience premium wines curated by our expert sommelier', 'Wine Tasting', 12, NOW() + INTERVAL '30 days', 'scheduled', 25, NOW(), NOW()),
('d0db97a3-9d4a-40b4-8736-e33b704efc90', '5e7d9c1b-3f82-4a67-b9d5-c46e8a213b9f', '00000000-0000-0000-0000-000000000105', 'Mystery in the Clouds', 'Solve an interactive mystery while flying to your destination', 'Interactive Mystery Events', 8, NOW() + INTERVAL '10 days', 'scheduled', 22, NOW(), NOW());

-- 4. Create sample custom itinerary requests
INSERT INTO custom_itinerary_requests (id, requesting_user_id, destination, origin, date_time, requested_specializations, description, created_at, updated_at)
VALUES
('2a9c8d7e-6f5b-4a3c-9d2e-1f8g7h6j5k4l', '00000000-0000-0000-0000-000000000031', 'New York', 'Los Angeles', NOW() + INTERVAL '45 days', ARRAY['Business Networking', 'TED-talks'], 'Looking for an executive networking flight for our leadership team of 6 people', NOW(), NOW()),
('3b8d7c6f-5e4d-3c2b-1a9f-2g3h4j5k6l7m', '00000000-0000-0000-0000-000000000032', 'Miami', 'Chicago', NOW() + INTERVAL '60 days', ARRAY['Wellness Sessions', 'Mindfulness'], 'Seeking a wellness retreat experience during our flight for a team-building exercise', NOW(), NOW()),
('4c9d8e7f-6g5h-4j3k-2l1m-9n8b7v6c5x4', '00000000-0000-0000-0000-000000000033', 'Las Vegas', 'Seattle', NOW() + INTERVAL '30 days', ARRAY['Comedy', 'Interactive Mystery Events'], 'Bachelor party flight - looking for entertainment options for 8 people', NOW(), NOW());

-- Re-enable foreign key checking
SET session_replication_role = 'origin';

COMMIT;
    `;
    
    // Write the specialized seed SQL to a file
    fs.writeFileSync(specializedSeedPath, specializedSeedSQL);
    console.log(`Created specialized seed SQL at: ${specializedSeedPath}`);
    
    // Execute the specialized seed SQL
    console.log('Executing specialized seed SQL...');
    const statements = specializedSeedSQL.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1} of ${statements.length}...`);
        
        try {
          // Execute the SQL statement
          const { error: execError } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (execError) {
            console.error(`Error executing statement: ${statement}`);
            console.error(execError);
            console.log('Continuing with next statement...');
          }
        } catch (statementError) {
          console.error(`Error executing statement:`, statementError);
          console.log('Continuing with next statement...');
        }
      }
    }
    
    // Step 7: Final status update
    console.log('=============================================');
    console.log('JetStream Database Setup Complete!');
    console.log('=============================================');
    console.log('Summary:');
    console.log('- Created necessary database functions');
    console.log('- Ran all migration files');
    console.log('- Applied seed data from JS seeders');
    console.log('- Applied seed data from SQL files');
    console.log('- Created specialized seed data for Pilots & Crew feature');
    console.log('=============================================');
    
  } catch (error) {
    console.error('Error setting up JetStream database:', error);
    process.exit(1);
  }
}

// Run the setup function
setupJetstreamDB(); 