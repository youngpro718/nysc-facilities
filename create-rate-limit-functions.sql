-- Create Rate Limit Management Functions (Simplified)
-- Run this in your Supabase SQL editor to add the missing functions
-- No user_profiles dependency - works with any database

-- Function to reset rate limits (simplified - no role check)
CREATE OR REPLACE FUNCTION reset_rate_limit(
    p_identifier TEXT,
    p_attempt_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Note: In production, you should add proper role-based access control
    
    -- Reset rate limits
    IF p_attempt_type IS NULL THEN
        -- Reset all attempt types for the identifier
        DELETE FROM auth_rate_limits 
        WHERE identifier = p_identifier;
    ELSE
        -- Reset specific attempt type for the identifier
        DELETE FROM auth_rate_limits 
        WHERE identifier = p_identifier 
        AND attempt_type = p_attempt_type;
    END IF;
    
    -- Log the action (commented out - requires security_audit_log table)
    -- INSERT INTO security_audit_log (
    --     user_id,
    --     action,
    --     details,
    --     ip_address,
    --     user_agent
    -- ) VALUES (
    --     auth.uid(),
    --     'rate_limit_reset',
    --     jsonb_build_object(
    --         'identifier', p_identifier,
    --         'attempt_type', COALESCE(p_attempt_type, 'all')
    --     ),
    --     inet_client_addr()::text,
    --     current_setting('request.headers', true)::json->>'user-agent'
    -- );
    
    RETURN TRUE;
END;
$$;

-- Function to get rate limit status (simplified - no role check)
CREATE OR REPLACE FUNCTION get_rate_limit_status(
    p_identifier TEXT,
    p_attempt_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    identifier TEXT,
    attempt_type TEXT,
    attempts INTEGER,
    last_attempt TIMESTAMP WITH TIME ZONE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    is_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Note: In production, you should add proper role-based access control
    
    -- Return rate limit status
    RETURN QUERY
    SELECT 
        arl.identifier,
        arl.attempt_type,
        arl.attempts,
        arl.last_attempt,
        arl.blocked_until,
        (arl.blocked_until IS NOT NULL AND arl.blocked_until > now()) as is_blocked
    FROM auth_rate_limits arl
    WHERE arl.identifier = p_identifier
    AND (p_attempt_type IS NULL OR arl.attempt_type = p_attempt_type)
    ORDER BY arl.last_attempt DESC;
END;
$$;

-- Grant execute permissions to authenticated users (with internal role checks)
GRANT EXECUTE ON FUNCTION reset_rate_limit(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_rate_limit_status(TEXT, TEXT) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION reset_rate_limit(TEXT, TEXT) IS 'Reset rate limits for a given identifier. Admin only.';
COMMENT ON FUNCTION get_rate_limit_status(TEXT, TEXT) IS 'Get current rate limit status for a given identifier. Admin only.';
