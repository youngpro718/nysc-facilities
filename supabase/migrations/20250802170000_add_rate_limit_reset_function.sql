-- Add function to reset rate limits for administrators
CREATE OR REPLACE FUNCTION public.reset_rate_limit(
    p_identifier text, 
    p_attempt_type text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Only admins can reset rate limits
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can reset rate limits';
    END IF;
    
    -- If specific attempt_type provided, reset only that type
    IF p_attempt_type IS NOT NULL THEN
        DELETE FROM auth_rate_limits 
        WHERE identifier = p_identifier 
        AND attempt_type = p_attempt_type;
    ELSE
        -- Reset all rate limits for the identifier
        DELETE FROM auth_rate_limits 
        WHERE identifier = p_identifier;
    END IF;
    
    -- Log the security event
    INSERT INTO security_audit_log (
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
        'rate_limit_reset',
        'auth_rate_limits',
        p_identifier,
        json_build_object(
            'identifier', p_identifier,
            'attempt_type', p_attempt_type,
            'reset_by', auth.uid()
        )::text,
        NULL,
        NULL,
        now()
    );
    
    RETURN true;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin role internally)
GRANT EXECUTE ON FUNCTION public.reset_rate_limit(text, text) TO authenticated;

-- Add function to check current rate limit status
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
    p_identifier text,
    p_attempt_type text DEFAULT NULL
)
RETURNS TABLE (
    identifier text,
    attempt_type text,
    attempts integer,
    last_attempt timestamptz,
    blocked_until timestamptz,
    is_blocked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is admin
    SELECT role INTO current_user_role 
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Only admins can view rate limit status
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can view rate limit status';
    END IF;
    
    -- Return rate limit information
    IF p_attempt_type IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            rl.identifier,
            rl.attempt_type,
            rl.attempts,
            rl.last_attempt,
            rl.blocked_until,
            (rl.blocked_until IS NOT NULL AND rl.blocked_until > now()) as is_blocked
        FROM auth_rate_limits rl
        WHERE rl.identifier = p_identifier 
        AND rl.attempt_type = p_attempt_type;
    ELSE
        RETURN QUERY
        SELECT 
            rl.identifier,
            rl.attempt_type,
            rl.attempts,
            rl.last_attempt,
            rl.blocked_until,
            (rl.blocked_until IS NOT NULL AND rl.blocked_until > now()) as is_blocked
        FROM auth_rate_limits rl
        WHERE rl.identifier = p_identifier;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users (function will check admin role internally)
GRANT EXECUTE ON FUNCTION public.get_rate_limit_status(text, text) TO authenticated;
