-- Fix 1: Remove security definer views and replace with proper RLS policies
-- These views bypass RLS and create security vulnerabilities

-- Drop existing security definer views
DROP VIEW IF EXISTS active_relocations_view CASCADE;
DROP VIEW IF EXISTS court_maintenance_view CASCADE;  
DROP VIEW IF EXISTS court_operations_dashboard CASCADE;
DROP VIEW IF EXISTS courtroom_availability CASCADE;
DROP VIEW IF EXISTS courtroom_shutdowns_view CASCADE;
DROP VIEW IF EXISTS floorplan_report_data CASCADE;

-- Fix 2: Add proper search_path to all security definer functions
-- This prevents potential SQL injection via search_path manipulation

-- Update existing security definer functions to use secure search_path
CREATE OR REPLACE FUNCTION public.check_admin_privileges()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_or_authorized(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow if current user is admin
  IF EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- Allow if current user is the target user (self-operations only for non-admin actions)
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_admin_status(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = $1 
    AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_role_assignment(target_user_id uuid, new_role user_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can assign roles
  IF NOT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  -- Prevent self-promotion (admin cannot change their own role)
  IF auth.uid() = target_user_id THEN
    RETURN false;
  END IF;
  
  -- Additional validation: check if target user exists
  IF NOT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = target_user_id
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

-- Fix 3: Secure the add_admin_user function with proper validation
-- The current function lacks proper security checks and validation

CREATE OR REPLACE FUNCTION public.add_admin_user(email_to_promote text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
BEGIN
  -- Verify that the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can promote users to admin';
  END IF;
  
  -- Validate email format
  IF email_to_promote IS NULL OR email_to_promote = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;
  
  IF email_to_promote !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;
  
  -- Find the user by email in profiles table
  SELECT id INTO target_user_id 
  FROM public.profiles 
  WHERE email = lower(trim(email_to_promote))
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', email_to_promote;
  END IF;
  
  -- Prevent self-promotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot promote yourself to admin';
  END IF;
  
  -- Check if user is already an admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'User % is already an administrator', email_to_promote;
  END IF;
  
  -- Add or update the user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();
  
  -- Log the admin promotion for audit purposes
  INSERT INTO public.role_audit_log (
    user_id, target_user_id, action, new_role, reason
  ) VALUES (
    auth.uid(), target_user_id, 'role_assigned', 'admin', 
    'User promoted to admin via add_admin_user function'
  );
END;
$function$;

-- Fix 4: Add comprehensive input validation triggers
-- These will help prevent XSS and injection attacks

CREATE OR REPLACE FUNCTION public.validate_text_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate and sanitize text fields to prevent XSS
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Check for common XSS patterns in text fields
    IF NEW.title IS NOT NULL AND NEW.title ~ '<script|javascript:|vbscript:|onload=|onerror=' THEN
      RAISE EXCEPTION 'Invalid characters detected in title field';
    END IF;
    
    IF NEW.description IS NOT NULL AND NEW.description ~ '<script|javascript:|vbscript:|onload=|onerror=' THEN
      RAISE EXCEPTION 'Invalid characters detected in description field';
    END IF;
    
    IF NEW.notes IS NOT NULL AND NEW.notes ~ '<script|javascript:|vbscript:|onload=|onerror=' THEN
      RAISE EXCEPTION 'Invalid characters detected in notes field';
    END IF;
    
    -- Trim whitespace and limit length
    IF NEW.title IS NOT NULL THEN
      NEW.title = trim(NEW.title);
      IF length(NEW.title) > 255 THEN
        RAISE EXCEPTION 'Title exceeds maximum length of 255 characters';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply validation trigger to vulnerable tables
DROP TRIGGER IF EXISTS validate_supply_requests_input ON supply_requests;
CREATE TRIGGER validate_supply_requests_input
  BEFORE INSERT OR UPDATE ON supply_requests
  FOR EACH ROW EXECUTE FUNCTION validate_text_input();

DROP TRIGGER IF EXISTS validate_key_requests_input ON key_requests;
CREATE TRIGGER validate_key_requests_input
  BEFORE INSERT OR UPDATE ON key_requests
  FOR EACH ROW EXECUTE FUNCTION validate_text_input();

DROP TRIGGER IF EXISTS validate_issues_input ON issues;
CREATE TRIGGER validate_issues_input
  BEFORE INSERT OR UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION validate_text_input();

-- Fix 5: Add secure session management
-- Create a function to properly invalidate sessions

CREATE OR REPLACE FUNCTION public.invalidate_user_sessions(target_user_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_user_id uuid;
BEGIN
  -- If no target user specified, use current user
  session_user_id := COALESCE(target_user_id, auth.uid());
  
  -- Only allow users to invalidate their own sessions, or admins to invalidate any
  IF session_user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to invalidate sessions';
  END IF;
  
  -- Delete all user sessions from our tracking table
  DELETE FROM public.user_sessions 
  WHERE user_id = session_user_id;
  
  -- Log the session invalidation
  INSERT INTO public.role_audit_log (
    user_id, target_user_id, action, reason
  ) VALUES (
    auth.uid(), session_user_id, 'sessions_invalidated', 
    'All sessions invalidated for security'
  );
END;
$function$;

-- Fix 6: Add rate limiting for sensitive operations
-- Create a table to track rate-limited actions

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now(),
  attempts integer DEFAULT 1
);

-- Enable RLS on rate limiting table
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limiting table
CREATE POLICY "Users can view their own rate limit data" ON public.rate_limit_tracking
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert rate limit data" ON public.rate_limit_tracking
FOR INSERT WITH CHECK (true);

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  action_type text,
  max_attempts integer DEFAULT 5,
  time_window interval DEFAULT '1 hour'::interval
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_attempts integer;
BEGIN
  -- Count recent attempts for this user and action type
  SELECT COUNT(*) INTO current_attempts
  FROM public.rate_limit_tracking
  WHERE user_id = auth.uid()
    AND action_type = check_rate_limit.action_type
    AND created_at > (now() - time_window);
  
  -- If under limit, log this attempt and allow
  IF current_attempts < max_attempts THEN
    INSERT INTO public.rate_limit_tracking (user_id, action_type)
    VALUES (auth.uid(), check_rate_limit.action_type);
    RETURN true;
  END IF;
  
  -- Over limit, deny
  RETURN false;
END;
$function$;