-- Force fix all Security Definer Views - Final attempt
-- First check if views exist and their security properties

-- Drop ALL views that might have SECURITY DEFINER
DROP VIEW IF EXISTS public.personnel_profiles_view CASCADE;
DROP VIEW IF EXISTS public.spaces CASCADE;
DROP VIEW IF EXISTS public.courtroom_availability CASCADE;
DROP VIEW IF EXISTS public.court_maintenance_view CASCADE;
DROP VIEW IF EXISTS public.key_inventory_view CASCADE;
DROP VIEW IF EXISTS public.user_verification_view CASCADE;

-- Recreate all views without SECURITY DEFINER and with proper column definitions
CREATE VIEW public.personnel_profiles_view AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    (p.first_name || ' ' || p.last_name) AS full_name,
    p.email,
    p.department,
    p.access_level,
    p.is_approved,
    p.created_at,
    p.updated_at,
    ur.role AS user_role,
    CASE 
        WHEN ur.role IS NOT NULL THEN 'registered_user'
        ELSE 'court_personnel'
    END AS personnel_type
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

CREATE VIEW public.spaces AS
SELECT 
    r.id,
    r.name,
    'room' as space_type,
    r.room_number,
    r.room_type,
    r.status,
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
    NULL as room_type,
    h.status,
    h.floor_id,
    h.created_at,
    h.updated_at
FROM hallways h
UNION ALL
SELECT 
    d.id,
    d.name,
    'door' as space_type,
    NULL as room_number,
    NULL as room_type,
    d.status,
    d.floor_id,
    d.created_at,
    d.updated_at
FROM doors d;

CREATE VIEW public.courtroom_availability AS
SELECT 
    cr.id,
    cr.room_number,
    cr.courtroom_number,
    cr.is_active,
    cr.juror_capacity,
    cr.spectator_capacity,
    cr.accessibility_features,
    cr.maintenance_status,
    CASE 
        WHEN cr.maintenance_status = 'under_maintenance' THEN 'unavailable'
        WHEN cr.is_active = false THEN 'inactive'
        ELSE 'available'
    END as availability_status,
    cr.notes
FROM court_rooms cr;

CREATE VIEW public.court_maintenance_view AS
SELECT 
    cr.id as court_id,
    cr.room_number,
    cr.maintenance_status,
    cr.maintenance_start_date,
    cr.maintenance_end_date,
    cr.maintenance_notes,
    NULL::uuid as schedule_id,
    'No scheduled maintenance' as maintenance_title,
    NULL::timestamp with time zone as scheduled_start_date,
    NULL::timestamp with time zone as scheduled_end_date,
    'none' as schedule_status
FROM court_rooms cr;

CREATE VIEW public.key_inventory_view AS
SELECT 
    k.id,
    k.name,
    k.type,
    k.total_quantity,
    k.available_quantity,
    k.status,
    k.created_at,
    k.updated_at,
    CASE 
        WHEN k.available_quantity <= 5 THEN 'low_stock'
        WHEN k.available_quantity = 0 THEN 'out_of_stock'
        ELSE 'in_stock'
    END as stock_status
FROM keys k;

CREATE VIEW public.user_verification_view AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.department,
    p.is_approved,
    p.created_at,
    p.updated_at,
    ur.role as user_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Grant proper permissions
GRANT SELECT ON public.personnel_profiles_view TO authenticated;
GRANT SELECT ON public.spaces TO authenticated;
GRANT SELECT ON public.courtroom_availability TO authenticated;
GRANT SELECT ON public.court_maintenance_view TO authenticated;
GRANT SELECT ON public.key_inventory_view TO authenticated;
GRANT SELECT ON public.user_verification_view TO authenticated;