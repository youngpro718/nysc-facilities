-- Drop functions with CASCADE to remove dependencies first
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_role_assignment(uuid, user_role) CASCADE;

-- Recreate the functions with proper search_path
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
  
  RETURN true;
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

-- Recreate any policies that were dropped with the CASCADE
-- Re-enable RLS policies that depend on is_admin function

-- Policy for users_metadata table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users_metadata') THEN
    DROP POLICY IF EXISTS "Enable all access for admins" ON public.users_metadata;
    CREATE POLICY "Enable all access for admins" 
    ON public.users_metadata
    FOR ALL 
    TO authenticated
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- Drop and recreate user verification view with correct column references
DROP VIEW IF EXISTS public.user_verification_view CASCADE;
CREATE VIEW public.user_verification_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.department,
  p.is_approved,
  p.created_at,
  p.updated_at,
  ur.role as user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Create secure functions instead of security definer views
CREATE OR REPLACE FUNCTION public.get_user_verification_data()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  department TEXT,
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
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.department,
    p.is_approved,
    p.created_at,
    p.updated_at,
    ur.role as user_role
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id;
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