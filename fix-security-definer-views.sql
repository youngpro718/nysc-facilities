-- Fix Security Definer Views
-- Addresses Supabase security linter warnings about SECURITY DEFINER views
-- These views bypass RLS policies and should be converted to regular views with proper RLS

-- 1. Fix key_assignments_view
DROP VIEW IF EXISTS public.key_assignments_view;
CREATE VIEW public.key_assignments_view AS
SELECT 
    ka.id,
    ka.key_id,
    ka.occupant_id,
    ka.assigned_at,
    ka.returned_at,
    ka.return_reason,
    ka.is_spare,
    ka.spare_key_reason,
    ka.created_at,
    ka.updated_at,
    -- Join with keys table for key details
    k.name AS key_name,
    k.key_scope,
    k.status AS key_status,
    k.type AS key_type,
    k.total_quantity,
    k.available_quantity,
    -- Join with profiles for assignee details
    p.first_name,
    p.last_name,
    p.email,
    p.department,
    CASE
        WHEN ka.returned_at IS NULL THEN 'assigned'
        ELSE 'returned'
    END AS assignment_status
FROM key_assignments ka
LEFT JOIN keys k ON ka.key_id = k.id
LEFT JOIN profiles p ON ka.occupant_id = p.id;

-- Enable RLS on the view (inherits from underlying tables)
ALTER VIEW public.key_assignments_view OWNER TO postgres;

-- 2. Fix key_inventory_view
DROP VIEW IF EXISTS public.key_inventory_view;
CREATE VIEW public.key_inventory_view AS
SELECT 
    k.id,
    k.name,
    k.key_scope,
    k.status,
    k.type,
    k.total_quantity,
    k.available_quantity,
    k.is_passkey,
    k.captain_office_copy,
    k.captain_office_assigned_date,
    k.captain_office_notes,
    k.active_assignments,
    k.lost_count,
    k.properties,
    k.location_data,
    k.created_at,
    k.updated_at,
    count(ka.id) FILTER (WHERE ka.returned_at IS NULL) AS current_assignments,
    count(ka.id) AS total_assignment_history
FROM keys k
LEFT JOIN key_assignments ka ON k.id = ka.key_id
GROUP BY k.id, k.name, k.key_scope, k.status, k.type, k.total_quantity, k.available_quantity, k.is_passkey, k.captain_office_copy, k.captain_office_assigned_date, k.captain_office_notes, k.active_assignments, k.lost_count, k.properties, k.location_data, k.created_at, k.updated_at;

-- Enable RLS on the view
ALTER VIEW public.key_inventory_view OWNER TO postgres;

-- 3. Fix elevator_pass_assignments view
DROP VIEW IF EXISTS public.elevator_pass_assignments;
CREATE VIEW public.elevator_pass_assignments AS
SELECT 
    ka.id AS assignment_id,
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
    END AS status,
    (CURRENT_DATE - ka.assigned_at::date) AS days_since_assigned,
    CASE
        WHEN (ka.returned_at IS NULL AND ka.assigned_at::date < (CURRENT_DATE - INTERVAL '30 days')) THEN true
        ELSE false
    END AS is_overdue,
    k.name AS key_name,
    k.key_scope,
    p.first_name,
    p.last_name,
    p.email,
    p.department
FROM key_assignments ka
LEFT JOIN keys k ON ka.key_id = k.id
LEFT JOIN profiles p ON ka.occupant_id = p.id
WHERE k.key_scope = 'elevator' OR k.name ILIKE '%elevator%';

-- Enable RLS on the view
ALTER VIEW public.elevator_pass_assignments OWNER TO postgres;

-- 4. Fix spaces view (if it exists with SECURITY DEFINER)
DROP VIEW IF EXISTS public.spaces;
CREATE VIEW public.spaces AS
SELECT 
    r.id,
    r.name,
    r.room_number,
    r.floor_id,
    r.capacity,
    r.current_occupancy,
    r.status::text AS status,
    r.room_type::text AS room_type,
    r.description,
    r.current_function,
    r.phone_number,
    r.is_storage,
    r.storage_type,
    r.created_at,
    r.updated_at,
    f.name AS floor_name,
    f.floor_number,
    b.name AS building_name,
    b.address AS building_address,
    'room'::text AS space_type,
    b.id AS building_id
FROM rooms r
LEFT JOIN floors f ON r.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id
WHERE r.status = 'active'
UNION ALL
SELECT 
    h.id,
    h.name,
    NULL::text AS room_number,
    h.floor_id,
    h.capacity_limit AS capacity,
    NULL::integer AS current_occupancy,
    h.status::text AS status,
    h.type::text AS room_type,
    h.description,
    NULL::text AS current_function,
    NULL::text AS phone_number,
    false AS is_storage,
    NULL::text AS storage_type,
    h.created_at,
    h.updated_at,
    f.name AS floor_name,
    f.floor_number,
    b.name AS building_name,
    b.address AS building_address,
    'hallway'::text AS space_type,
    b.id AS building_id
FROM hallways h
LEFT JOIN floors f ON h.floor_id = f.id
LEFT JOIN buildings b ON f.building_id = b.id
WHERE h.status = 'active';

-- Enable RLS on the view
ALTER VIEW public.spaces OWNER TO postgres;

-- Add comments explaining the security fix
COMMENT ON VIEW public.key_assignments_view IS 'View of key assignments with related data. Removed SECURITY DEFINER to respect RLS policies.';
COMMENT ON VIEW public.key_inventory_view IS 'View of key inventory status. Removed SECURITY DEFINER to respect RLS policies.';
COMMENT ON VIEW public.elevator_pass_assignments IS 'View of elevator pass assignments. Removed SECURITY DEFINER to respect RLS policies.';
COMMENT ON VIEW public.spaces IS 'View of spaces/rooms with computed fields. Removed SECURITY DEFINER to respect RLS policies.';

-- Ensure proper RLS policies exist on underlying tables
-- (These should already exist, but adding as safety check)

-- Enable RLS on underlying tables if not already enabled
ALTER TABLE public.key_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hallways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.key_assignments_view TO authenticated;
GRANT SELECT ON public.key_inventory_view TO authenticated;
GRANT SELECT ON public.elevator_pass_assignments TO authenticated;
GRANT SELECT ON public.spaces TO authenticated;

-- Grant permissions to service_role for admin operations
GRANT ALL ON public.key_assignments_view TO service_role;
GRANT ALL ON public.key_inventory_view TO service_role;
GRANT ALL ON public.elevator_pass_assignments TO service_role;
GRANT ALL ON public.spaces TO service_role;
