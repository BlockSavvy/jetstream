-- SQL Script to Seed Jets with proper images

-- First clear existing data if needed
-- DELETE FROM jets;

-- Insert jets with proper images
INSERT INTO jets (model, manufacturer, year, capacity, range_nm, cruise_speed_kts, hourly_rate, description, image_url, category, created_at, updated_at)
VALUES
-- Gulfstream jets
('G650ER', 'Gulfstream', 2020, 19, 7500, 560, 12000, 'Ultra-long-range business jet with luxury cabin and intercontinental capabilities.', '/images/jets/gulfstream/g650er.jpg', 'heavy', NOW(), NOW()),
('G550', 'Gulfstream', 2018, 16, 6750, 488, 8500, 'Long-range business jet with exceptional comfort and performance.', '/images/jets/gulfstream/g550.jpg', 'heavy', NOW(), NOW()),
('G280', 'Gulfstream', 2019, 10, 3600, 482, 5500, 'Super-midsize jet offering comfort and best-in-class performance.', '/images/jets/gulfstream/g280.jpg', 'super_midsize', NOW(), NOW()),

-- Bombardier jets
('Global 7500', 'Bombardier', 2021, 19, 7700, 516, 13000, 'Ultimate long-range jet with four distinct living spaces.', '/images/jets/bombardier/global7500.jpg', 'heavy', NOW(), NOW()),
('Challenger 350', 'Bombardier', 2020, 10, 3200, 470, 5800, 'Super-midsize jet with best-in-class comfort and performance.', '/images/jets/bombardier/challenger350.jpg', 'super_midsize', NOW(), NOW()),
('Learjet 75', 'Bombardier', 2019, 9, 2040, 464, 4200, 'Light jet with superior performance and spacious cabin.', '/images/jets/bombardier/learjet75.jpg', 'light', NOW(), NOW()),

-- Dassault jets
('Falcon 8X', 'Dassault', 2020, 16, 6450, 460, 10500, 'Ultra-long-range jet with outstanding agility and cabin comfort.', '/images/jets/dassault/falcon8x.jpg', 'heavy', NOW(), NOW()),
('Falcon 2000LXS', 'Dassault', 2019, 10, 4000, 470, 6300, 'Wide-body jet offering comfort and airport flexibility.', '/images/jets/dassault/falcon2000lxs.jpg', 'super_midsize', NOW(), NOW()),
('Falcon 900LX', 'Dassault', 2018, 14, 4750, 459, 8700, 'Tri-engine design with exceptional reliability and range.', '/images/jets/dassault/falcon900lx.jpg', 'heavy', NOW(), NOW()),

-- Embraer jets
('Praetor 600', 'Embraer', 2020, 12, 4018, 466, 5900, 'Super-midsize jet with intercontinental range and advanced technology.', '/images/jets/embraer/praetor600.jpg', 'super_midsize', NOW(), NOW()),
('Legacy 500', 'Embraer', 2019, 12, 3125, 466, 5200, 'Midsize jet with large cabin and fly-by-wire technology.', '/images/jets/embraer/legacy500.jpg', 'midsize', NOW(), NOW()),
('Phenom 300E', 'Embraer', 2020, 10, 2010, 444, 3200, 'Light jet with exceptional performance and comfort.', '/images/jets/embraer/phenom300e.jpg', 'light', NOW(), NOW()),

-- Cessna jets
('Citation Longitude', 'Cessna', 2020, 12, 3500, 476, 5400, 'Super-midsize jet with best-in-class legroom and low cabin altitude.', '/images/jets/cessna/citationlongitude.jpg', 'super_midsize', NOW(), NOW()),
('Citation Latitude', 'Cessna', 2019, 9, 2700, 446, 4200, 'Midsize jet with stand-up cabin and transcontinental range.', '/images/jets/cessna/citationlatitude.jpg', 'midsize', NOW(), NOW()),
('Citation XLS+', 'Cessna', 2020, 9, 2100, 441, 3900, 'Midsize jet with outstanding short-field performance.', '/images/jets/cessna/citationxlsplus.jpg', 'midsize', NOW(), NOW()),

-- Beechcraft jets
('King Air 350i', 'Beechcraft', 2020, 11, 1806, 313, 2800, 'Turboprop with exceptional cabin comfort and versatility.', '/images/jets/beechcraft/kingair350i.jpg', 'turboprop', NOW(), NOW()),
('King Air 250', 'Beechcraft', 2019, 8, 1720, 310, 2500, 'Turboprop offering performance and comfort with lower operating costs.', '/images/jets/beechcraft/kingair250.jpg', 'turboprop', NOW(), NOW()),

