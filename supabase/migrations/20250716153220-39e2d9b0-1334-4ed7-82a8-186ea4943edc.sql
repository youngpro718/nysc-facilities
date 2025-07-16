-- Explicitly recreate views with security_invoker = true to fix linter warnings

-- Drop and recreate room_assignment_conflicts view with explicit security_invoker
DROP VIEW IF EXISTS public.room_assignment_conflicts CASCADE;

CREATE VIEW public.room_assignment_conflicts 
WITH (security_invoker = true) AS
SELECT 
    r.id as room_id,
    r.room_number,
    r.name as room_name,
    COUNT(ora.id) as assignment_count,
    ARRAY_AGG(
        jsonb_build_object(
            'occupant_id', o.id,
            'occupant_name', o.first_name || ' ' || o.last_name,
            'assignment_type', ora.assignment_type,
            'assigned_at', ora.assigned_at,
            'expiration_date', ora.expiration_date,
            'is_primary', ora.is_primary
        )
    ) as conflicting_assignments
FROM rooms r
JOIN occupant_room_assignments ora ON ora.room_id = r.id
JOIN occupants o ON o.id = ora.occupant_id
WHERE ora.expiration_date IS NULL OR ora.expiration_date > CURRENT_DATE
GROUP BY r.id, r.room_number, r.name
HAVING COUNT(ora.id) > 1;

-- Drop and recreate room_assignment_analytics view with explicit security_invoker
DROP VIEW IF EXISTS public.room_assignment_analytics CASCADE;

CREATE VIEW public.room_assignment_analytics 
WITH (security_invoker = true) AS
SELECT 
    r.id as room_id,
    r.room_number,
    r.name as room_name,
    r.room_type,
    f.name as floor_name,
    b.name as building_name,
    COUNT(ora.id) as total_assignments,
    COUNT(CASE WHEN ora.is_primary = true THEN 1 END) as primary_assignments,
    COUNT(CASE WHEN ora.assignment_type = 'temporary' THEN 1 END) as temporary_assignments,
    COUNT(CASE WHEN ora.expiration_date IS NULL OR ora.expiration_date > CURRENT_DATE THEN 1 END) as active_assignments,
    COUNT(CASE WHEN ora.expiration_date IS NOT NULL AND ora.expiration_date <= CURRENT_DATE THEN 1 END) as expired_assignments,
    AVG(EXTRACT(EPOCH FROM (COALESCE(ora.expiration_date, CURRENT_DATE) - ora.assigned_at)) / 86400) as avg_assignment_duration_days,
    MIN(ora.assigned_at) as earliest_assignment,
    MAX(ora.assigned_at) as latest_assignment
FROM rooms r
LEFT JOIN occupant_room_assignments ora ON ora.room_id = r.id
LEFT JOIN floors f ON f.id = r.floor_id
LEFT JOIN buildings b ON b.id = f.building_id
GROUP BY r.id, r.room_number, r.name, r.room_type, f.name, b.name;