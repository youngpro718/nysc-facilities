-- Create Optimized Spaces Service Database Functions and Materialized Views
-- This migration implements the database layer for the OptimizedSpacesService

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- 1. Room Details Materialized View
-- Combines room data with building and floor information for fast queries
CREATE MATERIALIZED VIEW IF NOT EXISTS room_details_mv AS
SELECT 
  r.id,
  r.name,
  r.room_number,
  r.room_type,
  r.status,
  r.description,
  r.is_storage,
  r.storage_type,
  r.phone_number,
  r.current_function,
  r.courtroom_photos,
  r.created_at,
  r.updated_at,
  f.id as floor_id,
  f.name as floor_name,
  f.floor_number,
  b.id as building_id,
  b.name as building_name,
  b.address as building_address,
  -- Computed fields for analytics
  CASE WHEN r.status = 'occupied' THEN 1 ELSE 0 END as is_occupied,
  CASE WHEN r.status = 'available' THEN 1 ELSE 0 END as is_available,
  CASE WHEN r.status = 'maintenance' THEN 1 ELSE 0 END as needs_maintenance
FROM rooms r
LEFT JOIN floors f ON r.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id;

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_details_mv_id ON room_details_mv (id);
CREATE INDEX IF NOT EXISTS idx_room_details_mv_building ON room_details_mv (building_id);
CREATE INDEX IF NOT EXISTS idx_room_details_mv_floor ON room_details_mv (floor_id);
CREATE INDEX IF NOT EXISTS idx_room_details_mv_status ON room_details_mv (status);
CREATE INDEX IF NOT EXISTS idx_room_details_mv_type ON room_details_mv (room_type);

-- 2. Unified Spaces View
-- Combines all space types (rooms, hallways, doors) into a single queryable view
CREATE MATERIALIZED VIEW IF NOT EXISTS unified_spaces AS
SELECT 
  r.id,
  r.name,
  'room' as space_type,
  r.room_number,
  r.room_type as type_detail,
  r.status,
  r.description,
  r.is_storage,
  r.storage_type,
  r.phone_number,
  r.current_function,
  r.courtroom_photos,
  r.floor_id,
  r.created_at,
  r.updated_at
FROM rooms r
UNION ALL
SELECT 
  h.id,
  h.name,
  'hallway' as space_type,
  NULL as room_number,
  h.hallway_type as type_detail,
  h.status,
  h.description,
  false as is_storage,
  NULL as storage_type,
  NULL as phone_number,
  NULL as current_function,
  NULL as courtroom_photos,
  h.floor_id,
  h.created_at,
  h.updated_at
FROM hallways h
UNION ALL
SELECT 
  d.id,
  d.name,
  'door' as space_type,
  d.door_number as room_number,
  d.door_type as type_detail,
  d.status,
  d.description,
  false as is_storage,
  NULL as storage_type,
  NULL as phone_number,
  NULL as current_function,
  NULL as courtroom_photos,
  d.floor_id,
  d.created_at,
  d.updated_at
FROM doors d;

-- Create indexes for unified spaces
CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_spaces_id ON unified_spaces (id);
CREATE INDEX IF NOT EXISTS idx_unified_spaces_type ON unified_spaces (space_type);
CREATE INDEX IF NOT EXISTS idx_unified_spaces_floor ON unified_spaces (floor_id);
CREATE INDEX IF NOT EXISTS idx_unified_spaces_status ON unified_spaces (status);
CREATE INDEX IF NOT EXISTS idx_unified_spaces_name ON unified_spaces (name);

-- 3. Spaces Dashboard Materialized View
-- Pre-computed analytics for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS spaces_dashboard_mv AS
SELECT 
  us.id,
  us.name,
  us.space_type,
  us.room_number,
  us.type_detail,
  us.status,
  us.description,
  us.floor_id,
  f.name as floor_name,
  f.floor_number,
  f.building_id,
  b.name as building_name,
  b.address as building_address,
  -- Analytics fields
  CASE WHEN us.status = 'occupied' THEN 1 ELSE 0 END as occupancy_count,
  CASE WHEN us.status = 'maintenance' THEN 1 ELSE 0 END as maintenance_count,
  CASE WHEN us.status = 'available' THEN 1 ELSE 0 END as available_count,
  -- Issue counts (would need to join with issues table if it exists)
  0 as open_issues_count,
  0 as critical_issues_count,
  -- Fixture counts (would need actual fixture data)
  0 as fixture_count,
  us.created_at,
  us.updated_at
FROM unified_spaces us
LEFT JOIN floors f ON us.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id;

