-- First, declare UUIDs for our test users
DO $$
DECLARE
    test_user_1 UUID := '6f956420-1867-429e-b803-f45468c68086'; -- Joey's ID
    test_user_2 UUID := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
    test_user_3 UUID := 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
    test_user_4 UUID := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';
BEGIN

-- Create test users in auth.users table (except Joey who already exists)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_sent_at,
  is_anonymous
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    test_user_2,
    'authenticated',
    'authenticated',
    'sarah@test.com',
    '$2a$10$oq6vrQdLPHxNDCdUBVxl8eY2KMLm4OvzoT9CysWeMA/KzvaTNIdsW',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    'false'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    test_user_3,
    'authenticated',
    'authenticated',
    'michael@test.com',
    '$2a$10$oq6vrQdLPHxNDCdUBVxl8eY2KMLm4OvzoT9CysWeMA/KzvaTNIdsW',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    'false'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    test_user_4,
    'authenticated',
    'authenticated',
    'emily@test.com',
    '$2a$10$oq6vrQdLPHxNDCdUBVxl8eY2KMLm4OvzoT9CysWeMA/KzvaTNIdsW',
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    'false'
  );

-- Create test user profiles
INSERT INTO public.profiles (id, first_name, last_name, verification_status, user_type, created_at, updated_at)
VALUES
  (test_user_1, 'Joey', 'Cacciatore', 'verified', 'traveler', NOW(), NOW()),
  (test_user_2, 'Sarah', 'Johnson', 'verified', 'traveler', NOW(), NOW()),
  (test_user_3, 'Michael', 'Brown', 'verified', 'traveler', NOW(), NOW()),
  (test_user_4, 'Emily', 'Davis', 'verified', 'traveler', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now create some offers from these test users
INSERT INTO public.jetshare_offers (
  user_id,
  flight_date,
  departure_location,
  arrival_location,
  total_flight_cost,
  requested_share_amount,
  status,
  created_at,
  updated_at
)
VALUES
  -- Test User 1's offers (Joey)
  (
    test_user_1,
    '2025-04-15',
    'New York',
    'Miami',
    28000,
    14000,
    'open',
    NOW(),
    NOW()
  ),
  (
    test_user_1,
    '2025-04-20',
    'Los Angeles',
    'Las Vegas',
    15000,
    7500,
    'open',
    NOW(),
    NOW()
  ),
  
  -- Test User 2's offers
  (
    test_user_2,
    '2025-04-18',
    'Chicago',
    'San Francisco',
    35000,
    17500,
    'open',
    NOW(),
    NOW()
  ),
  (
    test_user_2,
    '2025-04-25',
    'Boston',
    'Washington DC',
    22000,
    11000,
    'open',
    NOW(),
    NOW()
  ),
  
  -- Test User 3's offers
  (
    test_user_3,
    '2025-04-22',
    'Seattle',
    'Denver',
    25000,
    12500,
    'open',
    NOW(),
    NOW()
  ),
  (
    test_user_3,
    '2025-04-30',
    'Houston',
    'Phoenix',
    30000,
    15000,
    'open',
    NOW(),
    NOW()
  ),
  
  -- Test User 4's offers
  (
    test_user_4,
    '2025-04-28',
    'Miami',
    'New Orleans',
    20000,
    10000,
    'open',
    NOW(),
    NOW()
  ),
  (
    test_user_4,
    '2025-05-05',
    'Las Vegas',
    'San Diego',
    18000,
    9000,
    'open',
    NOW(),
    NOW()
  );

END $$; 