-- Drop existing functions that need to be recreated with search_path
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.validate_role_assignment(uuid, user_role);

-- Fix Security Definer Views by converting them to regular views
-- Remove SECURITY DEFINER from views and replace with secure functions

-- First, let's recreate the functions with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_role_assignment(target_user_id uuid, target_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  -- Additional validation logic
  RETURN true;
END;
$$;

-- Drop and recreate any problematic views without SECURITY DEFINER
DROP VIEW IF EXISTS public.user_verification_view CASCADE;
CREATE VIEW public.user_verification_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.department,
  p.role,
  p.is_approved,
  p.created_at,
  p.updated_at,
  ur.role as user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Check for other common views that might have SECURITY DEFINER and fix them
-- Fix spaces dashboard view if it exists
DROP VIEW IF EXISTS public.spaces_summary_view CASCADE;
CREATE VIEW public.spaces_summary_view AS
SELECT 
  us.id,
  us.name,
  us.space_type,
  us.status,
  f.name as floor_name,
  f.floor_number,
  b.name as building_name
FROM unified_spaces us
JOIN floors f ON us.floor_id = f.id
JOIN buildings b ON f.building_id = b.id;

-- Fix room analytics view if it exists
DROP VIEW IF EXISTS public.room_analytics_view CASCADE;
CREATE VIEW public.room_analytics_view AS
SELECT 
  us.id,
  us.name,
  us.room_number,
  COUNT(p.id) as occupant_count,
  COUNT(i.id) as issue_count,
  COUNT(CASE WHEN i.status IN ('open', 'in_progress') THEN 1 END) as open_issue_count
FROM unified_spaces us
LEFT JOIN profiles p ON p.room_id = us.id
LEFT JOIN issues i ON i.room_id = us.id
WHERE us.space_type = 'room'
GROUP BY us.id, us.name, us.room_number;

-- Create secure functions instead of security definer views
CREATE OR REPLACE FUNCTION public.get_user_verification_data()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  department TEXT,
  role TEXT,
  is_approved BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to access this data
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.department,
    p.role,
    p.is_approved,
    p.created_at,
    p.updated_at,
    ur.role as user_role
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id;
END;
$$;

-- Fix any other functions that might not have search_path set
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role FROM user_roles 
    WHERE user_id = auth.uid()
  );
END;
$$;

-- Ensure all trigger functions have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Grant proper permissions to the new functions
GRANT EXECUTE ON FUNCTION public.get_user_verification_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_role_assignment(uuid, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;