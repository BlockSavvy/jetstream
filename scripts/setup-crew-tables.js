/**
 * Script to set up the database tables for the Pilots & Crew specialization feature
 * 
 * Usage:
 * - Configure your Supabase URL and service role key in .env file
 * - Run with: node scripts/setup-crew-tables.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Important: Use service role key for schema changes

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing environment variables. Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  try {
    console.log('Setting up database tables for Pilots & Crew specialization feature...');
    
    // Create pilots_crews table
    const { error: crewsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'pilots_crews',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        bio TEXT,
        profile_image_url TEXT,
        ratings_avg DECIMAL(3, 2) DEFAULT 0,
        specializations TEXT[] NOT NULL,
        social_links JSONB,
        availability TSRANGE[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (crewsError) {
      throw new Error(`Error creating pilots_crews table: ${crewsError.message}`);
    }
    
    // Create crew_reviews table
    const { error: reviewsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'crew_reviews',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        crew_id UUID REFERENCES pilots_crews(id) ON DELETE CASCADE,
        user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        flight_id UUID REFERENCES flights(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review_text TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (reviewsError) {
      throw new Error(`Error creating crew_reviews table: ${reviewsError.message}`);
    }
    
    // Create specialized_flights table
    const { error: flightsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'specialized_flights',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        theme TEXT NOT NULL,
        description TEXT,
        crew_id UUID REFERENCES pilots_crews(id) ON DELETE SET NULL,
        nft_ticketed BOOLEAN DEFAULT FALSE,
        seats_available INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (flightsError) {
      throw new Error(`Error creating specialized_flights table: ${flightsError.message}`);
    }
    
    // Create custom_itinerary_requests table
    const { error: requestsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'custom_itinerary_requests',
      table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        requesting_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        destination TEXT,
        origin TEXT,
        date_time TIMESTAMPTZ,
        requested_specializations TEXT[],
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed', 'cancelled')),
        matches_found JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (requestsError) {
      throw new Error(`Error creating custom_itinerary_requests table: ${requestsError.message}`);
    }
    
    // Alter flights table to add specialized_event flag and crew_id
    const { error: alterFlightsError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE flights 
        ADD COLUMN IF NOT EXISTS specialized_event BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES pilots_crews(id) ON DELETE SET NULL
      `
    });
    
    if (alterFlightsError) {
      throw new Error(`Error altering flights table: ${alterFlightsError.message}`);
    }
    
    // Create indexes for better performance
    const { error: indexesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_pilots_crews_specializations ON pilots_crews USING GIN (specializations);
        CREATE INDEX IF NOT EXISTS idx_crew_reviews_crew_id ON crew_reviews(crew_id);
        CREATE INDEX IF NOT EXISTS idx_specialized_flights_flight_id ON specialized_flights(flight_id);
        CREATE INDEX IF NOT EXISTS idx_custom_itinerary_requests_status ON custom_itinerary_requests(status);
        CREATE INDEX IF NOT EXISTS idx_flights_crew_id ON flights(crew_id);
        CREATE INDEX IF NOT EXISTS idx_flights_specialized_event ON flights(specialized_event);
      `
    });
    
    if (indexesError) {
      throw new Error(`Error creating indexes: ${indexesError.message}`);
    }
    
    // Create RLS policies
    const rlsQueries = [
      // pilots_crews policies
      `ALTER TABLE pilots_crews ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY IF NOT EXISTS pilots_crews_select_policy ON pilots_crews FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS pilots_crews_update_policy ON pilots_crews FOR UPDATE USING (auth.uid() = user_id);`,
      
      // crew_reviews policies
      `ALTER TABLE crew_reviews ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY IF NOT EXISTS crew_reviews_select_policy ON crew_reviews FOR SELECT USING (true);`,
      `CREATE POLICY IF NOT EXISTS crew_reviews_insert_policy ON crew_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      // specialized_flights policies
      `ALTER TABLE specialized_flights ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY IF NOT EXISTS specialized_flights_select_policy ON specialized_flights FOR SELECT USING (true);`,
      
      // custom_itinerary_requests policies
      `ALTER TABLE custom_itinerary_requests ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY IF NOT EXISTS custom_itinerary_requests_select_policy ON custom_itinerary_requests 
       FOR SELECT USING (requesting_user_id = auth.uid() OR auth.uid() IN 
        (SELECT user_id FROM pilots_crews WHERE id = ANY(ARRAY(
          SELECT crew_id FROM flights WHERE flights.id = ANY(
            SELECT flight_id FROM specialized_flights WHERE specialized_flights.id = custom_itinerary_requests.id
          )
        )))
       );`,
      `CREATE POLICY IF NOT EXISTS custom_itinerary_requests_insert_policy ON custom_itinerary_requests 
       FOR INSERT WITH CHECK (auth.uid() = requesting_user_id);`,
      `CREATE POLICY IF NOT EXISTS custom_itinerary_requests_update_policy ON custom_itinerary_requests 
       FOR UPDATE USING (auth.uid() = requesting_user_id);`
    ];
    
    for (const query of rlsQueries) {
      const { error } = await supabase.rpc('execute_sql', { sql: query });
      if (error) {
        console.warn(`Warning: Error executing RLS policy: ${error.message}`);
        // Don't throw error here, just warn - policies might already exist
      }
    }
    
    // Insert sample data for crew members
    const sampleCrewMembers = [
      {
        name: 'Sarah Johnson',
        bio: 'Comedy host and wellness expert with over 10 years of experience in creating unforgettable in-flight experiences.',
        specializations: ['Comedy', 'Wellness Sessions'],
        social_links: { twitter: '@sarahflighthost', instagram: 'sarahjets', linkedin: 'https://linkedin.com/in/sarahjohnson' },
        ratings_avg: 4.9
      },
      {
        name: 'Michael Chen',
        bio: 'Former TED speaker turned private aviation host. Specializes in business networking events and tech demonstrations.',
        specializations: ['TED-talks', 'Business Networking', 'Tech Demos'],
        social_links: { twitter: '@michaelintheclouds', linkedin: 'https://linkedin.com/in/michaelchen' },
        ratings_avg: 4.7
      },
      {
        name: 'Olivia Rodriguez',
        bio: 'Professional sommelier and culinary expert who creates gourmet dining experiences at 40,000 feet.',
        specializations: ['Wine Tasting', 'Culinary Experiences'],
        social_links: { instagram: 'olivia_sky_dining', website: 'https://oliviarodriguez.com' },
        ratings_avg: 4.8
      },
      {
        name: 'James Wilson',
        bio: 'Podcast host and interactive entertainment specialist. Creates immersive mystery events and live podcast recordings.',
        specializations: ['Live Podcasts', 'Interactive Mystery Events'],
        social_links: { twitter: '@jwilsonair', instagram: 'jameswilsonpods' },
        ratings_avg: 4.6
      }
    ];
    
    // Insert sample crew members
    for (const crew of sampleCrewMembers) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (userData && userData.length > 0) {
        const { error } = await supabase
          .from('pilots_crews')
          .insert({
            user_id: userData[0].id,
            name: crew.name,
            bio: crew.bio,
            specializations: crew.specializations,
            social_links: crew.social_links,
            ratings_avg: crew.ratings_avg,
            profile_image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(crew.name)}&background=FF9500&color=fff&size=200`
          });
        
        if (error) {
          console.warn(`Warning: Error inserting sample crew member ${crew.name}: ${error.message}`);
        } else {
          console.log(`Added sample crew member: ${crew.name}`);
        }
      }
    }
    
    console.log('Database setup complete for Pilots & Crew specialization feature!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 