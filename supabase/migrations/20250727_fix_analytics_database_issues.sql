-- Fix Analytics Database Issues
-- This migration creates missing database objects required for Phase 4 Analytics

-- 1. Create missing spaces_dashboard_mv materialized view
DROP MATERIALIZED VIEW IF EXISTS spaces_dashboard_mv CASCADE;

CREATE MATERIALIZED VIEW spaces_dashboard_mv AS
SELECT 
    s.id,
    s.name,
    s.space_type,
    s.building_id,
    s.floor_id,
    s.capacity,
    s.created_at,
    s.updated_at,
    -- Building information
    b.name as building_name,
    f.name as floor_name,
    -- Occupancy metrics
    COALESCE(occ.occupant_count, 0) as current_occupancy,
    CASE 
        WHEN s.capacity > 0 THEN (COALESCE(occ.occupant_count, 0)::float / s.capacity * 100)
        ELSE 0 
    END as occupancy_rate,
    -- Issue metrics
    COALESCE(iss.total_issues, 0) as total_issues,
    COALESCE(iss.open_issues, 0) as open_issues,
    COALESCE(iss.critical_issues, 0) as critical_issues,
    -- Maintenance metrics
    COALESCE(maint.maintenance_score, 85) as maintenance_score,
    COALESCE(maint.last_maintenance, s.created_at) as last_maintenance
