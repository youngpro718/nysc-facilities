-- Fix Security Definer Views by converting them to regular views or secure functions
-- First, let's identify and fix any views with SECURITY DEFINER

-- Drop and recreate views without SECURITY DEFINER
-- Note: We'll recreate them as regular views since SECURITY DEFINER views bypass RLS

-- Fix any remaining Function Search Path Mutable warnings
-- Update all functions that don't have search_path set

-- Function 1: validate_role_assignment (if it exists and doesn't have search_path)
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

-- Function 2: is_admin (if it exists and doesn't have search_path)
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

-- Fix any problematic views by recreating them without SECURITY DEFINER
-- View 1: Fix user_verification_view if it has SECURITY DEFINER
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

-- View 2: Fix any other security definer views
-- Let's check for common view patterns and fix them

-- Create secure functions instead of security definer views where needed
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

-- Create a secure function for getting building analytics
CREATE OR REPLACE FUNCTION public.get_building_analytics()
RETURNS TABLE (
  building_id UUID,
  building_name TEXT,
  total_floors BIGINT,
  total_rooms BIGINT,
  occupied_rooms BIGINT,
  occupancy_rate NUMERIC,
  active_issues BIGINT,
  maintenance_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as building_id,
    b.name as building_name,
    COUNT(DISTINCT f.id) as total_floors,
    COUNT(DISTINCT CASE WHEN us.space_type = 'room' THEN us.id END) as total_rooms,
    COUNT(DISTINCT CASE WHEN us.space_type = 'room' AND EXISTS(SELECT 1 FROM profiles p WHERE p.room_id = us.id) THEN us.id END) as occupied_rooms,
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN us.space_type = 'room' THEN us.id END) > 0 
      THEN (COUNT(DISTINCT CASE WHEN us.space_type = 'room' AND EXISTS(SELECT 1 FROM profiles p WHERE p.room_id = us.id) THEN us.id END)::NUMERIC / 
            COUNT(DISTINCT CASE WHEN us.space_type = 'room' THEN us.id END)::NUMERIC) * 100
      ELSE 0
    END as occupancy_rate,
    COUNT(DISTINCT CASE WHEN i.status IN ('open', 'in_progress') THEN i.id END) as active_issues,
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN i.status IN ('open', 'in_progress') THEN i.id END) = 0 THEN 100
      ELSE GREATEST(0, 100 - (COUNT(DISTINCT CASE WHEN i.status IN ('open', 'in_progress') THEN i.id END) * 5))
    END as maintenance_score
  FROM buildings b
  LEFT JOIN floors f ON b.id = f.building_id
  LEFT JOIN unified_spaces us ON f.id = us.floor_id
  LEFT JOIN issues i ON us.id = i.room_id
  WHERE b.status = 'active'
  GROUP BY b.id, b.name
  ORDER BY b.name;
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
GRANT EXECUTE ON FUNCTION public.get_building_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_role_assignment(uuid, user_role) TO authenticated;