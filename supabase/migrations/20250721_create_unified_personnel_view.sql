-- Create a unified personnel view that combines occupants and term_personnel
-- This provides a single source of truth for all personnel data throughout the app

-- First, create a unified personnel view
CREATE OR REPLACE VIEW unified_personnel AS
SELECT 
  -- Common fields
  'occupant' as personnel_type,
  'occupant_' || id as unified_id,
  id as source_id,
  first_name,
  last_name,
  CONCAT(first_name, ' ', last_name) as full_name,
  email,
  phone,
  department,
  title as role,
  title,
  status::text as status,
  access_level,
  room_id as room,
  NULL as extension,
  NULL as floor,
  created_at,
  updated_at,
  -- Occupant-specific fields
  hire_date,
  start_date,
  end_date,
  termination_date,
  employment_type,
  supervisor_id,
  emergency_contact,
  assigned_resources,
  notes
FROM occupants
WHERE status != 'terminated'

UNION ALL

SELECT 
  -- Common fields
  'court_personnel' as personnel_type,
  'court_' || id as unified_id,
  id as source_id,
  -- Parse first and last name from the single name field
  CASE 
    WHEN position(' ' in name) > 0 
    THEN substring(name from 1 for position(' ' in name) - 1)
    ELSE name
  END as first_name,
  CASE 
    WHEN position(' ' in name) > 0 
    THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END as last_name,
  name as full_name,
  NULL as email, -- term_personnel doesn't have email
  phone,
  'Court Administration' as department,
  role,
  role as title,
  'active' as status,
  NULL as access_level,
  room,
  extension,
  floor,
  created_at,
  updated_at,
  -- Occupant-specific fields (NULL for court personnel)
  NULL as hire_date,
  NULL as start_date,
  NULL as end_date,
  NULL as termination_date,
  NULL as employment_type,
  NULL as supervisor_id,
  NULL as emergency_contact,
  NULL as assigned_resources,
  NULL as notes
FROM term_personnel;

-- Create an index on the view for better performance
CREATE INDEX IF NOT EXISTS idx_unified_personnel_type ON occupants(status);
CREATE INDEX IF NOT EXISTS idx_unified_personnel_name ON term_personnel(name);

-- Grant appropriate permissions
GRANT SELECT ON unified_personnel TO authenticated;
GRANT SELECT ON unified_personnel TO anon;

-- Create a function to get personnel by type
CREATE OR REPLACE FUNCTION get_personnel_by_type(p_type text DEFAULT 'all')
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
    FROM unified_personnel up
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
    FROM unified_personnel up
    WHERE up.personnel_type = p_type
    ORDER BY up.full_name;
  END IF;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_personnel_by_type(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_personnel_by_type(text) TO anon;

COMMENT ON VIEW unified_personnel IS 'Unified view combining occupants and term_personnel for consistent personnel management throughout the app';
COMMENT ON FUNCTION get_personnel_by_type(text) IS 'Function to retrieve personnel by type (occupant, court_personnel, or all)';
