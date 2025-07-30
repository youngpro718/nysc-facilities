-- Final Security Hardening Migration - Corrected
-- Fix remaining security vulnerabilities without materialized view RLS

-- 1. Secure the materialized view by restricting access through permissions only
REVOKE ALL ON spaces_dashboard_mv FROM authenticated, anon;

-- Create a secure function to access dashboard data
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_rooms BIGINT,
  occupied_rooms BIGINT,
  available_rooms BIGINT,
  maintenance_rooms BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can access dashboard stats
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM rooms WHERE status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM rooms WHERE status = 'active' AND current_occupancy > 0)::BIGINT,
    (SELECT COUNT(*) FROM rooms WHERE status = 'active' AND current_occupancy = 0)::BIGINT,
    (SELECT COUNT(*) FROM rooms WHERE status = 'maintenance')::BIGINT;
END;
$$;

-- 2. Add missing search_path to critical functions
CREATE OR REPLACE FUNCTION public.check_admin_status(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if the current user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to perform this action';
  END IF;

  -- Get the current user's role using secure function
  IF NOT is_current_user_admin() THEN
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

  -- Log the role change for audit purposes if table exists
  BEGIN
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
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, skip logging
    NULL;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can approve users';
  END IF;

  UPDATE profiles
  SET 
    is_approved = true,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = user_id;
END;
$$;

-- 3. Strengthen RLS policies with more restrictive access
-- Update user_roles table RLS
DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
CREATE POLICY "Users can view their own role" 
ON user_roles 
FOR SELECT 
USING (user_id = auth.uid() OR 
       EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

-- Update profiles table RLS to be more restrictive
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Add timestamp column to security audit log if missing
ALTER TABLE security_audit_log 
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Add rate limiting to critical operations
CREATE OR REPLACE FUNCTION public.secure_role_assignment(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check rate limit
  IF NOT check_rate_limit(auth.uid()::TEXT, 'role_assignment', 3, 60) THEN
    RAISE EXCEPTION 'Rate limit exceeded for role assignments';
  END IF;
  
  -- Check admin privileges
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  
  -- Log security event
  PERFORM log_security_event(
    'role_assignment',
    'user_roles',
    target_user_id::TEXT,
    jsonb_build_object('new_role', new_role, 'assigned_by', auth.uid())
  );
  
  -- Perform the assignment
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role::user_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = new_role::user_role, updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- 6. Create secure wrapper for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_user_action(
  action_type TEXT,
  target_resource TEXT,
  details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Always log user actions for audit trail
  PERFORM log_security_event(
    action_type,
    target_resource,
    auth.uid()::TEXT,
    details::TEXT
  );
END;
$$;