-- Create indexes for dashboard view
CREATE UNIQUE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_id ON spaces_dashboard_mv (id);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_building ON spaces_dashboard_mv (building_id);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_floor ON spaces_dashboard_mv (floor_id);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_type ON spaces_dashboard_mv (space_type);
CREATE INDEX IF NOT EXISTS idx_spaces_dashboard_mv_status ON spaces_dashboard_mv (status);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- 1. Get Spaces Dashboard Data
CREATE OR REPLACE FUNCTION get_spaces_dashboard(
  p_building_id UUID DEFAULT NULL,
  p_floor_id UUID DEFAULT NULL,
  p_space_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  space_type TEXT,
  room_number TEXT,
  type_detail TEXT,
  status TEXT,
  description TEXT,
  floor_id UUID,
  floor_name TEXT,
  floor_number INTEGER,
  building_id UUID,
  building_name TEXT,
  building_address TEXT,
  occupancy_count INTEGER,
  maintenance_count INTEGER,
  available_count INTEGER,
  open_issues_count INTEGER,
  critical_issues_count INTEGER,
  fixture_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sdm.id,
    sdm.name,
    sdm.space_type,
    sdm.room_number,
    sdm.type_detail,
    sdm.status,
    sdm.description,
    sdm.floor_id,
    sdm.floor_name,
    sdm.floor_number,
    sdm.building_id,
    sdm.building_name,
    sdm.building_address,
    sdm.occupancy_count,
    sdm.maintenance_count,
    sdm.available_count,
    sdm.open_issues_count,
    sdm.critical_issues_count,
    sdm.fixture_count,
    sdm.created_at,
    sdm.updated_at
  FROM spaces_dashboard_mv sdm
  WHERE 
    (p_building_id IS NULL OR sdm.building_id = p_building_id)
    AND (p_floor_id IS NULL OR sdm.floor_id = p_floor_id)
    AND (p_space_type IS NULL OR sdm.space_type = p_space_type)
  ORDER BY sdm.building_name, sdm.floor_number, sdm.name;
END;
$$;

-- 2. Get Building Hierarchy
CREATE OR REPLACE FUNCTION get_building_hierarchy()
RETURNS TABLE (
  building_id UUID,
  building_name TEXT,
  building_address TEXT,
  floor_id UUID,
  floor_name TEXT,
  floor_number INTEGER,
  room_count BIGINT,
  hallway_count BIGINT,
  door_count BIGINT,
  total_spaces BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    COUNT(CASE WHEN us.space_type = 'room' THEN 1 END) as room_count,
    COUNT(CASE WHEN us.space_type = 'hallway' THEN 1 END) as hallway_count,
    COUNT(CASE WHEN us.space_type = 'door' THEN 1 END) as door_count,
    COUNT(*) as total_spaces
  FROM buildings b
  LEFT JOIN floors f ON b.id = f.building_id
  LEFT JOIN unified_spaces us ON f.id = us.floor_id
  GROUP BY b.id, b.name, b.address, f.id, f.name, f.floor_number
  ORDER BY b.name, f.floor_number;
END;
$$;

-- 3. Search Spaces Function
CREATE OR REPLACE FUNCTION search_spaces(
  p_search_term TEXT,
  p_space_type TEXT DEFAULT NULL,
  p_building_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  space_type TEXT,
  room_number TEXT,
  type_detail TEXT,
  status TEXT,
  description TEXT,
  floor_id UUID,
  floor_name TEXT,
  floor_number INTEGER,
  building_id UUID,
  building_name TEXT,
  building_address TEXT,
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sdm.id,
    sdm.name,
    sdm.space_type,
    sdm.room_number,
    sdm.type_detail,
    sdm.status,
    sdm.description,
    sdm.floor_id,
    sdm.floor_name,
    sdm.floor_number,
    sdm.building_id,
    sdm.building_name,
    sdm.building_address,
    -- Simple text search ranking
    CASE 
      WHEN LOWER(sdm.name) LIKE LOWER('%' || p_search_term || '%') THEN 1.0
      WHEN LOWER(sdm.room_number) LIKE LOWER('%' || p_search_term || '%') THEN 0.9
      WHEN LOWER(sdm.description) LIKE LOWER('%' || p_search_term || '%') THEN 0.7
      WHEN LOWER(sdm.type_detail) LIKE LOWER('%' || p_search_term || '%') THEN 0.5
      ELSE 0.1
    END as search_rank
  FROM spaces_dashboard_mv sdm
  WHERE 
    (
      LOWER(sdm.name) LIKE LOWER('%' || p_search_term || '%')
      OR LOWER(sdm.room_number) LIKE LOWER('%' || p_search_term || '%')
      OR LOWER(sdm.description) LIKE LOWER('%' || p_search_term || '%')
      OR LOWER(sdm.type_detail) LIKE LOWER('%' || p_search_term || '%')
    )
    AND (p_space_type IS NULL OR sdm.space_type = p_space_type)
    AND (p_building_id IS NULL OR sdm.building_id = p_building_id)
  ORDER BY search_rank DESC, sdm.name
  LIMIT 50;
END;
$$;

-- 4. Refresh Materialized View Function
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE view_name
    WHEN 'room_details_mv' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY room_details_mv;
    WHEN 'unified_spaces' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY unified_spaces;
    WHEN 'spaces_dashboard_mv' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY spaces_dashboard_mv;
    ELSE
      RAISE EXCEPTION 'Unknown materialized view: %', view_name;
  END CASE;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing materialized view %: %', view_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- 5. Refresh All Materialized Views Function
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := TRUE;
BEGIN
  -- Refresh in dependency order
  IF NOT refresh_materialized_view('unified_spaces') THEN
    success := FALSE;
  END IF;
  
  IF NOT refresh_materialized_view('room_details_mv') THEN
    success := FALSE;
  END IF;
  
  IF NOT refresh_materialized_view('spaces_dashboard_mv') THEN
    success := FALSE;
  END IF;
  
  RETURN success;
END;
$$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON room_details_mv TO authenticated;
GRANT SELECT ON unified_spaces TO authenticated;
GRANT SELECT ON spaces_dashboard_mv TO authenticated;

GRANT EXECUTE ON FUNCTION get_spaces_dashboard(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_building_hierarchy() TO authenticated;
GRANT EXECUTE ON FUNCTION search_spaces(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_materialized_view(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;

-- ============================================================================
-- INITIAL DATA REFRESH
-- ============================================================================

-- Refresh all materialized views to populate initial data
SELECT refresh_all_materialized_views();
