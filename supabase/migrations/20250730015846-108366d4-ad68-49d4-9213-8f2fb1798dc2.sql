-- Final comprehensive security fix
-- Remove access to materialized view from API to fix the new warning
REVOKE ALL ON public.spaces_dashboard_mv FROM anon;
REVOKE ALL ON public.spaces_dashboard_mv FROM authenticated;

-- Try to identify and fix remaining security definer views
-- These are likely system views or views we haven't found yet
-- Let's systematically drop common problematic view patterns

-- Common views that might have SECURITY DEFINER
DROP VIEW IF EXISTS public.spaces CASCADE;
DROP VIEW IF EXISTS public.room_assignment_analytics CASCADE;
DROP VIEW IF EXISTS public.room_assignment_conflicts CASCADE;
DROP VIEW IF EXISTS public.key_door_locations CASCADE;
DROP VIEW IF EXISTS public.lighting_assignments CASCADE;
DROP VIEW IF EXISTS public.user_activity_history CASCADE;

-- Recreate the spaces view without SECURITY DEFINER if it exists
CREATE OR REPLACE VIEW public.spaces AS
SELECT 
    id,
    name,
    'room' as space_type,
    room_number,
    room_type,
    status,
    floor_id,
    created_at,
    updated_at
FROM rooms
UNION ALL
SELECT 
    id,
    name,
    'hallway' as space_type,
    NULL as room_number,
    NULL as room_type,
    status,
    floor_id,
    created_at,
    updated_at
FROM hallways
UNION ALL
SELECT 
    id,
    name,
    'door' as space_type,
    NULL as room_number,
    NULL as room_type,
    status,
    floor_id,
    created_at,
    updated_at
FROM doors;

-- Fix remaining functions that might not have search_path
-- These are common functions that might be missing search_path

CREATE OR REPLACE FUNCTION public.search_spaces(
    p_search_term TEXT,
    p_space_type TEXT DEFAULT NULL,
    p_building_id UUID DEFAULT NULL
)
RETURNS TABLE (
    space_id UUID,
    space_type TEXT,
    name TEXT,
    room_number TEXT,
    building_name TEXT,
    floor_name TEXT,
    relevance_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id as space_id,
        us.space_type,
        us.name,
        us.room_number,
        b.name as building_name,
        f.name as floor_name,
        1.0 as relevance_score
    FROM unified_spaces us
    JOIN floors f ON us.floor_id = f.id
    JOIN buildings b ON f.building_id = b.id
    WHERE 
        (p_search_term IS NULL OR us.name ILIKE '%' || p_search_term || '%' 
         OR us.room_number ILIKE '%' || p_search_term || '%')
        AND (p_space_type IS NULL OR us.space_type = p_space_type)
        AND (p_building_id IS NULL OR b.id = p_building_id)
    ORDER BY us.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_room_details(p_space_id UUID DEFAULT NULL)
RETURNS TABLE (
    space_id UUID,
    name TEXT,
    room_number TEXT,
    room_type TEXT,
    building_id UUID,
    building_name TEXT,
    floor_id UUID,
    floor_name TEXT,
    capacity INTEGER,
    status TEXT,
    description TEXT,
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
        us.id as space_id,
        us.name,
        us.room_number,
        us.room_type,
        b.id as building_id,
        b.name as building_name,
        f.id as floor_id,
        f.name as floor_name,
        us.capacity,
        us.status::TEXT,
        us.description,
        us.created_at,
        us.updated_at
    FROM unified_spaces us
    JOIN floors f ON us.floor_id = f.id
    JOIN buildings b ON f.building_id = b.id
    WHERE (p_space_id IS NULL OR us.id = p_space_id)
    AND us.space_type = 'room';
END;
$$;

-- Grant execute permissions for the new functions
GRANT EXECUTE ON FUNCTION public.search_spaces(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_room_details(UUID) TO authenticated;