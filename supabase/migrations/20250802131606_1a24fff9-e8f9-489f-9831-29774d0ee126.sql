-- Security fixes for high-priority database issues

-- First, let's identify and fix the security definer views
-- We need to find which views have SECURITY DEFINER and replace them with safer alternatives

-- Fix function search paths by adding explicit search_path to functions missing them
-- Update existing functions to include proper search path settings

-- Fix validate_email_format function
CREATE OR REPLACE FUNCTION public.validate_email_format(email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Simple email validation regex
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Fix validate_password_strength function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result jsonb := '{"is_valid": true, "errors": []}'::jsonb;
    errors text[] := ARRAY[]::text[];
BEGIN
    -- Check minimum length
    IF length(password) < 8 THEN
        errors := array_append(errors, 'Password must be at least 8 characters long');
    END IF;
    
    -- Check for uppercase letter
    IF password !~ '[A-Z]' THEN
        errors := array_append(errors, 'Password must contain at least one uppercase letter');
    END IF;
    
    -- Check for lowercase letter
    IF password !~ '[a-z]' THEN
        errors := array_append(errors, 'Password must contain at least one lowercase letter');
    END IF;
    
    -- Check for number
    IF password !~ '[0-9]' THEN
        errors := array_append(errors, 'Password must contain at least one number');
    END IF;
    
    -- Check for special character
    IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
        errors := array_append(errors, 'Password must contain at least one special character');
    END IF;
    
    -- Update result
    IF array_length(errors, 1) > 0 THEN
        result := jsonb_build_object(
            'is_valid', false,
            'errors', to_jsonb(errors)
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Fix sanitize_input function
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Basic input sanitization
    -- Remove potentially dangerous HTML tags and SQL injection patterns
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '<[^>]*>', '', 'g'), 
            '[''";\\-]', '', 'g'
        ),
        '\s+', ' ', 'g'
    );
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_identifier text,
    p_attempt_type text,
    p_max_attempts integer DEFAULT 5,
    p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_attempts integer;
    window_start timestamp with time zone;
BEGIN
    window_start := now() - (p_window_minutes || ' minutes')::interval;
    
    -- Count recent attempts
    SELECT COUNT(*) INTO current_attempts
    FROM public.auth_rate_limits
    WHERE identifier = p_identifier
    AND attempt_type = p_attempt_type
    AND first_attempt > window_start;
    
    -- If under limit, record attempt and allow
    IF current_attempts < p_max_attempts THEN
        INSERT INTO public.auth_rate_limits (
            identifier, 
            attempt_type, 
            attempts,
            first_attempt,
            last_attempt
        ) VALUES (
            p_identifier,
            p_attempt_type,
            1,
            now(),
            now()
        )
        ON CONFLICT (identifier, attempt_type) 
        DO UPDATE SET 
            attempts = auth_rate_limits.attempts + 1,
            last_attempt = now(),
            blocked_until = CASE 
                WHEN auth_rate_limits.attempts + 1 >= p_max_attempts 
                THEN now() + (p_window_minutes || ' minutes')::interval
                ELSE auth_rate_limits.blocked_until
            END;
        
        RETURN true;
    END IF;
    
    -- Check if block period has expired
    IF EXISTS (
        SELECT 1 FROM public.auth_rate_limits 
        WHERE identifier = p_identifier 
        AND attempt_type = p_attempt_type
        AND (blocked_until IS NULL OR blocked_until < now())
    ) THEN
        -- Reset attempts and allow
        UPDATE public.auth_rate_limits 
        SET attempts = 1, 
            first_attempt = now(),
            last_attempt = now(),
            blocked_until = NULL
        WHERE identifier = p_identifier 
        AND attempt_type = p_attempt_type;
        
        RETURN true;
    END IF;
    
    -- Still blocked
    RETURN false;
END;
$$;

-- Fix validate_user_session function
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND verification_status = 'verified'
    ) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Fix log_security_event function
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
SET search_path TO 'public'
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
        created_at
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id::uuid,
        p_details::jsonb,
        p_ip_address,
        p_user_agent,
        now()
    );
END;
$$;