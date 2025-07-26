-- Duplicate court personnel from term_personnel into profiles table
-- This allows court personnel to be managed through the regular user management system

-- Insert court personnel into profiles table
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  email,
  phone,
  department,
  title,
  access_level,
  verification_status,
  is_approved,
  created_at,
  updated_at
)
SELECT 
  -- Generate a UUID for each court personnel entry
  gen_random_uuid() as id,
  -- Parse first name from the name field
  CASE 
    WHEN position(' ' in name) > 0 
    THEN substring(name from 1 for position(' ' in name) - 1)
    ELSE name
  END as first_name,
  -- Parse last name from the name field  
  CASE 
    WHEN position(' ' in name) > 0 
    THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END as last_name,
  -- Generate email based on name (can be updated later)
  LOWER(REPLACE(name, ' ', '.')) || '@court.nysc.gov' as email,
  phone,
  'Court Administration' as department,
  role as title,
  'read' as access_level, -- Default access level
  'pending' as verification_status, -- They'll need to be verified
  false as is_approved, -- They'll need to be approved
  COALESCE(created_at, NOW()) as created_at,
  COALESCE(updated_at, NOW()) as updated_at
FROM term_personnel
WHERE NOT EXISTS (
  -- Don't duplicate if a profile already exists with similar name
  SELECT 1 FROM profiles p 
  WHERE LOWER(CONCAT(p.first_name, ' ', p.last_name)) = LOWER(term_personnel.name)
     OR p.email = LOWER(REPLACE(term_personnel.name, ' ', '.')) || '@court.nysc.gov'
);

-- Create a comment to track this migration
COMMENT ON TABLE profiles IS 'User profiles including court personnel duplicated from term_personnel table for unified management';

-- Optional: Create a view to show the source of each profile
CREATE OR REPLACE VIEW profile_sources AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.department,
  p.title,
  p.access_level,
  p.verification_status,
  p.is_approved,
  CASE 
    WHEN p.email LIKE '%@court.nysc.gov' THEN 'court_personnel'
    ELSE 'regular_user'
  END as source_type,
  p.created_at,
  p.updated_at
FROM profiles p
ORDER BY p.first_name, p.last_name;

-- Grant permissions on the view
GRANT SELECT ON profile_sources TO authenticated;
GRANT SELECT ON profile_sources TO anon;

COMMENT ON VIEW profile_sources IS 'View showing all profiles with their source type (court_personnel or regular_user)';
