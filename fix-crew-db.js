require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key is missing in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const captainFields = `
-- Add captain-specific columns to pilots_crews table if they don't exist
ALTER TABLE IF EXISTS pilots_crews 
  ADD COLUMN IF NOT EXISTS is_captain BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dedicated_jet_owner_id TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS availability TEXT[];

-- Create index on is_captain for faster filtering if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pilots_crews_is_captain ON pilots_crews (is_captain);

-- Create index on years_of_experience for faster filtering if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pilots_crews_years_experience ON pilots_crews (years_of_experience);

-- Create index on dedicated_jet_owner_id for faster lookup if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_pilots_crews_jet_owner ON pilots_crews (dedicated_jet_owner_id);
`;

const seedCaptainsAndCrew = `
-- Insert elite captains if they don't exist
INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, is_captain, years_of_experience, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000001',
  'Captain William Powell',
  'Elite captain with over 25 years of experience in luxury private aviation. Specialized in VIP services and international long-haul flights.',
  '/images/crew/captain_powell.jpg',
  ARRAY['Luxury', 'VIP Service', 'International Flights', 'Long-haul Expert'],
  '{"linkedin":"https://linkedin.com/in/captainpowell"}',
  4.9,
  TRUE,
  25,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pilots_crews WHERE name = 'Captain William Powell' AND is_captain = TRUE
);

INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, is_captain, years_of_experience, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000002',
  'Captain Alexandra Reid',
  'Dedicated captain with expertise in business aviation and family-friendly flights. Known for creating a comfortable and safe environment for executives and families alike.',
  '/images/crew/captain_reid.jpg',
  ARRAY['Business', 'Family-oriented', 'VIP Service'],
  '{"twitter":"@CaptReid","instagram":"@captain_reid"}',
  4.8,
  TRUE,
  18,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pilots_crews WHERE name = 'Captain Alexandra Reid' AND is_captain = TRUE
);

-- Insert specialized crew if they don't exist
INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, is_captain, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000003',
  'Michael Chen',
  'TED-style speaker and business networking expert. Transform your flight time into productive connections.',
  '/images/crew/michael_chen.jpg',
  ARRAY['TED-talks', 'Business Networking'],
  '{"linkedin":"https://linkedin.com/in/michaelchen"}',
  4.7,
  FALSE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pilots_crews WHERE name = 'Michael Chen' AND is_captain = FALSE
);

INSERT INTO pilots_crews (id, user_id, name, bio, profile_image_url, specializations, social_links, ratings_avg, is_captain, created_at, updated_at)
SELECT 
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000004',
  'Sophia Johnson',
  'Certified wellness coach specializing in meditation and mindfulness at 40,000 feet.',
  '/images/crew/sophia_johnson.jpg',
  ARRAY['Wellness Sessions', 'Mindfulness'],
  '{"instagram":"@sophiajohnson_wellness"}',
  4.9,
  FALSE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM pilots_crews WHERE name = 'Sophia Johnson' AND is_captain = FALSE
);
`;

async function fixCrewDatabase() {
  try {
    console.log('Starting database fix for pilots and crew...');
    
    // First, check if pilots_crews table exists
    const { data, error } = await supabase
      .from('pilots_crews')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST204') {
        console.log('pilots_crews table does not exist. Creating it...');
        
        // Create the table
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS pilots_crews (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          bio TEXT,
          profile_image_url TEXT,
          specializations TEXT[] NOT NULL,
          social_links JSONB,
          ratings_avg FLOAT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
        
        if (createError) {
          if (createError.message.includes('function "exec_sql" does not exist')) {
            console.error('The exec_sql function does not exist. Please create it first.');
            console.error('Run this SQL in the Supabase SQL Editor:');
            console.error(`
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
            `);
            process.exit(1);
          }
          
          console.error('Error creating pilots_crews table:', createError);
          return;
        }
        
        console.log('pilots_crews table created successfully.');
      } else {
        console.error('Error checking pilots_crews table:', error);
        return;
      }
    }
    
    // Add captain fields
    console.log('Adding captain fields...');
    try {
      const { error: fieldsError } = await supabase.rpc('exec_sql', { sql: captainFields });
      
      if (fieldsError) {
        if (fieldsError.message.includes('function "exec_sql" does not exist')) {
          console.error('The exec_sql function does not exist. Using a different approach...');
          
          // Try direct SQL approach with pgbouncer_exec if available
          try {
            const { error: pgError } = await supabase.rpc('pgbouncer_exec', { query: captainFields });
            
            if (pgError) {
              console.error('Error with pgbouncer_exec:', pgError);
            } else {
              console.log('Captain fields added successfully using pgbouncer_exec.');
            }
          } catch (pgError) {
            console.error('Error with pgbouncer_exec approach:', pgError);
            console.error('Please run the SQL manually in the Supabase SQL Editor.');
            console.log(captainFields);
          }
        } else {
          console.error('Error adding captain fields:', fieldsError);
        }
      } else {
        console.log('Captain fields added successfully.');
      }
    } catch (err) {
      console.error('Error executing captain fields SQL:', err);
    }
    
    // Seed captains and crew
    console.log('Seeding captains and crew...');
    try {
      const { error: seedError } = await supabase.rpc('exec_sql', { sql: seedCaptainsAndCrew });
      
      if (seedError) {
        if (seedError.message.includes('function "exec_sql" does not exist')) {
          console.error('The exec_sql function does not exist. Using a different approach...');
          
          // Try direct SQL approach with pgbouncer_exec if available
          try {
            const { error: pgError } = await supabase.rpc('pgbouncer_exec', { query: seedCaptainsAndCrew });
            
            if (pgError) {
              console.error('Error with pgbouncer_exec:', pgError);
            } else {
              console.log('Captains and crew seeded successfully using pgbouncer_exec.');
            }
          } catch (pgError) {
            console.error('Error with pgbouncer_exec approach:', pgError);
            console.error('Please run the SQL manually in the Supabase SQL Editor.');
            console.log(seedCaptainsAndCrew);
          }
        } else {
          console.error('Error seeding captains and crew:', seedError);
        }
      } else {
        console.log('Captains and crew seeded successfully.');
      }
    } catch (err) {
      console.error('Error executing seed SQL:', err);
    }
    
    // Verify pilots_crews table has data and structure
    const { data: verifyData, error: verifyError } = await supabase
      .from('pilots_crews')
      .select('*')
      .limit(5);
    
    if (verifyError) {
      console.error('Error verifying pilots_crews table:', verifyError);
    } else {
      console.log('Verification successful. Sample data:');
      console.log(verifyData);
    }
    
    console.log('Database fix completed.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixCrewDatabase().catch(console.error); 