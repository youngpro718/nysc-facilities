-- CRITICAL SECURITY FIXES - Phase 2: Complete security implementation
-- Add remaining security features and fix issues

-- Step 1: Create secure role management functions
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  new_role user_role,
  reason text DEFAULT 'Role assigned by admin'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify current user is admin
  IF NOT public.is_admin(current_user_id) THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Verify target user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Insert or update role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = EXCLUDED.role, updated_at = now();
  
  -- Log the role assignment
  INSERT INTO public.role_audit_log (
    user_id, target_user_id, action, new_role, reason
  ) VALUES (
    current_user_id, target_user_id, 'role_assigned', new_role, reason
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_user_role(
  target_user_id uuid,
  reason text DEFAULT 'Role removed by admin'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  old_role user_role;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify current user is admin
  IF NOT public.is_admin(current_user_id) THEN
    RAISE EXCEPTION 'Only administrators can remove roles';
  END IF;
  
  -- Get current role for logging
  SELECT role INTO old_role FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Remove role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Log the role removal
  IF old_role IS NOT NULL THEN
    INSERT INTO public.role_audit_log (
      user_id, target_user_id, action, old_role, reason
    ) VALUES (
      current_user_id, target_user_id, 'role_removed', old_role, reason
    );
  END IF;
END;
$$;

-- Step 2: Create security audit table for monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security audit logs
CREATE POLICY "Only admins can view security audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Step 3: Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_type text,
  resource_type text DEFAULT NULL,
  resource_id uuid DEFAULT NULL,
  details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, details
  ) VALUES (
    auth.uid(), action_type, resource_type, resource_id, details
  );
END;
$$;

-- Step 4: Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Only users can see their own rate limit entries
CREATE POLICY "Users can view their own rate limit log"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all rate limit logs"
ON public.rate_limit_log
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Step 5: Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  action_name text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Count attempts in the time window
  SELECT COUNT(*) INTO attempt_count
  FROM public.rate_limit_log
  WHERE user_id = current_user_id
    AND action = action_name
    AND created_at > (now() - (window_minutes || ' minutes')::interval);
  
  -- Check if limit exceeded
  IF attempt_count >= max_attempts THEN
    -- Log the rate limit violation
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      'rate_limit',
      current_user_id,
      jsonb_build_object('action', action_name, 'attempts', attempt_count)
    );
    RETURN false;
  END IF;
  
  -- Log this attempt
  INSERT INTO public.rate_limit_log (user_id, action)
  VALUES (current_user_id, action_name);
  
  RETURN true;
END;
$$;

-- Step 6: Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_text_input(
  input_text text,
  max_length integer DEFAULT 255,
  required boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Check if required and empty
  IF required AND (input_text IS NULL OR trim(input_text) = '') THEN
    RETURN false;
  END IF;
  
  -- Check length
  IF input_text IS NOT NULL AND length(trim(input_text)) > max_length THEN
    RETURN false;
  END IF;
  
  -- Check for dangerous patterns
  IF input_text IS NOT NULL AND (
    input_text ~* '<script|javascript:|vbscript:|onload=|onerror=|onclick='
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Step 7: Grant proper permissions
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, user_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, text, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_text_input(text, integer, boolean) TO authenticated;