-- Check current view definitions and recreate them explicitly without SECURITY DEFINER
-- First, let's check what views currently exist
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('court_maintenance_view', 'court_operations_dashboard', 'courtroom_availability');

-- Force drop all views that might be causing issues
DROP VIEW IF EXISTS public.court_maintenance_view CASCADE;
DROP VIEW IF EXISTS public.court_operations_dashboard CASCADE; 
DROP VIEW IF EXISTS public.courtroom_availability CASCADE;

-- Recreate court_maintenance_view explicitly as SECURITY INVOKER (default)
CREATE VIEW public.court_maintenance_view 
WITH (security_invoker = true)
AS
SELECT 
    cr.id as court_room_id,
    cr.room_id,
    cr.room_number,
    cr.courtroom_number,
    cr.maintenance_status,
    cr.maintenance_start_date,
    cr.maintenance_end_date,
    cr.maintenance_notes,
    cr.temporary_location,
    r.name as room_name,
    r.floor_id,
    f.name as floor_name,
    b.name as building_name,
    ms.id as maintenance_schedule_id,
    ms.title as maintenance_title,
    ms.maintenance_type,
    ms.scheduled_start_date,
    ms.scheduled_end_date,
    ms.status as maintenance_status_detail,
    ms.priority,
    ms.impact_level
FROM court_rooms cr
LEFT JOIN rooms r ON r.id = cr.room_id
LEFT JOIN floors f ON f.id = r.floor_id
LEFT JOIN buildings b ON b.id = f.building_id
LEFT JOIN maintenance_schedules ms ON ms.space_id = cr.room_id AND ms.space_type = 'room';

-- Recreate court_operations_dashboard explicitly as SECURITY INVOKER (default)
CREATE VIEW public.court_operations_dashboard
WITH (security_invoker = true)
AS
SELECT 
    ct.id as term_id,
    ct.term_name,
    ct.term_number,
    ct.start_date,
    ct.end_date,
    ct.location,
    ct.term_status,
    COUNT(DISTINCT cr.id) as total_courtrooms,
    COUNT(DISTINCT CASE WHEN cr.is_active = true AND cr.maintenance_status = 'operational' THEN cr.id END) as available_courtrooms,
    COUNT(DISTINCT CASE WHEN cr.maintenance_status IN ('under_maintenance', 'maintenance_scheduled') THEN cr.id END) as maintenance_courtrooms,
    COUNT(DISTINCT CASE WHEN rr.id IS NOT NULL AND rr.status = 'active' THEN cr.id END) as relocated_courtrooms,
    COUNT(DISTINCT ca.id) as active_assignments
FROM court_terms ct
LEFT JOIN court_assignments ca ON ca.term_id = ct.id
LEFT JOIN court_rooms cr ON cr.room_number = ca.room_number
LEFT JOIN rooms r ON r.id = cr.room_id
LEFT JOIN room_relocations rr ON rr.original_room_id = r.id AND rr.status = 'active'
GROUP BY ct.id, ct.term_name, ct.term_number, ct.start_date, ct.end_date, ct.location, ct.term_status;

-- Recreate courtroom_availability explicitly as SECURITY INVOKER (default)
CREATE VIEW public.courtroom_availability
WITH (security_invoker = true)
AS
SELECT 
    cr.id,
    cr.room_number,
    cr.courtroom_number,
    cr.is_active,
    cr.maintenance_status,
    cr.maintenance_start_date,
    cr.maintenance_end_date,
    cr.temporary_location,
    r.name as room_name,
    f.name as floor_name,
    b.name as building_name,
    CASE 
        WHEN NOT cr.is_active THEN 'inactive'
        WHEN cr.maintenance_status = 'under_maintenance' THEN 'maintenance'
        WHEN cr.maintenance_status = 'maintenance_scheduled' THEN 'scheduled_maintenance'
        WHEN rr.id IS NOT NULL AND rr.status = 'active' THEN 'relocated'
        ELSE 'available'
    END as availability_status
FROM court_rooms cr
LEFT JOIN rooms r ON r.id = cr.room_id
LEFT JOIN floors f ON f.id = r.floor_id
LEFT JOIN buildings b ON b.id = f.building_id
LEFT JOIN room_relocations rr ON rr.original_room_id = r.id AND rr.status = 'active';