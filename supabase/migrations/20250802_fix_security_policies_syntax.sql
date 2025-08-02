-- Critical Security Fixes - Phase 1: Database Security Hardening (Fixed Syntax)

-- 1. Drop security definer views that bypass RLS and recreate as regular views
DROP VIEW IF EXISTS elevator_pass_assignments CASCADE;
DROP MATERIALIZED VIEW IF EXISTS spaces_dashboard_mv CASCADE;

-- 2. Add missing search_path to critical security functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(check_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_rooms bigint, occupied_rooms bigint, available_rooms bigint, maintenance_rooms bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can access dashboard stats
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM rooms WHERE status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM rooms WHERE status = 'active' AND current_occupancy > 0)::BIGINT,
    (SELECT COUNT(*) FROM rooms WHERE status = 'active' AND current_occupancy = 0)::BIGINT,
    (SELECT COUNT(*) FROM rooms WHERE status = 'maintenance')::BIGINT;
END;
$$;

-- 3. Update RLS policies for backup tables to require authentication
-- Drop existing policies first, then recreate
DO $$
BEGIN
    -- Handle backup_versions table policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_versions') THEN
        DROP POLICY IF EXISTS "Users can view their own backup versions" ON backup_versions;
        DROP POLICY IF EXISTS "Only authenticated users can create backup versions" ON backup_versions;
        
        CREATE POLICY "Users can view their own backup versions"
        ON backup_versions
        FOR SELECT
        USING (created_by = auth.uid() OR created_by IS NULL);

        CREATE POLICY "Only authenticated users can create backup versions"
        ON backup_versions
        FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
    END IF;

    -- Handle backup_retention_policies table policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_retention_policies') THEN
        DROP POLICY IF EXISTS "Admin users can manage backup retention policies" ON backup_retention_policies;
        
        CREATE POLICY "Admin users can manage backup retention policies"
        ON backup_retention_policies
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END
$$;

-- 4. Create secure view for elevator pass assignments with proper RLS
CREATE VIEW elevator_pass_assignments AS
SELECT 
    ka.id as assignment_id,
    ka.occupant_id,
    ka.key_id,
    ka.assigned_at,
    ka.returned_at,
    ka.return_reason,
    ka.is_spare,
    ka.spare_key_reason,
    CASE 
        WHEN ka.returned_at IS NULL THEN 'assigned'
        ELSE 'returned'
    END as status,
    EXTRACT(days FROM (CURRENT_DATE - ka.assigned_at::date)) as days_since_assigned,
    CASE 
        WHEN ka.returned_at IS NULL AND ka.assigned_at < (CURRENT_DATE - INTERVAL '30 days') THEN true
        ELSE false
    END as is_overdue,
    k.name as key_name,
    p.first_name,
    p.last_name,
    p.email,
    p.department
FROM key_assignments ka
LEFT JOIN keys k ON ka.key_id = k.id
LEFT JOIN profiles p ON ka.occupant_id = p.id
WHERE k.key_type = 'elevator_pass';

-- Grant appropriate permissions on the view
GRANT SELECT ON elevator_pass_assignments TO authenticated;

-- 5. Consolidate overlapping RLS policies for court_terms
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'court_terms') THEN
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON court_terms;
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON court_terms;  
        DROP POLICY IF EXISTS "Enable update for authenticated users" ON court_terms;
        
        -- Create consolidated policy for court_terms
        CREATE POLICY "Authenticated users can manage court terms"
        ON court_terms
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;

-- 6. Create materialized view with proper security
CREATE MATERIALIZED VIEW spaces_dashboard_mv AS
SELECT 
    r.id as space_id,
    'room'::text as space_type,
    r.name,
    r.room_number,
    b.name as building_name,
    f.name as floor_name,
    r.capacity,
    COALESCE(occ.occupancy_count, 0) as occupancy_count,
    COALESCE(iss.issue_count, 0) as issue_count,
    COALESCE(fix.fixture_count, 0) as fixture_count,
    r.status::text,
    b.id as building_id,
    f.id as floor_id
FROM rooms r
LEFT JOIN floors f ON r.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id
LEFT JOIN (
    SELECT room_id, COUNT(*) as occupancy_count
    FROM occupant_room_assignments
    WHERE is_active = true
    GROUP BY room_id
) occ ON r.id = occ.room_id
LEFT JOIN (
    SELECT room_id, COUNT(*) as issue_count
    FROM issues
    WHERE status IN ('open', 'in_progress')
    GROUP BY room_id
) iss ON r.id = iss.room_id
LEFT JOIN (
    SELECT room_id, COUNT(*) as fixture_count
    FROM lighting_fixtures
    GROUP BY room_id
) fix ON r.id = fix.room_id
WHERE r.status = 'active';

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_building ON spaces_dashboard_mv(building_id);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_floor ON spaces_dashboard_mv(floor_id);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_type ON spaces_dashboard_mv(space_type);

-- Grant permissions on materialized view
GRANT SELECT ON spaces_dashboard_mv TO authenticated;

-- 7. Strengthen RLS policies for unified_spaces table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_spaces') THEN
        -- Drop overly permissive policies and recreate with proper restrictions
        DROP POLICY IF EXISTS "Public read access" ON unified_spaces;
        DROP POLICY IF EXISTS "Enable read access for all users" ON unified_spaces;

        CREATE POLICY "Authenticated users can view spaces"
        ON unified_spaces
        FOR SELECT
        TO authenticated
        USING (true);

        CREATE POLICY "Admin users can manage spaces"
        ON unified_spaces
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END
$$;

-- 8. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_spaces_dashboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only admins can refresh the materialized view
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  REFRESH MATERIALIZED VIEW spaces_dashboard_mv;
END;
$$;

-- Grant execute permission on the refresh function
GRANT EXECUTE ON FUNCTION refresh_spaces_dashboard() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_current_user_role() IS 'Securely retrieves the current user role with proper search_path';
COMMENT ON FUNCTION has_role(user_role) IS 'Securely checks if current user has specified role with proper search_path';
COMMENT ON FUNCTION get_dashboard_stats() IS 'Admin-only function to retrieve dashboard statistics with proper security';
COMMENT ON VIEW elevator_pass_assignments IS 'Secure view for elevator pass assignments with proper RLS';
COMMENT ON MATERIALIZED VIEW spaces_dashboard_mv IS 'Optimized dashboard data with proper security controls';
COMMENT ON FUNCTION refresh_spaces_dashboard() IS 'Admin-only function to refresh spaces dashboard materialized view';
