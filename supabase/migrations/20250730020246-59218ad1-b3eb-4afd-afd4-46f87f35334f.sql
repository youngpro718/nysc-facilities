-- Fix the 6 specific Security Definer Views with only existing columns
-- Drop and recreate them without SECURITY DEFINER

-- 1. Fix public.spaces view
DROP VIEW IF EXISTS public.spaces CASCADE;
CREATE VIEW public.spaces AS
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

-- 2. Fix public.courtroom_availability view
DROP VIEW IF EXISTS public.courtroom_availability CASCADE;
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

-- 3. Fix public.court_maintenance_view view
DROP VIEW IF EXISTS public.court_maintenance_view CASCADE;
CREATE VIEW public.court_maintenance_view AS
SELECT 
    cr.id as court_id,
    cr.room_number,
    cr.maintenance_status,
    cr.maintenance_start_date,
    cr.maintenance_end_date,
    cr.maintenance_notes,
    NULL::UUID as schedule_id,
    'No scheduled maintenance' as maintenance_title,
    NULL::TIMESTAMPTZ as scheduled_start_date,
    NULL::TIMESTAMPTZ as scheduled_end_date,
    'none' as schedule_status
FROM court_rooms cr;

-- 4. Fix public.key_inventory_view view (only use existing columns)
DROP VIEW IF EXISTS public.key_inventory_view CASCADE;
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

-- 5. Fix public.personnel_profiles_view view
DROP VIEW IF EXISTS public.personnel_profiles_view CASCADE;
CREATE VIEW public.personnel_profiles_view AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.first_name || ' ' || p.last_name as full_name,
    p.email,
    p.department,
    p.access_level,
    p.is_approved,
    p.created_at,
    p.updated_at,
    ur.role as user_role,
    CASE 
        WHEN ur.role IS NOT NULL THEN 'registered_user'
        ELSE 'court_personnel'
    END as personnel_type
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- 6. Fix public.user_verification_view view
DROP VIEW IF EXISTS public.user_verification_view CASCADE;
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

-- Grant appropriate permissions to the views
GRANT SELECT ON public.spaces TO authenticated;
GRANT SELECT ON public.courtroom_availability TO authenticated;
GRANT SELECT ON public.court_maintenance_view TO authenticated;
GRANT SELECT ON public.key_inventory_view TO authenticated;
GRANT SELECT ON public.personnel_profiles_view TO authenticated;
GRANT SELECT ON public.user_verification_view TO authenticated;