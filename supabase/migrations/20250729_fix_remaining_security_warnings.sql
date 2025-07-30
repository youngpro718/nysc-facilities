-- Fix Remaining Security Warnings
-- This migration addresses WARN-level security issues for additional hardening

-- 1. Fix Function Search Path Mutable warnings
-- Set search_path to 'public' for all functions to prevent search path injection attacks

-- Fix get_court_personnel function
CREATE OR REPLACE FUNCTION public.get_court_personnel()
RETURNS TABLE(
    id uuid,
    first_name text,
    last_name text,
    display_name text,
    primary_role text,
    department text,
    email text,
    phone text,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.first_name,
        pp.last_name,
        pp.display_name,
        pp.primary_role,
        pp.department,
        pp.email,
        pp.phone,
        pp.is_active
    FROM personnel_profiles pp
    WHERE pp.is_active = true
    ORDER BY pp.primary_role, pp.last_name, pp.first_name;
END;
$$;

-- Fix create_automatic_shutdown_for_critical_issue function
CREATE OR REPLACE FUNCTION public.create_automatic_shutdown_for_critical_issue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If a critical issue is reported, automatically create a shutdown record
    IF NEW.priority = 'critical' AND NEW.category = 'safety' THEN
        INSERT INTO maintenance_schedules (
            title,
            description,
            space_name,
            scheduled_start_date,
            scheduled_end_date,
            status,
            priority,
            created_by
        ) VALUES (
            'Emergency Shutdown - Critical Safety Issue',
            'Automatic shutdown triggered by critical safety issue: ' || NEW.title,
            (SELECT room_number FROM rooms WHERE id = NEW.room_id),
            NOW(),
            NOW() + INTERVAL '24 hours',
            'scheduled',
            'critical',
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix get_building_hierarchy function
CREATE OR REPLACE FUNCTION public.get_building_hierarchy()
RETURNS TABLE(
    building_id uuid,
    building_name text,
    floor_count bigint,
    room_count bigint,
    total_capacity integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as building_id,
        b.building_name,
        COUNT(DISTINCT r.floor) as floor_count,
        COUNT(r.id) as room_count,
        COALESCE(SUM(r.capacity), 0)::integer as total_capacity
    FROM buildings b
    LEFT JOIN rooms r ON b.id = r.building_id
    GROUP BY b.id, b.building_name
    ORDER BY b.building_name;
END;
$$;

-- Fix get_energy_analytics function
CREATE OR REPLACE FUNCTION public.get_energy_analytics()
RETURNS TABLE(
    building_id uuid,
    building_name text,
    total_rooms bigint,
    active_rooms bigint,
    energy_efficiency_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as building_id,
        b.building_name,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as active_rooms,
        ROUND(
            (COUNT(CASE WHEN r.status = 'available' THEN 1 END)::numeric / 
             NULLIF(COUNT(r.id), 0) * 100), 2
        ) as energy_efficiency_score
    FROM buildings b
    LEFT JOIN rooms r ON b.id = r.building_id
    GROUP BY b.id, b.building_name
    ORDER BY energy_efficiency_score DESC NULLS LAST;
END;
$$;

-- Fix refresh_analytics_cache function
CREATE OR REPLACE FUNCTION public.refresh_analytics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Refresh the materialized view for analytics
    REFRESH MATERIALIZED VIEW CONCURRENTLY spaces_dashboard_mv;
    
    -- Log the refresh
    INSERT INTO system_logs (
        log_level,
        message,
        created_at
    ) VALUES (
        'INFO',
        'Analytics cache refreshed successfully',
        NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log error if refresh fails
        INSERT INTO system_logs (
            log_level,
            message,
            error_details,
            created_at
        ) VALUES (
            'ERROR',
            'Failed to refresh analytics cache',
            SQLERRM,
            NOW()
        );
        RAISE;
END;
$$;

-- Fix get_facility_analytics function
CREATE OR REPLACE FUNCTION public.get_facility_analytics()
RETURNS TABLE(
    total_buildings bigint,
    total_rooms bigint,
    total_capacity bigint,
    utilization_rate numeric,
    maintenance_issues bigint,
    available_rooms bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM buildings)::bigint as total_buildings,
        (SELECT COUNT(*) FROM rooms)::bigint as total_rooms,
        (SELECT COALESCE(SUM(capacity), 0) FROM rooms)::bigint as total_capacity,
        ROUND(
            (SELECT COUNT(*)::numeric FROM rooms WHERE status = 'available') / 
            NULLIF((SELECT COUNT(*) FROM rooms), 0) * 100, 2
        ) as utilization_rate,
        (SELECT COUNT(*) FROM issues WHERE status IN ('open', 'in_progress'))::bigint as maintenance_issues,
        (SELECT COUNT(*) FROM rooms WHERE status = 'available')::bigint as available_rooms;
END;
$$;

-- Fix get_spaces_dashboard_data function
CREATE OR REPLACE FUNCTION public.get_spaces_dashboard_data()
RETURNS TABLE(
    building_id uuid,
    building_name text,
    total_rooms bigint,
    available_rooms bigint,
    occupied_rooms bigint,
    maintenance_rooms bigint,
    utilization_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as building_id,
        b.building_name,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms,
        COUNT(CASE WHEN r.status = 'occupied' THEN 1 END) as occupied_rooms,
        COUNT(CASE WHEN r.status = 'maintenance' THEN 1 END) as maintenance_rooms,
        ROUND(
            (COUNT(CASE WHEN r.status = 'occupied' THEN 1 END)::numeric / 
             NULLIF(COUNT(r.id), 0) * 100), 2
        ) as utilization_percentage
    FROM buildings b
    LEFT JOIN rooms r ON b.id = r.building_id
    GROUP BY b.id, b.building_name
    ORDER BY b.building_name;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Secure the materialized view by restricting access
-- Remove public access and grant only to authenticated users
REVOKE SELECT ON public.spaces_dashboard_mv FROM anon;
GRANT SELECT ON public.spaces_dashboard_mv TO authenticated;

-- 3. Add comments for documentation
COMMENT ON FUNCTION public.get_court_personnel() IS 'Secure function with fixed search_path for court personnel data';
COMMENT ON FUNCTION public.create_automatic_shutdown_for_critical_issue() IS 'Secure trigger function with fixed search_path for critical issue handling';
COMMENT ON FUNCTION public.get_building_hierarchy() IS 'Secure function with fixed search_path for building hierarchy data';
COMMENT ON FUNCTION public.get_energy_analytics() IS 'Secure function with fixed search_path for energy analytics';
COMMENT ON FUNCTION public.refresh_analytics_cache() IS 'Secure function with fixed search_path for cache refresh';
COMMENT ON FUNCTION public.get_facility_analytics() IS 'Secure function with fixed search_path for facility analytics';
COMMENT ON FUNCTION public.get_spaces_dashboard_data() IS 'Secure function with fixed search_path for dashboard data';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Secure trigger function with fixed search_path for timestamp updates';
COMMENT ON MATERIALIZED VIEW public.spaces_dashboard_mv IS 'Materialized view with restricted access - authenticated users only';
