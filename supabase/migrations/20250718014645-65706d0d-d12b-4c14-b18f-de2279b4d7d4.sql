-- Comprehensive fix for security definer view issue
-- This will completely remove and prevent any SECURITY DEFINER properties

-- First, drop everything related to room_persistent_issues
DROP VIEW IF EXISTS public.room_persistent_issues CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.room_persistent_issues CASCADE;

-- Check for any triggers or rules that might recreate this view
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND pg_get_triggerdef(t.oid) ILIKE '%room_persistent_issues%';

-- Remove any existing permissions or policies
REVOKE ALL ON public.room_persistent_issues FROM PUBLIC CASCADE;

-- Now create a completely clean view with explicit SECURITY INVOKER behavior
CREATE VIEW public.room_persistent_issues 
WITH (security_invoker=true)  -- Explicitly set security invoker
AS
SELECT 
    i.room_id,
    count(*) AS issue_count,
    count(
        CASE
            WHEN i.status = 'open'::issue_status_enum THEN 1
            ELSE NULL::integer
        END) AS open_issues,
    max(i.created_at) AS latest_issue_date
FROM public.issues i
WHERE i.status = ANY (ARRAY['open'::issue_status_enum, 'in_progress'::issue_status_enum])
  AND i.room_id IS NOT NULL
GROUP BY i.room_id
HAVING count(*) >= 3;

-- Grant minimal necessary permissions
GRANT SELECT ON public.room_persistent_issues TO authenticated;

-- Verify the view properties
SELECT 
    c.relname,
    c.relkind,
    reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relname = 'room_persistent_issues';