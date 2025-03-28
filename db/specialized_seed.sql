
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
    