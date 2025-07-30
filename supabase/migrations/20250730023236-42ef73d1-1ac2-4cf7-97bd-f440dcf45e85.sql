-- Fix RLS infinite recursion issues and strengthen security

-- Step 1: Create security definer functions to break recursion chains
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role 
  FROM user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_user_manage_roles(target_user_id uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) AND auth.uid() != target_user_id; -- Prevent self-modification
$$;

-- Step 2: Drop existing problematic RLS policies on user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can manage their roles" ON user_roles;

-- Step 3: Create new secure RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (public.can_user_manage_roles(user_id))
WITH CHECK (public.can_user_manage_roles(user_id));

CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (public.can_user_manage_roles(user_id));

-- Step 4: Update profiles table policies to use security definer functions
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can insert profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

-- Step 5: Create audit table for security monitoring
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON security_audit_log FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

-- Step 6: Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id, action, resource_type, resource_id, details, ip_address, user_agent
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent
  );
END;
$$;

-- Step 7: Create trigger to audit role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'role_assigned',
      'user_role',
      NEW.id,
      jsonb_build_object('target_user_id', NEW.user_id, 'role', NEW.role)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'role_updated',
      'user_role',
      NEW.id,
      jsonb_build_object('target_user_id', NEW.user_id, 'old_role', OLD.role, 'new_role', NEW.role)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'role_removed',
      'user_role',
      OLD.id,
      jsonb_build_object('target_user_id', OLD.user_id, 'role', OLD.role)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON user_roles;

-- Create new audit trigger
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Step 8: Create session validation function
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email_confirmed_at IS NOT NULL
  );
$$;

-- Step 9: Add rate limiting table for failed auth attempts
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address or email
  attempt_type text NOT NULL, -- 'login', 'signup', 'password_reset'
  attempts integer DEFAULT 1,
  first_attempt timestamp with time zone DEFAULT now(),
  last_attempt timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(identifier, attempt_type)
);

ALTER TABLE auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage rate limits"
ON auth_rate_limits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 10: Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_attempt_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts integer;
  is_blocked boolean;
BEGIN
  -- Check if currently blocked
  SELECT COALESCE(blocked_until > now(), false) INTO is_blocked
  FROM auth_rate_limits
  WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
  
  IF is_blocked THEN
    RETURN false;
  END IF;
  
  -- Get current attempts in the window
  SELECT COALESCE(attempts, 0) INTO current_attempts
  FROM auth_rate_limits
  WHERE identifier = p_identifier 
    AND attempt_type = p_attempt_type
    AND first_attempt > (now() - (p_window_minutes || ' minutes')::interval);
  
  -- If under limit, allow
  IF current_attempts < p_max_attempts THEN
    -- Update or insert attempt record
    INSERT INTO auth_rate_limits (identifier, attempt_type, attempts, first_attempt, last_attempt)
    VALUES (p_identifier, p_attempt_type, 1, now(), now())
    ON CONFLICT (identifier, attempt_type) 
    DO UPDATE SET 
      attempts = CASE 
        WHEN auth_rate_limits.first_attempt < (now() - (p_window_minutes || ' minutes')::interval)
        THEN 1
        ELSE auth_rate_limits.attempts + 1
      END,
      first_attempt = CASE
        WHEN auth_rate_limits.first_attempt < (now() - (p_window_minutes || ' minutes')::interval)
        THEN now()
        ELSE auth_rate_limits.first_attempt
      END,
      last_attempt = now();
    
    RETURN true;
  ELSE
    -- Block for double the window time
    UPDATE auth_rate_limits
    SET blocked_until = now() + (p_window_minutes * 2 || ' minutes')::interval
    WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
    
    RETURN false;
  END IF;
END;
$$;