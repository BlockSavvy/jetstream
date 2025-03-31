-- Update user verification status script
-- Use with caution: This should only be used in development or for specific users
-- who have explicitly requested verification bypass

-- Update user verification status for a specific email
UPDATE auth.users
SET 
  email_confirmed_at = CURRENT_TIMESTAMP,
  raw_user_meta_data = jsonb_set(
    raw_user_meta_data, 
    '{email_verified}', 
    'true'
  )
WHERE email = 'jeffrey@eiserman.us';

-- Update user profile verification status as well
UPDATE public.profiles
SET
  verification_status = 'verified',
  updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'jeffrey@eiserman.us'
);

-- Log the changes for audit purposes
INSERT INTO public.audit_logs (
  event_type,
  user_id,
  metadata,
  created_at
)
SELECT 
  'manual_verification',
  id,
  jsonb_build_object(
    'email', email,
    'action_by', 'admin',
    'reason', 'requested bypass for testing'
  ),
  CURRENT_TIMESTAMP
FROM auth.users 
WHERE email = 'jeffrey@eiserman.us'
ON CONFLICT DO NOTHING; 