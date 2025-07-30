-- Fix Function Search Path Mutable warnings by setting search_path for security functions
-- This prevents search path injection attacks

-- Fix get_court_personnel function
CREATE OR REPLACE FUNCTION public.get_court_personnel()
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    department TEXT,
    role TEXT,
    access_level TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.department,
        p.role,
        p.access_level,
        p.created_at,
        p.updated_at
    FROM profiles p
    WHERE p.department IN ('Court Operations', 'Judicial', 'Clerk', 'Security');
END;
$$;

-- Fix get_building_hierarchy function
CREATE OR REPLACE FUNCTION public.get_building_hierarchy()
RETURNS TABLE (
    building_id UUID,
    building_name TEXT,
    building_address TEXT,
    floor_id UUID,
    floor_name TEXT,
    floor_number INTEGER,
    total_spaces BIGINT,
    room_count BIGINT,
    hallway_count BIGINT,
    door_count BIGINT,
    active_spaces BIGINT,
    total_occupants BIGINT,
    total_issues BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as building_id,
        b.name as building_name,
        b.address as building_address,
        f.id as floor_id,
        f.name as floor_name,
        f.floor_number,
        COUNT(us.*) as total_spaces,
        COUNT(CASE WHEN us.space_type = 'room' THEN 1 END) as room_count,
        COUNT(CASE WHEN us.space_type = 'hallway' THEN 1 END) as hallway_count,
        COUNT(CASE WHEN us.space_type = 'door' THEN 1 END) as door_count,
        COUNT(CASE WHEN us.status = 'active' THEN 1 END) as active_spaces,
        COALESCE(SUM(
            CASE 
                WHEN us.space_type = 'room' THEN 
                    (SELECT COUNT(*) FROM profiles p WHERE p.room_id = us.id)
                ELSE 0 
            END
        ), 0) as total_occupants,
        COALESCE(SUM(
            (SELECT COUNT(*) FROM issues i WHERE i.room_id = us.id)
        ), 0) as total_issues
    FROM buildings b
    LEFT JOIN floors f ON b.id = f.building_id
    LEFT JOIN unified_spaces us ON f.id = us.floor_id
    GROUP BY b.id, b.name, b.address, f.id, f.name, f.floor_number
    ORDER BY b.name, f.floor_number;
END;
$$;

-- Fix get_energy_analytics function
CREATE OR REPLACE FUNCTION public.get_energy_analytics()
RETURNS TABLE (
    id UUID,
    building_name TEXT,
    total_consumption NUMERIC,
    average_consumption NUMERIC,
    efficiency_score NUMERIC,
    last_reading TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name as building_name,
        COALESCE(SUM(er.consumption), 0) as total_consumption,
        COALESCE(AVG(er.consumption), 0) as average_consumption,
        COALESCE(AVG(er.efficiency_rating), 0) as efficiency_score,
        MAX(er.reading_date) as last_reading
    FROM buildings b
    LEFT JOIN energy_readings er ON b.id = er.building_id
    GROUP BY b.id, b.name;
END;
$$;

-- Fix get_facility_analytics function
CREATE OR REPLACE FUNCTION public.get_facility_analytics()
RETURNS TABLE (
    total_buildings BIGINT,
    total_floors BIGINT,
    total_spaces BIGINT,
    active_issues BIGINT,
    maintenance_requests BIGINT,
    occupancy_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM buildings) as total_buildings,
        (SELECT COUNT(*) FROM floors) as total_floors,
        (SELECT COUNT(*) FROM unified_spaces) as total_spaces,
        (SELECT COUNT(*) FROM issues WHERE status IN ('open', 'in_progress')) as active_issues,
        (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'pending') as maintenance_requests,
        CASE 
            WHEN (SELECT COUNT(*) FROM unified_spaces WHERE space_type = 'room') > 0 THEN
                ((SELECT COUNT(*) FROM profiles WHERE room_id IS NOT NULL)::NUMERIC / 
                 (SELECT COUNT(*) FROM unified_spaces WHERE space_type = 'room')::NUMERIC) * 100
            ELSE 0
        END as occupancy_rate;
END;
$$;

-- Fix get_spaces_dashboard_data function
CREATE OR REPLACE FUNCTION public.get_spaces_dashboard_data(
    building_filter UUID DEFAULT NULL,
    space_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    space_type TEXT,
    room_number TEXT,
    status TEXT,
    floor_name TEXT,
    floor_number INTEGER,
    building_name TEXT,
    room_type TEXT,
    is_storage BOOLEAN,
    occupant_count BIGINT,
    issue_count BIGINT,
    open_issue_count BIGINT,
    fixture_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.name,
        us.space_type,
        us.room_number,
        us.status,
        f.name as floor_name,
        f.floor_number,
        b.name as building_name,
        us.room_type,
        us.is_storage,
        COALESCE((SELECT COUNT(*) FROM profiles p WHERE p.room_id = us.id), 0) as occupant_count,
        COALESCE((SELECT COUNT(*) FROM issues i WHERE i.room_id = us.id), 0) as issue_count,
        COALESCE((SELECT COUNT(*) FROM issues i WHERE i.room_id = us.id AND i.status IN ('open', 'in_progress')), 0) as open_issue_count,
        COALESCE((SELECT COUNT(*) FROM lighting_fixtures lf WHERE lf.room_id = us.id), 0) as fixture_count
    FROM unified_spaces us
    JOIN floors f ON us.floor_id = f.id
    JOIN buildings b ON f.building_id = b.id
    WHERE 
        (building_filter IS NULL OR b.id = building_filter)
        AND (space_type_filter IS NULL OR us.space_type = space_type_filter)
    ORDER BY b.name, f.floor_number, us.name;
END;
$$;

-- Restrict access to materialized view spaces_dashboard_mv
-- Remove access from anon and authenticated roles
REVOKE ALL ON public.spaces_dashboard_mv FROM anon;
REVOKE ALL ON public.spaces_dashboard_mv FROM authenticated;

-- Only allow access through the secure function
GRANT SELECT ON public.spaces_dashboard_mv TO service_role;