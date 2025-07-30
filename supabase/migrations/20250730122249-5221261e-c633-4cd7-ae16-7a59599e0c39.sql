-- Security Hardening Migration - Corrected
-- Fix critical security vulnerabilities identified by linter

-- 1. Create missing security validation functions

-- Email validation function
CREATE OR REPLACE FUNCTION public.validate_email_format(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Basic email validation using regex
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Password strength validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  errors TEXT[] := '{}';
  is_valid BOOLEAN := true;
BEGIN
  -- Check minimum length
  IF LENGTH(password) < 8 THEN
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
  
  result := jsonb_build_object(
    'is_valid', is_valid,
    'errors', to_jsonb(errors)
  );
  
  RETURN result;
END;
$$;

-- Input sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Basic sanitization - remove potential SQL injection patterns and XSS
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '<[^>]*>', '', 'g'), -- Remove HTML tags
      '[;&|`$]', '', 'g' -- Remove potentially dangerous characters
    ),
    '\s+', ' ', 'g' -- Normalize whitespace
  );
END;
$$;

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_attempts INTEGER;
  is_blocked BOOLEAN := false;
BEGIN
  -- Check if currently blocked
  SELECT blocked_until > NOW() INTO is_blocked
  FROM auth_rate_limits
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type;
  
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Count recent attempts
  SELECT COALESCE(attempts, 0) INTO recent_attempts
  FROM auth_rate_limits
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND first_attempt > NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  -- If too many attempts, block
  IF recent_attempts >= p_max_attempts THEN
    INSERT INTO auth_rate_limits (identifier, attempt_type, attempts, blocked_until)
    VALUES (p_identifier, p_attempt_type, recent_attempts + 1, NOW() + INTERVAL '1 hour')
    ON CONFLICT (identifier, attempt_type) 
    DO UPDATE SET 
      attempts = auth_rate_limits.attempts + 1,
      blocked_until = NOW() + INTERVAL '1 hour',
      last_attempt = NOW();
    
    RETURN false;
  END IF;
  
  -- Record attempt
  INSERT INTO auth_rate_limits (identifier, attempt_type, attempts)
  VALUES (p_identifier, p_attempt_type, 1)
  ON CONFLICT (identifier, attempt_type)
  DO UPDATE SET 
    attempts = auth_rate_limits.attempts + 1,
    last_attempt = NOW();
  
  RETURN true;
END;
$$;

-- Session validation function
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is authenticated and session is valid
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Additional session checks can be added here
  RETURN true;
END;
$$;

-- Security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_details TEXT DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(auth.uid()::TEXT, 'anonymous'),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details::JSONB,
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- 2. Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
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

-- 3. Remove problematic security definer views and replace with regular views
DROP VIEW IF EXISTS elevator_pass_assignments CASCADE;
DROP VIEW IF EXISTS user_activity_history CASCADE;
DROP VIEW IF EXISTS user_verification_view CASCADE;
DROP VIEW IF EXISTS room_hierarchy_view CASCADE;

-- Create replacement view with correct column names
CREATE VIEW elevator_pass_assignments AS
SELECT 
  ka.id as assignment_id,
  k.id as key_id,
  k.name as key_name,
  p.id as occupant_id,
  p.first_name,
  p.last_name,
  p.email,
  p.department,
  ka.assigned_at,
  ka.returned_at,
  ka.status,
  ka.is_spare,
  ka.spare_key_reason,
  ka.return_reason,
  EXTRACT(DAY FROM (NOW() - ka.assigned_at))::INTEGER as days_since_assigned,
  CASE 
    WHEN ka.status = 'assigned' AND ka.assigned_at < NOW() - INTERVAL '90 days' THEN true
    ELSE false
  END as is_overdue
FROM key_assignments ka
JOIN keys k ON ka.key_id = k.id
JOIN profiles p ON ka.occupant_id = p.id
WHERE k.type = 'elevator_pass'
  AND ka.status IN ('assigned', 'returned');

-- 4. Create security audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on critical tables
ALTER TABLE key_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
DO $$
BEGIN
  -- Key assignments policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'key_assignments' 
    AND policyname = 'Users can view their own assignments'
  ) THEN
    CREATE POLICY "Users can view their own assignments" 
    ON key_assignments 
    FOR SELECT 
    USING (occupant_id = auth.uid() OR 
           EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;

  -- Security audit log policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'security_audit_log' 
    AND policyname = 'Admins can view all security events'
  ) THEN
    CREATE POLICY "Admins can view all security events" 
    ON security_audit_log 
    FOR SELECT 
    USING (EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END
$$;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;