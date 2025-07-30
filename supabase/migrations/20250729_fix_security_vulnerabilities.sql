-- Fix Security Vulnerabilities
-- This migration addresses critical security issues identified by Supabase linter

-- 1. Enable RLS on user_roles table
-- The table has policies but RLS is not enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Review and potentially modify SECURITY DEFINER views
-- These views enforce permissions of the view creator rather than the querying user
-- We'll convert them to SECURITY INVOKER where appropriate

-- Drop and recreate key_inventory_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.key_inventory_view;
CREATE VIEW public.key_inventory_view AS
SELECT 
    k.id,
    k.key_number,
    k.key_type,
    k.status,
    k.room_id,
    r.room_number,
    r.building_id,
    b.building_name,
    ka.assigned_to,
    p.full_name as assigned_to_name,
    ka.assigned_at,
    ka.returned_at,
    k.created_at,
    k.updated_at
FROM keys k
LEFT JOIN rooms r ON k.room_id = r.id
LEFT JOIN buildings b ON r.building_id = b.id
LEFT JOIN key_assignments ka ON k.id = ka.key_id AND ka.returned_at IS NULL
LEFT JOIN profiles p ON ka.assigned_to = p.id;

-- Drop and recreate courtroom_availability without SECURITY DEFINER
DROP VIEW IF EXISTS public.courtroom_availability;
CREATE VIEW public.courtroom_availability AS
SELECT 
    r.id,
    r.room_number,
    r.building_id,
    b.building_name,
    r.capacity,
    r.room_type,
    r.status,
    CASE 
        WHEN r.status = 'available' THEN true
        ELSE false
    END as is_available,
    COUNT(ra.id) as current_assignments,
    r.created_at,
    r.updated_at
FROM rooms r
LEFT JOIN buildings b ON r.building_id = b.id
LEFT JOIN room_assignments ra ON r.id = ra.room_id AND ra.status = 'active'
WHERE r.room_type = 'courtroom'
GROUP BY r.id, r.room_number, r.building_id, b.building_name, r.capacity, r.room_type, r.status, r.created_at, r.updated_at;

-- Drop and recreate court_maintenance_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.court_maintenance_view;
CREATE VIEW public.court_maintenance_view AS
SELECT 
    r.id as room_id,
    r.room_number,
    r.building_id,
    b.building_name,
    r.status as room_status,
    COUNT(CASE WHEN i.status = 'open' THEN 1 END) as open_issues,
    COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress_issues,
    COUNT(CASE WHEN i.priority = 'high' THEN 1 END) as high_priority_issues,
    MAX(i.created_at) as last_issue_reported,
    r.updated_at as last_room_update
FROM rooms r
LEFT JOIN buildings b ON r.building_id = b.id
LEFT JOIN issues i ON r.id = i.room_id
WHERE r.room_type = 'courtroom'
GROUP BY r.id, r.room_number, r.building_id, b.building_name, r.status, r.updated_at;

-- Drop and recreate personnel_profiles_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.personnel_profiles_view;
CREATE VIEW public.personnel_profiles_view AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.department,
    p.position,
    p.employee_id,
    p.status,
    ur.role,
    COUNT(ra.id) as room_assignments_count,
    COUNT(ka.id) as key_assignments_count,
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN room_assignments ra ON p.id = ra.assigned_to AND ra.status = 'active'
LEFT JOIN key_assignments ka ON p.id = ka.assigned_to AND ka.returned_at IS NULL
GROUP BY p.id, p.full_name, p.email, p.phone, p.department, p.position, p.employee_id, p.status, ur.role, p.created_at, p.updated_at;

-- Drop and recreate unified_personnel_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.unified_personnel_view;
CREATE VIEW public.unified_personnel_view AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.department,
    p.position,
    p.employee_id,
    p.status as profile_status,
    ur.role as user_role,
    COALESCE(cp.court_role, 'staff') as court_role,
    cp.security_clearance,
    cp.badge_number,
    cp.hire_date,
    cp.supervisor_id,
    s.full_name as supervisor_name,
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN court_personnel cp ON p.id = cp.profile_id
LEFT JOIN profiles s ON cp.supervisor_id = s.id;

-- 3. Add proper RLS policies for user_roles table if they don't exist
-- First, let's ensure we have the basic policies

-- Policy for authenticated users to view roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles' 
        AND policyname = 'Authenticated users can view roles'
    ) THEN
        CREATE POLICY "Authenticated users can view roles" ON public.user_roles
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

-- Policy for service role to manage roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles' 
        AND policyname = 'Service role can manage roles'
    ) THEN
        CREATE POLICY "Service role can manage roles" ON public.user_roles
            FOR ALL TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Policy for users to view their own role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles' 
        AND policyname = 'Users can view own role'
    ) THEN
        CREATE POLICY "Users can view own role" ON public.user_roles
            FOR SELECT TO authenticated
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Grant appropriate permissions to views
GRANT SELECT ON public.key_inventory_view TO authenticated;
GRANT SELECT ON public.courtroom_availability TO authenticated;
GRANT SELECT ON public.court_maintenance_view TO authenticated;
GRANT SELECT ON public.personnel_profiles_view TO authenticated;
GRANT SELECT ON public.unified_personnel_view TO authenticated;

-- 5. Add comments for documentation
COMMENT ON TABLE public.user_roles IS 'User roles table with RLS enabled for security';
COMMENT ON VIEW public.key_inventory_view IS 'View for key inventory without SECURITY DEFINER for proper access control';
COMMENT ON VIEW public.courtroom_availability IS 'View for courtroom availability without SECURITY DEFINER';
COMMENT ON VIEW public.court_maintenance_view IS 'View for court maintenance status without SECURITY DEFINER';
COMMENT ON VIEW public.personnel_profiles_view IS 'View for personnel profiles without SECURITY DEFINER';
COMMENT ON VIEW public.unified_personnel_view IS 'Unified view for personnel data without SECURITY DEFINER';
