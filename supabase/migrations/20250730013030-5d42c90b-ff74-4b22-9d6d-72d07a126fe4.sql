-- Phase 1: Critical Security Fixes - Admin Role Management
-- Create a secure function for promoting users to admin

-- Create a secure function to promote users to admin with proper authorization
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
BEGIN
  -- Check if the current user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to perform this action';
  END IF;

  -- Get the current user's role
  SELECT role INTO current_user_role
  FROM user_roles 
  WHERE user_id = auth.uid();

  -- Only allow existing admins to promote users
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can promote users to admin role';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  -- Insert or update the user role to admin
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();

  -- Log the role change for audit purposes
  INSERT INTO role_audit_log (
    user_id, 
    target_user_id, 
    action, 
    new_role, 
    reason
  ) VALUES (
    auth.uid(), 
    target_user_id, 
    'role_promoted', 
    'admin', 
    'User promoted to admin via secure function'
  );
END;
$$;

-- Create a secure function to demote admin users
CREATE OR REPLACE FUNCTION public.demote_admin_user(target_user_id uuid, new_role user_role DEFAULT 'standard')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role user_role;
  target_current_role user_role;
BEGIN
  -- Check if the current user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to perform this action';
  END IF;

  -- Prevent users from demoting themselves
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot change your own admin role';
  END IF;

  -- Get the current user's role
  SELECT role INTO current_user_role
  FROM user_roles 
  WHERE user_id = auth.uid();

  -- Only allow existing admins to demote users
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  -- Get target user's current role
  SELECT role INTO target_current_role
  FROM user_roles 
  WHERE user_id = target_user_id;

  -- Update the user role
  UPDATE user_roles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;

  -- Log the role change for audit purposes
  INSERT INTO role_audit_log (
    user_id, 
    target_user_id, 
    action, 
    old_role,
    new_role, 
    reason
  ) VALUES (
    auth.uid(), 
    target_user_id, 
    'role_demoted', 
    target_current_role,
    new_role, 
    'Admin role removed via secure function'
  );
END;
$$;

-- Add RLS policies to prevent direct manipulation of user_roles table
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create more restrictive RLS policies
CREATE POLICY "Users can read their own role" 
ON user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles" 
ON user_roles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Prevent direct INSERT/UPDATE/DELETE on user_roles table
-- All role changes must go through the secure functions
CREATE POLICY "Prevent direct role manipulation" 
ON user_roles 
FOR ALL
USING (false)
WITH CHECK (false);

-- Grant execute permissions on the secure functions to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_admin_user(uuid, user_role) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.promote_user_to_admin(uuid) IS 'Securely promotes a user to admin role with proper authorization checks';
COMMENT ON FUNCTION public.demote_admin_user(uuid, user_role) IS 'Securely demotes an admin user with proper authorization checks';