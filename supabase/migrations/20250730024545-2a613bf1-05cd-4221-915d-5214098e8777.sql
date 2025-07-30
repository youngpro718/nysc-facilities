-- Phase 1 & 2: Critical Security Fixes (Fixed)

-- Fix profiles table RLS policies - remove conflicting ones
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for user's own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- Create clean, secure profiles policies
CREATE POLICY "users_can_view_own_profile" 
ON profiles FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "admins_can_view_all_profiles" 
ON profiles FOR SELECT 
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "users_can_update_own_profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admins_can_update_profiles" 
ON profiles FOR UPDATE 
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Fix all security definer functions to use proper search_path
CREATE OR REPLACE FUNCTION public.check_admin_status(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the current user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to perform this action';
  END IF;

  -- Get the current user's role using secure function
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only administrators can promote users to admin role';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  -- Insert or update the user role to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();

  -- Log the role change for audit purposes
  INSERT INTO public.role_audit_log (
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

CREATE OR REPLACE FUNCTION public.demote_admin_user(target_user_id uuid, new_role public.user_role DEFAULT 'standard')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_current_role public.user_role;
BEGIN
  -- Check if the current user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to perform this action';
  END IF;

  -- Prevent users from demoting themselves
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot change your own admin role';
  END IF;

  -- Only allow existing admins to demote users
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;

  -- Get target user's current role
  SELECT role INTO target_current_role
  FROM public.user_roles 
  WHERE user_roles.user_id = target_user_id;

  -- Update the user role
  UPDATE public.user_roles 
  SET role = new_role, updated_at = now()
  WHERE user_roles.user_id = target_user_id;

  -- Log the role change for audit purposes
  INSERT INTO public.role_audit_log (
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

-- Add security validation functions
CREATE OR REPLACE FUNCTION public.validate_email_format(email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  errors text[] := '{}';
  is_valid boolean := true;
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    errors := array_append(errors, 'Password must be at least 8 characters long');
    is_valid := false;
  END IF;

  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
    is_valid := false;
  END IF;

  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
    is_valid := false;
  END IF;

  -- Check for number
  IF password !~ '[0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one number');
    is_valid := false;
  END IF;

  -- Check for special character
  IF password !~ '[^A-Za-z0-9]' THEN
    errors := array_append(errors, 'Password must contain at least one special character');
    is_valid := false;
  END IF;

  RETURN jsonb_build_object('is_valid', is_valid, 'errors', errors);
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  -- Basic HTML/script tag removal
  RETURN regexp_replace(
    regexp_replace(input_text, '<[^>]*>', '', 'g'),
    '[<>"]', '', 'g'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_attempt_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_attempts integer;
  window_start timestamp with time zone;
BEGIN
  window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Clean up old entries
  DELETE FROM public.auth_rate_limits 
  WHERE last_attempt < window_start;
  
  -- Get current attempts in window
  SELECT COALESCE(attempts, 0) INTO current_attempts
  FROM public.auth_rate_limits
  WHERE identifier = p_identifier 
  AND attempt_type = p_attempt_type
  AND first_attempt >= window_start;
  
  -- Check if rate limit exceeded
  IF current_attempts >= p_max_attempts THEN
    -- Update blocked_until time
    UPDATE public.auth_rate_limits
    SET blocked_until = now() + (p_window_minutes || ' minutes')::interval
    WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
    
    RETURN false;
  END IF;
  
  -- Record this attempt
  INSERT INTO public.auth_rate_limits (identifier, attempt_type, attempts, first_attempt, last_attempt)
  VALUES (p_identifier, p_attempt_type, 1, now(), now())
  ON CONFLICT (identifier, attempt_type)
  DO UPDATE SET 
    attempts = public.auth_rate_limits.attempts + 1,
    last_attempt = now();
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if user session exists and is recent
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_sessions 
    WHERE user_sessions.user_id = auth.uid() 
    AND last_active_at > now() - interval '24 hours'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details text DEFAULT '{}',
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    timestamp
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details::jsonb,
    p_ip_address,
    p_user_agent,
    now()
  );
END;
$$;

-- Grant execute permissions on all security functions
GRANT EXECUTE ON FUNCTION public.validate_email_format(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_strength(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sanitize_input(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_user_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, text, text, text, text) TO authenticated;