FROM unified_spaces s
LEFT JOIN buildings b ON s.building_id = b.id
LEFT JOIN floors f ON s.floor_id = f.id
LEFT JOIN (
    -- Occupancy subquery
    SELECT 
        room_id,
        COUNT(*) as occupant_count
    FROM occupant_room_assignments 
    WHERE is_active = true
    GROUP BY room_id
) occ ON s.id = occ.room_id
LEFT JOIN (
    -- Issues subquery
    SELECT 
        room_id,
        COUNT(*) as total_issues,
        COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as open_issues,
        COUNT(*) FILTER (WHERE priority = 'high' AND status IN ('open', 'in_progress')) as critical_issues
    FROM issues
    GROUP BY room_id
) iss ON s.id = iss.room_id
LEFT JOIN (
    -- Maintenance subquery
    SELECT 
        room_id,
        AVG(CASE 
            WHEN status = 'completed' THEN 95
            WHEN status = 'in_progress' THEN 75
            ELSE 60
        END) as maintenance_score,
        MAX(updated_at) as last_maintenance
    FROM maintenance_requests
    GROUP BY room_id
) maint ON s.id = maint.room_id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_building_id ON spaces_dashboard_mv(building_id);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_space_type ON spaces_dashboard_mv(space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_occupancy_rate ON spaces_dashboard_mv(occupancy_rate);

-- 2. Create or update get_spaces_dashboard_data function
CREATE OR REPLACE FUNCTION get_spaces_dashboard_data(
    building_filter uuid DEFAULT NULL,
    space_type_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    space_type text,
    building_id uuid,
    building_name text,
    floor_name text,
    capacity integer,
    current_occupancy bigint,
    occupancy_rate numeric,
    total_issues bigint,
    open_issues bigint,
    critical_issues bigint,
    maintenance_score numeric,
    last_maintenance timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mv.id,
        mv.name,
        mv.space_type,
        mv.building_id,
        mv.building_name,
        mv.floor_name,
        mv.capacity,
        mv.current_occupancy,
        mv.occupancy_rate,
        mv.total_issues,
        mv.open_issues,
        mv.critical_issues,
        mv.maintenance_score,
        mv.last_maintenance
    FROM spaces_dashboard_mv mv
    WHERE 
        (building_filter IS NULL OR mv.building_id = building_filter)
        AND (space_type_filter IS NULL OR mv.space_type = space_type_filter);
END;
$$;

-- 3. Create or update get_building_hierarchy function
CREATE OR REPLACE FUNCTION get_building_hierarchy()
RETURNS TABLE (
    building_id uuid,
    building_name text,
    floor_id uuid,
    floor_name text,
    space_id uuid,
    space_name text,
    space_type text,
    capacity integer,
    current_occupancy bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as building_id,
        b.name as building_name,
        f.id as floor_id,
        f.name as floor_name,
        s.id as space_id,
        s.name as space_name,
        s.space_type,
        s.capacity,
        COALESCE(occ.occupant_count, 0) as current_occupancy
    FROM buildings b
    LEFT JOIN floors f ON b.id = f.building_id
    LEFT JOIN unified_spaces s ON f.id = s.floor_id
    LEFT JOIN (
        SELECT 
            room_id,
            COUNT(*) as occupant_count
        FROM occupant_room_assignments 
        WHERE is_active = true
        GROUP BY room_id
    ) occ ON s.id = occ.room_id
    ORDER BY b.name, f.name, s.name;
END;
$$;

-- 4. Fix foreign key relationship for issues table
-- First, check if the foreign key exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'issues_room_id_fkey' 
        AND table_name = 'issues'
    ) THEN
        ALTER TABLE issues DROP CONSTRAINT issues_room_id_fkey;
    END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE issues 
ADD CONSTRAINT issues_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES unified_spaces(id) ON DELETE CASCADE;

-- 5. Create analytics helper functions
CREATE OR REPLACE FUNCTION get_facility_analytics(
    building_filter uuid DEFAULT NULL,
    date_range_start timestamp DEFAULT NOW() - INTERVAL '30 days',
    date_range_end timestamp DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_spaces', COUNT(*),
        'total_capacity', COALESCE(SUM(capacity), 0),
        'total_occupancy', COALESCE(SUM(current_occupancy), 0),
        'average_occupancy_rate', COALESCE(AVG(occupancy_rate), 0),
        'total_issues', COALESCE(SUM(total_issues), 0),
        'open_issues', COALESCE(SUM(open_issues), 0),
        'critical_issues', COALESCE(SUM(critical_issues), 0),
        'average_maintenance_score', COALESCE(AVG(maintenance_score), 85),
        'building_breakdown', json_agg(
            json_build_object(
                'building_id', building_id,
                'building_name', building_name,
                'space_count', COUNT(*),
                'occupancy_rate', AVG(occupancy_rate),
                'issue_count', SUM(total_issues)
            )
        )
    ) INTO result
    FROM spaces_dashboard_mv
    WHERE (building_filter IS NULL OR building_id = building_filter);
    
    RETURN result;
END;
$$;

-- 6. Create energy efficiency analytics function
CREATE OR REPLACE FUNCTION get_energy_analytics(
    building_filter uuid DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_lighting_fixtures', COALESCE(COUNT(l.id), 0),
        'energy_efficient_count', COALESCE(COUNT(l.id) FILTER (WHERE l.is_energy_efficient = true), 0),
        'efficiency_percentage', CASE 
            WHEN COUNT(l.id) > 0 THEN 
                (COUNT(l.id) FILTER (WHERE l.is_energy_efficient = true)::float / COUNT(l.id) * 100)
            ELSE 0 
        END,
        'estimated_savings', COALESCE(SUM(
            CASE WHEN l.is_energy_efficient THEN 50 ELSE 0 END
        ), 0),
        'recommendations', json_build_array(
            'Upgrade remaining fixtures to LED',
            'Install motion sensors in low-traffic areas',
            'Implement smart lighting controls'
        )
    ) INTO result
    FROM lighting l
    JOIN unified_spaces s ON l.room_id = s.id
    WHERE (building_filter IS NULL OR s.building_id = building_filter);
    
    RETURN result;
END;
$$;

-- 7. Refresh the materialized view
REFRESH MATERIALIZED VIEW spaces_dashboard_mv;

-- 8. Grant necessary permissions
GRANT SELECT ON spaces_dashboard_mv TO authenticated;
GRANT EXECUTE ON FUNCTION get_spaces_dashboard_data(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_building_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION get_facility_analytics(uuid, timestamp, timestamp) TO authenticated;
GRANT EXECUTE ON FUNCTION get_energy_analytics(uuid) TO authenticated;

-- 9. Create a refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW spaces_dashboard_mv;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_analytics_cache() TO authenticated;

-- 10. Add helpful indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_issues_room_id_status ON issues(room_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_priority_status ON issues(priority, status);
CREATE INDEX IF NOT EXISTS idx_occupant_room_assignments_active ON occupant_room_assignments(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_room_status ON maintenance_requests(room_id, status);
CREATE INDEX IF NOT EXISTS idx_unified_spaces_building_type ON unified_spaces(building_id, space_type);

COMMENT ON MATERIALIZED VIEW spaces_dashboard_mv IS 'Optimized view for analytics dashboard with pre-calculated metrics';
COMMENT ON FUNCTION get_spaces_dashboard_data IS 'Returns dashboard data with optional building and space type filters';
COMMENT ON FUNCTION get_building_hierarchy IS 'Returns complete building hierarchy for analytics';
COMMENT ON FUNCTION get_facility_analytics IS 'Returns comprehensive facility analytics in JSON format';
COMMENT ON FUNCTION get_energy_analytics IS 'Returns energy efficiency analytics in JSON format';
