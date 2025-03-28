require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: 5432, // Default PostgreSQL port
  database: process.env.POSTGRES_DATABASE,
  ssl: {
    rejectUnauthorized: false
  }
});

// Read SQL files
const readSqlFile = (filename) => {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8');
};

const executeQuery = async (query, description) => {
  try {
    await pool.query(query);
    console.log(`✅ Successfully executed: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Error executing ${description}:`, err.message);
    return false;
  }
};

const runMigrations = async () => {
  console.log("🔄 Running database restoration...");
  
  try {
    // 1. Create pilots and crew tables if not exist
    const pilotsSql = `
    -- Create pilots table if not exists
    CREATE TABLE IF NOT EXISTS pilots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      license_type TEXT NOT NULL,
      specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
      bio TEXT,
      avatar_url TEXT,
      ratings_avg DECIMAL(3,2) DEFAULT 5.0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create crew table if not exists
    CREATE TABLE IF NOT EXISTS crew (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
      bio TEXT,
      avatar_url TEXT,
      ratings_avg DECIMAL(3,2) DEFAULT 5.0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `;
    await executeQuery(pilotsSql, "pilots and crew tables creation");

    // 2. Create jets table if not exists
    const jetsSql = `
    -- Create jets table if not exists
    CREATE TABLE IF NOT EXISTS jets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      year INTEGER NOT NULL,
      registration TEXT UNIQUE NOT NULL,
      passenger_capacity INTEGER NOT NULL,
      range_miles INTEGER NOT NULL,
      cruise_speed_mph INTEGER NOT NULL,
      home_base TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'available',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `;
    await executeQuery(jetsSql, "jets table creation");

    // 3. Create flights table if not exists
    const flightsSql = `
    -- Create flights table if not exists
    CREATE TABLE IF NOT EXISTS flights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jet_id UUID REFERENCES jets(id),
      pilot_id UUID REFERENCES pilots(id),
      departure_location TEXT NOT NULL,
      arrival_location TEXT NOT NULL,
      departure_time TIMESTAMPTZ NOT NULL,
      arrival_time TIMESTAMPTZ NOT NULL,
      available_seats INTEGER NOT NULL,
      price_per_seat DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'scheduled',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `;
    await executeQuery(flightsSql, "flights table creation");

    // 4. Seed pilots data
    const seedPilotsSql = `
    -- Insert sample pilots if not exist
    INSERT INTO pilots (name, experience_years, license_type, specializations, bio, avatar_url, ratings_avg)
    SELECT 
      'Captain Sarah Johnson', 15, 'ATP', ARRAY['Business Jets', 'International Travel', 'Entertainment'], 
      'With 15 years of flying experience across six continents, Captain Johnson specializes in creating a seamless business travel environment.',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1000&auto=format&fit=crop',
      4.9
    WHERE NOT EXISTS (SELECT 1 FROM pilots WHERE name = 'Captain Sarah Johnson')
    UNION ALL
    SELECT 
      'Captain Michael Rodriguez', 12, 'ATP', ARRAY['Comedy Flights', 'Family Travel', 'Interactive Entertainment'], 
      'Known for his humor and engaging personality, Captain Rodriguez makes every flight entertaining with his comedy background.',
      'https://images.unsplash.com/photo-1600878459108-617a253537e9?q=80&w=1000&auto=format&fit=crop',
      4.8
    WHERE NOT EXISTS (SELECT 1 FROM pilots WHERE name = 'Captain Michael Rodriguez')
    UNION ALL
    SELECT 
      'Captain James Chen', 18, 'ATP', ARRAY['Tech Industry', 'Networking Events', 'Business Seminars'], 
      'Formerly a tech executive, Captain Chen hosts in-flight networking and business seminars for tech industry travelers.',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop',
      4.7
    WHERE NOT EXISTS (SELECT 1 FROM pilots WHERE name = 'Captain James Chen');
    `;
    await executeQuery(seedPilotsSql, "seed pilots data");

    // 5. Seed crew data
    const seedCrewSql = `
    -- Insert sample crew if not exist
    INSERT INTO crew (name, role, experience_years, specializations, bio, avatar_url, ratings_avg)
    SELECT 
      'Emma Williams', 'Lead Flight Attendant', 8, ARRAY['Luxury Service', 'Wine Pairing', 'VIP Experience'], 
      'Emma creates unforgettable luxury experiences with her background in fine dining and hospitality.',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop',
      4.9
    WHERE NOT EXISTS (SELECT 1 FROM crew WHERE name = 'Emma Williams')
    UNION ALL
    SELECT 
      'Daniel Lopez', 'Flight Attendant', 6, ARRAY['Entertainment', 'Mixology', 'Music Performance'], 
      'Daniel brings entertainment to new heights with his mixology skills and background as a professional musician.',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop',
      4.7
    WHERE NOT EXISTS (SELECT 1 FROM crew WHERE name = 'Daniel Lopez')
    UNION ALL
    SELECT 
      'Olivia Taylor', 'Concierge Specialist', 10, ARRAY['Event Planning', 'Business Facilitation', 'Wellness'], 
      'Olivia specializes in transforming flights into productive meetings or relaxing wellness retreats.',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
      4.8
    WHERE NOT EXISTS (SELECT 1 FROM crew WHERE name = 'Olivia Taylor');
    `;
    await executeQuery(seedCrewSql, "seed crew data");

    // 6. Seed jets data
    const seedJetsSql = `
    -- Insert sample jets if not exist
    INSERT INTO jets (model, manufacturer, year, registration, passenger_capacity, range_miles, cruise_speed_mph, home_base, image_url, status)
    SELECT 
      'G650ER', 'Gulfstream', 2022, 'N650JS', 19, 7500, 610, 'New York (KTEB)', 
      'https://www.flyingmag.com/wp-content/uploads/sites/6/2021/12/Screen-Shot-2021-12-06-at-3.31.35-PM.jpg?width=1920&height=1080&crop=1', 
      'available'
    WHERE NOT EXISTS (SELECT 1 FROM jets WHERE registration = 'N650JS')
    UNION ALL
    SELECT 
      'Global 7500', 'Bombardier', 2021, 'N7500B', 17, 7700, 590, 'Los Angeles (KLAX)', 
      'https://www.flyingmag.com/wp-content/uploads/sites/6/2023/05/Global-7500-Aircraft-image-1.jpg?width=1920&height=1080&crop=1', 
      'available'
    WHERE NOT EXISTS (SELECT 1 FROM jets WHERE registration = 'N7500B')
    UNION ALL
    SELECT 
      'Falcon 8X', 'Dassault', 2020, 'N8XDF', 16, 6450, 530, 'Miami (KMIA)', 
      'https://businessaircraft.bombardier.com/sites/default/files/styles/max_width_1620/public/2022-04/Bombardier-Aircraft-Cabin-Global-7500-Lifestyle-1920x1080.jpeg?itok=EXtBzQdw', 
      'available'
    WHERE NOT EXISTS (SELECT 1 FROM jets WHERE registration = 'N8XDF')
    UNION ALL
    SELECT 
      'Citation Longitude', 'Cessna', 2023, 'N800CL', 12, 3500, 490, 'Chicago (KORD)', 
      'https://businessaircraft.bombardier.com/sites/default/files/styles/max_width_1620/public/2022-04/Bombardier-Aircraft-Exterior-Global-7500-Parked-1920x1080.jpeg?itok=vb7NoPM4', 
      'available'
    WHERE NOT EXISTS (SELECT 1 FROM jets WHERE registration = 'N800CL')
    UNION ALL
    SELECT 
      'Phenom 300E', 'Embraer', 2022, 'N300EP', 10, 2010, 495, 'San Francisco (KSFO)', 
      'https://cdn.shopify.com/s/files/1/0607/3913/1771/files/embraer-aircraft-praetor-600-gallery-exterior-3-1400x1000-1.jpeg?v=1666106473', 
      'available'
    WHERE NOT EXISTS (SELECT 1 FROM jets WHERE registration = 'N300EP');
    `;
    await executeQuery(seedJetsSql, "seed jets data");

    // 7. Seed flights data
    const seedFlightsSql = `
    -- Insert sample flights if not exist
    INSERT INTO flights (jet_id, pilot_id, departure_location, arrival_location, departure_time, arrival_time, available_seats, price_per_seat, status)
    SELECT 
      (SELECT id FROM jets WHERE registration = 'N650JS' LIMIT 1),
      (SELECT id FROM pilots WHERE name = 'Captain Sarah Johnson' LIMIT 1),
      'New York (KTEB)', 'Los Angeles (KLAX)', 
      NOW() + interval '2 days', NOW() + interval '2 days 6 hours',
      12, 5500, 'scheduled'
    WHERE NOT EXISTS (
      SELECT 1 FROM flights 
      WHERE departure_location = 'New York (KTEB)' 
      AND arrival_location = 'Los Angeles (KLAX)'
      AND departure_time > NOW()
    )
    UNION ALL
    SELECT 
      (SELECT id FROM jets WHERE registration = 'N7500B' LIMIT 1),
      (SELECT id FROM pilots WHERE name = 'Captain Michael Rodriguez' LIMIT 1),
      'Miami (KMIA)', 'Aspen (KASE)', 
      NOW() + interval '3 days', NOW() + interval '3 days 5 hours',
      10, 6200, 'scheduled'
    WHERE NOT EXISTS (
      SELECT 1 FROM flights 
      WHERE departure_location = 'Miami (KMIA)' 
      AND arrival_location = 'Aspen (KASE)'
      AND departure_time > NOW()
    )
    UNION ALL
    SELECT 
      (SELECT id FROM jets WHERE registration = 'N8XDF' LIMIT 1),
      (SELECT id FROM pilots WHERE name = 'Captain James Chen' LIMIT 1),
      'San Francisco (KSFO)', 'Las Vegas (KLAS)', 
      NOW() + interval '4 days', NOW() + interval '4 days 2 hours',
      8, 3800, 'scheduled'
    WHERE NOT EXISTS (
      SELECT 1 FROM flights 
      WHERE departure_location = 'San Francisco (KSFO)' 
      AND arrival_location = 'Las Vegas (KLAS)'
      AND departure_time > NOW()
    )
    UNION ALL
    SELECT 
      (SELECT id FROM jets WHERE registration = 'N800CL' LIMIT 1),
      (SELECT id FROM pilots WHERE name = 'Captain Sarah Johnson' LIMIT 1),
      'Chicago (KORD)', 'New York (KTEB)', 
      NOW() + interval '5 days', NOW() + interval '5 days 2 hours',
      10, 4200, 'scheduled'
    WHERE NOT EXISTS (
      SELECT 1 FROM flights 
      WHERE departure_location = 'Chicago (KORD)' 
      AND arrival_location = 'New York (KTEB)'
      AND departure_time > NOW()
    )
    UNION ALL
    SELECT 
      (SELECT id FROM jets WHERE registration = 'N300EP' LIMIT 1),
      (SELECT id FROM pilots WHERE name = 'Captain Michael Rodriguez' LIMIT 1),
      'Los Angeles (KLAX)', 'Denver (KDEN)', 
      NOW() + interval '6 days', NOW() + interval '6 days 3 hours',
      8, 3500, 'scheduled'
    WHERE NOT EXISTS (
      SELECT 1 FROM flights 
      WHERE departure_location = 'Los Angeles (KLAX)' 
      AND arrival_location = 'Denver (KDEN)'
      AND departure_time > NOW()
    );
    `;
    await executeQuery(seedFlightsSql, "seed flights data");

    // 8. Run JetShare migrations
    const jetShareMigrationSql = `
    -- Enable the necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create enum type for offer statuses
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jetshare_offer_status') THEN
            CREATE TYPE jetshare_offer_status AS ENUM ('open', 'accepted', 'completed');
        END IF;
    END$$;

    -- Create enum type for payment methods
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jetshare_payment_method') THEN
            CREATE TYPE jetshare_payment_method AS ENUM ('fiat', 'crypto');
        END IF;
    END$$;

    -- Create enum type for payment statuses
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jetshare_payment_status') THEN
            CREATE TYPE jetshare_payment_status AS ENUM ('pending', 'completed', 'failed');
        END IF;
    END$$;

    -- Create JetShare Settings Table
    CREATE TABLE IF NOT EXISTS "jetshare_settings" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "handling_fee_percentage" DECIMAL(5, 2) NOT NULL DEFAULT 7.5,
      "allow_crypto_payments" BOOLEAN NOT NULL DEFAULT TRUE,
      "allow_fiat_payments" BOOLEAN NOT NULL DEFAULT TRUE,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create JetShare Offers Table
    CREATE TABLE IF NOT EXISTS "jetshare_offers" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      "flight_date" TIMESTAMPTZ NOT NULL,
      "departure_location" TEXT NOT NULL,
      "arrival_location" TEXT NOT NULL,
      "total_flight_cost" DECIMAL(10, 2) NOT NULL,
      "requested_share_amount" DECIMAL(10, 2) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'completed')),
      "matched_user_id" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create JetShare Transactions Table
    CREATE TABLE IF NOT EXISTS "jetshare_transactions" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "offer_id" UUID NOT NULL REFERENCES jetshare_offers(id) ON DELETE CASCADE,
      "payer_user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      "recipient_user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      "amount" DECIMAL(10, 2) NOT NULL,
      "handling_fee" DECIMAL(10, 2) NOT NULL,
      "payment_method" TEXT NOT NULL CHECK (payment_method IN ('fiat', 'crypto')),
      "payment_status" TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed')),
      "transaction_date" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "transaction_reference" TEXT,
      "receipt_url" TEXT
    );

    -- Insert default settings if not exists
    INSERT INTO "jetshare_settings" ("handling_fee_percentage", "allow_crypto_payments", "allow_fiat_payments")
    SELECT 7.5, TRUE, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM jetshare_settings LIMIT 1);

    -- Create functions and triggers for updated_at
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for jetshare_offers if not exists
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_jetshare_offers_modtime'
        ) THEN
            CREATE TRIGGER update_jetshare_offers_modtime
            BEFORE UPDATE ON "jetshare_offers"
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
        END IF;
    END$$;

    -- Create trigger for jetshare_settings if not exists
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_jetshare_settings_modtime'
        ) THEN
            CREATE TRIGGER update_jetshare_settings_modtime
            BEFORE UPDATE ON "jetshare_settings"
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
        END IF;
    END$$;

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_jetshare_offers_user_id ON "jetshare_offers" ("user_id");
    CREATE INDEX IF NOT EXISTS idx_jetshare_offers_status ON "jetshare_offers" ("status");
    CREATE INDEX IF NOT EXISTS idx_jetshare_offers_flight_date ON "jetshare_offers" ("flight_date");
    CREATE INDEX IF NOT EXISTS idx_jetshare_transactions_offer_id ON "jetshare_transactions" ("offer_id");
    CREATE INDEX IF NOT EXISTS idx_jetshare_transactions_payer_user_id ON "jetshare_transactions" ("payer_user_id");
    CREATE INDEX IF NOT EXISTS idx_jetshare_transactions_recipient_user_id ON "jetshare_transactions" ("recipient_user_id");

    -- Create notification function
    CREATE OR REPLACE FUNCTION notify_jetshare_changes()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM pg_notify(
          'jetshare_' || TG_TABLE_NAME || '_changes',
          json_build_object(
            'operation', TG_OP,
            'record', row_to_json(NEW)
          )::text
        );
      ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify(
          'jetshare_' || TG_TABLE_NAME || '_changes',
          json_build_object(
            'operation', TG_OP,
            'old_record', row_to_json(OLD)
          )::text
        );
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    -- Create triggers for real-time updates if not exists
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'notify_jetshare_offers_changes'
        ) THEN
            CREATE TRIGGER notify_jetshare_offers_changes
            AFTER INSERT OR UPDATE OR DELETE ON "jetshare_offers"
            FOR EACH ROW EXECUTE FUNCTION notify_jetshare_changes();
        END IF;
    END$$;

    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'notify_jetshare_transactions_changes'
        ) THEN
            CREATE TRIGGER notify_jetshare_transactions_changes
            AFTER INSERT OR UPDATE OR DELETE ON "jetshare_transactions"
            FOR EACH ROW EXECUTE FUNCTION notify_jetshare_changes();
        END IF;
    END$$;
    `;
    await executeQuery(jetShareMigrationSql, "JetShare migrations");

    // 9. Run JetShare seed data if not exists
    const jetShareSeedSql = `
    -- Seed JetShare offers - simulate flight share offers by test users
    DO $$
    DECLARE
      test_user_id uuid;
      second_user_id uuid;
    BEGIN
      -- Get a test user for creating offers
      SELECT id INTO test_user_id FROM auth.users LIMIT 1;
      
      -- Get a second test user for matched offers
      SELECT id INTO second_user_id FROM auth.users WHERE id != test_user_id LIMIT 1;
      
      -- Only proceed if we have at least one user
      IF test_user_id IS NOT NULL THEN
        -- Create open offers
        INSERT INTO jetshare_offers (
          user_id, 
          flight_date, 
          departure_location, 
          arrival_location, 
          total_flight_cost, 
          requested_share_amount, 
          status
        )
        SELECT 
          test_user_id,
          NOW() + interval '3 days',
          'New York (KTEB)',
          'Miami (KMIA)',
          45000,
          22500,
          'open'
        WHERE NOT EXISTS (
          SELECT 1 FROM jetshare_offers 
          WHERE user_id = test_user_id 
          AND departure_location = 'New York (KTEB)'
          AND arrival_location = 'Miami (KMIA)'
        )
        UNION ALL
        SELECT
          test_user_id,
          NOW() + interval '5 days',
          'Los Angeles (KVNY)',
          'Las Vegas (KLAS)',
          32000,
          16000,
          'open'
        WHERE NOT EXISTS (
          SELECT 1 FROM jetshare_offers 
          WHERE user_id = test_user_id 
          AND departure_location = 'Los Angeles (KVNY)'
          AND arrival_location = 'Las Vegas (KLAS)'
        );
        
        -- Create matched offer if we have a second user
        IF second_user_id IS NOT NULL THEN
          INSERT INTO jetshare_offers (
            user_id, 
            flight_date, 
            departure_location, 
            arrival_location, 
            total_flight_cost, 
            requested_share_amount, 
            status,
            matched_user_id
          )
          SELECT
            test_user_id,
            NOW() + interval '10 days',
            'San Francisco (KSFO)',
            'San Diego (KSAN)',
            38500,
            19250,
            'accepted',
            second_user_id
          WHERE NOT EXISTS (
            SELECT 1 FROM jetshare_offers 
            WHERE user_id = test_user_id 
            AND matched_user_id = second_user_id
          );
        END IF;
      END IF;
    END
    $$;
    `;
    await executeQuery(jetShareSeedSql, "JetShare seed data");

    console.log("🎉 Database restoration completed successfully!");
  } catch (err) {
    console.error("❌ Database restoration failed:", err);
  } finally {
    await pool.end();
  }
};

runMigrations(); 