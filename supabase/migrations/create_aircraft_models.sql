-- Create the aircraft_models table
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
ALTER TABLE public.aircraft_models ADD CONSTRAINT unique_aircraft_model UNIQUE (manufacturer, model);

-- Add an index for faster lookups
CREATE INDEX idx_aircraft_models_display_name ON public.aircraft_models(display_name);

-- Grant access to authenticated users
GRANT SELECT ON public.aircraft_models TO authenticated;

-- Insert common private jets with accurate data
INSERT INTO public.aircraft_models (manufacturer, model, display_name, seat_capacity, range_nm, cruise_speed_kts, description)
VALUES
  ('Gulfstream', 'G650', 'Gulfstream G650', 19, 7000, 516, 'Ultra-long-range business jet with exceptional comfort and performance.'),
  ('Gulfstream', 'G550', 'Gulfstream G550', 16, 6750, 488, 'Long-range business jet with excellent range and versatility.'),
  ('Gulfstream', 'G280', 'Gulfstream G280', 10, 3600, 459, 'Super mid-size business jet with impressive performance.'),
  ('Bombardier', 'Global 7500', 'Bombardier Global 7500', 19, 7700, 516, 'Ultra-long-range business jet with four living spaces.'),
  ('Bombardier', 'Global 6000', 'Bombardier Global 6000', 17, 6000, 513, 'Long-range business jet with spacious cabin.'),
  ('Bombardier', 'Challenger 350', 'Bombardier Challenger 350', 10, 3200, 470, 'Super mid-size business jet with excellent performance.'),
  ('Dassault', 'Falcon 8X', 'Dassault Falcon 8X', 16, 6450, 460, 'Ultra-long-range business jet with exceptional fuel efficiency.'),
  ('Dassault', 'Falcon 7X', 'Dassault Falcon 7X', 14, 5950, 460, 'Long-range business jet with impressive capabilities.'),
  ('Dassault', 'Falcon 2000LXS', 'Dassault Falcon 2000LXS', 10, 4000, 460, 'Twin-engine business jet with excellent short-field performance.'),
  ('Cessna', 'Citation Longitude', 'Cessna Citation Longitude', 12, 3500, 476, 'Super mid-size business jet with long-range capabilities.'),
  ('Cessna', 'Citation Latitude', 'Cessna Citation Latitude', 9, 2700, 446, 'Mid-size business jet with impressive comfort and performance.'),
  ('Cessna', 'Citation XLS+', 'Cessna Citation XLS+', 9, 2100, 441, 'Mid-size business jet with excellent short-field performance.'),
  ('Embraer', 'Praetor 600', 'Embraer Praetor 600', 12, 4018, 466, 'Super mid-size business jet with intercontinental range.'),
  ('Embraer', 'Praetor 500', 'Embraer Praetor 500', 9, 3340, 466, 'Mid-size business jet with excellent performance.'),
  ('Embraer', 'Phenom 300E', 'Embraer Phenom 300E', 10, 2010, 453, 'Light business jet with exceptional performance and comfort.'),
  ('Pilatus', 'PC-24', 'Pilatus PC-24', 11, 2000, 440, 'Light business jet with unique rough-field capabilities.'),
  ('Beechcraft', 'King Air 350i', 'Beechcraft King Air 350i', 11, 1806, 312, 'Twin-turboprop business aircraft with versatility and reliability.'),
  ('HondaJet', 'Elite', 'HondaJet Elite', 7, 1437, 408, 'Light business jet with innovative over-the-wing engine mount configuration.'),
  ('Cirrus', 'Vision Jet', 'Cirrus Vision Jet', 7, 1275, 305, 'Single-engine personal jet with unique V-tail design and parachute system.');

-- Add "Other" option for custom models
INSERT INTO public.aircraft_models (manufacturer, model, display_name, seat_capacity, description)
VALUES
  ('Other', 'Custom', 'Other (Custom Aircraft)', 8, 'Custom aircraft model not in the standard list.');
  
-- Update existing entries in jetshare_offers table
UPDATE jetshare_offers
SET aircraft_model = 'Gulfstream G650'
WHERE aircraft_model IS NULL OR aircraft_model = '';

-- Integrate constraint (optional) to link aircraft_model field to the models table
-- Note: This is commented out to maintain backward compatibility - would require updating all existing records first
-- ALTER TABLE jetshare_offers ADD CONSTRAINT fk_aircraft_model FOREIGN KEY (aircraft_model) REFERENCES aircraft_models(display_name); 