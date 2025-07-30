-- Fix remaining Security Definer Views - Minimal version
-- Drop and recreate views without SECURITY DEFINER

-- Drop views if they exist
DROP VIEW IF EXISTS public.personnel_profiles_view;
DROP VIEW IF EXISTS public.spaces;
DROP VIEW IF EXISTS public.courtroom_availability;
DROP VIEW IF EXISTS public.court_maintenance_view;
DROP VIEW IF EXISTS public.key_inventory_view;
DROP VIEW IF EXISTS public.user_verification_view;

-- Recreate personnel_profiles_view without SECURITY DEFINER
CREATE VIEW public.personnel_profiles_view AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.department,
    p.title,
    p.phone,
    p.access_level,
    p.is_approved,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.is_approved = true;

-- Recreate spaces view without SECURITY DEFINER
CREATE VIEW public.spaces AS
SELECT 
    r.id,
    r.name,
    'room' as type,
    r.room_number,
    r.status::text,
    r.floor_id,
    r.position,
    r.size,
    r.rotation,
    r.created_at,
    r.updated_at
FROM rooms r
UNION ALL
SELECT 
    h.id,
    h.name,
    'hallway' as type,
    NULL as room_number,
    h.status::text,
    h.floor_id,
    h.position,
    h.size,
    h.rotation,
    h.created_at,
    h.updated_at
FROM hallways h
UNION ALL
SELECT 
    d.id,
    d.name,
    'door' as type,
    NULL as room_number,
    d.status::text,
    d.floor_id,
    d.position,
    d.size,
    0::numeric as rotation,
    d.created_at,
    d.updated_at
FROM doors d;

-- Recreate courtroom_availability view without SECURITY DEFINER
CREATE VIEW public.courtroom_availability AS
SELECT 
    cr.id,
    cr.room_number,
    cr.courtroom_number,
    cr.is_active,
    cr.maintenance_status,
    CASE 
        WHEN cr.maintenance_status = 'operational' AND cr.is_active = true THEN 'available'
        WHEN cr.maintenance_status = 'under_maintenance' THEN 'maintenance'
        ELSE 'unavailable'
    END as availability_status,
    cr.spectator_capacity,
    cr.juror_capacity,
    cr.accessibility_features,
    cr.notes
FROM court_rooms cr;

-- Recreate court_maintenance_view without SECURITY DEFINER
CREATE VIEW public.court_maintenance_view AS
SELECT 
    cr.id as court_id,
    cr.room_number,
    cr.maintenance_status,
    cr.maintenance_start_date,
    cr.maintenance_end_date,
    cr.maintenance_notes,
    NULL::uuid as schedule_id,
    NULL::text as maintenance_title,
    NULL::timestamp with time zone as scheduled_start_date,
    NULL::timestamp with time zone as scheduled_end_date,
    NULL::text as schedule_status
FROM court_rooms cr;

-- Recreate key_inventory_view without SECURITY DEFINER
CREATE VIEW public.key_inventory_view AS
SELECT 
    k.id,
    k.name,
    k.type,
    k.status,
    k.total_quantity,
    k.available_quantity,
    k.created_at,
    k.updated_at
FROM keys k;

-- Recreate user_verification_view without SECURITY DEFINER (basic columns only)
CREATE VIEW public.user_verification_view AS
SELECT 
    vr.id,
    vr.user_id,
    vr.status,
    vr.department,
    vr.submitted_at,
    vr.reviewed_by,
    vr.reviewed_at,
    vr.rejection_reason,
    p.first_name,
    p.last_name,
    p.email
FROM verification_requests vr
LEFT JOIN profiles p ON p.id = vr.user_id;

-- Grant SELECT permissions to authenticated users for all views
GRANT SELECT ON public.personnel_profiles_view TO authenticated;
GRANT SELECT ON public.spaces TO authenticated;
GRANT SELECT ON public.courtroom_availability TO authenticated;
GRANT SELECT ON public.court_maintenance_view TO authenticated;
GRANT SELECT ON public.key_inventory_view TO authenticated;
GRANT SELECT ON public.user_verification_view TO authenticated;