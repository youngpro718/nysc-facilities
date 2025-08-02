-- Critical Security Fixes - Addressing Security Definer Views and Function Search Paths

-- First, let's identify and fix the security definer views
-- We need to drop and recreate them without SECURITY DEFINER where possible

-- Drop existing security definer views if they exist
DROP VIEW IF EXISTS public.unified_spaces CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.spaces_dashboard_mv CASCADE;

-- Recreate unified_spaces view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.unified_spaces AS
SELECT 
    r.id as space_id,
    'room' as space_type,
    r.name,
    r.room_number,
    r.floor_id,
    r.status,
    rp.current_occupancy as capacity
FROM rooms r
LEFT JOIN room_properties rp ON r.id = rp.space_id
WHERE r.status = 'active'

UNION ALL

SELECT 
    h.id as space_id,
    'hallway' as space_type,
    h.name,
    NULL as room_number,
    h.floor_id,
    h.status::text,
    hp.capacity_limit as capacity
FROM hallways h
LEFT JOIN hallway_properties hp ON h.id = hp.space_id
WHERE h.status = 'active'

UNION ALL

SELECT 
    d.id as space_id,
    'door' as space_type,
    d.name,
    NULL as room_number,
    d.floor_id,
    d.status::text,
    NULL as capacity
FROM doors d
WHERE d.status = 'active';

-- Recreate spaces_dashboard_mv without SECURITY DEFINER
CREATE MATERIALIZED VIEW public.spaces_dashboard_mv AS
SELECT 
    us.space_id,
    us.space_type,
    us.name,
    us.room_number,
    f.name as floor_name,
    us.capacity,
    COALESCE(occ.occupancy_count, 0) as occupancy_count,
    COALESCE(iss.issue_count, 0) as issue_count,
    COALESCE(fix.fixture_count, 0) as fixture_count,
    us.status
FROM unified_spaces us
LEFT JOIN floors f ON us.floor_id = f.id
LEFT JOIN (
    SELECT room_id, COUNT(*) as occupancy_count
    FROM room_assignments
    WHERE is_active = true
    GROUP BY room_id
) occ ON us.space_id = occ.room_id
LEFT JOIN (
    SELECT room_id, COUNT(*) as issue_count
    FROM issues
    WHERE status IN ('open', 'in_progress')
    GROUP BY room_id
) iss ON us.space_id = iss.room_id
LEFT JOIN (
    SELECT room_id, COUNT(*) as fixture_count
    FROM lighting_fixtures
    GROUP BY room_id
) fix ON us.space_id = fix.room_id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_space_type ON public.spaces_dashboard_mv(space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_floor_name ON public.spaces_dashboard_mv(floor_name);

-- Fix remaining functions with missing search_path
-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Update is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

-- Update check_rate_limit function to include proper search_path
CREATE OR REPLACE FUNCTION public.check_rate_limit(identifier text, attempt_type text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_attempts integer;
    window_start timestamptz;
BEGIN
    window_start := now() - (window_minutes || ' minutes')::interval;
    
    -- Count recent attempts
    SELECT COUNT(*) INTO current_attempts
    FROM auth_rate_limits
    WHERE auth_rate_limits.identifier = check_rate_limit.identifier
    AND auth_rate_limits.attempt_type = check_rate_limit.attempt_type
    AND last_attempt > window_start;
    
    -- If under limit, record this attempt and allow
    IF current_attempts < max_attempts THEN
        INSERT INTO auth_rate_limits (identifier, attempt_type, attempts, last_attempt)
        VALUES (check_rate_limit.identifier, check_rate_limit.attempt_type, 1, now())
        ON CONFLICT (identifier, attempt_type) 
        DO UPDATE SET 
            attempts = auth_rate_limits.attempts + 1,
            last_attempt = now(),
            blocked_until = CASE 
                WHEN auth_rate_limits.attempts + 1 >= max_attempts 
                THEN now() + (window_minutes || ' minutes')::interval
                ELSE NULL 
            END;
        RETURN true;
    END IF;
    
    -- Update blocked status
    UPDATE auth_rate_limits 
    SET blocked_until = now() + (window_minutes || ' minutes')::interval
    WHERE auth_rate_limits.identifier = check_rate_limit.identifier
    AND auth_rate_limits.attempt_type = check_rate_limit.attempt_type;
    
    RETURN false;
END;
$$;

-- Update log_security_event function to include proper search_path
CREATE OR REPLACE FUNCTION public.log_security_event(action_type text, resource_type text DEFAULT NULL, resource_id text DEFAULT NULL, details text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO security_audit_log (
        user_id, 
        action, 
        resource_type, 
        resource_id, 
        details,
        created_at
    ) VALUES (
        auth.uid(), 
        action_type, 
        log_security_event.resource_type, 
        log_security_event.resource_id::uuid, 
        log_security_event.details::jsonb,
        now()
    );
EXCEPTION WHEN OTHERS THEN
    -- Ensure security events don't fail operations
    NULL;
END;
$$;