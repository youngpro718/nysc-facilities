-- Fix the infinite recursion in user_roles table by cleaning up conflicting policies

-- First, drop ALL existing policies on user_roles to start clean
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "admins_can_manage_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_can_view_all_roles" ON user_roles;
DROP POLICY IF EXISTS "users_can_view_own_roles" ON user_roles;
DROP POLICY IF EXISTS "service_role_full_access" ON user_roles;

-- Ensure we have the security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Create simple, non-conflicting RLS policies
CREATE POLICY "users_can_read_own_role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admins_can_read_all_roles"
ON user_roles FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "admins_can_insert_roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "admins_can_update_roles"
ON user_roles FOR UPDATE
TO authenticated
USING (public.is_current_user_admin() AND auth.uid() != user_id)
WITH CHECK (public.is_current_user_admin() AND auth.uid() != user_id);

CREATE POLICY "admins_can_delete_roles"
ON user_roles FOR DELETE
TO authenticated
USING (public.is_current_user_admin() AND auth.uid() != user_id);

-- Allow service role full access for system operations
CREATE POLICY "service_role_access"
ON user_roles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;