-- Hawker jets
('Hawker 900XP', 'Hawker', 2018, 8, 2930, 448, 4800, 'Midsize jet with extended range and enhanced performance.', '/images/jets/hawker/hawker900xp.jpg', 'midsize', NOW(), NOW()),
('Hawker 750', 'Hawker', 2017, 8, 2116, 448, 4400, 'Midsize jet with large baggage compartment and excellent value.', '/images/jets/hawker/hawker750.jpg', 'midsize', NOW(), NOW()),

-- HondaJet
('HA-420', 'HondaJet', 2021, 6, 1223, 422, 2700, 'Light jet with unique over-the-wing engine mount design.', '/images/jets/hondajet/ha420.jpg', 'very_light', NOW(), NOW()),

-- Pilatus
('PC-24', 'Pilatus', 2020, 8, 2000, 425, 3600, 'Versatile jet with exceptional runway performance.', '/images/jets/pilatus/pc24.jpg', 'light', NOW(), NOW()),
('PC-12 NGX', 'Pilatus', 2020, 9, 1800, 290, 2600, 'Turboprop offering versatility and luxury in a single-engine design.', '/images/jets/pilatus/pc12ngx.jpg', 'turboprop', NOW(), NOW()),

-- Boeing business jets
('BBJ 737-7', 'Boeing', 2021, 25, 6710, 470, 25000, 'Ultra-large business jet based on commercial airliner.', '/images/jets/boeing/bbj737.jpg', 'ultra_large', NOW(), NOW()),
('BBJ 787-8', 'Boeing', 2020, 40, 9800, 488, 35000, 'Ultra-long-range VIP airliner with exceptional comfort and range.', '/images/jets/boeing/bbj787.jpg', 'ultra_large', NOW(), NOW()),

-- Airbus corporate jets
('ACJ319neo', 'Airbus', 2021, 19, 6750, 470, 24000, 'Corporate jet with exceptional cabin space and comfort.', '/images/jets/airbus/acj319neo.jpg', 'ultra_large', NOW(), NOW()),
('ACJ320neo', 'Airbus', 2020, 25, 6000, 470, 26000, 'Corporate jet offering a wider and taller cabin than traditional business jets.', '/images/jets/airbus/acj320neo.jpg', 'ultra_large', NOW(), NOW());

-- Add sample information about jet interiors
INSERT INTO jet_interiors (jet_id, interior_type, seats, berths, lavatory, galley, entertainment, wifi, interior_image_url, notes, created_at, updated_at)
SELECT 
    id,
    CASE 
        WHEN category IN ('heavy', 'ultra_large') THEN 'Luxury VIP'
        WHEN category IN ('super_midsize', 'midsize') THEN 'Executive'
        ELSE 'Standard'
    END,
    capacity,
    CASE 
        WHEN category IN ('heavy', 'ultra_large') THEN TRUE
        WHEN category = 'super_midsize' THEN CASE WHEN RANDOM() > 0.5 THEN TRUE ELSE FALSE END
        ELSE FALSE
    END,
    CASE WHEN category != 'very_light' THEN TRUE ELSE CASE WHEN RANDOM() > 0.7 THEN TRUE ELSE FALSE END END,
    CASE WHEN category IN ('midsize', 'super_midsize', 'heavy', 'ultra_large') THEN TRUE ELSE FALSE END,
    CASE 
        WHEN category IN ('heavy', 'ultra_large') THEN 'Premium entertainment system with multiple screens'
        WHEN category IN ('super_midsize', 'midsize') THEN 'Entertainment system with personal screens'
        ELSE 'Basic entertainment system'
    END,
    CASE WHEN category IN ('very_light', 'light') THEN CASE WHEN RANDOM() > 0.5 THEN TRUE ELSE FALSE END ELSE TRUE END,
    '/images/jets/interior/interior' || (FLOOR(RANDOM() * 5) + 1)::TEXT || '.jpg',
    CASE 
        WHEN category = 'ultra_large' THEN 'Custom luxury interior with multiple compartments'
        WHEN category = 'heavy' THEN 'Spacious luxury interior with separate areas'
        WHEN category = 'super_midsize' THEN 'Premium interior with enhanced comfort'
        WHEN category = 'midsize' THEN 'Comfortable interior suitable for business travel'
        WHEN category = 'light' THEN 'Efficient interior with essential amenities'
        ELSE 'Compact interior optimized for short flights'
    END,
    NOW(),
    NOW()
FROM jets;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_jets_category ON jets(category);
CREATE INDEX IF NOT EXISTS idx_jets_manufacturer ON jets(manufacturer); 