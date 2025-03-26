-- Fix crew image URLs to ensure they have correct extensions
-- This standardizes all image paths in the database to be consistent

-- First, update any image URLs that point to unsplash to use UI avatars instead
UPDATE pilots_crews
SET profile_image_url = CONCAT('https://ui-avatars.com/api/?name=', REPLACE(name, ' ', '+'), '&background=FF9500&color=fff')
WHERE profile_image_url LIKE '%source.unsplash.com%';

-- Update the specific captain images to use proper paths
UPDATE pilots_crews
SET profile_image_url = '/images/crew/captain_powell.jpg'
WHERE profile_image_url LIKE '%captain_powell%' AND NOT profile_image_url LIKE '%.jpg';

UPDATE pilots_crews
SET profile_image_url = '/images/crew/captain_reid.jpg'
WHERE profile_image_url LIKE '%captain_reid%' AND NOT profile_image_url LIKE '%.jpg';

UPDATE pilots_crews
SET profile_image_url = '/images/crew/captain_emmet.jpg'
WHERE profile_image_url LIKE '%emmet%' OR (profile_image_url LIKE '%spencer%' AND profile_image_url LIKE '%zieme%');

-- Update all remaining crew images to ensure they have .jpg extension if they don't already have an extension
UPDATE pilots_crews
SET profile_image_url = CONCAT(profile_image_url, '.jpg')
WHERE profile_image_url NOT LIKE '%.jpg' 
  AND profile_image_url NOT LIKE '%.jpeg' 
  AND profile_image_url NOT LIKE '%.png' 
  AND profile_image_url NOT LIKE '%.webp'
  AND profile_image_url NOT LIKE 'http%'
  AND profile_image_url IS NOT NULL;

-- For any remaining images without proper paths, set them to UI avatars
UPDATE pilots_crews
SET profile_image_url = CONCAT('https://ui-avatars.com/api/?name=', REPLACE(name, ' ', '+'), '&background=FF9500&color=fff')
WHERE profile_image_url IS NULL OR profile_image_url = ''; 