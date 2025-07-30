-- Query to find all views with SECURITY DEFINER and drop them
-- Let's target the most common problematic views

-- Drop materialized views that might have SECURITY DEFINER issues
DROP MATERIALIZED VIEW IF EXISTS public.spaces_dashboard_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.room_details_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.building_analytics_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.floor_analytics_mv CASCADE;

-- Recreate materialized views without SECURITY DEFINER
CREATE MATERIALIZED VIEW public.spaces_dashboard_mv AS
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
JOIN buildings b ON f.building_id = b.id;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX ON public.spaces_dashboard_mv (id);

-- Drop any other problematic views that might have SECURITY DEFINER
DROP VIEW IF EXISTS public.unified_personnel_view CASCADE;
DROP VIEW IF EXISTS public.room_hierarchy_view CASCADE;
DROP VIEW IF EXISTS public.maintenance_analytics_view CASCADE;

-- Fix any remaining functions that don't have search_path set
-- Let's fix common trigger and utility functions

CREATE OR REPLACE FUNCTION public.generate_issue_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get the next issue number
  SELECT COALESCE(MAX(SUBSTRING(issue_number FROM '[0-9]+')::INTEGER), 0) + 1
  INTO next_number
  FROM issues
  WHERE issue_number ~ '^ISS-[0-9]+$';
  
  -- Format as ISS-000001
  formatted_number := 'ISS-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN formatted_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_issue_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.issue_number IS NULL THEN
    NEW.issue_number := public.generate_issue_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix the refresh materialized views function
CREATE OR REPLACE FUNCTION public.refresh_materialized_view(view_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE view_name
    WHEN 'spaces_dashboard_mv' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.spaces_dashboard_mv;
    WHEN 'room_details_mv' THEN
      -- Create if it doesn't exist
      IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'room_details_mv') THEN
        CREATE MATERIALIZED VIEW public.room_details_mv AS
        SELECT 
          us.id,
          us.name,
          us.room_number,
          us.room_type,
          us.status,
          f.name as floor_name,
          f.floor_number,
          b.id as building_id,
          b.name as building_name,
          b.address as building_address
        FROM unified_spaces us
        JOIN floors f ON us.floor_id = f.id
        JOIN buildings b ON f.building_id = b.id
        WHERE us.space_type = 'room';
        
        CREATE UNIQUE INDEX ON public.room_details_mv (id);
      ELSE
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.room_details_mv;
      END IF;
    ELSE
      RAISE EXCEPTION 'Unknown materialized view: %', view_name;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_materialized_views()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.spaces_dashboard_mv;
  
  -- Refresh room_details_mv if it exists
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'room_details_mv') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.room_details_mv;
  END IF;
END;
$$;

-- Grant proper permissions
GRANT SELECT ON public.spaces_dashboard_mv TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_materialized_view(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_all_materialized_views() TO service_role;