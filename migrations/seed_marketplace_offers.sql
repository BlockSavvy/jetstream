INSERT INTO public.jetshare_offers (
  user_id,
  flight_date,
  departure_time,
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
    '2025-04-15T14:30:00Z', -- 2:30 PM UTC
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
    '2025-04-20T08:15:00Z', -- 8:15 AM UTC
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
    '2025-04-18T16:45:00Z', -- 4:45 PM UTC
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
    '2025-04-25T11:00:00Z', -- 11:00 AM UTC
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
    '2025-04-22T19:30:00Z', -- 7:30 PM UTC
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
    '2025-04-30T09:45:00Z', -- 9:45 AM UTC
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
    '2025-04-28T12:15:00Z', -- 12:15 PM UTC
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
    '2025-05-05T07:30:00Z', -- 7:30 AM UTC
    'Las Vegas',
    'San Diego',
    18000,
    9000,
    'open',
    NOW(),
    NOW()
  ); 