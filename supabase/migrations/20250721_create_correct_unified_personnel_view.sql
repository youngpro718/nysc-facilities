-- Create a unified personnel view that combines profiles (registered users) and personnel_profiles (court personnel)
-- This provides a single source of truth for all personnel data throughout the app

-- Drop existing view if it exists
DROP VIEW IF EXISTS unified_personnel_view;

-- Create the unified personnel view
CREATE OR REPLACE VIEW unified_personnel_view AS
SELECT 
  -- Common fields
  'registered_user' as personnel_type,
  'user_' || id as unified_id,
  id as source_id,
  first_name,
  last_name,
  CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as full_name,
  email,
  phone,
  department,
  title as role,
  title,
  verification_status as status,
  access_level,
  NULL as room,
  NULL as extension,
  NULL as floor,
  created_at,
  updated_at
FROM profiles
WHERE is_approved = true

UNION ALL

SELECT 
  -- Common fields
  'court_personnel' as personnel_type,
  'court_' || id as unified_id,
  id as source_id,
  first_name,
  last_name,
  display_name as full_name,
  email,
  phone,
  department,
  primary_role as role,
  primary_role as title,
  'active' as status,
  NULL as access_level,
  room,
  extension,
  floor,
  created_at,
  updated_at
FROM personnel_profiles;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_personnel_profiles_display_name ON personnel_profiles(display_name);

-- Grant appropriate permissions
GRANT SELECT ON unified_personnel_view TO authenticated;
GRANT SELECT ON unified_personnel_view TO anon;

-- Create a function to get personnel by type
CREATE OR REPLACE FUNCTION get_unified_personnel_by_type(p_type text DEFAULT 'all')
RETURNS TABLE (
  personnel_type text,
  unified_id text,
  source_id text,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  department text,
  role text,
  title text,
  status text,
  access_level text,
  room text,
  extension text,
  floor text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_type = 'all' THEN
    RETURN QUERY
    SELECT 
      up.personnel_type,
      up.unified_id,
      up.source_id,
      up.first_name,
      up.last_name,
      up.full_name,
      up.email,
      up.phone,
      up.department,
      up.role,
      up.title,
      up.status,
      up.access_level,
      up.room,
      up.extension,
      up.floor,
      up.created_at,
      up.updated_at
    FROM unified_personnel_view up
    ORDER BY up.full_name;
  ELSE
    RETURN QUERY
    SELECT 
      up.personnel_type,
      up.unified_id,
      up.source_id,
      up.first_name,
      up.last_name,
      up.full_name,
      up.email,
      up.phone,
      up.department,
      up.role,
      up.title,
      up.status,
      up.access_level,
      up.room,
      up.extension,
      up.floor,
      up.created_at,
      up.updated_at
    FROM unified_personnel_view up
    WHERE up.personnel_type = p_type
    ORDER BY up.full_name;
  END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_unified_personnel_by_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unified_personnel_by_type(text) TO anon;

COMMENT ON VIEW unified_personnel_view IS 'Unified view combining profiles (registered users) and personnel_profiles (court personnel) for consistent personnel management throughout the app';
COMMENT ON FUNCTION get_unified_personnel_by_type(text) IS 'Function to retrieve unified personnel by type (registered_user, court_personnel, or all)';
