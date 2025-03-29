-- Create the aircraft_models table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.aircraft_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  seat_capacity INTEGER NOT NULL CHECK (seat_capacity > 0),
  range_nm INTEGER, -- Range in nautical miles
  cruise_speed_kts INTEGER, -- Cruise speed in knots
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a unique constraint on the combination of manufacturer and model
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_aircraft_model'
  ) THEN
    ALTER TABLE public.aircraft_models 
    ADD CONSTRAINT unique_aircraft_model UNIQUE (manufacturer, model);
  END IF;
END $$;

-- Add an index for faster lookups if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_aircraft_models_display_name'
  ) THEN
    CREATE INDEX idx_aircraft_models_display_name ON public.aircraft_models(display_name);
  END IF;
END $$;

-- Grant access to authenticated users
GRANT SELECT ON public.aircraft_models TO authenticated;

-- Only insert data if the table is empty to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.aircraft_models LIMIT 1) THEN
    -- Insert data that matches existing jet image structure
    INSERT INTO public.aircraft_models (manufacturer, model, display_name, seat_capacity, range_nm, cruise_speed_kts, image_url, description)
    VALUES
      -- Gulfstream models - matching /public/images/jets/gulfstream
      ('Gulfstream', 'G650', 'Gulfstream G650', 19, 7000, 516, '/images/jets/gulfstream/g650.jpg', 'Ultra-long-range business jet with exceptional comfort and performance.'),
      ('Gulfstream', 'G550', 'Gulfstream G550', 16, 6750, 488, '/images/jets/gulfstream/g550.jpg', 'Long-range business jet with excellent range and versatility.'),
      ('Gulfstream', 'G280', 'Gulfstream G280', 10, 3600, 459, '/images/jets/gulfstream/g280.jpg', 'Super mid-size business jet with impressive performance.'),
      ('Gulfstream', 'G450', 'Gulfstream G450', 14, 4350, 476, '/images/jets/gulfstream/g450.jpg', 'Large-cabin, long-range business jet.'),
      ('Gulfstream', 'G600', 'Gulfstream G600', 19, 6500, 516, '/images/jets/gulfstream/g600.jpg', 'Long-range, large-cabin business jet with advanced technology.'),
      ('Gulfstream', 'G700', 'Gulfstream G700', 19, 7500, 516, '/images/jets/gulfstream/g700.jpg', 'Ultra-long-range business jet with the largest cabin in its class.'),
      
      -- Bombardier models - matching /public/images/jets/bombardier
      ('Bombardier', 'Global 7500', 'Bombardier Global 7500', 19, 7700, 516, '/images/jets/bombardier/global-7500.jpg', 'Ultra-long-range business jet with four living spaces.'),
      ('Bombardier', 'Global 6000', 'Bombardier Global 6000', 17, 6000, 513, '/images/jets/bombardier/global-6000.jpg', 'Long-range business jet with spacious cabin.'),
      ('Bombardier', 'Challenger 350', 'Bombardier Challenger 350', 10, 3200, 470, '/images/jets/bombardier/challenger-350.jpg', 'Super mid-size business jet with excellent performance.'),
      ('Bombardier', 'Challenger 650', 'Bombardier Challenger 650', 12, 4000, 470, '/images/jets/bombardier/challenger-650.jpg', 'Large-cabin business jet with proven reliability.'),
      ('Bombardier', 'Global 5000', 'Bombardier Global 5000', 16, 5200, 499, '/images/jets/bombardier/global-5000.jpg', 'Long-range business jet with spacious cabin.'),
      ('Bombardier', 'Learjet 75', 'Bombardier Learjet 75', 9, 2040, 464, '/images/jets/bombardier/learjet-75.jpg', 'Light business jet with exceptional performance.'),
      
      -- Dassault models - matching /public/images/jets/dassault
      ('Dassault', 'Falcon 8X', 'Dassault Falcon 8X', 16, 6450, 460, '/images/jets/dassault/falcon-8x.jpg', 'Ultra-long-range business jet with exceptional fuel efficiency.'),
      ('Dassault', 'Falcon 7X', 'Dassault Falcon 7X', 14, 5950, 460, '/images/jets/dassault/falcon-7x.jpg', 'Long-range business jet with impressive capabilities.'),
      ('Dassault', 'Falcon 2000LXS', 'Dassault Falcon 2000LXS', 10, 4000, 460, '/images/jets/dassault/falcon-2000lxs.jpg', 'Twin-engine business jet with excellent short-field performance.'),
      ('Dassault', 'Falcon 900LX', 'Dassault Falcon 900LX', 12, 4750, 459, '/images/jets/dassault/falcon-900lx.jpg', 'Tri-engine business jet with outstanding versatility.'),
      
      -- Cessna models - matching /public/images/jets/cessna
      ('Cessna', 'Citation Longitude', 'Cessna Citation Longitude', 12, 3500, 476, '/images/jets/cessna/citation-longitude.jpg', 'Super mid-size business jet with long-range capabilities.'),
      ('Cessna', 'Citation Latitude', 'Cessna Citation Latitude', 9, 2700, 446, '/images/jets/cessna/citation-latitude.jpg', 'Mid-size business jet with impressive comfort and performance.'),
      ('Cessna', 'Citation XLS+', 'Cessna Citation XLS+', 9, 2100, 441, '/images/jets/cessna/citation-xlsplus.jpg', 'Mid-size business jet with excellent short-field performance.'),
      
      -- Embraer models - matching /public/images/jets/embraer
      ('Embraer', 'Praetor 600', 'Embraer Praetor 600', 12, 4018, 466, '/images/jets/embraer/praetor-600.jpg', 'Super mid-size business jet with intercontinental range.'),
      ('Embraer', 'Praetor 500', 'Embraer Praetor 500', 9, 3340, 466, '/images/jets/embraer/praetor-500.jpg', 'Mid-size business jet with excellent performance.'),
      ('Embraer', 'Phenom 300E', 'Embraer Phenom 300E', 10, 2010, 453, '/images/jets/embraer/phenom-300e.jpg', 'Light business jet with exceptional performance and comfort.'),
      
      -- Pilatus models - matching /public/images/jets/pilatus
      ('Pilatus', 'PC-24', 'Pilatus PC-24', 11, 2000, 440, '/images/jets/pilatus/pc-24.jpg', 'Light business jet with unique rough-field capabilities.'),
      
      -- Beechcraft models - matching /public/images/jets/beechcraft
      ('Beechcraft', 'King Air 350i', 'Beechcraft King Air 350i', 11, 1806, 312, '/images/jets/beechcraft/king-air-350i.jpg', 'Twin-turboprop business aircraft with versatility and reliability.'),
      
      -- HondaJet models - matching /public/images/jets/hondajet
      ('HondaJet', 'Elite', 'HondaJet Elite', 7, 1437, 408, '/images/jets/hondajet/elite.jpg', 'Light business jet with innovative over-the-wing engine mount configuration.'),
      
      -- Hawker models - matching /public/images/jets/hawker
      ('Hawker', '800XP', 'Hawker 800XP', 8, 2540, 447, '/images/jets/hawker/800xp.jpg', 'Mid-size business jet with comfortable cabin and solid performance.');
      
    -- Add Additional Airbus/Boeing/Other commercial jets if files exist
    
    -- Add "Other" option for custom models
    INSERT INTO public.aircraft_models (manufacturer, model, display_name, seat_capacity, description)
    VALUES
      ('Other', 'Custom', 'Other (Custom Aircraft)', 8, 'Custom aircraft model not in the standard list.');
  END IF;
END $$;

-- Create function to update image_url based on actual files that exist
-- This ensures image paths match what's actually in the file system
CREATE OR REPLACE FUNCTION update_aircraft_model_image_paths()
RETURNS void AS $$
DECLARE
  model_record RECORD;
BEGIN
  FOR model_record IN 
    SELECT id, manufacturer, model, image_url 
    FROM public.aircraft_models
  LOOP
    -- Logic to set the most accurate image path
    -- This is a simple version - in production, you might need to check file existence
    
    -- Don't update 'Other' models
    IF model_record.manufacturer != 'Other' THEN
      UPDATE public.aircraft_models
      SET image_url = '/images/jets/' || lower(model_record.manufacturer) || '/' || 
                      lower(replace(replace(model_record.model, ' ', '-'), '+', 'plus')) || '.jpg'
      WHERE id = model_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to update paths
SELECT update_aircraft_model_image_paths();

-- Link to existing row-level security if needed
ALTER TABLE public.aircraft_models ENABLE ROW LEVEL SECURITY; 